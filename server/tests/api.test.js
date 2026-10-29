const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/index');
const db = require('../src/db');
const seedDatabase = require('../src/db/seed');
const { evaluateRotationSequence } = require('../src/rules/rotationEngine');

// Re-seed DB before tests to ensure hermetic and predictable test state
test.before(() => {
  seedDatabase();
});

// In-process mock request helper (doesn't require TCP socket loopback permissions)
function mockRequest(app, method, url, body = null) {
  return new Promise((resolve, reject) => {
    const req = new http.IncomingMessage();
    req.method = method;
    req.url = url;
    req.headers = {
      'host': 'localhost',
      'content-type': 'application/json'
    };

    let statusCode = 200;
    let headers = {};
    let responseBody = '';

    const res = {
      statusCode: 200,
      setHeader(name, val) {
        headers[name.toLowerCase()] = val;
      },
      getHeader(name) {
        return headers[name.toLowerCase()];
      },
      status(code) {
        this.statusCode = code;
        statusCode = code;
        return this;
      },
      json(data) {
        headers['content-type'] = 'application/json';
        responseBody = JSON.stringify(data);
        this.end(responseBody);
      },
      send(data) {
        responseBody = typeof data === 'object' ? JSON.stringify(data) : String(data);
        this.end(responseBody);
      },
      end(chunk) {
        if (chunk) responseBody = typeof chunk === 'object' ? JSON.stringify(chunk) : String(chunk);
        let parsed = responseBody;
        try {
          parsed = JSON.parse(responseBody);
        } catch (_) {}

        resolve({
          status: statusCode || this.statusCode,
          headers,
          body: parsed,
          text: responseBody
        });
      }
    };

    if (body) {
      req.body = body;
    }

    try {
      app(req, res);
    } catch (err) {
      reject(err);
    }
  });
}

test('HarvestHub Agronomic Rules Engine', async (t) => {
  await t.test('flags continuous corn monoculture with warning', () => {
    const sequence = [
      { year: 2024, season: 'Spring', crop: { name: 'Corn (Field Grain)', botanical_family: 'Poaceae (Grass)', nitrogen_demand: 'Heavy Feeder', root_depth: 'Medium Fibrous' } },
      { year: 2025, season: 'Spring', crop: { name: 'Corn (Field Grain)', botanical_family: 'Poaceae (Grass)', nitrogen_demand: 'Heavy Feeder', root_depth: 'Medium Fibrous' } }
    ];

    const result = evaluateRotationSequence(sequence);
    assert.ok(result.score < 80, `Expected score < 80, got ${result.score}`);
    assert.ok(result.alerts.length > 0, 'Expected alerts for monoculture');
    const hasMonocultureAlert = result.alerts.some(a => a.message.includes('Consecutive monoculture'));
    assert.equal(hasMonocultureAlert, true);
  });

  await t.test('awards synergy bonus for Legume followed by Heavy Feeder', () => {
    const sequence = [
      { year: 2024, season: 'Spring', crop: { name: 'Soybeans', botanical_family: 'Fabaceae (Legume)', nitrogen_demand: 'Nitrogen Fixer', root_depth: 'Deep Taproot' } },
      { year: 2025, season: 'Spring', crop: { name: 'Corn (Field Grain)', botanical_family: 'Poaceae (Grass)', nitrogen_demand: 'Heavy Feeder', root_depth: 'Medium Fibrous' } }
    ];

    const result = evaluateRotationSequence(sequence);
    assert.ok(result.score >= 90, `Expected high score >= 90, got ${result.score}`);
    const hasSynergy = result.positives.some(p => p.category === 'Nitrogen Synergy');
    assert.equal(hasSynergy, true);
  });

  await t.test('detects root depth alternation benefits', () => {
    const sequence = [
      { year: 2024, season: 'Spring', crop: { name: 'Canola', botanical_family: 'Brassicaceae', nitrogen_demand: 'Heavy Feeder', root_depth: 'Deep Taproot' } },
      { year: 2025, season: 'Spring', crop: { name: 'Winter Wheat', botanical_family: 'Poaceae', nitrogen_demand: 'Medium Feeder', root_depth: 'Shallow Fibrous' } }
    ];

    const result = evaluateRotationSequence(sequence);
    const hasRootSynergy = result.positives.some(p => p.category === 'Soil Structure Synergy');
    assert.equal(hasRootSynergy, true);
  });
});

