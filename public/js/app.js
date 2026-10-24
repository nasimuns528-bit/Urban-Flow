/**
 * UrbanFlow Master Application Bootstrap
 * Connects state, views, Leaflet mapping, and role-based permissions
 */

import { getState, setState, subscribe } from './state.js';
import { api } from './api.js';
import { initMap, renderIncidentMarkers, flyToLocation } from './map.js';
import { initReportWizard } from './components/citizenReport.js';
import { initIncidentTracker, searchIncidentCode } from './components/incidentTracker.js';
import { initOfficerDashboard, renderHotspotsView } from './components/officerDashboard.js';
import { initFieldDashboard, renderFieldTasks } from './components/fieldDashboard.js';
import { renderAdminAnalytics } from './components/adminDashboard.js';
import { showToast } from './components/notifications.js';

let demoUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌊 Initialising UrbanFlow: Localised Flood and Drainage Response Platform');

  // 1. Initialize Map
  initMap('leaflet-map');

  // 2. Initialize sub-components
  initReportWizard(onIncidentCreated);
  initIncidentTracker();
  await initOfficerDashboard(refreshData);
  initFieldDashboard(refreshData);

  // 3. Setup UI event handlers
  setupRoleSwitcher();
  setupNavigation();
  setupFilters();
  setupWeatherTicker();

  // 4. Load demo accounts and initial data
  await loadDemoAccounts();
  await refreshData();

  // 5. Initial view setup based on default role (admin)
  switchView('map');
});

async function loadDemoAccounts() {
  try {
    const res = await api.getDemoUsers();
    if (res.success && res.users) {
      demoUsers = res.users;
    }
  } catch (e) {
    console.error('Could not load demo accounts:', e);
  }
}

async function refreshData() {
  try {
    const state = getState();

    // Fetch Incidents
    const incidentsRes = await api.getIncidents(state.filters);
    const incidents = incidentsRes.incidents || [];

    // Fetch Hotspots
    const hotspotsRes = await api.getHotspots();

    // Fetch Tasks
    const tasksRes = await api.getTasks();
    const tasks = tasksRes.tasks || [];

    // Fetch Weather Telemetry
    const weatherRes = await api.getWeather();
    const weather = weatherRes.weather || null;

    setState({
      incidents,
      hotspotsData: hotspotsRes,
      tasks,
      weather
    });

    // Update Map Pins
    renderIncidentMarkers(incidents, (incident) => {
      onSelectIncidentFromMap(incident);
    });

    // Update Weather Badge
    updateWeatherUI(weather);

    // Re-render currently active view
    renderCurrentView();
  } catch (err) {
    console.error('Refresh error:', err);
  }
}

function renderCurrentView() {
  const { activeView, activeRole, hotspotsData, tasks } = getState();

  if (activeView === 'hotspots') {
    renderHotspotsView(hotspotsData, 'hotspots-view-container', (lat, lng) => {
      switchView('map');
      flyToLocation(lat, lng);
    });
  } else if (activeView === 'tasks') {
    renderFieldTasks(tasks, 'field-tasks-container', refreshData);
  } else if (activeView === 'analytics') {
    renderAdminAnalytics('admin-view-container');
  }
}

