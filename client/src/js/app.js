/**
 * HarvestHub Main Application Controller
 * Handles application lifecycle, interactive SVG farm map, drag-and-drop Kanban board,
 * quick crop rotation palette, what-if simulators, and reactive farm management views.
 */

const CROP_IMAGES = {
  1: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80', // Corn
  2: 'https://images.unsplash.com/photo-1599818817290-73ea74834ff2?w=600&auto=format&fit=crop&q=80', // Soybeans
  3: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80', // Hard Red Winter Wheat
  4: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&auto=format&fit=crop&q=80', // Alfalfa
  5: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=600&auto=format&fit=crop&q=80', // Field Peas
  6: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=600&auto=format&fit=crop&q=80', // Canola
  7: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600&auto=format&fit=crop&q=80', // Sunflowers
  8: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80', // Crimson Clover
  9: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80', // Winter Cereal Rye
  10: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80' // Spring Malting Barley
};

const FIELD_IMAGES = {
  1: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=700&auto=format&fit=crop&q=80', // North Valley Plot
  2: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=700&auto=format&fit=crop&q=80', // Ridge Creek 40
  3: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=700&auto=format&fit=crop&q=80', // River Bottom Flat
  4: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=700&auto=format&fit=crop&q=80', // East Prairie Section
  5: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=700&auto=format&fit=crop&q=80', // South Hill Terrace
  6: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=700&auto=format&fit=crop&q=80', // Willow Springs West
  7: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=700&auto=format&fit=crop&q=80', // Oak Ridge Bottom
  8: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=700&auto=format&fit=crop&q=80'  // Sunrise Pasture Conversion
};

const EQUIPMENT_IMAGES = {
  1: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600&auto=format&fit=crop&q=80', // Tractor
  2: 'https://images.unsplash.com/photo-1562684750-61d02c892850?w=600&auto=format&fit=crop&q=80', // Combine
  3: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&auto=format&fit=crop&q=80', // Planter
  4: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=600&auto=format&fit=crop&q=80', // Sprayer
  5: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=600&auto=format&fit=crop&q=80', // Grain Cart
  6: 'https://images.unsplash.com/photo-1594771804886-a933bb2d609b?w=600&auto=format&fit=crop&q=80', // Tillage
  7: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80', // Spreader
  8: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'  // Track Loader
};