test('HarvestHub REST API In-Process Endpoints', async (t) => {
  await t.test('GET /api/health returns 200 OK', async () => {
    const res = await mockRequest(app, 'GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'online');
  });

  await t.test('GET /api/fields returns active fields', async () => {
    const res = await mockRequest(app, 'GET', '/api/fields');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 8);
    const field1 = res.body.data.find(f => f.id === 1);
    assert.equal(field1.name, 'North Valley Plot');
  });

  await t.test('POST /api/fields creates new field and GET /api/fields/:id retrieves it', async () => {
    const newField = {
      name: 'Pioneer Test Terrace',
      acreage: 65.5,
      soil_type: 'Silt Loam',
      ph_level: 6.7,
      organic_matter_pct: 3.5,
      irrigation_type: 'Drip'
    };

    const postRes = await mockRequest(app, 'POST', '/api/fields', newField);
    assert.equal(postRes.status, 201);
    assert.equal(postRes.body.data.name, 'Pioneer Test Terrace');

    const getRes = await mockRequest(app, 'GET', `/api/fields/${postRes.body.data.id}`);
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.acreage, 65.5);
  });

  await t.test('GET /api/rotations/evaluate/1 returns agronomic evaluation', async () => {
    const res = await mockRequest(app, 'GET', '/api/rotations/evaluate/1');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.evaluation.score > 0);
    assert.ok(res.body.evaluation.positives.length > 0);
  });

  await t.test('POST /api/rotations upserts a planned crop', async () => {
    const res = await mockRequest(app, 'POST', '/api/rotations', {
      field_id: 1,
      crop_id: 2,
      year: 2027,
      season: 'Spring',
      target_yield: 60.0,
      notes: 'Testing rotation plan insertion'
    });
    assert.ok(res.status === 201 || res.status === 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.year, 2027);
  });

  await t.test('GET /api/operations returns operations with input costs', async () => {
    const res = await mockRequest(app, 'GET', '/api/operations');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length > 0);
    const op = res.body.data.find(o => o.id === 2);
    assert.ok(op.total_input_cost > 0, 'Expected input cost to be calculated');
  });

  await t.test('Equipment hours logging and maintenance calculations', async () => {
    const listRes = await mockRequest(app, 'GET', '/api/equipment');
    assert.equal(listRes.status, 200);

    const combine = listRes.body.data.find(eq => eq.model.includes('8250'));
    assert.ok(combine, 'Case IH combine found');
    assert.equal(combine.computed_status, 'Overdue', 'Expected 1010.5h vs 1000h to be Overdue');

    // Test logging hours on John Deere 8R
    const logRes = await mockRequest(app, 'POST', '/api/equipment/1/log-hours', {
      hours_to_add: 5.5,
      fuel_level_pct: 65
    });
    assert.equal(logRes.status, 200);

    // Test completing service on combine
    const svcRes = await mockRequest(app, 'POST', '/api/equipment/2/service', {
      task_id: 3,
      performed_by: 'Travis King',
      cost: 820.0,
      parts_replaced: 'Case Hy-Tran fluid & variator belt',
      notes: 'Overhaul complete'
    });
    assert.equal(svcRes.status, 200);

    // Check that combine status is now reset to Active
    const updatedCombineRes = await mockRequest(app, 'GET', '/api/equipment/2');
    assert.equal(updatedCombineRes.body.data.computed_status, 'Active');
  });

  await t.test('GET /api/analytics/kpis and /api/analytics/pnl return valid financial metrics', async () => {
    const kpiRes = await mockRequest(app, 'GET', '/api/analytics/kpis');
    assert.equal(kpiRes.status, 200);
    assert.equal(kpiRes.body.success, true);
    assert.ok(kpiRes.body.data.totalAcreage > 0);
    assert.ok(kpiRes.body.data.financials.totalRevenue > 0);
    assert.ok(kpiRes.body.data.financials.totalNetProfit > 0);

    const pnlRes = await mockRequest(app, 'GET', '/api/analytics/pnl');
    assert.equal(pnlRes.status, 200);
    assert.equal(pnlRes.body.success, true);
    assert.ok(pnlRes.body.data.byYear.length > 0);
    assert.ok(pnlRes.body.data.byCrop.length > 0);
  });

  await t.test('HarvestAI Copilot chat and advisory recommendations', async () => {
    // 1. Chat about pest risk
    const chatRes = await mockRequest(app, 'POST', '/api/ai/chat', { message: 'Analyze pest risks across our fields' });
    assert.equal(chatRes.status, 200);
    assert.equal(chatRes.body.success, true);
    assert.ok(chatRes.body.data.reply.includes('Rootworm') || chatRes.body.data.reply.includes('Pest'));

    // 2. Recommend crop rotation for Field 1
    const rotRes = await mockRequest(app, 'GET', '/api/ai/recommend-rotation/1');
    assert.equal(rotRes.status, 200);
    assert.equal(rotRes.body.success, true);
    assert.ok(rotRes.body.data.recommendedCrop);
    assert.ok(rotRes.body.data.reasoning);

    // 3. Diagnose machinery for Combine 2
    const diagRes = await mockRequest(app, 'GET', '/api/ai/diagnose-machinery/2');
    assert.equal(diagRes.status, 200);
    assert.equal(diagRes.body.success, true);
    assert.ok(diagRes.body.data.riskLevel);
    assert.ok(diagRes.body.data.componentWearForecast.length > 0);

    // 4. Financial executive insights
    const finRes = await mockRequest(app, 'GET', '/api/ai/financial-insights');
    assert.equal(finRes.status, 200);
    assert.equal(finRes.body.success, true);
    assert.ok(finRes.body.data.keyInsights.length > 0);
    assert.ok(finRes.body.data.aiActionableRecommendations.length > 0);

    // 5. Chat with User Profile context
    const profileChatRes = await mockRequest(app, 'POST', '/api/ai/chat', {
      message: 'What should our farm focus on today?',
      userProfile: { full_name: 'Sarah Jenkins', role: 'Farm Manager', farm_name: 'Willow Creek Farm' }
    });
    assert.equal(profileChatRes.status, 200);
    assert.equal(profileChatRes.body.success, true);
    assert.ok(profileChatRes.body.data.reply.includes('Sarah'));
  });

  await t.test('User Authentication & Profile management (signup, login, me, profile)', async () => {
    // 1. Login with seeded demo account (Sarah Jenkins)
    const loginRes = await mockRequest(app, 'POST', '/api/auth/login', {
      email: 'sarah@willowcreek.farm',
      password: 'farm123'
    });
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.success, true);
    assert.equal(loginRes.body.user.full_name, 'Sarah Jenkins');
    assert.ok(loginRes.body.token);

    const token = loginRes.body.token;

    // 2. GET /api/auth/me using token
    const meRes = await mockRequest(app, 'GET', `/api/auth/me?token=${token}`);
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.success, true);
    assert.equal(meRes.body.user.email, 'sarah@willowcreek.farm');

    // 3. Signup with new account
    const signupRes = await mockRequest(app, 'POST', '/api/auth/signup', {
      full_name: 'David Miller',
      email: 'david@willowcreek.farm',
      password: 'pass1234Secure',
      role: 'Agronomist',
      farm_name: 'Willow Creek Farm'
    });
    assert.equal(signupRes.status, 201);
    assert.equal(signupRes.body.success, true);
    assert.equal(signupRes.body.user.full_name, 'David Miller');
    assert.ok(signupRes.body.token);

    // 4. Duplicate email fails with 409
    const dupRes = await mockRequest(app, 'POST', '/api/auth/signup', {
      full_name: 'David Duplicate',
      email: 'david@willowcreek.farm',
      password: 'pass1234Secure'
    });
    assert.equal(dupRes.status, 409);

    // 5. Invalid login fails with 401
    const badLoginRes = await mockRequest(app, 'POST', '/api/auth/login', {
      email: 'sarah@willowcreek.farm',
      password: 'wrongpassword'
    });
    assert.equal(badLoginRes.status, 401);
  });
});