function setupRoleSwitcher() {
  const roleButtons = document.querySelectorAll('.role-tab');
  roleButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const selectedRole = btn.dataset.role;
      roleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Find matching demo user
      const user = demoUsers.find(u => u.role === selectedRole) || {
        id: 1,
        full_name: selectedRole === 'citizen' ? 'Citizen Vikram Sen' : selectedRole === 'field_worker' ? 'Ramesh Kumar (Field Lead)' : selectedRole === 'officer' ? 'Chief Officer Ananya' : 'Commissioner Rajesh',
        role: selectedRole,
        email: `${selectedRole}@urbanflow.gov`
      };

      // Authenticate as this demo user to obtain valid JWT token
      try {
        const loginRes = await api.login(user.email, 'Password@123');
        if (loginRes.success && loginRes.token) {
          localStorage.setItem('urbanflow_token', loginRes.token);
          setState({ currentUser: loginRes.user, activeRole: selectedRole });
        } else {
          setState({ currentUser: user, activeRole: selectedRole });
        }
      } catch (e) {
        setState({ currentUser: user, activeRole: selectedRole });
      }

      updateUserProfileUI(getState().currentUser);
      applyRoleNavVisibility(selectedRole);

      // Auto-navigate to role's primary view
      if (selectedRole === 'citizen') {
        switchView('map');
      } else if (selectedRole === 'field_worker') {
        switchView('tasks');
      } else if (selectedRole === 'officer') {
        switchView('hotspots');
      } else if (selectedRole === 'admin') {
        switchView('analytics');
      }

      showToast(`Switched persona to ${user.full_name} (${selectedRole.toUpperCase()})`, 'info');
      await refreshData();
    });
  });
}

function applyRoleNavVisibility(role) {
  const navItems = document.querySelectorAll('[data-view]');
  navItems.forEach(item => {
    const view = item.dataset.view;
    let allowed = true;

    if (role === 'citizen') {
      if (view === 'hotspots' || view === 'tasks' || view === 'analytics') allowed = false;
    } else if (role === 'field_worker') {
      if (view === 'hotspots' || view === 'analytics') allowed = false;
    }

    item.style.display = allowed ? '' : 'none';
  });
}

function updateUserProfileUI(user) {
  const nameEl = document.getElementById('user-profile-name');
  const roleEl = document.getElementById('user-profile-role');
  const avatarEl = document.getElementById('user-profile-avatar');

  if (nameEl) nameEl.innerText = user.full_name || 'UrbanFlow User';
  if (roleEl) roleEl.innerText = (user.role || 'citizen').toUpperCase();
  if (avatarEl) {
    const initials = (user.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2);
    avatarEl.innerText = initials;
  }
}

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-item');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.dataset.view;
      if (targetView) {
        switchView(targetView);
      }
    });
  });
}

export function switchView(viewName) {
  setState({ activeView: viewName });

  // Update navigation classes
  document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(el => {
    if (el.dataset.view === viewName) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Toggle view containers
  const viewPanels = document.querySelectorAll('.view-panel');
  viewPanels.forEach(panel => {
    if (panel.id === `view-${viewName}`) {
      panel.style.display = 'block';
    } else {
      panel.style.display = 'none';
    }
  });

  // Re-trigger map resize if switching to map
  if (viewName === 'map') {
    setTimeout(() => {
      const mapEl = document.getElementById('leaflet-map');
      if (mapEl && window.L) {
        window.dispatchEvent(new Event('resize'));
      }
    }, 100);
  }

  renderCurrentView();
}

function setupFilters() {
  const filterBtns = document.querySelectorAll('.map-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterStatus = btn.dataset.status;
      const state = getState();
      state.filters.status = filterStatus;
      refreshData();
    });
  });
}

function setupWeatherTicker() {
  const weatherEl = document.getElementById('header-weather-info');
  if (weatherEl) {
    weatherEl.onclick = () => {
      const weather = getState().weather;
      if (weather) {
        showToast(`🌧️ Rainfall: ${weather.precipitationMm} mm/hr • ${weather.warningMessage}`, 'info');
      }
    };
  }
}

function updateWeatherUI(weather) {
  if (!weather) return;
  const rainText = document.getElementById('weather-rain-mm');
  const alertText = document.getElementById('weather-alert-label');

  if (rainText) rainText.innerText = `${weather.precipitationMm} mm/hr`;
  if (alertText) alertText.innerText = weather.rainIntensity || 'Heavy Downpour';
}

function onIncidentCreated(incident) {
  refreshData();
  switchView('track');
  searchIncidentCode(incident.tracking_code);
}

function onSelectIncidentFromMap(incident) {
  switchView('track');
  searchIncidentCode(incident.tracking_code);
}
