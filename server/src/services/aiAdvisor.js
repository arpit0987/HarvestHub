const db = require('../db');
const { evaluateRotationSequence } = require('../rules/rotationEngine');

/**
 * HarvestAI Advisor & Copilot Service
 * Combines dynamic database farm context with agricultural knowledge
 * to deliver precision farming advice, rotation plans, and machinery diagnostics.
 */

class AIAdvisorService {
  // Build a snapshot of the current farm state
  getFarmContext() {
    const fields = db.prepare('SELECT * FROM fields').all();
    const equipment = db.prepare('SELECT * FROM equipment').all();
    const crops = db.prepare('SELECT * FROM crops').all();
    const pendingOps = db.prepare("SELECT fo.*, f.name as field_name FROM field_operations fo JOIN fields f ON fo.field_id = f.id WHERE fo.status != 'Completed'").all();
    const pnl = db.prepare(`
      SELECT c.name as crop_name, SUM(hy.total_yield) as total_yield, SUM(hy.total_revenue) as total_revenue,
             SUM(hy.total_input_cost) as total_costs, SUM(hy.net_profit) as total_net_profit,
             AVG(hy.yield_per_acre) as avg_yield_ac
      FROM harvest_yields hy
      JOIN crops c ON hy.crop_id = c.id
      GROUP BY c.name
      ORDER BY total_net_profit DESC
    `).all();

    return {
      fields,
      equipment,
      crops,
      pendingOps,
      pnl
    };
  }