const App = {
  state: {
    currentTab: 'landing',
    operationsView: 'kanban', // 'kanban' or 'table'
    mapLayer: 'crop', // 'crop', 'soil', 'irrigation', 'operations'
    activePaletteCropId: null,
    draggedOpId: null,
    pnlSortKey: 'year',
    pnlSortAsc: false,
    simSlotValues: [1, 2, 3, 8], // default 4-season test sequence
    fields: [],
    crops: [],
    rotations: [],
    operations: [],
    equipment: [],
    pnlData: null,
    weather: null,
    kpis: null,
    currentUser: null,
    token: null
  },

  getCropImageUrl(crop) {
    if (!crop) return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80';
    if (typeof crop === 'number') {
      return CROP_IMAGES[crop] || CROP_IMAGES[1];
    }
    const str = String(crop).toLowerCase();
    if (str.includes('corn')) return CROP_IMAGES[1];
    if (str.includes('soybean')) return CROP_IMAGES[2];
    if (str.includes('wheat')) return CROP_IMAGES[3];
    if (str.includes('alfalfa')) return CROP_IMAGES[4];
    if (str.includes('pea')) return CROP_IMAGES[5];
    if (str.includes('canola')) return CROP_IMAGES[6];
    if (str.includes('sunflower')) return CROP_IMAGES[7];
    if (str.includes('clover')) return CROP_IMAGES[8];
    if (str.includes('rye')) return CROP_IMAGES[9];
    if (str.includes('barley')) return CROP_IMAGES[10];
    return CROP_IMAGES[1];
  },

  async init() {
    console.log('🌾 Initializing HarvestHub Interactive Suite...');
    this.setupEventListeners();
    await this.initAuth();
    await this.loadInitialData();
  },

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
      }
    });

    // Close modal on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('open');
        }
      });
    });
  },

  switchTab(tabName) {
    const PROTECTED_TABS = ['dashboard', 'fields', 'rotations', 'operations', 'analytics', 'equipment'];

    // Auth guard: block internal tabs if not logged in
    if (PROTECTED_TABS.includes(tabName) && !this.state.currentUser) {
      this.showAuthRequiredBanner();
      this.openAuthModal('login');
      return;
    }

    this.state.currentTab = tabName;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.tab-panel').forEach(panel => {
      if (panel.id === tabName) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    if (tabName === 'landing') this.renderLandingPage();
    else if (tabName === 'dashboard') this.renderDashboard();
    else if (tabName === 'fields') this.renderFields();
    else if (tabName === 'rotations') this.renderRotations();
    else if (tabName === 'operations') this.renderOperations();
    else if (tabName === 'analytics') this.renderAnalytics();
    else if (tabName === 'equipment') this.renderEquipment();
  },

  showAuthRequiredBanner() {
    // Show a floating banner nudging sign in
    const existing = document.getElementById('auth-required-banner');
    if (existing) { existing.remove(); }

    const banner = document.createElement('div');
    banner.id = 'auth-required-banner';
    banner.className = 'auth-required-banner';
    banner.innerHTML = `
      <span class="auth-banner-icon">🔒</span>
      <div class="auth-banner-body">
        <strong>Sign in required</strong>
        <span>Create a free account or use a 1-click demo profile to access all farm tools.</span>
      </div>
      <div class="auth-banner-btns">
        <button class="btn btn-hero-primary btn-sm" onclick="App.openAuthModal('signup')">✨ Create Account</button>
        <button class="btn btn-hero-secondary btn-sm" onclick="App.openAuthModal('login')">🔑 Sign In</button>
      </div>
      <button class="auth-banner-dismiss" onclick="this.parentElement.remove()">✕</button>
    `;
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('show'));
    setTimeout(() => { if (banner.parentElement) { banner.style.opacity = '0'; setTimeout(() => banner.remove(), 400); } }, 5000);
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  },

  // ---------------------------------------------
  // User Authentication & Profile Lifecycle
  // ---------------------------------------------
  async initAuth() {
    const savedToken = localStorage.getItem('harvesthub_token');
    const savedUser = localStorage.getItem('harvesthub_user');

    if (savedToken && savedUser) {
      try {
        this.state.token = savedToken;
        this.state.currentUser = JSON.parse(savedUser);
        // Verify token is still valid in background
        API.getMe().then(res => {
          if (res.user) {
            this.state.currentUser = res.user;
            localStorage.setItem('harvesthub_user', JSON.stringify(res.user));
            this.renderAuthHeader();
            this.updateCopilotUserContext();
            this.renderTabLockState();
            this.renderLandingCtaBanner();
          }
        }).catch(() => {
          this.handleLogout(false);
        });
      } catch (e) {
        console.warn('Error restoring user session:', e);
        this.state.currentUser = null;
        this.state.token = null;
      }
    } else {
      // No session found — enforce guest / unauthenticated state
      this.state.currentUser = null;
      this.state.token = null;
    }

    this.renderAuthHeader();
    this.updateCopilotUserContext();
    this.renderTabLockState();
  },

  renderTabLockState() {
    const PROTECTED_TABS = ['dashboard', 'fields', 'rotations', 'operations', 'analytics', 'equipment'];
    const isLoggedIn = !!this.state.currentUser;

    const tabIcons = {
      dashboard: '📊',
      fields: '🗺️',
      rotations: '🔄',
      operations: '🚜',
      analytics: '📈',
      equipment: '🔧'
    };
    const tabLabels = {
      dashboard: 'Overview',
      fields: 'Fields & Map',
      rotations: 'Rotation Matrix',
      operations: 'Field Operations',
      analytics: 'Cost & Yield (P&L)',
      equipment: 'Machinery'
    };

    PROTECTED_TABS.forEach(tab => {
      const btn = document.getElementById(`tab-btn-${tab}`);
      if (!btn) return;
      const lockEl = btn.querySelector('.tab-lock-indicator');
      const textEl = btn.querySelector('.tab-text');

      if (isLoggedIn) {
        if (lockEl) lockEl.textContent = tabIcons[tab] || '';
        if (textEl) textEl.textContent = tabLabels[tab];
        btn.classList.remove('tab-locked');
      } else {
        if (lockEl) lockEl.textContent = '🔒';
        if (textEl) textEl.textContent = tabLabels[tab];
        btn.classList.add('tab-locked');
      }
    });

    // Show/hide header action buttons based on login
    const loggedInActions = document.getElementById('header-logged-in-actions');
    if (loggedInActions) {
      loggedInActions.style.display = isLoggedIn ? 'flex' : 'none';
    }

    // Update pillar cards to show/hide lock overlays
    document.querySelectorAll('.pillar-locked').forEach(card => {
      if (isLoggedIn) {
        card.classList.remove('pillar-locked-active');
      } else {
        card.classList.add('pillar-locked-active');
      }
    });
  },

  renderLandingCtaBanner() {
    const badge = document.getElementById('landing-cta-badge');
    const title = document.getElementById('landing-cta-title');
    const text = document.getElementById('landing-cta-text');
    const actions = document.getElementById('landing-cta-actions');
    const u = this.state.currentUser;

    if (u) {
      if (badge) badge.textContent = `✅ Welcome back, ${u.full_name.split(' ')[0]}!`;
      if (title) title.textContent = `${u.farm_name || 'Willow Creek Farm'} is Ready for Operations`;
      if (text) text.textContent = `Logged in as ${u.role} • 8 fields mapped • Real-time weather active`;
      if (actions) actions.innerHTML = `
        <button class="btn btn-hero-primary" style="font-size:1rem; padding: 0.8rem 1.8rem;" onclick="App.switchTab('dashboard')">
          <span>🌾</span> Open Farm Dashboard
        </button>
        <button class="btn btn-hero-secondary" onclick="App.openProfileModal()">
          👤 My Profile
        </button>
      `;
    } else {
      if (badge) badge.textContent = '🔒 Sign In to Get Started';
      if (title) title.textContent = 'Your Farm Dashboard Awaits';
      if (text) text.textContent = '8 fields mapped • 10 crop varieties loaded • 15 automated tests verified • Real-time weather active';
      if (actions) actions.innerHTML = `
        <button class="btn btn-auth-signup" style="font-size:1rem; padding: 0.8rem 1.8rem;" onclick="App.openAuthModal('signup')">
          <span>✨</span> Create Farm Account
        </button>
        <button class="btn btn-hero-secondary" onclick="App.openAuthModal('login')">
          🔑 Sign In
        </button>
      `;
    }
  },

  renderAuthHeader() {
    const container = document.getElementById('header-auth-area');
    if (!container) return;

    if (this.state.currentUser) {
      const u = this.state.currentUser;
      const initials = u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
      const roleColor = u.role.includes('Manager') ? '#059669' : u.role.includes('Agron') ? '#2563eb' : '#d97706';
      container.innerHTML = `
        <div class="user-profile-badge" onclick="App.openProfileModal()" title="View & Edit Profile (${u.email})">
          <div class="user-avatar-circle" style="border: 2px solid ${roleColor};">
            ${u.avatar_url && !u.avatar_url.includes('dicebear') ? `<img src="${u.avatar_url}" alt="${u.full_name}">` : initials}
          </div>
          <div style="display: flex; flex-direction: column; line-height: 1.1;">
            <span class="user-name-label">${u.full_name.split(' ')[0]}</span>
            <span class="user-role-label" style="color: ${roleColor};">${u.role.split(' ')[0]}</span>
          </div>
          <span style="font-size:0.7rem; color:rgba(255,255,255,0.5);">▼</span>
        </div>
      `;
    } else {
      container.innerHTML = `
        <button class="btn btn-auth-signin btn-sm" onclick="App.openAuthModal('login')">🔑 Sign In</button>
        <button class="btn btn-auth-signup btn-sm" onclick="App.openAuthModal('signup')">✨ Sign Up</button>
      `;
    }

    // Always sync lock state when auth changes
    this.renderTabLockState();
    this.renderLandingCtaBanner();
  },

  openAuthModal(mode = 'login') {
    this.setAuthMode(mode);
    this.openModal('modal-auth');
  },

  setAuthMode(mode) {
    const loginTab = document.getElementById('tab-auth-login');
    const signupTab = document.getElementById('tab-auth-signup');
    const loginForm = document.getElementById('form-auth-login');
    const signupForm = document.getElementById('form-auth-signup');
    const title = document.getElementById('auth-modal-title');

    if (mode === 'login') {
      loginTab?.classList.add('active');
      signupTab?.classList.remove('active');
      if (loginForm) loginForm.style.display = 'block';
      if (signupForm) signupForm.style.display = 'none';
      if (title) title.textContent = 'Sign In to HarvestHub';
    } else {
      loginTab?.classList.remove('active');
      signupTab?.classList.add('active');
      if (loginForm) loginForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'block';
      if (title) title.textContent = 'Create Farm Account';
    }
  },

  async quickLoginAs(email, password, showToastAlert = true) {
    try {
      const res = await API.login(email, password);
      this.state.token = res.token;
      this.state.currentUser = res.user;
      localStorage.setItem('harvesthub_token', res.token);
      localStorage.setItem('harvesthub_user', JSON.stringify(res.user));

      this.closeModal('modal-auth');
      this.renderAuthHeader();
      this.updateCopilotUserContext();

      if (showToastAlert) {
        this.showToast(`Signed in as ${res.user.full_name} (${res.user.role})! 🌾`);
        // Auto-navigate to dashboard after login
        setTimeout(() => this.switchTab('dashboard'), 300);
      }
    } catch (err) {
      if (showToastAlert) {
        this.showToast(`Login failed: ${err.message}`, 'error');
      }
    }
  },

  async handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const res = await API.login(email, password);
      this.state.token = res.token;
      this.state.currentUser = res.user;
      localStorage.setItem('harvesthub_token', res.token);
      localStorage.setItem('harvesthub_user', JSON.stringify(res.user));

      this.closeModal('modal-auth');
      this.renderAuthHeader();
      this.updateCopilotUserContext();
      this.showToast(`Welcome back, ${res.user.full_name}! 🌾`);
      setTimeout(() => this.switchTab('dashboard'), 300);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async handleSignupSubmit(e) {
    e.preventDefault();
    const payload = {
      full_name: document.getElementById('signup-name').value.trim(),
      email: document.getElementById('signup-email').value.trim(),
      password: document.getElementById('signup-password').value,
      role: document.getElementById('signup-role').value,
      farm_name: document.getElementById('signup-farm').value.trim()
    };

    try {
      const res = await API.signup(payload);
      this.state.token = res.token;
      this.state.currentUser = res.user;
      localStorage.setItem('harvesthub_token', res.token);
      localStorage.setItem('harvesthub_user', JSON.stringify(res.user));

      this.closeModal('modal-auth');
      this.renderAuthHeader();
      this.updateCopilotUserContext();
      this.showToast(`Farm account created! Welcome, ${res.user.full_name}! 🌾`);
      setTimeout(() => this.switchTab('dashboard'), 300);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  openProfileModal() {
    if (!this.state.currentUser) {
      this.openAuthModal('login');
      return;
    }

    const u = this.state.currentUser;
    const nameDisplay = document.getElementById('profile-name-display');
    const emailDisplay = document.getElementById('profile-email-display');
    const roleDisplay = document.getElementById('profile-role-display');
    const avatarDisplay = document.getElementById('profile-avatar-display');

    if (nameDisplay) nameDisplay.textContent = u.full_name;
    if (emailDisplay) emailDisplay.textContent = u.email;
    if (roleDisplay) roleDisplay.textContent = `${u.role} • ${u.farm_name}`;

    if (avatarDisplay) {
      if (u.avatar_url && !u.avatar_url.includes('dicebear')) {
        avatarDisplay.innerHTML = `<img src="${u.avatar_url}" alt="${u.full_name}">`;
      } else {
        const initials = u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
        avatarDisplay.textContent = initials;
      }
    }

    document.getElementById('edit-profile-name').value = u.full_name || '';
    document.getElementById('edit-profile-role').value = u.role || 'Farm Manager';
    document.getElementById('edit-profile-farm').value = u.farm_name || 'Willow Creek Farm';

    this.openModal('modal-profile');
  },

  async handleProfileUpdateSubmit(e) {
    e.preventDefault();
    const payload = {
      full_name: document.getElementById('edit-profile-name').value.trim(),
      role: document.getElementById('edit-profile-role').value,
      farm_name: document.getElementById('edit-profile-farm').value.trim()
    };

    try {
      const res = await API.updateProfile(payload);
      this.state.currentUser = res.user;
      localStorage.setItem('harvesthub_user', JSON.stringify(res.user));
      this.closeModal('modal-profile');
      this.renderAuthHeader();
      this.updateCopilotUserContext();
      this.showToast('Profile updated successfully!');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  handleLogout(notify = true) {
    localStorage.removeItem('harvesthub_token');
    localStorage.removeItem('harvesthub_user');
    this.state.currentUser = null;
    this.state.token = null;
    this.closeModal('modal-profile');
    this.renderAuthHeader();
    this.updateCopilotUserContext();
    // Always return to landing on logout
    this.switchTab('landing');
    if (notify) {
      this.showToast('Logged out of HarvestHub. See you next season! 👋');
    }
  },

  updateCopilotUserContext() {
    const userTag = document.getElementById('ai-drawer-user-tag');
    const bubbleText = document.getElementById('ai-bubble-text');
    const btnUserTag = document.getElementById('ai-btn-user-tag');

    const u = this.state.currentUser;
    if (u) {
      if (userTag) userTag.textContent = `👤 Advising: ${u.full_name} (${u.role})`;
      if (bubbleText) bubbleText.innerHTML = `Hi <strong>${u.full_name.split(' ')[0]}</strong>! Ask me any question about your 8 fields, crops, or machinery.`;
      if (btnUserTag) btnUserTag.textContent = u.full_name.split(' ')[0];
    } else {
      if (userTag) userTag.textContent = `👤 Advising: Guest Operator (Willow Creek Farm)`;
      if (bubbleText) bubbleText.textContent = `Ask me anything about your 8 fields, crops, or machinery!`;
      if (btnUserTag) btnUserTag.textContent = 'Online';
    }
  },

  dismissAIBubble() {
    const bubble = document.getElementById('ai-speech-bubble');
    if (bubble) bubble.style.display = 'none';
  },

  clearAIChat() {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;

    const u = this.state.currentUser;
    const name = u ? u.full_name : 'Farm Operator';

    container.innerHTML = `
      <div class="chat-bubble ai">
        <strong>🌾 HarvestAI Copilot Ready!</strong><br><br>
        Hello <strong>${name}</strong>. Chat history has been cleared. I am monitoring your 8 fields (980 acres) in real time.<br><br>
        Ask me <strong>any question</strong> or pick a quick prompt:
        <div class="chat-chips-row">
          <div class="chat-chip" onclick="App.sendQuickPrompt('Analyze pest risks across all fields')">🐛 Pest Risks</div>
          <div class="chat-chip" onclick="App.sendQuickPrompt('Recommend next crop for North Valley')">🌾 Next Crop</div>
          <div class="chat-chip" onclick="App.sendQuickPrompt('Summarize machinery maintenance alerts')">🔧 Fleet Alerts</div>
          <div class="chat-chip" onclick="App.sendQuickPrompt('How can I optimize crop profit margins?')">💰 ROI Levers</div>
          <div class="chat-chip" onclick="App.sendQuickPrompt('Is today a good day for chemical spraying?')">🌦️ Spray Window</div>
        </div>
      </div>
      <div class="typing-indicator" id="ai-typing-indicator" style="display: none;">
        <span></span><span></span><span></span>
        <small style="color: var(--text-muted); font-size: 0.75rem; margin-left: 0.5rem;">HarvestAI is synthesizing agronomic data...</small>
      </div>
    `;
    this.showToast('AI conversation reset.');
  },

  // ---------------------------------------------
  // Data Loading
  // ---------------------------------------------
  async loadInitialData() {
    try {
      const [weatherRes, kpiRes, fieldsRes, cropsRes, equipRes] = await Promise.all([
        API.getWeather(),
        API.getKPIs(),
        API.getFields(),
        API.getCrops(),
        API.getEquipment()
      ]);

      this.state.weather = weatherRes.data;
      this.state.kpis = kpiRes.data;
      this.state.fields = fieldsRes.data;
      this.state.crops = cropsRes.data;
      this.state.equipment = equipRes.data;

      this.renderWeatherHeader();
      this.renderLandingPage();
      this.renderDashboard();
      this.updateMaintenanceBadge();
      this.initProfitSimulator();
      this.renderTabLockState();
      this.renderLandingCtaBanner();
    } catch (err) {
      console.error('Failed to load initial data:', err);
      this.showToast('Could not load farm telemetry. Check server connection.', 'error');
    }
  },

  // ---------------------------------------------
  // Weather & Top Header
  // ---------------------------------------------
  renderWeatherHeader() {
    if (!this.state.weather) return;
    const cur = this.state.weather.current;

    const banner = document.getElementById('weather-banner');
    const tempSpan = document.getElementById('weather-temp');
    const spraySpan = document.getElementById('weather-spray');

    tempSpan.textContent = `🌤️ ${cur.condition} ${cur.tempF}°F • Wind ${cur.windSpeedMph} mph`;
    spraySpan.textContent = `Spraying: ${cur.fieldConditions.sprayabilityIndex}`;
    spraySpan.style.background = cur.fieldConditions.sprayabilityIndex === 'Optimal' ? '#059669' : '#d97706';

    const tempLarge = document.getElementById('weather-temp-large');
    if (tempLarge) tempLarge.textContent = `${cur.tempF}°F`;
    const condDesc = document.getElementById('weather-condition-desc');
    if (condDesc) condDesc.textContent = cur.condition;
    const wind = document.getElementById('weather-wind');
    if (wind) wind.textContent = `${cur.windSpeedMph} mph ${cur.windDirection}`;
    const soilTemp = document.getElementById('weather-soil-temp');
    if (soilTemp) soilTemp.textContent = `${cur.soilTemp4inF}°F`;
    const soilMoist = document.getElementById('weather-soil-moist');
    if (soilMoist) soilMoist.textContent = `${cur.soilMoisturePct}%`;
    const loc = document.getElementById('weather-location');
    if (loc) loc.textContent = cur.location;

    const adviceBox = document.getElementById('weather-advice-box');
    if (adviceBox) {
      adviceBox.innerHTML = `
        <strong>Spray Window (${cur.fieldConditions.sprayabilityIndex}):</strong> ${cur.fieldConditions.sprayAdvice}<br>
        <strong>Planting Suitability (${cur.fieldConditions.plantingSuitability}):</strong> ${cur.fieldConditions.plantingAdvice}
      `;
    }

    const forecastContainer = document.getElementById('forecast-cards');
    if (forecastContainer && this.state.weather.forecast) {
      forecastContainer.innerHTML = this.state.weather.forecast.map(f => `
        <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.6rem 0.75rem; min-width: 110px; text-align: center;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">${f.day}</div>
          <div style="font-size: 1.05rem; font-weight: 800; margin: 0.2rem 0;">${f.highF}° / ${f.lowF}°</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${f.condition}</div>
          <div style="margin-top: 0.35rem; font-size: 0.68rem; font-weight: 600; color: ${f.suitability.includes('Poor') ? 'var(--danger)' : 'var(--primary-dark)'};">
            ${f.suitability}
          </div>
        </div>
      `).join('');
    }
  },

  updateMaintenanceBadge() {
    const overdueCount = this.state.equipment.filter(e => e.computed_status === 'Overdue').length;
    const badge = document.getElementById('maint-alert-badge');
    if (badge) {
      if (overdueCount > 0) {
        badge.textContent = overdueCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  },

  // ---------------------------------------------
  // TAB 0: Landing Page & Real Crop Showcase
  // ---------------------------------------------
  renderLandingPage() {
    // 1. Update animated live counters
    if (this.state.kpis) {
      const acresElem = document.getElementById('landing-stat-acres');
      if (acresElem) acresElem.textContent = `${this.state.kpis.totalAcreage.toLocaleString()}`;

      const healthElem = document.getElementById('landing-stat-health');
      if (healthElem) healthElem.textContent = `${this.state.kpis.avgRotationScore}%`;

      const profitElem = document.getElementById('landing-stat-profit');
      if (profitElem) profitElem.textContent = `$${Math.round(this.state.kpis.financials.totalNetProfit / 1000)}K`;

      const opsElem = document.getElementById('landing-stat-ops');
      if (opsElem) opsElem.textContent = `${this.state.kpis.pendingOps + this.state.kpis.completedOps}`;

      const equipElem = document.getElementById('landing-stat-equip');
      if (equipElem) equipElem.textContent = `${this.state.equipment.length}`;
    }

    // 2. Render Real Crop Cards in Showcase
    const showcaseContainer = document.getElementById('landing-crops-showcase');
    if (!showcaseContainer || !this.state.crops || this.state.crops.length === 0) return;

    showcaseContainer.innerHTML = this.state.crops.map(crop => {
      const cropImg = App.getCropImageUrl(crop.id);
      const isLegume = crop.botanical_family.includes('Legume');
      const isGrass = crop.botanical_family.includes('Grass');
      const isMustard = crop.botanical_family.includes('Mustard');
      const badgeClass = isLegume ? 'legume' : isGrass ? 'grass' : isMustard ? 'mustard' : '';

      return `
        <div class="crop-showcase-card" data-family="${crop.botanical_family}" onclick="App.viewCropDetail(${crop.id})">
          <div class="crop-card-image-wrap">
            <img src="${cropImg}" alt="${crop.name}" class="crop-card-image" loading="lazy">
            <div class="crop-card-img-overlay"></div>
            <span class="crop-family-badge ${badgeClass}">${crop.botanical_family.split(' ')[0]}</span>
            <span class="crop-variety-tag">${crop.variety}</span>
          </div>

          <div class="crop-card-body">
            <div>
              <div class="crop-card-title-row">
                <span class="crop-card-name">${crop.name}</span>
                <span class="crop-card-price">$${crop.market_price_per_unit.toFixed(2)} / ${crop.yield_unit.split('/')[0]}</span>
              </div>

              <div class="crop-specs-grid">
                <div class="crop-spec-item">
                  <div class="crop-spec-label">Target Yield</div>
                  <div class="crop-spec-val">${crop.typical_yield_per_acre} ${crop.yield_unit}</div>
                </div>
                <div class="crop-spec-item">
                  <div class="crop-spec-label">Maturity</div>
                  <div class="crop-spec-val">${crop.days_to_maturity} Days (${crop.season})</div>
                </div>
                <div class="crop-spec-item">
                  <div class="crop-spec-label">Nitrogen</div>
                  <div class="crop-spec-val" style="color: ${isLegume ? '#059669' : '#d97706'};">${crop.nitrogen_demand}</div>
                </div>
                <div class="crop-spec-item">
                  <div class="crop-spec-label">Root System</div>
                  <div class="crop-spec-val">${crop.root_depth}</div>
                </div>
              </div>
            </div>

            <button class="crop-card-btn" onclick="event.stopPropagation(); App.viewCropDetail(${crop.id})">
              <span>🔍</span> Inspect Agronomic Profile
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Also refresh CTA banner and simulator diagnostics
    this.renderLandingCtaBanner();
    this.initLandingSimulator();
  },

  // Filter crop cards by botanical family category
  filterLandingCrops(category, btnEl) {
    // Update active pill
    document.querySelectorAll('.crop-filter-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const cards = document.querySelectorAll('.crop-showcase-card');
    cards.forEach(card => {
      const fam = card.getAttribute('data-family') || '';
      if (category === 'all' || fam.includes(category)) {
        card.style.display = '';
        card.style.animation = 'fadeIn 0.3s ease';
      } else {
        card.style.display = 'none';
      }
    });
  },

  // Landing Rotation Simulator Logic
  initLandingSimulator() {
    const defaults = ['1', '2', '3', '8'];
    defaults.forEach((val, i) => {
      const sel = document.getElementById(`landing-sim-slot-${i}`);
      if (sel) sel.value = val;
      this._updateSimBadge(i, val);
    });
    this._computeSimScore();
  },

  handleLandingSimChange(slotIndex, cropIdStr) {
    this._updateSimBadge(slotIndex, cropIdStr);
    this._computeSimScore();
  },

  _updateSimBadge(slotIndex, cropIdStr) {
    const cropId = parseInt(cropIdStr);
    const badgeEl = document.getElementById(`landing-sim-badge-${slotIndex}`);
    if (!badgeEl) return;

    const crop = this.state.crops ? this.state.crops.find(c => c.id === cropId) : null;
    const nDemand = crop ? crop.nitrogen_demand : '';
    const isFixerCrop = nDemand === 'Nitrogen Fixer';

    if (isFixerCrop) {
      badgeEl.textContent = '🌱 Nitrogen Fixer';
      badgeEl.className = 'sim-slot-badge legume';
    } else if (cropId === 1) {
      badgeEl.textContent = '⚡ Heavy Feeder';
      badgeEl.className = 'sim-slot-badge heavy';
    } else if (cropId === 3 || cropId === 9 || cropId === 10) {
      badgeEl.textContent = '🌾 Moderate Feeder';
      badgeEl.className = 'sim-slot-badge';
    } else if (cropId === 6 || cropId === 7) {
      badgeEl.textContent = '🌻 Oilseed Crop';
      badgeEl.className = 'sim-slot-badge mustard';
    } else {
      badgeEl.textContent = crop ? crop.nitrogen_demand : 'Unknown';
      badgeEl.className = 'sim-slot-badge';
    }
  },

  _computeSimScore() {
    const slots = [0, 1, 2, 3].map(i => {
      const sel = document.getElementById(`landing-sim-slot-${i}`);
      return sel ? parseInt(sel.value) : 1;
    });

    let score = 70;
    let diagnostics = [];

    // Check for nitrogen-fixing crops
    const FIXERS = new Set([2, 4, 5, 8]); // soybeans, alfalfa, field peas, clover
    const HEAVY = new Set([1]); // corn
    const GRASS = new Set([3, 9, 10]); // wheat, rye, barley

    const fixerCount = slots.filter(id => FIXERS.has(id)).length;
    const heavyCount = slots.filter(id => HEAVY.has(id)).length;
    const uniqueFamilies = new Set(slots).size;

    // Monoculture penalty
    if (uniqueFamilies === 1) {
      score -= 30;
      diagnostics.push({ type: 'danger', icon: '⚠️', label: 'Monoculture Risk', text: 'Continuous same-crop monoculture creates severe pest pressure, pathogen buildup, and soil depletion.' });
    }

    // Fixer bonus
    if (fixerCount >= 1) {
      score += fixerCount * 10;
      diagnostics.push({ type: 'success', icon: '🌱', label: 'Nitrogen Credit', text: `${fixerCount} legume(s) in rotation fix atmospheric nitrogen, reducing synthetic fertilizer inputs by ~40 lbs N/acre per legume.` });
    }

    // Heavy back-to-back penalty
    for (let i = 0; i < slots.length - 1; i++) {
      if (HEAVY.has(slots[i]) && HEAVY.has(slots[i + 1])) {
        score -= 20;
        diagnostics.push({ type: 'danger', icon: '🐛', label: 'Back-to-Back Corn Risk', text: 'Continuous corn dramatically increases corn rootworm pressure and requires costly soil insecticides.' });
        break;
      }
    }

    // Diversity bonus
    if (uniqueFamilies >= 3) {
      score += 12;
      diagnostics.push({ type: 'success', icon: '🛡️', label: 'Pest Break', text: `${uniqueFamilies}-family diversity disrupts pest reproduction cycles and reduces pesticide dependency by 25–35%.` });
    }

    // Grass in rotation bonus
    const grassCount = slots.filter(id => GRASS.has(id)).length;
    if (grassCount >= 1) {
      score += 5;
      diagnostics.push({ type: 'info', icon: '💧', label: 'Soil Structure', text: 'Fibrous-root cereal grasses improve topsoil aggregation and increase organic matter infiltration rates.' });
    }

    if (diagnostics.length === 0) {
      diagnostics.push({ type: 'info', icon: 'ℹ️', label: 'Evaluation', text: 'Adjust crop selections above to see live agronomic analysis.' });
    }

    score = Math.max(30, Math.min(100, score));

    const scoreEl = document.getElementById('landing-sim-score');
    const ratingEl = document.getElementById('landing-sim-rating');
    const diagEl = document.getElementById('landing-sim-diagnostics');

    if (scoreEl) scoreEl.textContent = `${score}%`;
    if (ratingEl) {
      if (score >= 90) ratingEl.textContent = 'Optimal Succession';
      else if (score >= 75) ratingEl.textContent = 'Good Diversification';
      else if (score >= 55) ratingEl.textContent = 'Moderate Risk';
      else ratingEl.textContent = 'High Risk — Adjust Rotation';
      ratingEl.style.background = score >= 90 ? 'rgba(16,185,129,0.3)' : score >= 75 ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)';
    }

    if (diagEl) {
      diagEl.innerHTML = diagnostics.map(d => `
        <div class="sim-diag-item ${d.type}">
          <span>${d.icon}</span> <strong>${d.label}:</strong> ${d.text}
        </div>
      `).join('');
    }
  },

  viewCropDetail(cropId) {
    const crop = this.state.crops.find(c => c.id === cropId);
    if (!crop) return;

    const cropImg = App.getCropImageUrl(crop.id);
    document.getElementById('crop-detail-title').textContent = `${crop.name} — Full Agronomic Profile`;

    const content = document.getElementById('crop-detail-content');
    content.innerHTML = `
      <div style="position: relative; height: 180px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 1.5rem;">
        <img src="${cropImg}" alt="${crop.name}" style="width: 100%; height: 100%; object-fit: cover;">
        <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 20%, rgba(6, 78, 59, 0.9) 100%);"></div>
        <div style="position: absolute; bottom: 1rem; left: 1.25rem; color: #ffffff;">
          <span class="badge badge-active" style="margin-bottom: 0.35rem;">${crop.botanical_family}</span>
          <h3 style="font-size: 1.6rem; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${crop.name} (${crop.variety})</h3>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 1.25rem;">
        <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem;">
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.6rem; color: var(--primary-dark);">Biological Profile</h4>
          <p style="margin-bottom: 0.4rem; font-size: 0.85rem;"><strong>Botanical Family:</strong> ${crop.botanical_family}</p>
          <p style="margin-bottom: 0.4rem; font-size: 0.85rem;"><strong>Typical Season:</strong> ${crop.season} (${crop.days_to_maturity} days to maturity)</p>
          <p style="margin-bottom: 0.4rem; font-size: 0.85rem;"><strong>Nitrogen Demand:</strong> <span class="badge ${crop.nitrogen_demand === 'Nitrogen Fixer' ? 'badge-active' : 'badge-warning'}">${crop.nitrogen_demand}</span></p>
          <p style="margin-bottom: 0.4rem; font-size: 0.85rem;"><strong>Root Architecture:</strong> ${crop.root_depth}</p>
          <p style="font-size: 0.85rem;"><strong>Water Requirement:</strong> ${crop.water_requirement}</p>
        </div>

        <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem;">
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.6rem; color: var(--primary-dark);">Economic Benchmarks</h4>
          <p style="margin-bottom: 0.4rem; font-size: 0.85rem;"><strong>Target Yield:</strong> ${crop.typical_yield_per_acre} ${crop.yield_unit}</p>
          <p style="margin-bottom: 0.4rem; font-size: 0.85rem;"><strong>Current Market Price:</strong> $${crop.market_price_per_unit.toFixed(2)} per ${crop.yield_unit.split('/')[0]}</p>
          <p style="margin-bottom: 0.4rem; font-size: 0.85rem;"><strong>Projected Gross Revenue / Acre:</strong> $${(crop.typical_yield_per_acre * crop.market_price_per_unit).toFixed(2)}</p>
          <p style="font-size: 0.85rem;"><strong>Willow Creek Suitability:</strong> Excellent (Zone 5b)</p>
        </div>
      </div>

      <div style="margin-bottom: 1rem;">
        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.4rem; color: #065f46;">🌱 Beneficial Companion Crops:</h4>
        <div style="background: #f0fdf4; border: 1px solid var(--primary-light); border-radius: var(--radius-sm); padding: 0.75rem 1rem; font-size: 0.85rem; color: #064e3b;">
          ${crop.companion_crops || 'General crop rotation diversity'}
        </div>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.4rem; color: #991b1b;">⚠️ Pests & Biological Disease Vectors:</h4>
        <div style="background: #fef2f2; border: 1px solid var(--danger-light); border-radius: var(--radius-sm); padding: 0.75rem 1rem; font-size: 0.85rem; color: #991b1b;">
          ${crop.pests_diseases || 'Standard regional monitoring'}
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.6rem;">
        <button class="btn btn-outline" onclick="App.closeModal('modal-crop-detail')">Close</button>
        <button class="btn btn-primary" onclick="App.closeModal('modal-crop-detail'); App.switchTab('rotations'); App.selectPaletteCrop(${crop.id});">
          Assign in Rotation Matrix →
        </button>
      </div>
    `;

    this.openModal('modal-crop-detail');
  },

  // ---------------------------------------------
  // TAB 1: Dashboard
  // ---------------------------------------------
  async renderDashboard() {
    try {
      const kpisRes = await API.getKPIs();
      const kpis = kpisRes.data;
      this.state.kpis = kpis;

      document.getElementById('kpi-acreage').textContent = `${kpis.totalAcreage.toLocaleString()} ac`;
      document.getElementById('kpi-active-fields').textContent = `${kpis.activeFields} Active Fields`;

      document.getElementById('kpi-rotation-score').textContent = `${kpis.avgRotationScore}%`;
      const ratingSpan = document.getElementById('kpi-rotation-rating');
      ratingSpan.textContent = kpis.avgRotationScore >= 80 ? 'Optimal Succession' : 'Caution / Imbalance';
      ratingSpan.className = `kpi-badge ${kpis.avgRotationScore >= 80 ? 'success' : 'amber'}`;

      document.getElementById('kpi-pending-ops').textContent = kpis.pendingOps;
      document.getElementById('kpi-completed-ops').textContent = `${kpis.completedOps} Completed this season`;

      document.getElementById('kpi-overdue-maint').textContent = kpis.overdueCount;
      document.getElementById('kpi-due-soon-maint').textContent = `${kpis.dueSoonCount} machines due soon`;

      const maintCard = document.getElementById('kpi-maint-card');
      if (kpis.overdueCount > 0) {
        maintCard.classList.add('red');
      } else {
        maintCard.classList.remove('red');
      }

      document.getElementById('kpi-net-profit').textContent = `$${Math.round(kpis.financials.totalNetProfit).toLocaleString()}`;
      document.getElementById('kpi-margin-pct').textContent = `${kpis.financials.overallMarginPct}% Operating Margin`;

      const opsRes = await API.getOperations({ status: 'Planned' });
      const recentOps = opsRes.data.slice(0, 4);
      const opsContainer = document.getElementById('dashboard-recent-ops');

      if (recentOps.length === 0) {
        opsContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.88rem;">No pending operations scheduled. All clear!</div>`;
      } else {
        opsContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${recentOps.map(op => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md);">
                <div>
                  <div style="font-weight: 700; font-size: 0.88rem;">${op.title}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">
                    📍 ${op.field_name} • 🗓️ ${op.scheduled_date} • 👤 ${op.assigned_to}
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                  <span class="badge ${op.priority === 'Critical' ? 'badge-danger' : op.priority === 'High' ? 'badge-warning' : 'badge-planned'}">
                    ${op.priority}
                  </span>
                  <button class="btn btn-outline btn-sm" onclick="App.openInputsModal(${op.id})">Inputs ($${op.total_input_cost.toLocaleString()})</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      const maintContainer = document.getElementById('dashboard-recent-maint');
      const urgentEquip = this.state.equipment.filter(e => e.computed_status === 'Overdue' || e.computed_status === 'Due Soon');

      if (urgentEquip.length === 0) {
        maintContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.88rem;">All machines within service intervals. Fleet operational!</div>`;
      } else {
        maintContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${urgentEquip.map(eq => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md);">
                <div>
                  <div style="font-weight: 700; font-size: 0.88rem;">${eq.name}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">
                    Meter: ${eq.current_hours.toFixed(1)} hrs • Target: ${eq.next_service_target} hrs (${eq.hours_remaining <= 0 ? `${Math.abs(eq.hours_remaining)}h overdue` : `${eq.hours_remaining}h remaining`})
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                  <span class="badge ${eq.computed_status === 'Overdue' ? 'badge-danger' : 'badge-warning'}">
                    ${eq.computed_status}
                  </span>
                  <button class="btn btn-primary btn-sm" onclick="App.openCompleteServiceModal(${eq.id})">Service</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } catch (err) {
      console.error('Error rendering dashboard:', err);
    }
  },

  // ---------------------------------------------
  // TAB 2: Fields & Interactive Farm Map
  // ---------------------------------------------
  async renderFields() {
    try {
      const res = await API.getFields();
      this.state.fields = res.data;
      this.renderFarmMap(this.state.mapLayer);

      const grid = document.getElementById('fields-grid');
      grid.innerHTML = this.state.fields.map(f => {
        const fieldImg = FIELD_IMAGES[f.id] || FIELD_IMAGES[1];
        const currentCropImg = App.getCropImageUrl(f.current_crop);
        const statusBadge = f.status === 'Active' ? 'badge-active' : 'badge-warning';

        return `
          <div class="field-card-enhanced">
            <div class="field-header-image" style="background-image: url('${fieldImg}');">
              <div class="field-header-overlay"></div>
              <span class="badge ${statusBadge} field-status-pill">${f.status}</span>
              <div class="field-header-content">
                <div>
                  <div class="field-header-name">${f.name}</div>
                  <div class="field-header-acres">📍 ${f.acreage} Acres • ${f.irrigation_type}</div>
                </div>
              </div>
            </div>

            <div class="field-card-inner">
              <div style="background: #f8fafc; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.85rem;">
                <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.35rem;">Soil Profile</div>
                <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 0.35rem; color: #334155;">🌱 ${f.soil_type}</div>
                <div style="display: flex; gap: 1rem; font-size: 0.8rem; color: #475569;">
                  <span>pH: <strong>${f.ph_level.toFixed(1)}</strong></span>
                  <span>Organic Matter: <strong>${f.organic_matter_pct}%</strong></span>
                </div>
              </div>

              <div style="margin-bottom: 1rem; background: #f0fdf4; border: 1px solid #d1fae5; border-radius: var(--radius-md); padding: 0.65rem 0.85rem; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="color: #065f46; font-size: 0.72rem; font-weight: 600; text-transform: uppercase;">2026 Active Crop</div>
                  <div style="font-weight: 700; color: #064e3b; font-size: 0.92rem;">
                    ${f.current_crop || 'No crop assigned'}
                  </div>
                </div>
                ${f.current_crop ? `
                  <div class="crop-avatar-wrap" style="width: 36px; height: 36px;" title="${f.current_crop}">
                    <img src="${currentCropImg}" alt="${f.current_crop}">
                  </div>
                ` : ''}
              </div>

              <div style="display: flex; gap: 0.5rem; border-top: 1px solid var(--border-light); padding-top: 0.85rem;">
                <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="App.viewFieldDetail(${f.id})">🔍 History & Profile</button>
                <button class="btn btn-outline btn-sm" onclick="App.viewFieldRotation(${f.id})">🔄 Rotation</button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Error rendering fields:', err);
    }
  },

  // Interactive 2D SVG Farm Map Renderer
  setMapLayer(layer) {
    this.state.mapLayer = layer;
    document.querySelectorAll('.map-layer-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-layer-${layer}`);
    if (activeBtn) activeBtn.classList.add('active');
    this.renderFarmMap(layer);
  },

  renderFarmMap(layer = 'crop') {
    const svg = document.getElementById('farm-svg-canvas');
    if (!svg) return;

    // Defined coordinates for Willow Creek Farm 8 plots
    const fieldPolygons = [
      { id: 1, points: '40,40 250,40 270,180 40,190', labelX: 145, labelY: 110, pivot: { cx: 145, cy: 110, r: 60 } },
      { id: 2, points: '290,40 480,40 470,180 290,175', labelX: 385, labelY: 110 },
      { id: 3, points: '520,30 750,50 730,190 510,180', labelX: 630, labelY: 115 },
      { id: 4, points: '770,40 960,40 960,200 755,200', labelX: 865, labelY: 120, pivot: { cx: 865, cy: 120, r: 65 } },
      { id: 5, points: '40,230 240,240 230,410 40,410', labelX: 135, labelY: 325 },
      { id: 6, points: '270,225 500,225 490,410 260,410', labelX: 380, labelY: 320, pivot: { cx: 380, cy: 320, r: 70 } },
      { id: 7, points: '530,230 730,230 710,410 520,410', labelX: 620, labelY: 320 },
      { id: 8, points: '760,240 960,230 960,410 740,410', labelX: 850, labelY: 325, pivot: { cx: 850, cy: 325, r: 65 } }
    ];

    let svgHtml = `
      <!-- Farm Roadways & River -->
      <path d="M 0,210 Q 500,200 1000,215" stroke="#334155" stroke-width="12" fill="none" stroke-dasharray="10 4" opacity="0.6"/>
      <path d="M 505,0 Q 515,220 510,450" stroke="#0284c7" stroke-width="16" fill="none" opacity="0.5" stroke-linecap="round"/>
      <text x="515" y="25" fill="#38bdf8" font-size="10" font-weight="700">Willow Creek River</text>
    `;

    for (const poly of fieldPolygons) {
      const field = this.state.fields.find(f => f.id === poly.id) || { name: `Field ${poly.id}`, acreage: 100, current_crop: 'Corn' };

      // Determine fill color based on layer
      let fillColor = '#10b981';
      let subText = field.current_crop || 'Active';

      if (layer === 'crop') {
        const crop = field.current_crop || '';
        if (crop.includes('Corn')) fillColor = '#f59e0b';
        else if (crop.includes('Soybean')) fillColor = '#10b981';
        else if (crop.includes('Wheat')) fillColor = '#eab308';
        else if (crop.includes('Alfalfa')) fillColor = '#047857';
        else if (crop.includes('Sunflower')) fillColor = '#fbbf24';
        else if (crop.includes('Peas')) fillColor = '#14b8a6';
        else fillColor = '#059669';
        subText = crop || 'Unassigned';
      } else if (layer === 'soil') {
        if (field.ph_level >= 6.8) fillColor = '#78350f';
        else if (field.ph_level >= 6.4) fillColor = '#92400e';
        else fillColor = '#b45309';
        subText = `pH ${field.ph_level.toFixed(1)} • ${field.soil_type.split(' ')[0]}`;
      } else if (layer === 'irrigation') {
        if (field.irrigation_type.includes('Pivot')) fillColor = '#0284c7';
        else if (field.irrigation_type.includes('Drip')) fillColor = '#06b6d4';
        else fillColor = '#475569';
        subText = field.irrigation_type;
      } else if (layer === 'operations') {
        fillColor = field.pending_operations > 0 ? '#ef4444' : '#10b981';
        subText = `${field.pending_operations} Pending Work Orders`;
      }

      svgHtml += `
        <g class="field-group" onclick="App.viewFieldDetail(${field.id})"
           onmousemove="App.handleMapMouseMove(event, ${field.id})"
           onmouseleave="App.handleMapMouseLeave()">
          <polygon points="${poly.points}" fill="${fillColor}" opacity="0.85" class="field-polygon"/>
          ${poly.pivot ? `<circle cx="${poly.pivot.cx}" cy="${poly.pivot.cy}" r="${poly.pivot.r}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-dasharray="4 4" pointer-events="none"/>` : ''}
          <text x="${poly.labelX}" y="${poly.labelY}" class="field-label">${field.name.split(' ')[0]}</text>
          <text x="${poly.labelX}" y="${poly.labelY + 16}" class="field-sublabel">${field.acreage} ac • ${subText}</text>
        </g>
      `;
    }

    svg.innerHTML = svgHtml;
  },

  handleMapMouseMove(e, fieldId) {
    const tooltip = document.getElementById('map-tooltip');
    if (!tooltip) return;

    const field = this.state.fields.find(f => f.id === fieldId);
    if (!field) return;

    const mapWrapper = document.querySelector('.farm-map-wrapper');
    const rect = mapWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left + 15;
    const y = e.clientY - rect.top + 15;

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.display = 'block';

    tooltip.innerHTML = `
      <div style="font-weight: 700; color: #a7f3d0; margin-bottom: 0.2rem;">${field.name}</div>
      <div>📐 <strong>${field.acreage}</strong> Acres</div>
      <div>🌱 <strong>${field.soil_type}</strong> (pH ${field.ph_level})</div>
      <div>🌾 2026 Crop: <strong>${field.current_crop || 'None'}</strong></div>
      <div>💧 ${field.irrigation_type}</div>
      <div style="color: #6ee7b7; font-size: 0.72rem; margin-top: 0.3rem;">👉 Click to open field records</div>
    `;
  },

  handleMapMouseLeave() {
    const tooltip = document.getElementById('map-tooltip');
    if (tooltip) tooltip.style.display = 'none';
  },

  async viewFieldDetail(id) {
    try {
      const res = await API.getField(id);
      const f = res.data;

      document.getElementById('field-detail-name').textContent = `${f.name} — Comprehensive Field Profile`;

      const content = document.getElementById('field-detail-content');
      content.innerHTML = `
        <div class="grid-2" style="margin-bottom: 1.5rem;">
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem;">
            <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.5rem;">Soil Specifications</h4>
            <p><strong>Acreage:</strong> ${f.acreage} acres</p>
            <p><strong>Soil Classification:</strong> ${f.soil_type}</p>
            <p><strong>Acidity (pH):</strong> ${f.ph_level}</p>
            <p><strong>Organic Matter:</strong> ${f.organic_matter_pct}%</p>
            <p><strong>Irrigation Type:</strong> ${f.irrigation_type}</p>
          </div>
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem;">
            <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.5rem;">Recent Harvest Yields</h4>
            ${f.yields.length === 0 ? '<p style="color: var(--text-muted);">No harvest records logged yet.</p>' : f.yields.map(y => `
              <div style="font-size: 0.82rem; margin-bottom: 0.4rem; padding-bottom: 0.4rem; border-bottom: 1px solid #e2e8f0;">
                <strong>${y.year} ${y.crop_name}:</strong> ${y.yield_per_acre} ${y.unit} (${y.total_yield.toLocaleString()} total) • Net Profit: $${y.net_profit.toLocaleString()}
              </div>
            `).join('')}
          </div>
        </div>

        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem;">Field Operation History</h4>
        <div class="table-wrapper" style="margin-bottom: 1.5rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Operation</th>
                <th>Crop</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              ${f.operations.length === 0 ? '<tr><td colspan="5">No operations recorded</td></tr>' : f.operations.map(o => `
                <tr>
                  <td><strong>${o.title}</strong></td>
                  <td>${o.crop_name || '--'}</td>
                  <td>${o.scheduled_date}</td>
                  <td><span class="badge ${o.status === 'Completed' ? 'badge-active' : 'badge-planned'}">${o.status}</span></td>
                  <td>${o.assigned_to}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      this.openModal('modal-field-detail');
    } catch (err) {
      this.showToast('Could not load field profile', 'error');
    }
  },

  openAddFieldModal() {
    document.getElementById('form-add-field').reset();
    this.openModal('modal-add-field');
  },

  async handleAddFieldSubmit(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('new-field-name').value,
      acreage: document.getElementById('new-field-acreage').value,
      soil_type: document.getElementById('new-field-soil').value,
      ph_level: document.getElementById('new-field-ph').value,
      organic_matter_pct: document.getElementById('new-field-om').value,
      irrigation_type: document.getElementById('new-field-irrigation').value,
      status: 'Active'
    };

    try {
      await API.createField(payload);
      this.closeModal('modal-add-field');
      this.showToast(`Field "${payload.name}" successfully added!`);
      await this.loadInitialData();
      this.renderFields();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // ---------------------------------------------
  // TAB 3: Crop Rotation Matrix & Planner
  // ---------------------------------------------
  async renderRotations() {
    try {
      const [fieldsRes, cropsRes, rotationsRes] = await Promise.all([
        API.getFields(),
        API.getCrops(),
        API.getRotations()
      ]);

      this.state.fields = fieldsRes.data;
      this.state.crops = cropsRes.data;
      this.state.rotations = rotationsRes.data;

      // Render Quick Crop Palette chips
      const paletteContainer = document.getElementById('crop-palette-items');
      if (paletteContainer) {
        paletteContainer.innerHTML = this.state.crops.map(c => {
          const cropImg = App.getCropImageUrl(c.id);
          return `
            <div class="palette-chip ${this.state.activePaletteCropId === c.id ? 'selected' : ''}"
                 onclick="App.selectPaletteCrop(${c.id})"
                 title="${c.botanical_family} • ${c.nitrogen_demand}">
              <div class="crop-avatar-wrap" style="width: 22px; height: 22px; border-width: 1px;">
                <img src="${cropImg}" alt="${c.name}">
              </div>
              <span>${c.name.split(' ')[0]}</span>
            </div>
          `;
        }).join('');
      }

      const years = [2023, 2024, 2025, 2026, 2027];
      const tbody = document.getElementById('matrix-tbody');

      // Populate crop selector in modal
      const cropSelect = document.getElementById('assign-crop-id');
      cropSelect.innerHTML = `<option value="">-- Choose crop from catalog --</option>` +
        this.state.crops.map(c => `
          <option value="${c.id}">${c.name} (${c.botanical_family} • ${c.nitrogen_demand})</option>
        `).join('');

      tbody.innerHTML = this.state.fields.map(f => {
        const fieldRotations = this.state.rotations.filter(r => r.field_id === f.id);

        const yearCells = years.map(yr => {
          const entry = fieldRotations.find(r => r.year === yr);
          if (entry) {
            const familyBadge = entry.botanical_family.includes('Legume') ? 'badge-active' :
                                entry.botanical_family.includes('Grass') ? 'badge-planned' : 'badge-family';
            const cropImg = App.getCropImageUrl(entry.crop_id);
            return `
              <td>
                <div class="matrix-cell" onclick="App.handleCellClick(${f.id}, '${f.name}', ${yr}, ${entry.crop_id})">
                  <div class="crop-row-visual">
                    <div class="crop-avatar-wrap" style="width: 30px; height: 30px;">
                      <img src="${cropImg}" alt="${entry.crop_name}">
                    </div>
                    <div>
                      <div class="crop-name">${entry.crop_name}</div>
                      <span class="badge ${familyBadge}">${entry.botanical_family.split(' ')[0]}</span>
                    </div>
                  </div>
                  <div class="crop-meta" style="margin-top: 0.35rem;">
                    ${entry.target_yield ? `🎯 ${entry.target_yield} ${entry.yield_unit}` : ''}
                    <span style="float: right;">${entry.status}</span>
                  </div>
                </div>
              </td>
            `;
          } else {
            return `
              <td>
                <div class="matrix-cell matrix-cell-empty" onclick="App.handleCellClick(${f.id}, '${f.name}', ${yr})">
                  + Plan Crop
                </div>
              </td>
            `;
          }
        }).join('');

        return `
          <tr>
            <td>
              <div style="font-weight: 700; font-size: 0.92rem;">${f.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${f.acreage} ac • ${f.soil_type}</div>
            </td>
            ${yearCells}
            <td>
              <button class="btn btn-outline btn-sm" onclick="App.evaluateFieldRotation(${f.id}, '${f.name}')">
                🔬 Analyze
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Error rendering rotation matrix:', err);
    }
  },

  selectPaletteCrop(cropId) {
    if (this.state.activePaletteCropId === cropId) {
      this.state.activePaletteCropId = null;
    } else {
      this.state.activePaletteCropId = cropId;
      const crop = this.state.crops.find(c => c.id === cropId);
      this.showToast(`Selected "${crop.name}" brush! Click any matrix cell to assign.`, 'success');
    }
    this.renderRotations();
  },

  async handleCellClick(fieldId, fieldName, year, currentCropId = null) {
    // If user has an active palette crop selected, paint it directly!
    if (this.state.activePaletteCropId) {
      const crop = this.state.crops.find(c => c.id === this.state.activePaletteCropId);
      await API.upsertRotation({
        field_id: fieldId,
        crop_id: this.state.activePaletteCropId,
        year: year,
        season: 'Spring',
        status: year <= 2025 ? 'Harvested' : year === 2026 ? 'Planted' : 'Planned'
      });
      this.showToast(`Assigned ${crop.name} to ${fieldName} (${year})`);
      await this.renderRotations();
      this.evaluateFieldRotation(fieldId);
      return;
    }

    // Otherwise open the standard edit modal
    this.openAssignCropModal(fieldId, fieldName, year, currentCropId);
  },

  openAssignCropModal(fieldId, fieldName, year, currentCropId = null, targetYield = null, status = 'Planned') {
    document.getElementById('assign-crop-title').textContent = `Assign Crop: ${fieldName} (${year})`;
    document.getElementById('assign-field-id').value = fieldId;
    document.getElementById('assign-year').value = year;
    document.getElementById('assign-crop-id').value = currentCropId || '';
    document.getElementById('assign-target-yield').value = targetYield || '';
    document.getElementById('assign-status').value = status || 'Planned';
    document.getElementById('assign-notes').value = '';
    this.openModal('modal-assign-crop');
  },

  async handleAssignCropSubmit(e) {
    e.preventDefault();
    const payload = {
      field_id: parseInt(document.getElementById('assign-field-id').value),
      year: parseInt(document.getElementById('assign-year').value),
      season: document.getElementById('assign-season').value || 'Spring',
      crop_id: parseInt(document.getElementById('assign-crop-id').value),
      target_yield: document.getElementById('assign-target-yield').value ? parseFloat(document.getElementById('assign-target-yield').value) : null,
      status: document.getElementById('assign-status').value,
      notes: document.getElementById('assign-notes').value
    };

    try {
      await API.upsertRotation(payload);
      this.closeModal('modal-assign-crop');
      this.showToast('Rotation sequence updated successfully!');
      await this.renderRotations();
      this.evaluateFieldRotation(payload.field_id);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async evaluateFieldRotation(fieldId, fieldName = null) {
    try {
      const res = await API.evaluateFieldRotation(fieldId);
      const evalData = res.evaluation;
      const field = res.field;

      const panel = document.getElementById('field-eval-panel');
      panel.style.display = 'block';

      document.getElementById('eval-field-title').textContent = `${field.name} (${evalData.totalRotations} Planned/Recorded Seasons)`;
      document.getElementById('eval-rating-text').textContent = `${evalData.rating} Agronomic Succession`;

      const scoreBadge = document.getElementById('eval-score-badge');
      scoreBadge.textContent = `${evalData.score}%`;
      scoreBadge.className = `eval-score-ring ${evalData.score < 60 ? 'risk' : evalData.score < 80 ? 'moderate' : ''}`;

      const alertsContainer = document.getElementById('eval-alerts-container');
      if (evalData.alerts.length === 0) {
        alertsContainer.innerHTML = '';
      } else {
        alertsContainer.innerHTML = `
          <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.4rem; color: #991b1b;">⚠️ Agronomic Alerts & Biological Risks:</div>
          ${evalData.alerts.map(a => `
            <div class="eval-alert-item">
              <strong>${a.category}:</strong> ${a.message}
            </div>
          `).join('')}
        `;
      }

      const positivesContainer = document.getElementById('eval-positives-container');
      positivesContainer.innerHTML = `
        <div style="font-weight: 700; font-size: 0.85rem; margin: 0.6rem 0 0.4rem 0; color: #065f46;">🌱 Ecological Synergies & Soil Health:</div>
        ${evalData.positives.map(p => `
          <div class="eval-positive-item">
            <strong>${p.category}:</strong> ${p.message}
          </div>
        `).join('')}
      `;

      panel.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      this.showToast('Error evaluating rotation sequence', 'error');
    }
  },

  closeFieldEvalPanel() {
    document.getElementById('field-eval-panel').style.display = 'none';
  },

  viewFieldRotation(fieldId) {
    this.switchTab('rotations');
    setTimeout(() => {
      this.evaluateFieldRotation(fieldId);
    }, 150);
  },

  // Interactive 4-Season Rotation Simulator Modal
  openRotationSimulatorModal() {
    for (let slot = 0; slot < 4; slot++) {
      const select = document.getElementById(`sim-select-${slot}`);
      if (select) {
        select.innerHTML = this.state.crops.map(c => `
          <option value="${c.id}" ${this.state.simSlotValues[slot] === c.id ? 'selected' : ''}>
            ${c.name.split(' ')[0]} (${c.botanical_family.split(' ')[0]})
          </option>
        `).join('');
      }
    }

    this.runSimulatedEvaluation();
    this.openModal('modal-rotation-simulator');
  },

  handleSimSlotChange(slotIndex, cropId) {
    this.state.simSlotValues[slotIndex] = parseInt(cropId);
    this.runSimulatedEvaluation();
  },

  async runSimulatedEvaluation() {
    const sequence = [
      { year: 2024, season: 'Spring', cropId: this.state.simSlotValues[0] },
      { year: 2025, season: 'Spring', cropId: this.state.simSlotValues[1] },
      { year: 2026, season: 'Spring', cropId: this.state.simSlotValues[2] },
      { year: 2026, season: 'Fall', cropId: this.state.simSlotValues[3] }
    ];

    try {
      const res = await API.evaluateSimulated(sequence);
      const evalData = res.evaluation;

      document.getElementById('sim-rating-text').textContent = `${evalData.rating} Succession (${evalData.uniqueFamilies} Botanical Families)`;
      document.getElementById('sim-summary-text').textContent = `Sequence score calculated across ${evalData.totalRotations} consecutive seasons`;

      const scoreDial = document.getElementById('sim-score-dial');
      scoreDial.textContent = `${evalData.score}%`;
      scoreDial.className = `eval-score-ring ${evalData.score < 60 ? 'risk' : evalData.score < 80 ? 'moderate' : ''}`;

      const alertsBox = document.getElementById('sim-alerts-box');
      alertsBox.innerHTML = evalData.alerts.length === 0 ? '' : `
        <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.4rem; color: #991b1b;">⚠️ Biological Risks Flagged:</div>
        ${evalData.alerts.map(a => `<div class="eval-alert-item"><strong>${a.category}:</strong> ${a.message}</div>`).join('')}
      `;

      const positivesBox = document.getElementById('sim-positives-box');
      positivesBox.innerHTML = `
        <div style="font-weight: 700; font-size: 0.85rem; margin: 0.6rem 0 0.4rem 0; color: #065f46;">🌱 Ecological Synergies:</div>
        ${evalData.positives.map(p => `<div class="eval-positive-item"><strong>${p.category}:</strong> ${p.message}</div>`).join('')}
      `;
    } catch (err) {
      console.error('Simulator evaluation failed:', err);
    }
  },

  // ---------------------------------------------
  // TAB 4: Field Operations & Interactive Kanban
  // ---------------------------------------------
  setOperationsView(view) {
    this.state.operationsView = view;
    document.getElementById('view-btn-kanban').classList.toggle('active', view === 'kanban');
    document.getElementById('view-btn-table').classList.toggle('active', view === 'table');

    document.getElementById('operations-kanban-view').style.display = view === 'kanban' ? 'grid' : 'none';
    document.getElementById('operations-table-view').style.display = view === 'table' ? 'block' : 'none';

    this.renderOperations();
  },

  async renderOperations() {
    try {
      const typeFilter = document.getElementById('op-filter-type')?.value || '';
      const res = await API.getOperations({ type: typeFilter });
      this.state.operations = res.data;

      const fieldSelect = document.getElementById('new-op-field-id');
      if (fieldSelect) {
        fieldSelect.innerHTML = this.state.fields.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
      }

      if (this.state.operationsView === 'kanban') {
        this.renderKanbanBoard();
      } else {
        this.renderOperationsTable();
      }
    } catch (err) {
      console.error('Error rendering operations:', err);
    }
  },

  renderKanbanBoard() {
    const planned = this.state.operations.filter(o => o.status === 'Planned');
    const inProgress = this.state.operations.filter(o => o.status === 'In Progress');
    const completed = this.state.operations.filter(o => o.status === 'Completed');

    document.getElementById('kanban-count-planned').textContent = planned.length;
    document.getElementById('kanban-count-progress').textContent = inProgress.length;
    document.getElementById('kanban-count-completed').textContent = completed.length;

    const renderCard = (op) => `
      <div class="kanban-card" draggable="true"
           ondragstart="App.handleDragStart(event, ${op.id})"
           ondragend="App.handleDragEnd(event)">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
          <span style="font-weight: 700; font-size: 0.88rem; color: var(--text-main);">${op.title}</span>
          <span class="badge ${op.priority === 'Critical' ? 'badge-danger' : op.priority === 'High' ? 'badge-warning' : 'badge-planned'}">
            ${op.priority}
          </span>
        </div>

        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.6rem;">
          📍 <strong>${op.field_name}</strong> • 🗓️ ${op.scheduled_date}<br>
          👤 ${op.assigned_to}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-light); padding-top: 0.5rem; font-size: 0.75rem;">
          <span style="font-weight: 700; color: var(--primary-dark);">$${op.total_input_cost.toLocaleString()}</span>
          <div style="display: flex; gap: 0.3rem;">
            <button class="btn btn-outline btn-sm" style="padding: 0.2rem 0.5rem;" onclick="App.openInputsModal(${op.id})">🧪 Inputs</button>
            ${op.status === 'Planned' ? `<button class="btn btn-primary btn-sm" style="padding: 0.2rem 0.5rem;" onclick="App.moveOperationStatus(${op.id}, 'In Progress')">Start ➔</button>` : ''}
            ${op.status === 'In Progress' ? `<button class="btn btn-primary btn-sm" style="padding: 0.2rem 0.5rem;" onclick="App.moveOperationStatus(${op.id}, 'Completed')">✓ Done</button>` : ''}
          </div>
        </div>
      </div>
    `;

    document.getElementById('kanban-cards-planned').innerHTML = planned.length === 0 ? '<p style="color: #94a3b8; font-size: 0.8rem;">No planned tasks</p>' : planned.map(renderCard).join('');
    document.getElementById('kanban-cards-progress').innerHTML = inProgress.length === 0 ? '<p style="color: #94a3b8; font-size: 0.8rem;">No tasks in progress</p>' : inProgress.map(renderCard).join('');
    document.getElementById('kanban-cards-completed').innerHTML = completed.length === 0 ? '<p style="color: #94a3b8; font-size: 0.8rem;">No completed tasks</p>' : completed.map(renderCard).join('');
  },

  handleDragStart(e, opId) {
    this.state.draggedOpId = opId;
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', opId);
  },

  handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
  },

  handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  },

  async handleDrop(e, targetStatus) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const opId = this.state.draggedOpId;
    if (!opId) return;

    await this.moveOperationStatus(opId, targetStatus);
    this.state.draggedOpId = null;
  },

  async moveOperationStatus(id, newStatus) {
    try {
      const today = new Date().toISOString().split('T')[0];
      await API.updateOperation(id, {
        status: newStatus,
        completed_date: newStatus === 'Completed' ? today : null
      });
      this.showToast(`Work order updated to "${newStatus}"!`);
      this.renderOperations();
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  renderOperationsTable() {
    const tbody = document.getElementById('operations-tbody');
    if (this.state.operations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 2rem; color: var(--text-muted);">No operations match filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.state.operations.map(op => `
      <tr>
        <td>
          <div style="font-weight: 700; font-size: 0.9rem;">${op.title}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">🔧 ${op.operation_type} ${op.weather_prerequisites ? `• ${op.weather_prerequisites}` : ''}</div>
        </td>
        <td><strong>${op.field_name}</strong></td>
        <td>${op.crop_name || '--'}</td>
        <td>${op.scheduled_date}</td>
        <td>${op.assigned_to}</td>
        <td><span class="badge ${op.priority === 'Critical' ? 'badge-danger' : op.priority === 'High' ? 'badge-warning' : 'badge-planned'}">${op.priority}</span></td>
        <td><span style="font-weight: 600;">${op.inputs_count} logged</span></td>
        <td style="font-weight: 700; color: var(--primary-dark);">$${op.total_input_cost.toLocaleString()}</td>
        <td><span class="badge ${op.status === 'Completed' ? 'badge-active' : op.status === 'In Progress' ? 'badge-warning' : 'badge-planned'}">${op.status}</span></td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn btn-outline btn-sm" onclick="App.openInputsModal(${op.id})">🧪 Inputs</button>
            ${op.status !== 'Completed' ? `<button class="btn btn-primary btn-sm" onclick="App.moveOperationStatus(${op.id}, 'Completed')">✓ Done</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  },

  filterOperations() {
    this.renderOperations();
  },

  openAddOperationModal() {
    document.getElementById('form-add-operation').reset();
    document.getElementById('new-op-date').value = new Date().toISOString().split('T')[0];
    this.openModal('modal-add-operation');
  },

  async handleAddOperationSubmit(e) {
    e.preventDefault();
    const payload = {
      title: document.getElementById('new-op-title').value,
      field_id: parseInt(document.getElementById('new-op-field-id').value),
      operation_type: document.getElementById('new-op-type').value,
      scheduled_date: document.getElementById('new-op-date').value,
      assigned_to: document.getElementById('new-op-assigned').value,
      priority: document.getElementById('new-op-priority').value,
      weather_prerequisites: document.getElementById('new-op-weather').value,
      notes: document.getElementById('new-op-notes').value,
      status: 'Planned'
    };

    try {
      await API.createOperation(payload);
      this.closeModal('modal-add-operation');
      this.showToast(`Work order "${payload.title}" created!`);
      this.renderOperations();
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async openInputsModal(opId) {
    try {
      const res = await API.getOperation(opId);
      const op = res.data;

      document.getElementById('input-op-id').value = op.id;
      document.getElementById('inputs-modal-title').textContent = `Inputs & Consumption: ${op.title} (${op.field_name})`;

      const listContainer = document.getElementById('inputs-list-container');
      if (op.inputs.length === 0) {
        listContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.88rem;">No input line items recorded yet. Add items below.</p>`;
      } else {
        listContainer.innerHTML = `
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product / Input Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Cost / Unit</th>
                  <th>Total Cost</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${op.inputs.map(inp => `
                  <tr>
                    <td><strong>${inp.input_name}</strong></td>
                    <td><span class="badge badge-family">${inp.category}</span></td>
                    <td>${inp.quantity} ${inp.unit}</td>
                    <td>$${inp.cost_per_unit.toFixed(2)}</td>
                    <td style="font-weight: 700; color: var(--primary-dark);">$${inp.total_cost.toLocaleString()}</td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="App.deleteInput(${op.id}, ${inp.id})">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr style="background: #f8fafc; font-weight: 700;">
                  <td colspan="4">Total Direct Input Cost:</td>
                  <td style="color: var(--primary-dark); font-size: 1.05rem;">$${op.total_input_cost.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        `;
      }

      this.openModal('modal-operation-inputs');
    } catch (err) {
      this.showToast('Could not load operation inputs', 'error');
    }
  },

  async handleAddInputSubmit(e) {
    e.preventDefault();
    const opId = parseInt(document.getElementById('input-op-id').value);
    const payload = {
      input_name: document.getElementById('new-input-name').value,
      category: document.getElementById('new-input-category').value,
      quantity: document.getElementById('new-input-qty').value,
      unit: document.getElementById('new-input-unit').value,
      cost_per_unit: document.getElementById('new-input-cpu').value
    };

    try {
      await API.addOperationInput(opId, payload);
      this.showToast(`Logged ${payload.quantity} ${payload.unit} of ${payload.input_name}`);
      document.getElementById('form-add-input').reset();
      this.openInputsModal(opId);
      this.renderOperations();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async deleteInput(opId, inputId) {
    try {
      await API.deleteOperationInput(inputId);
      this.showToast('Input item removed');
      this.openInputsModal(opId);
      this.renderOperations();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // ---------------------------------------------
  // TAB 5: Cost & Yield Analytics (P&L) & Interactive Simulator
  // ---------------------------------------------
  initProfitSimulator() {
    const cropSelect = document.getElementById('sim-calc-crop');
    if (!cropSelect) return;

    cropSelect.innerHTML = this.state.crops.map(c => `
      <option value="${c.id}" ${c.id === 1 ? 'selected' : ''}>${c.name}</option>
    `).join('');

    this.handleSimulatorCropChange(1);
  },

  handleSimulatorCropChange(cropId) {
    const crop = this.state.crops.find(c => c.id === parseInt(cropId));
    if (!crop) return;

    const priceSlider = document.getElementById('slider-price');
    const yieldSlider = document.getElementById('slider-yield');
    const costSlider = document.getElementById('slider-cost');

    priceSlider.value = crop.market_price_per_unit || 4.85;
    yieldSlider.value = crop.typical_yield_per_acre || 180;
    costSlider.value = crop.nitrogen_demand === 'Heavy Feeder' ? 420 : 310;

    this.recalcProfitSimulator();
  },

  recalcProfitSimulator() {
    const price = parseFloat(document.getElementById('slider-price').value);
    const yieldAc = parseFloat(document.getElementById('slider-yield').value);
    const costAc = parseFloat(document.getElementById('slider-cost').value);

    document.getElementById('slider-val-price').textContent = `$${price.toFixed(2)} / bu`;
    document.getElementById('slider-val-yield').textContent = `${yieldAc.toFixed(0)} bu/ac`;
    document.getElementById('slider-val-cost').textContent = `$${costAc.toFixed(0)} / ac`;

    const grossRev = price * yieldAc;
    const netProfit = grossRev - costAc;
    const marginPct = grossRev > 0 ? (netProfit / grossRev) * 100 : 0;
    const fieldTotalProfit = netProfit * 120; // 120-acre model

    document.getElementById('sim-out-revenue').textContent = `$${grossRev.toFixed(2)}`;
    document.getElementById('sim-out-profit').textContent = `$${netProfit.toFixed(2)}`;
    document.getElementById('sim-out-margin').textContent = `${marginPct.toFixed(1)}%`;
    document.getElementById('sim-out-field-profit').textContent = `$${Math.round(fieldTotalProfit).toLocaleString()}`;
  },

  async renderAnalytics() {
    try {
      const [pnlRes, inputsRes, yieldsRes] = await Promise.all([
        API.getPNL(),
        API.getInputsBreakdown(),
        API.getYields()
      ]);

      this.state.pnlData = pnlRes.data;

      Charts.renderAnnualPNL('chart-annual-pnl', pnlRes.data.byYear);
      Charts.renderCropMargin('chart-crop-margin', pnlRes.data.byCrop);
      Charts.renderInputDistribution('chart-input-distribution', inputsRes.data.categories);
      Charts.renderYieldVsTarget('chart-yield-target', yieldsRes.data);

      this.renderPNLTable();
    } catch (err) {
      console.error('Error rendering analytics:', err);
    }
  },

  sortPNLTable(columnKey) {
    if (this.state.pnlSortKey === columnKey) {
      this.state.pnlSortAsc = !this.state.pnlSortAsc;
    } else {
      this.state.pnlSortKey = columnKey;
      this.state.pnlSortAsc = true;
    }
    this.renderPNLTable();
  },

  renderPNLTable() {
    if (!this.state.pnlData) return;
    const records = [...this.state.pnlData.records];
    const key = this.state.pnlSortKey;
    const asc = this.state.pnlSortAsc;

    records.sort((a, b) => {
      let va = a[key];
      let vb = b[key];
      if (typeof va === 'string') return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      return asc ? va - vb : vb - va;
    });

    const tbody = document.getElementById('pnl-tbody');
    tbody.innerHTML = records.map(r => {
      const marginPct = r.total_revenue > 0 ? Math.round((r.net_profit / r.total_revenue) * 1000) / 10 : 0;
      return `
        <tr>
          <td><strong>${r.year}</strong></td>
          <td>${r.field_name}</td>
          <td><strong>${r.crop_name}</strong></td>
          <td>${r.harvest_date}</td>
          <td>${r.yield_per_acre} ${r.unit}</td>
          <td>${r.total_yield.toLocaleString()}</td>
          <td>$${r.sale_price_per_unit.toFixed(2)}</td>
          <td>${r.moisture_pct}%</td>
          <td style="font-weight: 600;">$${r.total_revenue.toLocaleString()}</td>
          <td style="color: #b45309;">$${r.total_input_cost.toLocaleString()}</td>
          <td style="font-weight: 700; color: var(--primary-dark);">$${r.net_profit.toLocaleString()}</td>
          <td><span class="badge ${marginPct >= 40 ? 'badge-active' : 'badge-warning'}">${marginPct}%</span></td>
        </tr>
      `;
    }).join('');

    // Also refresh CTA banner and simulator diagnostics
    this.renderLandingCtaBanner();
    this.initLandingSimulator();
  },

  // Filter crop cards by botanical family category
  filterLandingCrops(category, btnEl) {
    // Update active pill
    document.querySelectorAll('.crop-filter-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const cards = document.querySelectorAll('.crop-showcase-card');
    cards.forEach(card => {
      const fam = card.getAttribute('data-family') || '';
      if (category === 'all' || fam.includes(category)) {
        card.style.display = '';
        card.style.animation = 'fadeIn 0.3s ease';
      } else {
        card.style.display = 'none';
      }
    });
  },

  // Landing Rotation Simulator Logic
  initLandingSimulator() {
    const defaults = ['1', '2', '3', '8'];
    defaults.forEach((val, i) => {
      const sel = document.getElementById(`landing-sim-slot-${i}`);
      if (sel) sel.value = val;
      this._updateSimBadge(i, val);
    });
    this._computeSimScore();
  },

  handleLandingSimChange(slotIndex, cropIdStr) {
    this._updateSimBadge(slotIndex, cropIdStr);
    this._computeSimScore();
  },

  _updateSimBadge(slotIndex, cropIdStr) {
    const cropId = parseInt(cropIdStr);
    const badgeEl = document.getElementById(`landing-sim-badge-${slotIndex}`);
    if (!badgeEl) return;

    const crop = this.state.crops ? this.state.crops.find(c => c.id === cropId) : null;
    const nDemand = crop ? crop.nitrogen_demand : '';
    const isFixerCrop = nDemand === 'Nitrogen Fixer';

    if (isFixerCrop) {
      badgeEl.textContent = '🌱 Nitrogen Fixer';
      badgeEl.className = 'sim-slot-badge legume';
    } else if (cropId === 1) {
      badgeEl.textContent = '⚡ Heavy Feeder';
      badgeEl.className = 'sim-slot-badge heavy';
    } else if (cropId === 3 || cropId === 9 || cropId === 10) {
      badgeEl.textContent = '🌾 Moderate Feeder';
      badgeEl.className = 'sim-slot-badge';
    } else if (cropId === 6 || cropId === 7) {
      badgeEl.textContent = '🌻 Oilseed Crop';
      badgeEl.className = 'sim-slot-badge mustard';
    } else {
      badgeEl.textContent = crop ? crop.nitrogen_demand : 'Unknown';
      badgeEl.className = 'sim-slot-badge';
    }
  },

  _computeSimScore() {
    const slots = [0, 1, 2, 3].map(i => {
      const sel = document.getElementById(`landing-sim-slot-${i}`);
      return sel ? parseInt(sel.value) : 1;
    });

    let score = 70;
    let diagnostics = [];

    // Check for nitrogen-fixing crops
    const FIXERS = new Set([2, 4, 5, 8]); // soybeans, alfalfa, field peas, clover
    const HEAVY = new Set([1]); // corn
    const GRASS = new Set([3, 9, 10]); // wheat, rye, barley

    const fixerCount = slots.filter(id => FIXERS.has(id)).length;
    const heavyCount = slots.filter(id => HEAVY.has(id)).length;
    const uniqueFamilies = new Set(slots).size;

    // Monoculture penalty
    if (uniqueFamilies === 1) {
      score -= 30;
      diagnostics.push({ type: 'danger', icon: '⚠️', label: 'Monoculture Risk', text: 'Continuous same-crop monoculture creates severe pest pressure, pathogen buildup, and soil depletion.' });
    }

    // Fixer bonus
    if (fixerCount >= 1) {
      score += fixerCount * 10;
      diagnostics.push({ type: 'success', icon: '🌱', label: 'Nitrogen Credit', text: `${fixerCount} legume(s) in rotation fix atmospheric nitrogen, reducing synthetic fertilizer inputs by ~40 lbs N/acre per legume.` });
    }

    // Heavy back-to-back penalty
    for (let i = 0; i < slots.length - 1; i++) {
      if (HEAVY.has(slots[i]) && HEAVY.has(slots[i + 1])) {
        score -= 20;
        diagnostics.push({ type: 'danger', icon: '🐛', label: 'Back-to-Back Corn Risk', text: 'Continuous corn dramatically increases corn rootworm pressure and requires costly soil insecticides.' });
        break;
      }
    }

    // Diversity bonus
    if (uniqueFamilies >= 3) {
      score += 12;
      diagnostics.push({ type: 'success', icon: '🛡️', label: 'Pest Break', text: `${uniqueFamilies}-family diversity disrupts pest reproduction cycles and reduces pesticide dependency by 25–35%.` });
    }

    // Grass in rotation bonus
    const grassCount = slots.filter(id => GRASS.has(id)).length;
    if (grassCount >= 1) {
      score += 5;
      diagnostics.push({ type: 'info', icon: '💧', label: 'Soil Structure', text: 'Fibrous-root cereal grasses improve topsoil aggregation and increase organic matter infiltration rates.' });
    }

    if (diagnostics.length === 0) {
      diagnostics.push({ type: 'info', icon: 'ℹ️', label: 'Evaluation', text: 'Adjust crop selections above to see live agronomic analysis.' });
    }

    score = Math.max(30, Math.min(100, score));

    const scoreEl = document.getElementById('landing-sim-score');
    const ratingEl = document.getElementById('landing-sim-rating');
    const diagEl = document.getElementById('landing-sim-diagnostics');

    if (scoreEl) scoreEl.textContent = `${score}%`;
    if (ratingEl) {
      if (score >= 90) ratingEl.textContent = 'Optimal Succession';
      else if (score >= 75) ratingEl.textContent = 'Good Diversification';
      else if (score >= 55) ratingEl.textContent = 'Moderate Risk';
      else ratingEl.textContent = 'High Risk — Adjust Rotation';
      ratingEl.style.background = score >= 90 ? 'rgba(16,185,129,0.3)' : score >= 75 ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)';
    }

    if (diagEl) {
      diagEl.innerHTML = diagnostics.map(d => `
        <div class="sim-diag-item ${d.type}">
          <span>${d.icon}</span> <strong>${d.label}:</strong> ${d.text}
        </div>
      `).join('');
    }
  },

  exportFinancialsCSV() {
    if (!this.state.pnlData || !this.state.pnlData.records) {
      this.showToast('No financial data available to export', 'error');
      return;
    }

    const headers = ['Year', 'Field', 'Crop', 'Harvest Date', 'Yield per Acre', 'Total Yield', 'Unit', 'Moisture %', 'Grade', 'Buyer', 'Sale Price', 'Gross Revenue', 'Direct Input Expenses', 'Net Profit'];
    const rows = this.state.pnlData.records.map(r => [
      r.year,
      `"${r.field_name}"`,
      `"${r.crop_name}"`,
      r.harvest_date,
      r.yield_per_acre,
      r.total_yield,
      r.unit,
      r.moisture_pct,
      `"${r.quality_grade}"`,
      `"${r.contract_buyer || ''}"`,
      r.sale_price_per_unit,
      r.total_revenue,
      r.total_input_cost,
      r.net_profit
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HarvestHub_Financial_Ledger_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    this.showToast('Harvest & Financial CSV ledger exported!');
  },

  // ---------------------------------------------
  // TAB 6: Machinery & Equipment Maintenance
  // ---------------------------------------------
  async renderEquipment() {
    try {
      const res = await API.getEquipment();
      this.state.equipment = res.data;
      this.updateMaintenanceBadge();

      const eqSelect = document.getElementById('log-hours-eq-id');
      if (eqSelect) {
        eqSelect.innerHTML = `<option value="">-- Choose machine --</option>` +
          this.state.equipment.map(e => `<option value="${e.id}">${e.name} (${e.current_hours.toFixed(1)} hrs)</option>`).join('');
      }

      const grid = document.getElementById('equipment-grid');
      grid.innerHTML = this.state.equipment.map(eq => {
        const eqImg = EQUIPMENT_IMAGES[eq.id] || EQUIPMENT_IMAGES[1];
        const statusBadge = eq.computed_status === 'Overdue' ? 'badge-danger' :
                            eq.computed_status === 'Due Soon' ? 'badge-warning' : 'badge-active';

        const pctUsed = Math.min(100, Math.round((eq.current_hours / eq.next_service_target) * 100));

        return `
          <div class="equipment-card-enhanced">
            <div class="equipment-header-image" style="background-image: url('${eqImg}');">
              <div class="equipment-header-overlay"></div>
              <span class="badge ${statusBadge} field-status-pill">${eq.computed_status}</span>
              <div class="equipment-header-content">
                <div>
                  <h3 style="font-size: 1.15rem; font-weight: 800; color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${eq.name}</h3>
                  <div style="font-size: 0.75rem; color: #e2e8f0;">${eq.model} • S/N: ${eq.serial_number}</div>
                </div>
              </div>
            </div>

            <div class="field-card-inner">
              <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.85rem;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.35rem;">
                  <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Operating Hours</span>
                  <span style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">${eq.current_hours.toFixed(1)} hrs</span>
                </div>

                <div class="progress-bar">
                  <div class="progress-fill ${eq.computed_status === 'Overdue' ? 'red' : eq.computed_status === 'Due Soon' ? 'amber' : ''}" style="width: ${pctUsed}%;"></div>
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
                  <span>Last: ${eq.last_service_date || 'N/A'}</span>
                  <span>Target: <strong>${eq.next_service_target} hrs</strong></span>
                </div>

                <!-- Quick Hour Steppers -->
                <div class="stepper-btn-group" style="margin-top: 0.65rem;">
                  <span style="font-size: 0.7rem; color: var(--text-muted); align-self: center; margin-right: 0.2rem;">Quick Log:</span>
                  <button class="btn-stepper" onclick="App.quickAddHours(${eq.id}, 5)">+5h</button>
                  <button class="btn-stepper" onclick="App.quickAddHours(${eq.id}, 10)">+10h</button>
                  <button class="btn-stepper" onclick="App.quickAddHours(${eq.id}, 25)">+25h</button>
                </div>
              </div>

              <div style="font-size: 0.82rem; margin-bottom: 0.85rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
                  <span style="color: var(--text-muted);">Fuel Level:</span>
                  <strong style="color: ${eq.fuel_level_pct < 25 ? 'var(--danger)' : '#059669'};">${eq.fuel_level_pct}%</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">Station Location:</span>
                  <span>${eq.location}</span>
                </div>
              </div>

              ${eq.tasks && eq.tasks.length > 0 ? `
                <div style="border-top: 1px dashed var(--border); padding-top: 0.6rem; margin-bottom: 0.85rem;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.3rem;">Next Service Task</div>
                  <div style="font-size: 0.8rem; font-weight: 600; color: ${eq.hours_remaining <= 0 ? 'var(--danger)' : '#334155'};">
                    🔧 ${eq.tasks[0].task_name} (Due @ ${eq.tasks[0].due_hours}h)
                  </div>
                </div>
              ` : ''}

              <div style="display: flex; gap: 0.35rem; border-top: 1px solid var(--border-light); padding-top: 0.85rem; flex-wrap: wrap;">
                <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="App.openLogHoursFor(${eq.id})">⏱️ Meter</button>
                <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="App.openCompleteServiceModal(${eq.id})">🔧 Service</button>
                <button class="btn btn-outline btn-sm btn-ai-sparkle" onclick="App.openAIMachineryDiagnostic(${eq.id})">✨ AI Diag</button>
                <button class="btn btn-outline btn-sm" onclick="App.viewEquipmentHistory(${eq.id})">📜 History</button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Error rendering equipment:', err);
    }
  },

  async quickAddHours(eqId, hours) {
    try {
      const res = await API.logEquipmentHours(eqId, { hours_to_add: hours });
      this.showToast(res.message);
      await this.renderEquipment();
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  openLogHoursModal() {
    document.getElementById('form-log-hours').reset();
    document.getElementById('log-current-meter-display').textContent = '-- hrs';
    document.getElementById('log-next-service-display').textContent = '-- hrs';
    this.openModal('modal-log-hours');
  },

  openLogHoursFor(eqId) {
    this.openLogHoursModal();
    const select = document.getElementById('log-hours-eq-id');
    select.value = eqId;
    this.handleEquipmentSelectChange(eqId);
  },

  handleEquipmentSelectChange(eqId) {
    const eq = this.state.equipment.find(e => e.id === parseInt(eqId));
    if (eq) {
      document.getElementById('log-current-meter-display').textContent = `${eq.current_hours.toFixed(1)} hrs`;
      document.getElementById('log-next-service-display').textContent = `${eq.next_service_target} hrs`;
      document.getElementById('log-fuel-level').value = eq.fuel_level_pct;
    }
  },

  async handleLogHoursSubmit(e) {
    e.preventDefault();
    const eqId = parseInt(document.getElementById('log-hours-eq-id').value);
    const hoursToAdd = parseFloat(document.getElementById('log-hours-add').value);
    const fuel = document.getElementById('log-fuel-level').value ? parseFloat(document.getElementById('log-fuel-level').value) : undefined;

    try {
      const res = await API.logEquipmentHours(eqId, { hours_to_add: hoursToAdd, fuel_level_pct: fuel });
      this.closeModal('modal-log-hours');
      this.showToast(res.message);
      await this.renderEquipment();
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async openCompleteServiceModal(eqId) {
    try {
      const res = await API.getEquipmentDetail(eqId);
      const eq = res.data;

      document.getElementById('service-eq-id').value = eq.id;
      document.getElementById('service-machine-name').textContent = `${eq.name} (${eq.current_hours.toFixed(1)} hrs)`;

      const earliestTask = eq.tasks && eq.tasks.length > 0 ? eq.tasks[0] : null;
      document.getElementById('service-task-id').value = earliestTask ? earliestTask.id : '';
      document.getElementById('service-task-name').textContent = earliestTask ? earliestTask.task_name : 'Routine Periodic Service';
      document.getElementById('service-cost').value = earliestTask ? earliestTask.estimated_cost : 150.0;
      document.getElementById('service-hours-at').value = eq.current_hours;
      document.getElementById('service-date').value = new Date().toISOString().split('T')[0];

      this.openModal('modal-complete-service');
    } catch (err) {
      this.showToast('Could not load service details', 'error');
    }
  },

  async handleCompleteServiceSubmit(e) {
    e.preventDefault();
    const eqId = parseInt(document.getElementById('service-eq-id').value);
    const payload = {
      task_id: document.getElementById('service-task-id').value ? parseInt(document.getElementById('service-task-id').value) : null,
      service_date: document.getElementById('service-date').value,
      hours_at_service: parseFloat(document.getElementById('service-hours-at').value),
      performed_by: document.getElementById('service-tech').value,
      cost: parseFloat(document.getElementById('service-cost').value),
      parts_replaced: document.getElementById('service-parts').value,
      notes: document.getElementById('service-notes').value
    };

    try {
      await API.completeEquipmentService(eqId, payload);
      this.closeModal('modal-complete-service');
      this.showToast('Maintenance service ticket completed and interval reset!');
      await this.renderEquipment();
      this.renderDashboard();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async viewEquipmentHistory(eqId) {
    try {
      const res = await API.getEquipmentDetail(eqId);
      const eq = res.data;

      document.getElementById('history-modal-title').textContent = `${eq.name} — Service History & Maintenance Log`;
      const container = document.getElementById('history-modal-content');

      if (!eq.logs || eq.logs.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.88rem;">No past maintenance logs recorded for this machine.</p>`;
      } else {
        container.innerHTML = `
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Service Date</th>
                  <th>Task Name</th>
                  <th>Hour Meter</th>
                  <th>Technician</th>
                  <th>Parts / Fluids Replaced</th>
                  <th>Cost ($)</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${eq.logs.map(log => `
                  <tr>
                    <td><strong>${log.service_date}</strong></td>
                    <td>${log.task_name || 'Service Inspection'}</td>
                    <td>${log.hours_at_service.toFixed(1)} hrs</td>
                    <td>${log.performed_by}</td>
                    <td>${log.parts_replaced || '--'}</td>
                    <td style="font-weight: 700; color: var(--primary-dark);">$${log.cost.toLocaleString()}</td>
                    <td style="font-size: 0.78rem; color: var(--text-muted);">${log.notes || '--'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      this.openModal('modal-equipment-history');
    } catch (err) {
      this.showToast('Could not load service history', 'error');
    }
  },

  openAddEquipmentModal() {
    document.getElementById('form-add-equipment').reset();
    this.openModal('modal-add-equipment');
  },

  async handleAddEquipmentSubmit(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('new-eq-name').value,
      category: document.getElementById('new-eq-category').value,
      model: document.getElementById('new-eq-model').value,
      serial_number: document.getElementById('new-eq-serial').value,
      year: parseInt(document.getElementById('new-eq-year').value),
      current_hours: parseFloat(document.getElementById('new-eq-hours').value),
      next_service_hours: parseFloat(document.getElementById('new-eq-next-service').value),
      status: 'Active'
    };

    try {
      await API.createEquipment(payload);
      this.closeModal('modal-add-equipment');
      this.showToast(`Machine "${payload.name}" added to fleet!`);
      await this.renderEquipment();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // ---------------------------------------------
  // Global Search
  // ---------------------------------------------
  handleGlobalSearch(query) {
    if (!query || query.trim() === '') return;
    const q = query.toLowerCase().trim();

    // Check matching field
    const matchedField = this.state.fields.find(f => f.name.toLowerCase().includes(q));
    if (matchedField) {
      this.switchTab('fields');
      return;
    }

    // Check matching machinery
    const matchedEquip = this.state.equipment.find(e => e.name.toLowerCase().includes(q) || e.model.toLowerCase().includes(q));
    if (matchedEquip) {
      this.switchTab('equipment');
      return;
    }

    // Check matching operations
    const matchedOp = this.state.operations.find(o => o.title.toLowerCase().includes(q));
    if (matchedOp) {
      this.switchTab('operations');
      return;
    }
  },

  // ---------------------------------------------
  // HarvestAI Copilot & Predictive Intelligence
  // ---------------------------------------------
  toggleAICopilot() {
    const drawer = document.getElementById('ai-copilot-drawer');
    if (drawer) {
      drawer.classList.toggle('open');
      if (drawer.classList.contains('open')) {
        this.dismissAIBubble();
        this.updateCopilotUserContext();
        setTimeout(() => document.getElementById('ai-user-input')?.focus(), 250);
      }
    }
  },

  async handleCopilotSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('ai-user-input');
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    this.appendChatMessage(msg, 'user');

    // Show typing indicator
    const container = document.getElementById('ai-chat-messages');
    const typingIndicator = document.getElementById('ai-typing-indicator');
    if (typingIndicator) {
      typingIndicator.style.display = 'flex';
      container.appendChild(typingIndicator);
      container.scrollTop = container.scrollHeight;
    }

    try {
      const res = await API.chatAI(msg, [], this.state.currentUser);
      if (typingIndicator) typingIndicator.style.display = 'none';

      let replyHtml = res.data.reply
        .replace(/### (.*?)\n/g, '<h4 style="margin: 0.5rem 0 0.25rem 0; font-size: 0.95rem; color: #064e3b;">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');

      if (res.data.suggestedActions && res.data.suggestedActions.length > 0) {
        replyHtml += `<div class="chat-chips-row">` +
          res.data.suggestedActions.map(action => `<div class="chat-chip" onclick="App.handleAIActionClick('${action}')">${action}</div>`).join('') +
          `</div>`;
      }

      this.appendChatMessage(replyHtml, 'ai', true);
    } catch (err) {
      if (typingIndicator) typingIndicator.style.display = 'none';
      this.appendChatMessage(`⚠️ Could not reach HarvestAI advisor: ${err.message}`, 'ai', true);
    }
  },

  sendQuickPrompt(promptText) {
    const input = document.getElementById('ai-user-input');
    if (input) {
      input.value = promptText;
      const form = input.closest('form');
      if (form) form.dispatchEvent(new Event('submit'));
    }
  },

  appendChatMessage(content, sender, isHtml = false) {
    const container = document.getElementById('ai-chat-messages');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    if (isHtml) bubble.innerHTML = content;
    else bubble.textContent = content;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },

  handleAIActionClick(action) {
    if (action.includes('Matrix') || action.includes('Rotation')) {
      this.switchTab('rotations');
      this.toggleAICopilot();
    } else if (action.includes('Maintenance') || action.includes('Equipment')) {
      this.switchTab('equipment');
      this.toggleAICopilot();
    } else if (action.includes('Financial') || action.includes('Simulator') || action.includes('P&L')) {
      this.switchTab('analytics');
      this.toggleAICopilot();
    } else if (action.includes('Operation') || action.includes('Spray')) {
      this.switchTab('operations');
      this.toggleAICopilot();
    } else if (action.includes('North Valley') || action.includes('Ridge Creek')) {
      this.switchTab('rotations');
      this.toggleAICopilot();
    } else {
      this.sendQuickPrompt(action);
    }
  },

  // 1. AI Crop Rotation Recommendation Modal
  async openAIRotationModal() {
    const select = document.getElementById('ai-rec-field-select');
    if (select) {
      select.innerHTML = this.state.fields.map(f => `<option value="${f.id}">${f.name} (${f.acreage} ac)</option>`).join('');
      this.handleAIRecFieldChange(this.state.fields[0]?.id || 1);
    }
    this.openModal('modal-ai-recommendation');
  },

  async handleAIRecFieldChange(fieldId) {
    const content = document.getElementById('ai-rec-result-content');
    content.innerHTML = `<p style="color: var(--text-muted);">🌾 HarvestAI analyzing soil pH, organic matter, and prior crops...</p>`;

    try {
      const res = await API.getAIRotationRecommendation(fieldId);
      const rec = res.data;
      this.state.currentAIRec = rec;

      content.innerHTML = `
        <div style="background: #f0fdf4; border: 1px solid var(--primary); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #065f46; text-transform: uppercase;">Recommended Crop for 2027</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: #064e3b; margin: 0.2rem 0;">
            ✨ ${rec.recommendedCrop.name}
          </div>
          <span class="badge badge-active">${rec.recommendedCrop.botanical_family}</span>
          <span class="badge badge-planned">${rec.recommendedCrop.nitrogen_demand}</span>
        </div>

        <div style="font-size: 0.85rem; line-height: 1.6; margin-bottom: 1rem;">
          <strong>Agronomic Rationale:</strong><br>
          ${rec.reasoning}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.82rem;">
          <div style="background: #f8fafc; padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border);">
            <div style="color: var(--text-muted); font-size: 0.72rem;">Nitrogen Impact</div>
            <strong style="color: ${rec.estimatedNCreditLbsAc >= 0 ? '#059669' : '#b45309'}; font-size: 0.95rem;">
              ${rec.estimatedNCreditLbsAc >= 0 ? `+${rec.estimatedNCreditLbsAc} lbs N/ac credit` : `${rec.estimatedNCreditLbsAc} lbs N/ac deficit`}
            </strong>
          </div>
          <div style="background: #f8fafc; padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border);">
            <div style="color: var(--text-muted); font-size: 0.72rem;">Pathogen Protection</div>
            <strong style="font-size: 0.82rem; color: #334155;">${rec.pestBreakBenefit}</strong>
          </div>
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<p style="color: var(--danger);">Failed to generate recommendation: ${err.message}</p>`;
    }
  },

  async applyAIRotationRecommendation() {
    if (!this.state.currentAIRec) return;
    const rec = this.state.currentAIRec;

    try {
      await API.upsertRotation({
        field_id: rec.field.id,
        crop_id: rec.recommendedCrop.id,
        year: 2027,
        season: 'Spring',
        status: 'Planned',
        notes: `AI Recommended: ${rec.reasoning.substring(0, 80)}...`
      });

      this.closeModal('modal-ai-recommendation');
      this.showToast(`Applied ${rec.recommendedCrop.name} to ${rec.field.name} (2027)!`);
      await this.renderRotations();
      this.evaluateFieldRotation(rec.field.id);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // 2. AI Machinery Predictive Diagnostics Modal
  async openAIMachineryDiagnostic(eqId) {
    const title = document.getElementById('ai-diag-title');
    const content = document.getElementById('ai-diag-content');
    title.textContent = `✨ Predictive Diagnostics`;
    content.innerHTML = `<p style="color: var(--text-muted);">Analyzing sensor hours and telemetry wear models...</p>`;
    this.openModal('modal-ai-diagnostic');

    try {
      const res = await API.getAIMachineryDiagnosis(eqId);
      const diag = res.data;
      const eq = diag.equipment;

      title.textContent = `✨ Predictive Diagnostics: ${eq.name}`;
      content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
          <div>
            <div style="font-weight: 700; font-size: 1.1rem;">${eq.name} (${eq.model})</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Current: <strong>${eq.current_hours.toFixed(1)} hrs</strong> • Next Target: <strong>${eq.next_service_hours} hrs</strong></div>
          </div>
          <span class="badge ${diag.riskLevel.includes('Critical') ? 'badge-danger' : diag.riskLevel.includes('Moderate') ? 'badge-warning' : 'badge-active'}" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
            ${diag.riskLevel}
          </span>
        </div>

        <div style="font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.25rem; background: #fffbeb; border-left: 4px solid var(--accent); padding: 0.85rem 1rem; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; color: #92400e;">
          <strong>AI Diagnostics Assessment:</strong><br>
          ${diag.diagnosticSummary}
        </div>

        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem;">Component Wear Forecast & Telemetry</h4>
        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
          ${diag.componentWearForecast.map(item => `
            <div style="background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.85rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">
                <span>${item.component}</span>
                <span style="color: ${item.wearPct > 80 ? 'var(--danger)' : item.wearPct > 60 ? 'var(--accent)' : 'var(--primary-dark)'};">
                  ${item.wearPct}% Estimated Wear (${item.status})
                </span>
              </div>
              <div class="progress-bar" style="margin-bottom: 0.5rem;">
                <div class="progress-fill ${item.wearPct > 80 ? 'red' : item.wearPct > 60 ? 'amber' : ''}" style="width: ${item.wearPct}%;"></div>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                💡 <strong>Prescription:</strong> ${item.recommendation}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<p style="color: var(--danger);">Diagnosis failed: ${err.message}</p>`;
    }
  },

  // 3. AI Financial Executive Insights Modal
  async openAIFinancialInsightsModal() {
    const content = document.getElementById('ai-finance-content');
    content.innerHTML = `<p style="color: var(--text-muted);">Synthesizing multi-year harvest yields and financial margins...</p>`;
    this.openModal('modal-ai-finance');

    try {
      const res = await API.getAIFinancialInsights();
      const fin = res.data;

      content.innerHTML = `
        <div class="grid-2" style="margin-bottom: 1.25rem;">
          <div style="background: #ecfdf5; border: 1px solid var(--primary); border-radius: var(--radius-md); padding: 1rem;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #065f46; text-transform: uppercase;">Top Net Profit Generator</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #064e3b; margin: 0.2rem 0;">
              ${fin.topPerformingField.name}
            </div>
            <div style="font-size: 0.85rem; color: #047857;">
              Crop: <strong>${fin.topPerformingField.crop}</strong> (${fin.topPerformingField.yieldPerAcre} bu/ac) • <strong>$${fin.topPerformingField.netProfit.toLocaleString()}</strong> Net Profit
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Farm Realized Profit</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin: 0.2rem 0;">
              $${fin.totalNetProfit.toLocaleString()}
            </div>
            <span class="badge badge-active">${fin.overallMarginPct}% Farm Operating Margin</span>
          </div>
        </div>

        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.6rem;">Key Agronomic & Financial Observations</h4>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem;">
          ${fin.keyInsights.map(insight => `
            <div style="background: #ffffff; border: 1px solid var(--border); border-left: 4px solid var(--primary); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; padding: 0.75rem 1rem; font-size: 0.85rem; line-height: 1.5;">
              ${insight}
            </div>
          `).join('')}
        </div>

        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.6rem; color: #065f46;">Strategic AI Profit Optimization Directives</h4>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${fin.aiActionableRecommendations.map(rec => `
            <div style="background: #f0fdf4; border: 1px solid var(--primary-light); border-radius: var(--radius-md); padding: 0.75rem 1rem; font-size: 0.85rem; color: #064e3b;">
              🎯 ${rec}
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<p style="color: var(--danger);">Failed to load financial insights: ${err.message}</p>`;
    }
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
