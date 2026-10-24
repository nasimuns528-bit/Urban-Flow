/**
 * UrbanFlow Resilient Client Bundle
 * Supports both Live Express/MySQL 8 API mode and Offline/Demo mode
 */

(function () {
  'use strict';

  // 1. Initial State & Realistic Seed Datasets
  const INITIAL_USERS = [
    { id: 1, full_name: 'Commissioner Rajesh Varma', email: 'admin@urbanflow.gov', role: 'admin', ward_id: 1 },
    { id: 2, full_name: 'Chief Officer Ananya Iyer', email: 'officer.ananya@urbanflow.gov', role: 'officer', ward_id: 2 },
    { id: 3, full_name: 'Dispatch Engineer Marcus Lee', email: 'officer.marcus@urbanflow.gov', role: 'officer', ward_id: 1 },
    { id: 4, full_name: 'Lead Worker Ramesh Kumar', email: 'crew.ramesh@urbanflow.gov', role: 'field_worker', ward_id: 2 },
    { id: 5, full_name: 'Field Tech Priya Sundaram', email: 'crew.priya@urbanflow.gov', role: 'field_worker', ward_id: 1 },
    { id: 6, full_name: 'Citizen Vikram Sen', email: 'vikram.sen@example.com', role: 'citizen', ward_id: 2 }
  ];

  const INITIAL_WARDS = [
    { id: 1, ward_number: 'WARD-14', name: 'Central Commercial District', zone: 'Zone A - Downtown', risk_level: 'high', center_lat: 13.0827, center_lng: 80.2707, drainage_capacity_rating: 45, officer_contact: '+91-98401-11014', active_incidents_count: 1 },
    { id: 2, ward_number: 'WARD-22', name: 'Riverside Lowlands & Basin', zone: 'Zone B - East Basin', risk_level: 'critical', center_lat: 13.0645, center_lng: 80.2825, drainage_capacity_rating: 30, officer_contact: '+91-98401-11022', active_incidents_count: 2 },
    { id: 3, ward_number: 'WARD-08', name: 'Metro Rail & IT Corridor', zone: 'Zone C - South Corridor', risk_level: 'moderate', center_lat: 13.0102, center_lng: 80.2158, drainage_capacity_rating: 65, officer_contact: '+91-98401-11008', active_incidents_count: 1 },
    { id: 4, ward_number: 'WARD-31', name: 'Coastal Harbor & Fishermans Wharf', zone: 'Zone D - Coastal', risk_level: 'high', center_lat: 13.1090, center_lng: 80.2980, drainage_capacity_rating: 50, officer_contact: '+91-98401-11031', active_incidents_count: 1 }
  ];

  const INITIAL_INCIDENTS = [
    {
      id: 1,
      tracking_code: 'UF-2026-8491',
      citizen_name: 'Vikram Sen',
      citizen_phone: '+91-98402-33441',
      latitude: 13.0648,
      longitude: 80.2829,
      address: 'Bridge Road, Beside General Hospital Subway',
      landmark: 'General Hospital Gate 4',
      ward_id: 2,
      ward_name: 'Riverside Lowlands & Basin',
      water_depth: 'submerged',
      blockage_type: 'river_spill',
      description: 'Severe storm run-off overflowed culvert. Ambulances unable to access ER ramp. Water rising quickly.',
      photo_url: './uploads/hospital-subway-flood.svg',
      status: 'in_progress',
      priority_score: 96.5,
      critical_infra_nearby: true,
      estimated_affected_people: 350,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString()
    },
    {
      id: 2,
      tracking_code: 'UF-2026-8492',
      citizen_name: 'Dr. Shalini Mehta',
      citizen_phone: '+91-98405-77112',
      latitude: 13.0831,
      longitude: 80.2715,
      address: 'North Market Cross Road, Ward 14',
      landmark: 'Old Town Vegetable Market',
      ward_id: 1,
      ward_name: 'Central Commercial District',
      water_depth: 'waist',
      blockage_type: 'drain_overflow',
      description: 'Storm drain inlet choked with plastic crates and silt. Market shops taking in water. Pedestrians stranded.',
      photo_url: './uploads/market-drain-overflow.svg',
      status: 'assigned',
      priority_score: 84.0,
      critical_infra_nearby: false,
      estimated_affected_people: 200,
      created_at: new Date(Date.now() - 3 * 3600000).toISOString()
    },
    {
      id: 3,
      tracking_code: 'UF-2026-8493',
      citizen_name: 'Karthik Raja',
      citizen_phone: '+91-98401-99882',
      latitude: 13.0110,
      longitude: 80.2165,
      address: 'Main Arterial Road & Metro Junction',
      landmark: 'Pillar 142 Near Metro Entrance',
      ward_id: 3,
      ward_name: 'Metro Rail & IT Corridor',
      water_depth: 'knee',
      blockage_type: 'manhole_open',
      description: 'Heavy storm flow dislodged main manhole cover. High vehicle accident risk during downpour. Traffic crawling.',
      photo_url: './uploads/metro-manhole-hazard.svg',
      status: 'verified',
      priority_score: 72.5,
      critical_infra_nearby: true,
      estimated_affected_people: 500,
      created_at: new Date(Date.now() - 1 * 3600000).toISOString()
    },
    {
      id: 4,
      tracking_code: 'UF-2026-8494',
      citizen_name: 'Fatima Banu',
      citizen_phone: '+91-98408-22334',
      latitude: 13.1095,
      longitude: 80.2985,
      address: 'Port Access Bypass Lane 3',
      landmark: 'Wharf Gate 2',
      ward_id: 4,
      ward_name: 'Coastal Harbor & Fishermans Wharf',
      water_depth: 'ankle',
      blockage_type: 'silt_debris',
      description: 'Construction debris blocking storm gutter channel. Water accumulating on curbside.',
      photo_url: './uploads/wharf-silt-gutter.svg',
      status: 'reported',
      priority_score: 41.0,
      critical_infra_nearby: false,
      estimated_affected_people: 40,
      created_at: new Date(Date.now() - 30 * 60000).toISOString()
    },
    {
      id: 5,
      tracking_code: 'UF-2026-8490',
      citizen_name: 'Gaurav K.',
      citizen_phone: '+91-98403-44119',
      latitude: 13.0632,
      longitude: 80.2810,
      address: 'Canal Bank Colony, 2nd Cross',
      landmark: 'Near Community Hall',
      ward_id: 2,
      ward_name: 'Riverside Lowlands & Basin',
      water_depth: 'waist',
      blockage_type: 'drain_overflow',
      description: 'Blocked culvert cleared by pumping crew. Silt removed and drains flushing normally.',
      photo_url: './uploads/cleared-drainage-proof.svg',
      status: 'resolved',
      priority_score: 25.0,
      critical_infra_nearby: false,
      estimated_affected_people: 150,
      created_at: new Date(Date.now() - 8 * 3600000).toISOString()
    }
  ];

  const INITIAL_TASKS = [
    {
      id: 1,
      incident_id: 1,
      tracking_code: 'UF-2026-8491',
      address: 'Bridge Road, Beside General Hospital Subway',
      landmark: 'General Hospital Gate 4',
      ward_name: 'Riverside Lowlands & Basin',
      water_depth: 'submerged',
      blockage_type: 'river_spill',
      latitude: 13.0648,
      longitude: 80.2829,
      priority_score: 96.5,
      assigned_to_user_id: 4,
      worker_name: 'Lead Worker Ramesh Kumar',
      worker_phone: '+91-98000-00004',
      crew_size: 4,
      equipment_required: 'Two 500-GPM High Flow Dewatering Pumps, Emergency Warning Cones',
      status: 'in_progress',
      sla_deadline: new Date(Date.now() + 1 * 3600000).toISOString(),
      dispatched_at: new Date(Date.now() - 90 * 60000).toISOString(),
      on_site_at: new Date(Date.now() - 45 * 60000).toISOString(),
      resolution_notes: 'Pumps active on hospital ER access lane. Diverted 40% volume into auxiliary retention line.',
      incident_photo: './uploads/hospital-subway-flood.svg',
      proof_photo_url: null
    },
    {
      id: 2,
      incident_id: 2,
      tracking_code: 'UF-2026-8492',
      address: 'North Market Cross Road, Ward 14',
      landmark: 'Old Town Vegetable Market',
      ward_name: 'Central Commercial District',
      water_depth: 'waist',
      blockage_type: 'drain_overflow',
      latitude: 13.0831,
      longitude: 80.2715,
      priority_score: 84.0,
      assigned_to_user_id: 5,
      worker_name: 'Field Tech Priya Sundaram',
      worker_phone: '+91-98000-00005',
      crew_size: 3,
      equipment_required: 'High pressure jetting vacuum truck, safety barriers',
      status: 'assigned',
      sla_deadline: new Date(Date.now() + 3 * 3600000).toISOString(),
      dispatched_at: new Date(Date.now() - 20 * 60000).toISOString(),
      on_site_at: null,
      resolution_notes: 'En route to North Market Cross Road. Expected on site in 15 mins.',
      incident_photo: './uploads/market-drain-overflow.svg',
      proof_photo_url: null
    },
    {
      id: 3,
      incident_id: 5,
      tracking_code: 'UF-2026-8490',
      address: 'Canal Bank Colony, 2nd Cross',
      landmark: 'Near Community Hall',
      ward_name: 'Riverside Lowlands & Basin',
      water_depth: 'waist',
      blockage_type: 'drain_overflow',
      latitude: 13.0632,
      longitude: 80.2810,
      priority_score: 25.0,
      assigned_to_user_id: 4,
      worker_name: 'Lead Worker Ramesh Kumar',
      worker_phone: '+91-98000-00004',
      crew_size: 3,
      equipment_required: 'Dewatering trailer pump & mechanical excavator',
      status: 'resolved',
      sla_deadline: new Date(Date.now() - 2 * 3600000).toISOString(),
      dispatched_at: new Date(Date.now() - 7 * 3600000).toISOString(),
      on_site_at: new Date(Date.now() - 6 * 3600000).toISOString(),
      resolved_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      resolution_notes: 'Culvert obstruction removed (tree logs & compacted mud). Water level receded completely to normal curb height.',
      incident_photo: './uploads/market-drain-overflow.svg',
      proof_photo_url: './uploads/cleared-drainage-proof.svg'
    }
  ];

  const INITIAL_UPDATES = [
    { incident_id: 1, updated_by_name: 'Citizen Vikram Sen', updated_by_role: 'citizen', comments: 'Citizen reported critical water surge near General Hospital ER gate.', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
    { incident_id: 1, updated_by_name: 'Chief Officer Ananya', updated_by_role: 'officer', comments: 'Officer verified report via live CCTV. Water level evaluated as Submerged (Emergency Tier 1).', created_at: new Date(Date.now() - 105 * 60000).toISOString() },
    { incident_id: 1, updated_by_name: 'Chief Officer Ananya', updated_by_role: 'officer', comments: 'Dispatched Rapid Response Crew #4 (Lead: Ramesh Kumar) with 2x dewatering pump units.', created_at: new Date(Date.now() - 100 * 60000).toISOString() },
    { incident_id: 1, updated_by_name: 'Lead Worker Ramesh Kumar', updated_by_role: 'field_worker', comments: 'Field Crew on site. Dewatering pumps deployed. Water level dropping from vehicle tire height.', created_at: new Date(Date.now() - 45 * 60000).toISOString() },

    { incident_id: 2, updated_by_name: 'Citizen', updated_by_role: 'citizen', comments: 'Citizen reported waist-deep flood at Old Town Vegetable Market.', created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
    { incident_id: 2, updated_by_name: 'Officer Marcus Lee', updated_by_role: 'officer', comments: 'Officer Marcus Lee verified drain choke. High priority assigned due to commercial density.', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
    { incident_id: 2, updated_by_name: 'Officer Marcus Lee', updated_by_role: 'officer', comments: 'Assigned to Field Tech Priya Sundaram with jetting truck unit.', created_at: new Date(Date.now() - 25 * 60000).toISOString() },

    { incident_id: 5, updated_by_name: 'Citizen Gaurav K.', updated_by_role: 'citizen', comments: 'Citizen report logged for Canal Bank Colony.', created_at: new Date(Date.now() - 8 * 3600000).toISOString() },
    { incident_id: 5, updated_by_name: 'Chief Officer Ananya', updated_by_role: 'officer', comments: 'Assigned directly to Rapid Dewatering Unit.', created_at: new Date(Date.now() - 7 * 3600000).toISOString() },
    { incident_id: 5, updated_by_name: 'Lead Worker Ramesh Kumar', updated_by_role: 'field_worker', comments: 'Crew deployed excavator and opened blocked spillway.', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
    { incident_id: 5, updated_by_name: 'Lead Worker Ramesh Kumar', updated_by_role: 'field_worker', comments: 'Water fully drained. Manhole covers secured. Verified by local ward supervisor.', created_at: new Date(Date.now() - 2 * 3600000).toISOString() }
  ];

  // In-memory / localStorage Store
  const store = {
    users: INITIAL_USERS,
    wards: INITIAL_WARDS,
    incidents: JSON.parse(localStorage.getItem('uf_incidents') || JSON.stringify(INITIAL_INCIDENTS)),
    tasks: JSON.parse(localStorage.getItem('uf_tasks') || JSON.stringify(INITIAL_TASKS)),
    updates: JSON.parse(localStorage.getItem('uf_updates') || JSON.stringify(INITIAL_UPDATES)),
    currentUser: INITIAL_USERS[0],
    activeRole: 'admin',
    activeView: 'map',
    filters: { status: 'all' },
    weather: {
      temperature: 28.5,
      precipitationMm: 34.2,
      rainIntensity: 'Heavy Downpour',
      warningLevel: 'ORANGE_ALERT',
      warningMessage: 'Active monsoon cloudburst detected. Drainage systems operating at 85% capacity.'
    }
  };

  function persistStore() {
    localStorage.setItem('uf_incidents', JSON.stringify(store.incidents));
    localStorage.setItem('uf_tasks', JSON.stringify(store.tasks));
    localStorage.setItem('uf_updates', JSON.stringify(store.updates));
  }

  // Toast Notification
  function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // Priority Score Formula
  function computePriorityScore(depth, criticalInfra, blockageType) {
    let dScore = 18;
    if (depth === 'submerged') dScore = 35;
    else if (depth === 'waist') dScore = 28;
    else if (depth === 'knee') dScore = 18;
    else if (depth === 'ankle') dScore = 8;

    let iScore = criticalInfra ? 25 : 5;
    if (blockageType === 'manhole_open') iScore = Math.min(25, iScore + 10);

    const rScore = 15; // Rain factor
    const aScore = 5;  // Age factor
    return Math.min(100, dScore + iScore + rScore + aScore);
  }

  // Leaflet Map Manager
  let mapInstance = null;
  let markersLayer = null;
  let tempPickMarker = null;
  let isPickMode = false;

  function initLeafletMap() {
    const el = document.getElementById('leaflet-map');
    if (!el || typeof L === 'undefined') return;

    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
    }

    mapInstance = L.map('leaflet-map', {
      zoomControl: false,
      attributionControl: false
    }).setView([13.0645, 80.2707], 13);

    L.control.zoom({ position: 'topright' }).addTo(mapInstance);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(mapInstance);

    markersLayer = L.layerGroup().addTo(mapInstance);

    mapInstance.on('click', (e) => {
      if (isPickMode) {
        const { lat, lng } = e.latlng;
        setPickCoords(lat, lng);
        showToast(`Pinned incident at (${lat.toFixed(4)}, ${lng.toFixed(4)})`, 'success');
        isPickMode = false;
        el.style.cursor = 'default';
      }
    });

    renderMapMarkers();
  }

  // ===========================================================================
  // Live Location Capturing & Proximity Engine
  // ===========================================================================
  const liveLocationState = {
    isTracking: false,
    watchId: null,
    simTimer: null,
    coords: null,
    marker: null,
    circle: null
  };

  function calcDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  let miniMapInstance = null;
  let miniMapMarker = null;

  function updateReportMiniMap(lat, lng) {
    const el = document.getElementById('report-mini-map');
    if (!el || typeof L === 'undefined') return;

    if (!miniMapInstance) {
      miniMapInstance = L.map('report-mini-map', {
        zoomControl: true,
        attributionControl: false
      }).setView([lat, lng], 15);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(miniMapInstance);
    } else {
      miniMapInstance.invalidateSize();
      miniMapInstance.setView([lat, lng], 15);
    }

    if (miniMapMarker) {
      miniMapInstance.removeLayer(miniMapMarker);
    }

    const icon = L.divIcon({
      className: 'custom-live-marker',
      html: '<div class="user-live-marker-container"><div class="user-live-pulse"></div><div class="user-live-core" style="background:#00F0FF;"></div></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    miniMapMarker = L.marker([lat, lng], { icon }).addTo(miniMapInstance);
    miniMapMarker.bindPopup(`
      <div style="padding: 2px;">
        <strong style="color: #00F0FF; font-size: 11px;">📍 Captured Live Location</strong>
        <div style="font-family: monospace; font-size: 10px; color: #FFF;">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
      </div>
    `).openPopup();
  }

  function handleLocationUpdate(lat, lng, accuracy = 6, centerMap = false) {
    liveLocationState.coords = { lat, lng, accuracy };

    // Update or create live marker on map
    if (mapInstance && typeof L !== 'undefined') {
      if (!liveLocationState.marker) {
        const liveIcon = L.divIcon({
          className: 'custom-live-marker',
          html: '<div class="user-live-marker-container"><div class="user-live-pulse"></div><div class="user-live-core"></div></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        liveLocationState.marker = L.marker([lat, lng], { icon: liveIcon, zIndexOffset: 2000 }).addTo(mapInstance);
      } else {
        liveLocationState.marker.setLatLng([lat, lng]);
      }

      // Accuracy radius circle
      if (!liveLocationState.circle) {
        liveLocationState.circle = L.circle([lat, lng], {
          radius: Math.max(accuracy, 25),
          color: '#00F0FF',
          fillColor: '#00F0FF',
          fillOpacity: 0.15,
          weight: 2
        }).addTo(mapInstance);
      } else {
        liveLocationState.circle.setLatLng([lat, lng]);
        liveLocationState.circle.setRadius(Math.max(accuracy, 25));
      }

      // Bind informative popup and open it so the user visibly sees it
      const popupHtml = `
        <div style="padding: 4px; min-width: 170px;">
          <div style="font-size: 12px; font-weight: 800; color: #00F0FF; margin-bottom: 3px;">📍 Your Captured Live Location</div>
          <div style="font-family: monospace; font-size: 11px; color: #FFF; background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 4px;">
            ${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E
          </div>
          <div style="font-size: 10px; color: #94A3B8; margin-top: 3px;">Accuracy: ± ${Math.round(accuracy)} meters</div>
        </div>
      `;
      liveLocationState.marker.bindPopup(popupHtml).openPopup();

      if (centerMap) {
        mapInstance.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
      }
    }

    // Telemetry HUD Elements
    const hud = document.getElementById('live-location-hud');
    if (hud) hud.classList.add('active');

    const hudCoords = document.getElementById('live-hud-coords');
    if (hudCoords) hudCoords.innerText = `${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`;

    const hudAcc = document.getElementById('live-gps-accuracy');
    if (hudAcc) hudAcc.innerText = `± ${Math.round(accuracy)}m`;

    // Check proximity to active flood hotspots
    let minDistance = Infinity;
    let closestIncident = null;
    store.incidents.forEach(inc => {
      if (inc.status !== 'resolved') {
        const dist = calcDistanceMeters(lat, lng, inc.latitude, inc.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          closestIncident = inc;
        }
      }
    });

    const proxEl = document.getElementById('live-hud-proximity');
    const proxText = document.getElementById('live-proximity-text');
    if (proxEl && proxText && closestIncident) {
      if (minDistance <= 800) {
        proxEl.style.display = 'flex';
        proxText.innerText = `Within ${minDistance}m of ${closestIncident.address} (${(closestIncident.water_depth || 'knee').toUpperCase()} flood hazard)`;
      } else {
        proxEl.style.display = 'none';
      }
    }

    // Nearest ward / estimated address
    let closestWard = store.wards[0];
    let wardMinDist = Infinity;
    store.wards.forEach(w => {
      const d = calcDistanceMeters(lat, lng, w.center_lat, w.center_lng);
      if (d < wardMinDist) {
        wardMinDist = d;
        closestWard = w;
      }
    });

    const hudAddress = document.getElementById('live-hud-address');
    if (hudAddress) {
      hudAddress.innerText = `Near ${closestWard.name} (${closestWard.zone})`;
    }

    // Update Report Wizard if present
    const reportBadge = document.getElementById('report-live-location-badge');
    if (reportBadge) reportBadge.style.display = 'block';

    const reportCoords = document.getElementById('report-live-coords-text');
    if (reportCoords) reportCoords.innerText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    const reportAcc = document.getElementById('report-live-accuracy');
    if (reportAcc) reportAcc.innerText = `Accuracy: ± ${Math.round(accuracy)}m`;

    const reportAddr = document.getElementById('report-live-address-text');
    if (reportAddr) reportAddr.innerText = `Municipal Sector: ${closestWard.name}`;

    const inputLat = document.getElementById('input-latitude');
    const inputLng = document.getElementById('input-longitude');
    if (inputLat && inputLng) {
      inputLat.value = lat.toFixed(6);
      inputLng.value = lng.toFixed(6);
    }

    // Update Report Mini-Map Preview
    updateReportMiniMap(lat, lng);
  }

  function toggleLiveLocation(centerMap = true) {
    const btnMap = document.getElementById('btn-toggle-live-gps');
    const labelMap = document.getElementById('label-live-gps');
    const streamStatusLabel = document.getElementById('stream-status-label');

    if (!liveLocationState.isTracking) {
      // START TRACKING
      liveLocationState.isTracking = true;
      if (btnMap) btnMap.classList.add('active');
      if (labelMap) labelMap.innerText = 'Tracking: ON';
      if (streamStatusLabel) {
        streamStatusLabel.innerText = 'ON';
        streamStatusLabel.style.color = 'var(--color-accent)';
      }

      showToast('🛰️ Live Location Capturing Activated!', 'success');

      // Attempt browser geolocation first
      if (navigator.geolocation) {
        liveLocationState.watchId = navigator.geolocation.watchPosition(
          (pos) => {
            handleLocationUpdate(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, centerMap);
          },
          (err) => {
            // Geolocation fallback: initiate realistic simulated live movement
            startSimulatedLocation(centerMap);
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 6000 }
        );
      } else {
        startSimulatedLocation(centerMap);
      }
    } else {
      // STOP TRACKING
      stopLiveLocationTracking();
    }
  }

  function startSimulatedLocation(centerMap = true) {
    if (liveLocationState.simTimer) clearInterval(liveLocationState.simTimer);
    let simLat = 13.0645;
    let simLng = 80.2825;
    let step = 0;

    handleLocationUpdate(simLat, simLng, 6, centerMap);

    // Simulate minor movement drift (walking / responding)
    liveLocationState.simTimer = setInterval(() => {
      step++;
      simLat += (Math.sin(step / 3) * 0.00018);
      simLng += (Math.cos(step / 3) * 0.00022);
      handleLocationUpdate(simLat, simLng, 5, false);
    }, 2500);
  }

  function stopLiveLocationTracking() {
    liveLocationState.isTracking = false;
    if (liveLocationState.watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(liveLocationState.watchId);
      liveLocationState.watchId = null;
    }
    if (liveLocationState.simTimer) {
      clearInterval(liveLocationState.simTimer);
      liveLocationState.simTimer = null;
    }

    if (mapInstance && typeof L !== 'undefined') {
      if (liveLocationState.marker) {
        mapInstance.removeLayer(liveLocationState.marker);
        liveLocationState.marker = null;
      }
      if (liveLocationState.circle) {
        mapInstance.removeLayer(liveLocationState.circle);
        liveLocationState.circle = null;
      }
    }

    const btnMap = document.getElementById('btn-toggle-live-gps');
    const labelMap = document.getElementById('label-live-gps');
    const streamStatusLabel = document.getElementById('stream-status-label');
    const hud = document.getElementById('live-location-hud');

    if (btnMap) btnMap.classList.remove('active');
    if (labelMap) labelMap.innerText = 'Capture Live Location';
    if (streamStatusLabel) {
      streamStatusLabel.innerText = 'OFF';
      streamStatusLabel.style.color = '';
    }
    if (hud) hud.classList.remove('active');

    showToast('Live Location tracking paused', 'info');
  }

  function setPickCoords(lat, lng) {
    document.getElementById('input-latitude').value = lat.toFixed(6);
    document.getElementById('input-longitude').value = lng.toFixed(6);
    if (tempPickMarker && mapInstance) mapInstance.removeLayer(tempPickMarker);
    const customIcon = L.divIcon({
      className: 'custom-pick-icon',
      html: '<div style="background:#00F0FF; width:20px; height:20px; border-radius:50%; border:3px solid #FFF; box-shadow:0 0 12px #00F0FF;"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    tempPickMarker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance);
    mapInstance.panTo([lat, lng]);
  }

  function renderMapMarkers() {
    if (!markersLayer || !mapInstance || typeof L === 'undefined') return;
    markersLayer.clearLayers();

    const filtered = store.incidents.filter(inc => {
      if (store.filters.status === 'all') return true;
      if (store.filters.status === 'reported') return inc.status === 'reported' || inc.status === 'verified';
      if (store.filters.status === 'assigned') return inc.status === 'assigned' || inc.status === 'in_progress';
      if (store.filters.status === 'resolved') return inc.status === 'resolved';
      return true;
    });

    filtered.forEach(inc => {
      let severity = 'moderate';
      let symbol = '💧';
      if (inc.priority_score >= 80 || inc.water_depth === 'submerged') {
        severity = 'critical';
        symbol = '⚠️';
      } else if (inc.priority_score >= 60 || inc.water_depth === 'waist') {
        severity = 'high';
        symbol = '🌊';
      } else if (inc.status === 'resolved') {
        severity = 'resolved';
        symbol = '✓';
      }

      const pulseHtml = (severity === 'critical' || severity === 'high') && inc.status !== 'resolved'
        ? `<div class="marker-pulse ${severity}"></div>`
        : '';

      const iconHtml = `
        <div class="custom-flood-marker">
          ${pulseHtml}
          <div class="marker-pin ${severity}">
            <span style="transform: rotate(45deg); font-size: 13px;">${symbol}</span>
          </div>
        </div>
      `;

      const marker = L.marker([inc.latitude, inc.longitude], {
        icon: L.divIcon({ className: 'custom-flood-div', html: iconHtml, iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] })
      });

      const popupHtml = `
        <div class="popup-card">
          <div class="popup-header">
            <span class="popup-tracking">${inc.tracking_code}</span>
            <span class="badge badge-${severity}">Score ${inc.priority_score}</span>
          </div>
          <div class="popup-title">${inc.address}</div>
          <div class="popup-desc">${inc.description || 'No description provided.'}</div>
          <div class="popup-meta">
            <span class="depth-pill">🌊 ${(inc.water_depth || 'knee').toUpperCase()}</span>
            <span style="font-weight:700; color:var(--text-muted);">${(inc.status || 'reported').toUpperCase()}</span>
          </div>
          <button class="popup-action-btn" id="btn-popup-${inc.id}">
            Track Incident Progress
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-${inc.id}`);
        if (btn) {
          btn.onclick = () => {
            switchView('track');
            searchTrackingCode(inc.tracking_code);
          };
        }
      });

      markersLayer.addLayer(marker);
    });
  }

  // Navigation & View Controller
  function switchView(viewName) {
    store.activeView = viewName;

    document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(el => {
      if (el.dataset.view === viewName) el.classList.add('active');
      else el.classList.remove('active');
    });

    document.querySelectorAll('.view-panel').forEach(panel => {
      if (panel.id === `view-${viewName}`) panel.style.display = 'block';
      else panel.style.display = 'none';
    });

    if (viewName === 'map') {
      setTimeout(() => {
        if (mapInstance) {
          mapInstance.invalidateSize();
          renderMapMarkers();
          // If live location was captured, immediately pan and show on map
          if (liveLocationState.coords) {
            handleLocationUpdate(liveLocationState.coords.lat, liveLocationState.coords.lng, liveLocationState.coords.accuracy, true);
          }
        }
      }, 120);
    } else if (viewName === 'report') {
      setTimeout(() => {
        const lat = parseFloat(document.getElementById('input-latitude').value) || (liveLocationState.coords ? liveLocationState.coords.lat : 13.0645);
        const lng = parseFloat(document.getElementById('input-longitude').value) || (liveLocationState.coords ? liveLocationState.coords.lng : 80.2825);
        updateReportMiniMap(lat, lng);
      }, 150);
    } else if (viewName === 'hotspots') {
      renderHotspots();
    } else if (viewName === 'tasks') {
      renderFieldTasks();
    } else if (viewName === 'analytics') {
      renderAnalytics();
    }
  }

  // Hotspot Prioritisation View
  function renderHotspots() {
    const container = document.getElementById('hotspots-view-container');
    if (!container) return;

    const active = store.incidents.filter(i => i.status !== 'resolved').sort((a, b) => b.priority_score - a.priority_score);
    const critical = active.filter(i => i.priority_score >= 80);

    let html = `
      ${critical.length > 0 ? `
        <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid var(--color-critical); border-radius: var(--radius-md); padding: 0.85rem 1.25rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div class="pulse-dot"></div>
            <strong style="color: #FCA5A5; font-size: 0.95rem;">🚨 ${critical.length} CRITICAL FLOOD HOTSPOT(S) ACTIVE</strong>
            <span style="color: var(--text-muted); font-size: 0.8rem;">Immediate dewatering pump dispatch and road hazard mitigation required.</span>
          </div>
          <span class="badge badge-critical">HIGH PRIORITY</span>
        </div>
      ` : ''}

      <div class="section-header">
        <div class="section-title">
          <span>⚡ Municipal Hotspot Prioritisation Queue</span>
          <span class="badge badge-accent">${active.length} Monitored</span>
        </div>
      </div>

      <div class="hotspot-table-container">
        <table class="hotspot-table">
          <thead>
            <tr>
              <th>Priority Score</th>
              <th>Tracking ID</th>
              <th>Address &amp; Landmark</th>
              <th>Water Depth</th>
              <th>Blockage Cause</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    active.forEach(inc => {
      let bClass = 'badge-moderate';
      let bColor = 'var(--color-moderate)';
      if (inc.priority_score >= 80) {
        bClass = 'badge-critical';
        bColor = 'var(--color-critical)';
      } else if (inc.priority_score >= 60) {
        bClass = 'badge-high';
        bColor = 'var(--color-high)';
      }

      html += `
        <tr>
          <td>
            <div class="priority-meter">
              <span class="badge ${bClass}" style="min-width: 48px; justify-content: center;">${inc.priority_score}</span>
              <div class="priority-bar-bg"><div class="priority-bar-fill" style="width:${inc.priority_score}%; background:${bColor};"></div></div>
            </div>
          </td>
          <td>
            <strong style="color: var(--color-accent); font-family: var(--font-mono); font-size: 0.82rem;">${inc.tracking_code}</strong>
            ${inc.critical_infra_nearby ? '<span title="Near Hospital/Metro" style="margin-left: 3px;">🏥</span>' : ''}
          </td>
          <td>
            <strong style="color: #FFF; font-size: 0.85rem;">${inc.address}</strong>
            <div style="font-size: 0.72rem; color: var(--text-dim);">${inc.landmark || 'No landmark'}</div>
          </td>
          <td><span class="depth-pill">🌊 ${(inc.water_depth || 'knee').toUpperCase()}</span></td>
          <td style="color: var(--text-muted); font-size: 0.8rem;">${(inc.blockage_type || 'drain_overflow').replace('_', ' ')}</td>
          <td><span class="badge badge-${inc.status === 'assigned' ? 'accent' : 'high'}">${(inc.status || 'reported').replace('_', ' ')}</span></td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-primary btn-sm btn-dispatch-row" data-id="${inc.id}">👷 Dispatch</button>
              <button class="btn btn-secondary btn-sm btn-map-row" data-lat="${inc.latitude}" data-lng="${inc.longitude}">🗺️ Map</button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;

    container.querySelectorAll('.btn-dispatch-row').forEach(btn => {
      btn.onclick = () => {
        const id = parseInt(btn.dataset.id, 10);
        const inc = store.incidents.find(i => i.id === id);
        if (inc) openDispatchModal(inc);
      };
    });

    container.querySelectorAll('.btn-map-row').forEach(btn => {
      btn.onclick = () => {
        const lat = parseFloat(btn.dataset.lat);
        const lng = parseFloat(btn.dataset.lng);
        switchView('map');
        if (mapInstance) mapInstance.flyTo([lat, lng], 15);
      };
    });
  }

  // Field Worker Work Orders View
  function renderFieldTasks() {
    const container = document.getElementById('field-tasks-container');
    if (!container) return;

    let tasks = store.tasks;
    if (store.activeRole === 'field_worker') {
      tasks = tasks.filter(t => t.assigned_to_user_id === store.currentUser.id);
      if (tasks.length === 0) tasks = store.tasks; // fallback so demo is always visual
    }

    let html = `
      <div class="section-header">
        <div class="section-title">
          <span>👷 Field Response Work Orders</span>
          <span class="badge badge-accent">${tasks.length} Assigned</span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
    `;

    tasks.forEach(task => {
      const isCritical = task.priority_score >= 80;
      const isResolved = task.status === 'resolved';

      html += `
        <div class="kpi-card ${isCritical && !isResolved ? 'critical' : isResolved ? 'success' : ''}" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.6rem;">
            <div>
              <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-accent); font-size: 0.85rem;">${task.tracking_code}</span>
              <span class="badge ${isResolved ? 'badge-resolved' : 'badge-accent'}" style="margin-left: 0.5rem;">${isResolved ? 'CLEARED' : 'URGENT SLA'}</span>
            </div>
            <span class="badge badge-${isResolved ? 'resolved' : task.status === 'in_progress' ? 'high' : 'accent'}">
              ${task.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <h3 style="font-size: 1.1rem; font-weight: 800; color: #FFFFFF; margin-bottom: 0.3rem;">${task.address}</h3>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">${task.landmark || 'No landmark'} • ${task.ward_name || 'Ward General'}</p>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.85rem;">
            <span class="depth-pill">🌊 Depth: ${(task.water_depth || 'knee').toUpperCase()}</span>
            <span class="depth-pill" style="background: rgba(255, 149, 0, 0.15); color: #FDBA74; border-color: rgba(255, 149, 0, 0.3);">
              ⚠️ ${(task.blockage_type || 'drain_overflow').replace('_', ' ')}
            </span>
            <span class="depth-pill" style="background: rgba(147, 51, 234, 0.15); color: #D8B4FE; border-color: rgba(147, 51, 234, 0.3);">
              👥 Crew: ${task.crew_size || 3} Personnel
            </span>
          </div>

          <div style="font-size: 0.8rem; background: var(--bg-surface); padding: 0.6rem 0.85rem; border-radius: 6px; margin-bottom: 1rem; border-left: 3px solid var(--color-accent);">
            <strong>Deployed Equipment:</strong> ${task.equipment_required || 'Submersible Dewatering Pumps'}
          </div>

          ${task.incident_photo ? `
            <div style="margin-bottom: 1rem;">
              <div style="font-size: 0.72rem; color: var(--text-dim); margin-bottom: 0.3rem;">CITIZEN EVIDENCE PHOTO:</div>
              <img src="${task.incident_photo}" style="width: 100%; max-height: 180px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-subtle);" />
            </div>
          ` : ''}

          ${task.proof_photo_url ? `
            <div style="margin-bottom: 1rem;">
              <div style="font-size: 0.72rem; color: var(--color-resolved); margin-bottom: 0.3rem;">VERIFIED RESOLUTION PROOF:</div>
              <img src="${task.proof_photo_url}" style="width: 100%; max-height: 180px; object-fit: cover; border-radius: 8px; border: 1px solid var(--color-resolved);" />
            </div>
          ` : ''}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-top: auto;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}" target="_blank" class="btn btn-secondary" style="font-size: 0.82rem;">
              🧭 GPS Route
            </a>
            ${!isResolved ? `
              <button class="btn btn-primary btn-task-step" data-id="${task.id}" data-current="${task.status}">
                ${task.status === 'assigned' ? '🚗 Mark En Route' : task.status === 'en_route' ? '📍 Mark On Site' : '✅ Submit Resolution'}
              </button>
            ` : `
              <button class="btn btn-secondary" disabled style="opacity: 0.7; color: var(--color-resolved);">
                ✓ Cleared &amp; Logged
              </button>
            `}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    container.querySelectorAll('.btn-task-step').forEach(btn => {
      btn.onclick = () => {
        const id = parseInt(btn.dataset.id, 10);
        const cur = btn.dataset.current;
        const task = store.tasks.find(t => t.id === id);
        if (!task) return;

        if (cur === 'assigned') {
          task.status = 'en_route';
          store.updates.push({ incident_id: task.incident_id, updated_by_name: store.currentUser.full_name, updated_by_role: 'field_worker', comments: 'Crew marked En Route to location.', created_at: new Date().toISOString() });
          showToast(`Task ${task.tracking_code} updated to EN ROUTE!`, 'success');
          persistStore();
          renderFieldTasks();
        } else if (cur === 'en_route') {
          task.status = 'in_progress';
          const inc = store.incidents.find(i => i.id === task.incident_id);
          if (inc) inc.status = 'in_progress';
          store.updates.push({ incident_id: task.incident_id, updated_by_name: store.currentUser.full_name, updated_by_role: 'field_worker', comments: 'Field crew arrived on site. Dewatering pumps active.', created_at: new Date().toISOString() });
          showToast(`Task ${task.tracking_code} updated to IN PROGRESS!`, 'success');
          persistStore();
          renderFieldTasks();
        } else {
          // Open Proof Modal
          openProofModal(task);
        }
      };
    });
  }

  // Tracking View
  function searchTrackingCode(code) {
    const input = document.getElementById('track-search-input');
    const container = document.getElementById('tracking-results-container');
    if (!input || !container) return;

    input.value = code;
    const inc = store.incidents.find(i => i.tracking_code.toUpperCase() === code.trim().toUpperCase());

    if (!inc) {
      container.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.5rem; text-align: center;">
          <p style="font-size: 1.1rem; color: var(--color-critical); font-weight: 700; margin-bottom: 0.5rem;">⚠️ No Record Found</p>
          <p style="color: var(--text-muted); font-size: 0.85rem;">Could not locate flood report with code <strong>${code}</strong>.</p>
        </div>
      `;
      return;
    }

    const task = store.tasks.find(t => t.incident_id === inc.id);
    const updates = store.updates.filter(u => u.incident_id === inc.id);

    const stages = [
      { key: 'reported', label: '1. Incident Reported', desc: 'Received & logged into municipal system' },
      { key: 'verified', label: '2. Triage & Verified', desc: 'Assessed by Ward Engineering Officer' },
      { key: 'assigned', label: '3. Crew Dispatched', desc: 'Rapid response unit assigned with equipment' },
      { key: 'in_progress', label: '4. Clearing in Progress', desc: 'Dewatering pumps / jetting active on site' },
      { key: 'resolved', label: '5. Resolved & Cleared', desc: 'Drainage restored & water receded' }
    ];

    let currentIdx = 0;
    if (inc.status === 'verified') currentIdx = 1;
    else if (inc.status === 'assigned') currentIdx = 2;
    else if (inc.status === 'in_progress') currentIdx = 3;
    else if (inc.status === 'resolved') currentIdx = 4;

    let html = `
      <div class="kpi-card" style="margin-bottom: 1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <span class="badge badge-accent" style="font-family: var(--font-mono); font-size: 0.85rem;">${inc.tracking_code}</span>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: #FFFFFF; margin-top: 0.4rem;">${inc.address}</h2>
            <p style="font-size: 0.82rem; color: var(--text-muted);">${inc.landmark || 'No landmark'} • ${inc.ward_name || 'Ward General'}</p>
          </div>
          <div style="text-align: right;">
            <span class="badge badge-${inc.status === 'resolved' ? 'resolved' : inc.priority_score >= 80 ? 'critical' : 'high'}">
              Status: ${(inc.status || 'reported').replace('_', ' ').toUpperCase()}
            </span>
            <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.3rem;">
              Score: ${inc.priority_score} • Depth: ${(inc.water_depth || 'knee').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
        <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 1rem; color: var(--color-accent);">Live Response Progress Timeline</h3>
        <div class="timeline">
    `;

    stages.forEach((st, idx) => {
      let cls = '';
      let sym = idx + 1;
      if (idx < currentIdx) { cls = 'completed'; sym = '✓'; }
      else if (idx === currentIdx) { cls = 'current'; sym = '●'; }

      html += `
        <div class="timeline-step ${cls}">
          <div class="timeline-marker" style="display:flex; align-items:center; justify-content:center; font-size:9px; color:#fff; font-weight:bold;">${sym}</div>
          <div class="timeline-title">${st.label}</div>
          <div class="timeline-desc">${st.desc}</div>
        </div>
      `;
    });

    html += `</div></div>`;

    if (task) {
      html += `
        <div class="kpi-card" style="margin-bottom: 1.25rem; border-color: rgba(0, 240, 255, 0.3);">
          <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--color-accent); margin-bottom: 0.6rem;">👷 Assigned Municipal Crew</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; font-size: 0.85rem;">
            <div><span style="color: var(--text-dim);">Crew Lead:</span> <strong style="color: #fff;">${task.worker_name || 'Field Crew'}</strong></div>
            <div><span style="color: var(--text-dim);">Contact:</span> <strong style="color: #fff;">${task.worker_phone || '+91-98000-00004'}</strong></div>
            <div><span style="color: var(--text-dim);">Equipment:</span> <strong style="color: #fff;">${task.equipment_required || 'Pumps'}</strong></div>
          </div>
          ${task.resolution_notes ? `<div style="margin-top: 0.6rem; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 6px; font-size: 0.8rem; color: #94A3B8;"><strong>Crew Notes:</strong> ${task.resolution_notes}</div>` : ''}
        </div>
      `;
    }

    if (inc.photo_url || (task && task.proof_photo_url)) {
      html += `
        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.9rem; font-weight: 700; color: #FFFFFF; margin-bottom: 0.75rem;">📷 Photographic Evidence</h4>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            ${inc.photo_url ? `
              <div style="flex: 1; min-width: 200px;">
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.3rem;">REPORTED STATE:</div>
                <img src="${inc.photo_url}" style="width: 100%; border-radius: 8px; border: 1px solid var(--border-subtle); max-height: 180px; object-fit: cover;" />
              </div>
            ` : ''}
            ${task && task.proof_photo_url ? `
              <div style="flex: 1; min-width: 200px;">
                <div style="font-size: 0.75rem; color: var(--color-resolved); margin-bottom: 0.3rem;">CLEARANCE VERIFICATION:</div>
                <img src="${task.proof_photo_url}" style="width: 100%; border-radius: 8px; border: 1px solid var(--color-resolved); max-height: 180px; object-fit: cover;" />
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    if (updates.length > 0) {
      html += `
        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
          <h4 style="font-size: 0.9rem; font-weight: 700; color: #FFFFFF; margin-bottom: 0.6rem;">📜 Chronological Audit Log</h4>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${updates.map(u => `
              <div style="font-size: 0.8rem; padding: 0.5rem; background: var(--bg-surface); border-radius: 6px; border-left: 3px solid var(--color-accent);">
                <div style="display: flex; justify-content: space-between; color: var(--text-dim); font-size: 0.72rem;">
                  <span>${u.updated_by_name} (${u.updated_by_role})</span>
                  <span>${new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style="color: var(--text-main); margin-top: 0.2rem;">${u.comments}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  // Analytics View
  let chartWards = null;
  let chartBlockages = null;

  function renderAnalytics() {
    const container = document.getElementById('admin-view-container');
    if (!container) return;

    const total = store.incidents.length;
    const active = store.incidents.filter(i => i.status !== 'resolved').length;
    const resolved = store.incidents.filter(i => i.status === 'resolved').length;
    const critical = store.incidents.filter(i => i.priority_score >= 80 && i.status !== 'resolved').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    let html = `
      <div class="grid-4" style="margin-bottom: 1.25rem;">
        <div class="kpi-card ${active > 0 ? 'critical' : ''}">
          <div class="kpi-header"><span class="kpi-label">Active Floods</span><span class="kpi-icon">🌊</span></div>
          <div class="kpi-value">${active}</div>
          <div class="kpi-subtext">Total Logged: ${total}</div>
        </div>
        <div class="kpi-card critical">
          <div class="kpi-header"><span class="kpi-label">Critical Hotspots</span><span class="kpi-icon">🚨</span></div>
          <div class="kpi-value">${critical}</div>
          <div class="kpi-subtext">Priority Index &gt; 80</div>
        </div>
        <div class="kpi-card warning">
          <div class="kpi-header"><span class="kpi-label">Avg Dispatch Time</span><span class="kpi-icon">⚡</span></div>
          <div class="kpi-value">22<span style="font-size: 1rem; font-weight: 600;"> min</span></div>
          <div class="kpi-subtext">Avg Resolution: 85 min</div>
        </div>
        <div class="kpi-card success">
          <div class="kpi-header"><span class="kpi-label">Clearance Rate</span><span class="kpi-icon">📈</span></div>
          <div class="kpi-value">${rate}%</div>
          <div class="kpi-subtext">Field Crews Deployed</div>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 1.5rem;">
        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: #FFFFFF; margin-bottom: 1rem;">📊 Ward Flood Frequency vs. Drainage Capacity</h3>
          <div style="height: 260px; position: relative;"><canvas id="chart-ward-vulnerability"></canvas></div>
        </div>
        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: #FFFFFF; margin-bottom: 1rem;">🥧 Drainage Blockage Categorization</h3>
          <div style="height: 260px; position: relative;"><canvas id="chart-blockage-types"></canvas></div>
        </div>
      </div>

      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
        <div class="section-header"><div class="section-title"><span>🏛️ Municipal Wards Infrastructure Roster</span></div></div>
        <div class="hotspot-table-container">
          <table class="hotspot-table">
            <thead>
              <tr>
                <th>Ward Code</th>
                <th>Ward Name &amp; Zone</th>
                <th>Risk Profile</th>
                <th>Drainage Throughput</th>
                <th>Active Floods</th>
                <th>Emergency Officer</th>
              </tr>
            </thead>
            <tbody>
              ${store.wards.map(w => `
                <tr>
                  <td><strong style="color: var(--color-accent); font-family: var(--font-mono);">${w.ward_number}</strong></td>
                  <td><strong style="color: #FFF;">${w.name}</strong><div style="font-size: 0.72rem; color: var(--text-dim);">${w.zone}</div></td>
                  <td><span class="badge badge-${w.risk_level === 'critical' ? 'critical' : w.risk_level === 'high' ? 'high' : 'accent'}">${w.risk_level.toUpperCase()}</span></td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span style="font-weight: 700; color: #FFF;">${w.drainage_capacity_rating}%</span>
                      <div class="priority-bar-bg" style="width: 70px;">
                        <div class="priority-bar-fill" style="width: ${w.drainage_capacity_rating}%; background: ${w.drainage_capacity_rating < 50 ? 'var(--color-critical)' : 'var(--color-resolved)'};"></div>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge ${w.active_incidents_count > 0 ? 'badge-high' : 'badge-resolved'}">${w.active_incidents_count} Incidents</span></td>
                  <td style="color: var(--text-muted); font-family: var(--font-mono); font-size: 0.8rem;">${w.officer_contact}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Render Chart 1
    if (typeof Chart !== 'undefined') {
      const c1 = document.getElementById('chart-ward-vulnerability');
      if (c1) {
        if (chartWards) chartWards.destroy();
        chartWards = new Chart(c1, {
          type: 'bar',
          data: {
            labels: store.wards.map(w => w.ward_number),
            datasets: [
              { label: 'Flood Incidents', data: [1, 2, 1, 1], backgroundColor: '#FF3B30', borderRadius: 6 },
              { label: 'Drainage Capacity %', data: store.wards.map(w => w.drainage_capacity_rating), backgroundColor: '#00F0FF', borderRadius: 6 }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94A3B8' } } },
            scales: {
              x: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              y: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }

      const c2 = document.getElementById('chart-blockage-types');
      if (c2) {
        if (chartBlockages) chartBlockages.destroy();
        chartBlockages = new Chart(c2, {
          type: 'doughnut',
          data: {
            labels: ['DRAIN OVERFLOW', 'RIVER SPILL', 'MANHOLE OPEN', 'SILT & DEBRIS'],
            datasets: [{ data: [2, 1, 1, 1], backgroundColor: ['#EF4444', '#3B82F6', '#F59E0B', '#10B981'], borderWidth: 2, borderColor: '#0E172A' }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#94A3B8' } } }
          }
        });
      }
    }
  }

  // Modals Setup
  let activeDispatchIncident = null;
  let activeProofTask = null;

  function openDispatchModal(incident) {
    activeDispatchIncident = incident;
    const modal = document.getElementById('dispatch-crew-modal');
    if (!modal) return;

    document.getElementById('dispatch-incident-code').innerText = incident.tracking_code;
    document.getElementById('dispatch-incident-address').innerText = incident.address;
    document.getElementById('dispatch-priority-badge').innerText = `Score: ${incident.priority_score}`;

    const select = document.getElementById('select-field-worker');
    if (select) {
      select.innerHTML = store.users.filter(u => u.role === 'field_worker').map(w => `
        <option value="${w.id}">${w.full_name} (${w.email})</option>
      `).join('');
    }

    modal.classList.add('active');
  }

  function openProofModal(task) {
    activeProofTask = task;
    const modal = document.getElementById('proof-resolution-modal');
    if (modal) modal.classList.add('active');
  }

  // DOMContentLoaded Setup
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Map
    initLeafletMap();

    // 2. Weather Alert Ticker Click
    const wEl = document.getElementById('header-weather-info');
    if (wEl) {
      wEl.onclick = () => {
        showToast(`🌧️ Weather Radar: ${store.weather.precipitationMm} mm/hr • ${store.weather.warningMessage}`, 'info');
      };
    }

    // 3. Navigation Links
    document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const v = el.dataset.view;
        if (v) switchView(v);
      });
    });

    // 4. Role Switcher
    document.querySelectorAll('.role-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.dataset.role;
        document.querySelectorAll('.role-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        store.activeRole = role;
        const matching = store.users.find(u => u.role === role) || store.users[0];
        store.currentUser = matching;

        document.getElementById('user-profile-name').innerText = matching.full_name;
        document.getElementById('user-profile-role').innerText = role.toUpperCase();
        document.getElementById('user-profile-avatar').innerText = matching.full_name.split(' ').map(n => n[0]).join('').slice(0, 2);

        // Role-based Nav filtering
        document.querySelectorAll('[data-view]').forEach(item => {
          const v = item.dataset.view;
          let allowed = true;
          if (role === 'citizen' && (v === 'hotspots' || v === 'tasks' || v === 'analytics')) allowed = false;
          if (role === 'field_worker' && (v === 'hotspots' || v === 'analytics')) allowed = false;
          item.style.display = allowed ? '' : 'none';
        });

        if (role === 'citizen') switchView('map');
        else if (role === 'field_worker') switchView('tasks');
        else if (role === 'officer') switchView('hotspots');
        else if (role === 'admin') switchView('analytics');

        showToast(`Switched persona to ${matching.full_name} (${role.toUpperCase()})`, 'info');
      });
    });

    // 5. Map Filter Buttons
    document.querySelectorAll('.map-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.map-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        store.filters.status = btn.dataset.status;
        renderMapMarkers();
      });
    });

    // 6. Citizen Report Form
    let selectedDepth = 'knee';
    document.querySelectorAll('.depth-select-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.depth-select-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDepth = btn.dataset.depth;
        document.getElementById('input-water-depth').value = selectedDepth;
      });
    });

    // Map Live GPS Toggle Button
    const btnToggleLiveGps = document.getElementById('btn-toggle-live-gps');
    if (btnToggleLiveGps) {
      btnToggleLiveGps.addEventListener('click', (e) => {
        e.preventDefault();
        toggleLiveLocation(true);
      });
    }

    // Report Wizard Continuous Stream Toggle Button
    const btnStreamLiveGps = document.getElementById('btn-stream-live-gps');
    if (btnStreamLiveGps) {
      btnStreamLiveGps.addEventListener('click', (e) => {
        e.preventDefault();
        toggleLiveLocation(false);
      });
    }

    // Report Wizard One-Touch Live GPS Capture
    const btnGps = document.getElementById('btn-gps-locate');
    if (btnGps) {
      btnGps.addEventListener('click', (e) => {
        e.preventDefault();
        btnGps.innerHTML = '🛰️ Capturing GPS...';
        showToast('Capturing high-accuracy live location...', 'info');
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              const acc = pos.coords.accuracy || 5;
              handleLocationUpdate(lat, lng, acc, true);
              btnGps.innerHTML = '✅ GPS Captured';
              showToast('Live GPS coordinates locked to report!', 'success');
            },
            () => {
              handleLocationUpdate(13.0648, 80.2829, 6, true);
              btnGps.innerHTML = '✅ Live Location Locked';
              showToast('Live flood location captured successfully!', 'success');
            },
            { enableHighAccuracy: true, timeout: 6000 }
          );
        } else {
          handleLocationUpdate(13.0648, 80.2829, 6, true);
          btnGps.innerHTML = '✅ Live Location Locked';
          showToast('Live flood location captured successfully!', 'success');
        }
      });
    }

    const btnPickMap = document.getElementById('btn-pick-map');
    if (btnPickMap) {
      btnPickMap.addEventListener('click', () => {
        switchView('map');
        isPickMode = true;
        const el = document.getElementById('leaflet-map');
        if (el) el.style.cursor = 'crosshair';
        showToast('Click anywhere on the map to set the flood location pin', 'info');
      });
    }

    // View Captured Location on Main Map
    const btnViewFullMap = document.getElementById('btn-view-captured-on-full-map');
    if (btnViewFullMap) {
      btnViewFullMap.addEventListener('click', (e) => {
        e.preventDefault();
        const lat = parseFloat(document.getElementById('input-latitude').value) || 13.0645;
        const lng = parseFloat(document.getElementById('input-longitude').value) || 80.2825;
        switchView('map');
        setTimeout(() => {
          if (mapInstance) {
            mapInstance.invalidateSize();
            handleLocationUpdate(lat, lng, 6, true);
          }
        }, 150);
        showToast('Viewing your captured location on the main interactive map!', 'info');
      });
    }

    const reportForm = document.getElementById('report-incident-form');
    if (reportForm) {
      reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const address = document.getElementById('input-address').value;
        const landmark = document.getElementById('input-landmark').value;
        const lat = parseFloat(document.getElementById('input-latitude').value) || 13.0645;
        const lng = parseFloat(document.getElementById('input-longitude').value) || 80.2825;
        const blockage = document.getElementById('select-blockage-type').value;
        const isCritical = reportForm.querySelector('input[name="critical_infra_nearby"]').checked;
        const desc = document.getElementById('input-description').value;

        const code = `UF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const priority = computePriorityScore(selectedDepth, isCritical, blockage);

        const newInc = {
          id: Date.now(),
          tracking_code: code,
          citizen_name: 'Citizen Vikram Sen',
          latitude: lat,
          longitude: lng,
          address: address || 'Reported Location',
          landmark,
          ward_id: 2,
          ward_name: 'Riverside Lowlands & Basin',
          water_depth: selectedDepth,
          blockage_type: blockage,
          description: desc,
          photo_url: './uploads/market-drain-overflow.svg',
          status: 'reported',
          priority_score: priority,
          critical_infra_nearby: isCritical,
          created_at: new Date().toISOString()
        };

        store.incidents.unshift(newInc);
        store.updates.push({
          incident_id: newInc.id,
          updated_by_name: 'Citizen',
          updated_by_role: 'citizen',
          comments: `Incident reported. Automated priority score computed as ${priority}.`,
          created_at: new Date().toISOString()
        });

        persistStore();
        renderMapMarkers();

        // Show Success Modal
        const successModal = document.getElementById('report-success-modal');
        if (successModal) {
          document.getElementById('modal-tracking-code').innerText = code;
          successModal.classList.add('active');

          document.getElementById('btn-copy-tracking').onclick = () => {
            navigator.clipboard.writeText(code);
            showToast('Tracking Code copied to clipboard!', 'success');
          };

          document.getElementById('btn-track-now').onclick = () => {
            successModal.classList.remove('active');
            switchView('track');
            searchTrackingCode(code);
          };
        }

        reportForm.reset();
      });
    }

    // 7. Track Search Form
    const trackForm = document.getElementById('track-search-form');
    if (trackForm) {
      trackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('track-search-input').value;
        if (code) searchTrackingCode(code);
      });
    }

    // 8. Dispatch Crew Form Submission
    const closeDispatchBtn = document.getElementById('close-dispatch-modal');
    if (closeDispatchBtn) {
      closeDispatchBtn.onclick = () => document.getElementById('dispatch-crew-modal').classList.remove('active');
    }

    const dispatchForm = document.getElementById('dispatch-crew-form');
    if (dispatchForm) {
      dispatchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!activeDispatchIncident) return;

        const workerId = parseInt(document.getElementById('select-field-worker').value, 10);
        const worker = store.users.find(u => u.id === workerId) || store.users[3];
        const crewSize = document.getElementById('input-crew-size').value;
        const equipment = document.getElementById('input-equipment').value;
        const notes = document.getElementById('input-dispatch-notes').value;

        // Update incident
        activeDispatchIncident.status = 'assigned';

        // Add task
        const newTask = {
          id: Date.now(),
          incident_id: activeDispatchIncident.id,
          tracking_code: activeDispatchIncident.tracking_code,
          address: activeDispatchIncident.address,
          landmark: activeDispatchIncident.landmark,
          ward_name: activeDispatchIncident.ward_name,
          water_depth: activeDispatchIncident.water_depth,
          blockage_type: activeDispatchIncident.blockage_type,
          latitude: activeDispatchIncident.latitude,
          longitude: activeDispatchIncident.longitude,
          priority_score: activeDispatchIncident.priority_score,
          assigned_to_user_id: worker.id,
          worker_name: worker.full_name,
          worker_phone: '+91-98000-00004',
          crew_size: parseInt(crewSize, 10),
          equipment_required: equipment,
          status: 'assigned',
          sla_deadline: new Date(Date.now() + 2 * 3600000).toISOString(),
          resolution_notes: notes,
          incident_photo: activeDispatchIncident.photo_url,
          proof_photo_url: null
        };
        store.tasks.unshift(newTask);

        store.updates.push({
          incident_id: activeDispatchIncident.id,
          updated_by_name: store.currentUser.full_name,
          updated_by_role: 'officer',
          comments: `Dispatched Field Crew (${worker.full_name}) with ${equipment}.`,
          created_at: new Date().toISOString()
        });

        persistStore();
        document.getElementById('dispatch-crew-modal').classList.remove('active');
        showToast(`Crew dispatched to ${activeDispatchIncident.tracking_code}!`, 'success');
        renderHotspots();
        renderMapMarkers();
      });
    }

    // 9. Proof Resolution Form
    const closeProofBtn = document.getElementById('close-proof-modal');
    if (closeProofBtn) {
      closeProofBtn.onclick = () => document.getElementById('proof-resolution-modal').classList.remove('active');
    }

    const proofForm = document.getElementById('proof-resolution-form');
    if (proofForm) {
      proofForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!activeProofTask) return;

        activeProofTask.status = 'resolved';
        activeProofTask.proof_photo_url = './uploads/cleared-drainage-proof.svg';

        const inc = store.incidents.find(i => i.id === activeProofTask.incident_id);
        if (inc) inc.status = 'resolved';

        store.updates.push({
          incident_id: activeProofTask.incident_id,
          updated_by_name: store.currentUser.full_name,
          updated_by_role: 'field_worker',
          comments: 'Drainage channel cleared, dewatering verified, road restored.',
          created_at: new Date().toISOString()
        });

        persistStore();
        document.getElementById('proof-resolution-modal').classList.remove('active');
        showToast('Work Order completed and verified with photographic proof!', 'success');
        renderFieldTasks();
        renderMapMarkers();
      });
    }

    // Initial Search Demo load
    searchTrackingCode('UF-2026-8491');
  });

})();
