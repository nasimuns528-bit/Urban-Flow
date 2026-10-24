/**
 * UrbanFlow Centralized Reactive State Store
 */

const state = {
  currentUser: {
    id: 1,
    full_name: 'Commissioner Rajesh Varma',
    email: 'admin@urbanflow.gov',
    role: 'admin',
    ward_id: 1,
    token: null
  },
  activeRole: 'admin', // 'citizen' | 'field_worker' | 'officer' | 'admin'
  activeView: 'map', // 'map' | 'report' | 'track' | 'hotspots' | 'tasks' | 'analytics'
  incidents: [],
  selectedIncident: null,
  hotspotsData: null,
  tasks: [],
  wards: [],
  weather: null,
  filters: {
    status: 'all',
    water_depth: 'all',
    min_priority: 0,
    search: ''
  },
  listeners: []
};

export function getState() {
  return state;
}

export function setState(updates) {
  Object.assign(state, updates);
  notifyListeners();
}

export function subscribe(listener) {
  state.listeners.push(listener);
  return () => {
    state.listeners = state.listeners.filter(l => l !== listener);
  };
}

function notifyListeners() {
  state.listeners.forEach(fn => fn(state));
}