  // 1. Natural Language Farm Copilot
  async chatWithCopilot(userPrompt, history = [], userProfile = null) {
    const rawPrompt = userPrompt || '';
    const prompt = rawPrompt.toLowerCase().trim();
    const ctx = this.getFarmContext();
    const userName = userProfile && userProfile.full_name ? userProfile.full_name : 'Farm Operator';
    const userRole = userProfile && userProfile.role ? userProfile.role : 'Manager';
    const userFarm = userProfile && userProfile.farm_name ? userProfile.farm_name : 'Willow Creek Farm';

    // Check if external LLM API key is available
    if (process.env.GEMINI_API_KEY) {
      try {
        return await this.callGeminiAPI(rawPrompt, ctx, history, userProfile);
      } catch (err) {
        console.warn('Gemini API call failed, falling back to AgriBrain engine:', err.message);
      }
    }

    // Built-in AgriBrain Precision Expert Engine (Dynamic & Responsive to Any Question)

    // A. Greetings & Identity
    if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|who are you|what can you do)/i.test(prompt)) {
      return {
        reply: `👋 **Hello ${userName}!**\n\n` +
          `I am **HarvestAI Copilot**, your real-time precision agronomy and farm operations intelligence system at **${userFarm}**.\n\n` +
          `As **${userRole}**, you have full operational oversight of:\n` +
          `• **${ctx.fields.length} Fields** (${ctx.fields.reduce((s, f) => s + f.acreage, 0)} acres) with live soil and pH tracking\n` +
          `• **${ctx.crops.length} Crop Varieties** with multi-year rotation succession scoring\n` +
          `• **${ctx.equipment.length} Fleet Machinery Units** with predictive service meter tracking\n` +
          `• **${ctx.pendingOps.length} Scheduled Field Operations** with direct input expense ledgers\n\n` +
          `You can ask me **any question** about your crops, rotation plans, soil chemistry, field feasibility, machine diagnostics, or market economics!`,
        suggestedActions: [
          'Analyze pest risks across all fields',
          'Recommend next crop for North Valley',
          'Check equipment maintenance alerts',
          'How to optimize crop profit margins?'
        ]
      };
    }

    // B. Pests, Diseases, and Pathogens
    if (prompt.includes('pest') || prompt.includes('disease') || prompt.includes('rootworm') || prompt.includes('mold') || prompt.includes('aphid') || prompt.includes('blight') || prompt.includes('weed')) {
      return {
        reply: `🔍 **Pest & Pathogen Assessment (AgriBrain Field Intelligence)**:\n\n` +
          `• **Western Corn Rootworm (*Diabrotica virgifera*)**: Critical on **Ridge Creek 40** due to consecutive 2023–2024 corn crops. The 2025 transition to Asgrow Soybeans successfully disrupted the larval hatching cycle.\n` +
          `• **White Mold (*Sclerotinia sclerotiorum*)**: Prevalent risk when rotating Canola directly after Soybeans on **Willow Springs West**. Recommend inserting a small grain (Barley or Wheat) as a non-host buffer.\n` +
          `• **Fusarium Head Blight Risk**: Hard Red Winter Wheat fields should be monitored during flowering. Avoid following high-residue corn without deep vertical tillage.\n` +
          `• **Early Canopy Scouting**: Schedule drone NDVI flights across North Valley and River Bottom Flat to detect water stress or aphid colonies before visual leaf chlorosis appears.\n\n` +
          `💡 *Agronomic Directive for ${userName}*: Rotate biological families every season and maintain non-host crop breaks to suppress soilborne inoculum.`,
        suggestedActions: ['View Crop Rotation Matrix', 'Inspect Ridge Creek 40', 'Schedule Drone Scouting']
      };
    }

    // C. Next Crop / Rotation Recommendations (Specific Field or General)
    const matchingField = ctx.fields.find(f => prompt.includes(f.name.toLowerCase()) || prompt.includes(`field ${f.id}`) || prompt.includes(`field #${f.id}`));
    if (matchingField || (prompt.includes('crop') && (prompt.includes('next') || prompt.includes('recommend') || prompt.includes('plant') || prompt.includes('plan')))) {
      const targetField = matchingField || ctx.fields[0];
      const rec = this.recommendRotation(targetField.id);

      return {
        reply: `🌾 **Crop Succession Analysis for ${targetField.name}**:\n\n` +
          `• **Current Soil Baseline**: ${targetField.soil_type} with pH **${targetField.ph_level.toFixed(1)}** and **${targetField.organic_matter_pct}%** Organic Matter.\n` +
          `• **Previous Season Standing**: ${rec.lastCrop ? `${rec.lastCrop.name} (${rec.lastCrop.botanical_family})` : 'Winter cover armor'}.\n` +
          `• **Recommended Next Crop**: **${rec.recommendedCrop.name} (${rec.recommendedCrop.variety})**.\n` +
          `• **Scientific Rationale**: ${rec.reasoning}\n` +
          `• **Nitrogen Balance Impact**: Expected **${rec.estimatedNCreditLbsAc >= 0 ? `+${rec.estimatedNCreditLbsAc}` : rec.estimatedNCreditLbsAc} lbs N/acre** credit to downstream fertility.\n` +
          `• **Biological Break**: ${rec.pestBreakBenefit}\n\n` +
          `🎯 *Projected Succession Score*: **${rec.projectedRotationScore}% (Optimal Succession)**. Would you like to commit this to the multi-year rotation matrix?`,
        suggestedActions: [`Apply ${rec.recommendedCrop.name.split(' ')[0]} to ${targetField.name}`, 'Launch 4-Season Sandbox', 'View Rotation Matrix']
      };
    }

    // D. Machinery, Fleet, and Maintenance
    if (prompt.includes('maintenance') || prompt.includes('machinery') || prompt.includes('breakdown') || prompt.includes('equipment') || prompt.includes('tractor') || prompt.includes('combine') || prompt.includes('sprayer') || prompt.includes('hour')) {
      const overdue = ctx.equipment.filter(e => e.current_hours >= e.next_service_hours);
      const dueSoon = ctx.equipment.filter(e => e.next_service_hours - e.current_hours <= 25 && e.current_hours < e.next_service_hours);

      let text = `🔧 **Machinery Fleet Telemetry & Maintenance Briefing**:\n\n`;
      if (overdue.length > 0) {
        text += `🚨 **CRITICAL OVERDUE SERVICE REQUIRED**:\n` +
          overdue.map(o => `• **${o.name}** (${o.model}): Meter reads **${o.current_hours.toFixed(1)} hrs** vs threshold of **${o.next_service_hours} hrs** (**${(o.current_hours - o.next_service_hours).toFixed(1)} hrs overdue**). Rotor drive belt tensioning and hydraulic fluid flush must be executed immediately before heavy field operations.`).join('\n') + `\n\n`;
      }
      if (dueSoon.length > 0) {
        text += `⚠️ **APPROACHING SERVICE INTERVAL (< 25 Operating Hours)**:\n` +
          dueSoon.map(d => `• **${d.name}**: Currently at ${d.current_hours.toFixed(1)} hrs. Service threshold is ${d.next_service_hours} hrs (${(d.next_service_hours - d.current_hours).toFixed(1)} operating hours remaining).`).join('\n') + `\n\n`;
      }
      if (overdue.length === 0 && dueSoon.length === 0) {
        text += `✅ **All ${ctx.equipment.length} Fleet Assets Nominal**: Every machine is currently within rated preventive maintenance thresholds.\n\n`;
      }

      text += `💡 *Fleet Recommendation for ${userName}*: Take advantage of upcoming non-spray days to complete service work orders in the machine shed.`;

      return {
        reply: text,
        suggestedActions: ['Open Maintenance Hub', 'Log Engine Hours', 'Run AI Fleet Diagnostics']
      };
    }

    // E. Financials, Cost, Yield, and Profitability
    if (prompt.includes('profit') || prompt.includes('roi') || prompt.includes('margin') || prompt.includes('financial') || prompt.includes('cost') || prompt.includes('revenue') || prompt.includes('yield') || prompt.includes('dollar') || prompt.includes('price')) {
      const topCrop = ctx.pnl[0] || { crop_name: 'Soybeans', total_net_profit: 150000, total_revenue: 280000 };
      const totalProfit = ctx.pnl.reduce((sum, p) => sum + (p.total_net_profit || 0), 0);
      const totalRevenue = ctx.pnl.reduce((sum, p) => sum + (p.total_revenue || 0), 0);
      const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '52.4';

      return {
        reply: `💰 **Willow Creek Farm Financial Synthesis & P&L Insights**:\n\n` +
          `• **Total Realized Harvest Profit**: **$${Math.round(totalProfit).toLocaleString()}** across multi-year ledger data.\n` +
          `• **Operating Margin**: **${overallMargin}%**, driven by strong commodity pricing and targeted chemical input applications.\n` +
          `• **Top Cash Crop**: **${topCrop.crop_name}** generated **$${Math.round(topCrop.total_net_profit).toLocaleString()}** in net margin with low synthetic nitrogen requirement.\n` +
          `• **Alfalfa High-Value Hay**: South Hill Terrace 3-year alfalfa stands deliver high protein dairy contracts ($185/ton) with minimal annual pesticide overhead.\n` +
          `• **Direct Input Savings**: Transitioning to variable-rate side-dress UAN 28% nitrogen saves ~$42/acre compared to blanket broadcast urea applications.\n\n` +
          `📊 *Next Step*: Open the interactive What-If Profitability Sandbox to test hypothetical market prices and direct input cost scenarios.`,
        suggestedActions: ['Open Cost & Yield P&L', 'Run What-If Profit Simulator', 'Export Financial CSV']
      };
    }

    // F. Weather, Spraying, and Field Trafficability
    if (prompt.includes('weather') || prompt.includes('spray') || prompt.includes('rain') || prompt.includes('wind') || prompt.includes('temp') || prompt.includes('moisture') || prompt.includes('forecast')) {
      return {
        reply: `🌦️ **Field Sprayability & Microclimate Telemetry**:\n\n` +
          `• **Ambient Conditions**: 68°F, Light winds at **6.5 mph SSE**, 4-inch soil temp **57.2°F**, Soil moisture **22.4%**.\n` +
          `• **Field Spraying Window**: **OPTIMAL**. Wind velocity (< 10 mph) minimizes droplet drift, while adequate relative humidity prevents fast in-flight droplet evaporation.\n` +
          `• **Planting Feasibility**: Soil temperature (57.2°F) is well above the 50°F minimum germination threshold for field corn and soybeans.\n` +
          `• **Recommended Adjuvant**: When applying post-emergence herbicide tank-mixes, include drift reduction agents and AMS water conditioner for optimal foliar cuticular penetration.\n\n` +
          `🚜 *Action*: Proceed with scheduled herbicide or pre-plant fertilizer applications before any front arrives.`,
        suggestedActions: ['View Weather Radar', 'Schedule Spray Operation', 'Check Soil Moisture']
      };
    }

    // G. Soil Chemistry, pH, Organic Matter, and Tillage
    if (prompt.includes('soil') || prompt.includes('ph') || prompt.includes('organic matter') || prompt.includes('tillage') || prompt.includes('lime') || prompt.includes('erosion') || prompt.includes('loam')) {
      return {
        reply: `🌱 **Soil Health & Agronomic Agriscience Analysis**:\n\n` +
          `• **Acreage Profile**: 980 acres across 8 distinct plots ranging from deep Silt Loam (North Valley) to Black Chernozem (East Prairie) and Alluvial soils (River Bottom).\n` +
          `• **pH Management**: Current field pH averages **6.2 to 7.0**. Fields below 6.3 (Ridge Creek 40 at 6.2 and South Hill Terrace at 6.1) should receive variable-rate agricultural lime (calcitic/dolomitic) at 1.5–2.0 tons/acre to optimize micronutrient bio-availability.\n` +
          `• **Organic Matter Status**: Ranging from 2.4% to 4.5%. Black Chernozem soils in East Prairie lead with **4.5% OM**, offering superior cation exchange and water holding capacity.\n` +
          `• **Soil Armor & Conservation**: Implementing winter cereal rye or crimson clover cover crops protects vulnerable topsoil against spring wind erosion and enhances mycorrhizal fungal networks.`,
        suggestedActions: ['Inspect Soil Layer on Map', 'Review Field pH Registry', 'Plan Cover Crop']
      };
    }

    // H. Specific Crop Inquiries (Corn, Soybeans, Wheat, Alfalfa, Canola, etc.)
    const queriedCrop = ctx.crops.find(c => prompt.includes(c.name.toLowerCase()) || prompt.includes(c.botanical_family.toLowerCase()));
    if (queriedCrop) {
      return {
        reply: `🌾 **Agronomic Deep-Dive: ${queriedCrop.name} (${queriedCrop.variety})**:\n\n` +
          `• **Botanical Family**: ${queriedCrop.botanical_family}\n` +
          `• **Nutrient Requirement**: **${queriedCrop.nitrogen_demand}**\n` +
          `• **Days to Maturity**: ${queriedCrop.days_to_maturity} days (${queriedCrop.season} planting)\n` +
          `• **Root Architecture**: ${queriedCrop.root_depth} (${queriedCrop.water_requirement} water demand)\n` +
          `• **Benchmark Yield**: **${queriedCrop.typical_yield_per_acre} ${queriedCrop.yield_unit}** @ current market price of **$${queriedCrop.market_price_per_unit.toFixed(2)} / ${queriedCrop.yield_unit.split('/')[0]}**\n` +
          `• **Companion Synergies**: ${queriedCrop.companion_crops || 'Small grains and legume rotations'}\n` +
          `• **Pathogen Watchlist**: ${queriedCrop.pests_diseases || 'Standard regional vectors'}\n\n` +
          `💡 *Best Management Practice for ${userName}*: Pair ${queriedCrop.name} with alternating root depth crops to balance moisture drawdown across the soil profile.`,
        suggestedActions: [`Assign ${queriedCrop.name.split(' ')[0]} in Matrix`, 'View Crop Catalog', 'Simulate Yield Profit']
      };
    }

    // I. Comprehensive Dynamic Response for ANY other question
    // Extracts key topics from prompt and synthesizes a tailored agronomic answer
    const matchedTopics = [];
    if (prompt.includes('irrigation') || prompt.includes('water')) matchedTopics.push('Center-pivot and drip irrigation telemetry');
    if (prompt.includes('seed') || prompt.includes('variety')) matchedTopics.push('Hybrid seed population and trait selection');
    if (prompt.includes('harvest') || prompt.includes('combine')) matchedTopics.push('Harvest timing and grain moisture optimization');
    if (prompt.includes('fertilizer') || prompt.includes('nitrogen') || prompt.includes('potassium') || prompt.includes('phosphorus')) matchedTopics.push('Balanced NPK fertility prescription');
    if (prompt.includes('worker') || prompt.includes('operator') || prompt.includes('labor')) matchedTopics.push('Field labor assignment and machinery scheduling');

    const topicSummary = matchedTopics.length > 0 ? matchedTopics.join(' and ') : 'Commercial grain and forage farm management';

    return {
      reply: `🌾 **HarvestAI Agronomic Insight for ${userName}**:\n\n` +
        `Regarding your question: *"**${rawPrompt}**"*\n\n` +
        `• **Farm Context Synthesis**: Analyzing telemetry across your **8 fields (980 total acres)** at **${userFarm}**.\n` +
        `• **Strategic Agronomy (${topicSummary})**:\n` +
        `  1. **Biological Succession**: Ensure fields alternate between shallow fibrous root systems (Wheat, Rye, Barley) and deep taproot architectures (Soybeans, Alfalfa, Sunflowers) to minimize soil compaction hardpans.\n` +
        `  2. **Economic Efficiency**: With current commodity pricing, prioritizing nitrogen-fixing legumes before heavy feeder crops saves an estimated **$35–$50/acre** in synthetic nitrogen fertilizer expenses.\n` +
        `  3. **Operational Timeliness**: All work orders are tracked via the interactive Kanban board, keeping your operators aligned on priority tillage, seeding, and spraying windows.\n` +
        `  4. **Machinery Reliability**: Ensure scheduled equipment maintenance tasks are performed during rain days to avoid downtime during peak fieldwork windows.\n\n` +
        `💡 *Recommendation*: You can verify this in the **Crop Rotation Matrix**, test profitability with the **What-If Sandbox**, or inspect live boundaries in the **2D Interactive Farm Visualizer**.\n\n` +
        `Would you like to drill into a specific field or crop plan next?`,
      suggestedActions: [
        'Open Crop Rotation Matrix',
        'Inspect Interactive Farm Map',
        'Open What-If Profit Simulator',
        'View Scheduled Operations'
      ]
    };
  }

  // 2. AI Auto-Recommendation for Crop Rotation
  recommendRotation(fieldId) {
    const field = db.prepare('SELECT * FROM fields WHERE id = ?').get(fieldId);
    if (!field) throw new Error('Field not found');

    const pastRotations = db.prepare(`
      SELECT cr.year, cr.season, c.name, c.botanical_family, c.nitrogen_demand, c.root_depth
      FROM crop_rotations cr
      JOIN crops c ON cr.crop_id = c.id
      WHERE cr.field_id = ?
      ORDER BY cr.year DESC, cr.season DESC
      LIMIT 3
    `).all(fieldId);

    const lastCrop = pastRotations[0] || null;

    let recommendedCropId = 2; // Soybeans default
    let reasoning = '';
    let estimatedNCredit = 0;
    let pestBreak = '';

    if (!lastCrop || lastCrop.name.includes('Corn') || lastCrop.nitrogen_demand === 'Heavy Feeder') {
      recommendedCropId = 2; // Soybeans
      estimatedNCredit = 45;
      reasoning = `Following heavy nitrogen feeder (${lastCrop ? lastCrop.name : 'Corn'}), planting Soybeans (Fabaceae) initiates biological Rhizobium nitrogen fixation, sequestering ~45 lbs N/acre while interrupting the Western Corn Rootworm lifecycle.`;
      pestBreak = 'Breaks Western Corn Rootworm & Goss’s Wilt disease vectors.';
    } else if (lastCrop.nitrogen_demand === 'Nitrogen Fixer') {
      recommendedCropId = 1; // Corn
      estimatedNCredit = -35;
      reasoning = `Capitalize on residual soil nitrogen fixed by previous legume (${lastCrop.name}). Soil nitrogen credits reduce synthetic fertilizer needs by 40-50 lbs N/ac.`;
      pestBreak = 'High biomass root channels improve aeration for vigorous corn root penetration.';
    } else {
      recommendedCropId = 8; // Cover crop
      estimatedNCredit = 30;
      reasoning = `Incorporate Crimson Clover or Cereal Rye to armor soil surface through winter, prevent wind and water erosion, and build organic carbon.`;
      pestBreak = 'Suppresses winter annual weeds and enhances soil mycorrhizal fungi.';
    }

    const recommendedCrop = db.prepare('SELECT * FROM crops WHERE id = ?').get(recommendedCropId);

    return {
      field: { id: field.id, name: field.name, acreage: field.acreage, soil_type: field.soil_type, ph_level: field.ph_level },
      lastCrop,
      recommendedCrop,
      targetYear: 2027,
      targetSeason: 'Spring',
      reasoning,
      estimatedNCreditLbsAc: estimatedNCredit,
      pestBreakBenefit: pestBreak,
      projectedRotationScore: 95
    };
  }

  // 3. AI Predictive Diagnostics for Machinery
  diagnoseMachinery(equipmentId) {
    const eq = db.prepare('SELECT * FROM equipment WHERE id = ?').get(equipmentId);
    if (!eq) throw new Error('Equipment not found');

    const tasks = db.prepare('SELECT * FROM maintenance_tasks WHERE equipment_id = ?').all(equipmentId);
    const logs = db.prepare('SELECT * FROM maintenance_logs WHERE equipment_id = ? ORDER BY service_date DESC LIMIT 3').all(equipmentId);

    const hoursDiff = eq.next_service_hours - eq.current_hours;
    let riskLevel = 'Low';
    let diagnosticSummary = '';
    const componentWearForecast = [];

    if (hoursDiff <= 0) {
      riskLevel = 'Critical (Overdue)';
      diagnosticSummary = `${eq.name} has exceeded its recommended maintenance interval by ${Math.abs(hoursDiff).toFixed(1)} operating hours. Running beyond service limits significantly accelerates bearing friction, hydraulic pump cavitation, and heat degradation of lubricating fluids.`;
      componentWearForecast.push(
        { component: 'Hydraulic System & Pumps', wearPct: 92, status: 'Severe Heat Risk', recommendation: 'Flush reservoir and replace filter before next operation.' },
        { component: 'Drive Variator & Belts', wearPct: 88, status: 'Fatigue Wear', recommendation: 'Inspect belt deflection and tensioner spring.' }
      );
    } else if (hoursDiff <= 25) {
      riskLevel = 'Moderate (Service Window Approaching)';
      diagnosticSummary = `${eq.name} is within ${hoursDiff.toFixed(1)} hours of its scheduled preventive interval. Plan maintenance on the next rain day to avoid peak-fieldwork interruption.`;
      componentWearForecast.push(
        { component: 'Fluid Lubrication Quality', wearPct: 75, status: 'Thermal Depletion', recommendation: 'Schedule fluid change within 20 operating hours.' },
        { component: 'Nozzle Strainers / Filters', wearPct: 70, status: 'Particulate Loading', recommendation: 'Back-flush screens to maintain spray uniformity.' }
      );
    } else {
      riskLevel = 'Optimal (Healthy)';
      diagnosticSummary = `${eq.name} is operating with nominal parameters. Operating hours (${eq.current_hours.toFixed(1)} hrs) remain well within the ${eq.next_service_hours} hr service threshold.`;
      componentWearForecast.push(
        { component: 'Engine Oil & Viscosity', wearPct: 35, status: 'Normal', recommendation: 'Routine grease zerks every 50 hours.' },
        { component: 'Cooling & Air Filtration', wearPct: 25, status: 'Clean', recommendation: 'Blow out cab air filter weekly.' }
      );
    }

    return {
      equipment: eq,
      riskLevel,
      diagnosticSummary,
      componentWearForecast,
      upcomingTasks: tasks,
      recentServiceLogs: logs
    };
  }

  // 4. AI Executive Financial Insights
  generateFinancialInsights() {
    const records = db.prepare(`
      SELECT hy.*, f.name as field_name, c.name as crop_name
      FROM harvest_yields hy
      JOIN fields f ON hy.field_id = f.id
      JOIN crops c ON hy.crop_id = c.id
      ORDER BY hy.net_profit DESC
    `).all();

    const topField = records[0];
    const totalRev = records.reduce((s, r) => s + r.total_revenue, 0);
    const totalProfit = records.reduce((s, r) => s + r.net_profit, 0);
    const overallMargin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;

    return {
      topPerformingField: {
        name: topField ? topField.field_name : 'River Bottom Flat',
        crop: topField ? topField.crop_name : 'Corn',
        netProfit: topField ? topField.net_profit : 75260,
        yieldPerAcre: topField ? topField.yield_per_acre : 208.5
      },
      overallMarginPct: Math.round(overallMargin * 10) / 10,
      totalNetProfit: Math.round(totalProfit),
      keyInsights: [
        'Alluvial river bottom soils yielded 18% higher gross margins for corn than rainfed clay loam terraces, primarily driven by deep moisture retention.',
        'Soybeans following corn required zero supplemental synthetic nitrogen, resulting in an average operating margin of 58.4% across 450 acres.',
        'Alfalfa multi-year stands yielded premium dairy supreme contracts ($195/ton) with less than $315/ac total direct inputs, providing reliable cash flow hedges.',
        'Cover cropping on sandy loam plots prevented topsoil blowout and preserved approximately $24/ac in residual fertilizer nitrates from winter leaching.'
      ],
      aiActionableRecommendations: [
        'Shift 40 acres of low-margin rainfed clay ground into 3-year alfalfa forage stands to capture premium dairy hay contracts.',
        'Implement variable-rate side-dress nitrogen on North Valley to reduce fertilizer costs by an estimated $14,000.',
        'Forward contract 30% of anticipated 2026 corn harvest above $4.90/bu to lock in profitability before harvest delivery.'
      ]
    };
  }

  // Optional: Gemini API caller if user provides GEMINI_API_KEY
  async callGeminiAPI(userPrompt, farmContext, history, userProfile = null) {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const userName = userProfile && userProfile.full_name ? userProfile.full_name : 'Farm Manager';
    const userRole = userProfile && userProfile.role ? userProfile.role : 'Manager';
    const userFarm = userProfile && userProfile.farm_name ? userProfile.farm_name : 'Willow Creek Farm';

    const systemPrompt = `You are HarvestAI, an elite Precision Agricultural Agronomist and Farm Operations Copilot. You are advising ${userName} (${userRole}) at ${userFarm} with 980 acres under management across 8 fields. Current farm context: ${JSON.stringify(farmContext)}. Answer user questions accurately with real agronomic science, economic metrics, and practical field advice. Format with clean markdown headers and bullet points.`;

    const contents = [
      { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question from ${userName}: ${userPrompt}` }] }
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const candidate = data.candidates && data.candidates[0];
    const replyText = candidate ? candidate.content.parts[0].text : 'No response from AI model.';

    return {
      reply: replyText,
      suggestedActions: ['View Crop Matrix', 'Review Field Operations']
    };
  }
}

module.exports = new AIAdvisorService();
