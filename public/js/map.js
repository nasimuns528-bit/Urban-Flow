/**
 * UrbanFlow Interactive Geospatial Map Manager
 * Powered by Leaflet & CartoDB Dark Matter
 */

import { getState, setState } from './state.js';

let mapInstance = null;
let markersLayer = null;
let isPickLocationMode = false;
let locationPickCallback = null;
let tempPickMarker = null;

export function initMap(elementId = 'leaflet-map') {
  const container = document.getElementById(elementId);
  if (!container) return null;

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  // Centered on urban flood region (Chennai coastal coordinates default from seed data)
  const defaultCenter = [13.0645, 80.2707];
  const defaultZoom = 13;

  mapInstance = L.map(elementId, {
    zoomControl: false,
    attributionControl: false
  }).setView(defaultCenter, defaultZoom);

  // Add zoom control top-right
  L.control.zoom({ position: 'topright' }).addTo(mapInstance);

  // CartoDB Dark Matter Tiles for sleek municipal command center aesthetic
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(mapInstance);

  markersLayer = L.layerGroup().addTo(mapInstance);

  // Click on map listener for report coordinate picking
  mapInstance.on('click', (e) => {
    if (isPickLocationMode && locationPickCallback) {
      const { lat, lng } = e.latlng;
      setTempPickMarker(lat, lng);
      locationPickCallback(lat, lng);
    }
  });

  return mapInstance;
}

export function setPickLocationMode(enabled, callback = null) {
  isPickLocationMode = enabled;
  locationPickCallback = callback;
  const mapElement = document.getElementById('leaflet-map');
  if (mapElement) {
    mapElement.style.cursor = enabled ? 'crosshair' : 'default';
  }
}

export function setTempPickMarker(lat, lng) {
  if (!mapInstance) return;
  if (tempPickMarker) {
    mapInstance.removeLayer(tempPickMarker);
  }
  const customIcon = L.divIcon({
    className: 'custom-pick-icon',
    html: `
      <div style="background:#00F0FF; width:22px; height:22px; border-radius:50%; border:3px solid #FFFFFF; box-shadow:0 0 15px #00F0FF; display:flex; align-items:center; justify-content:center;">
        <div style="width:6px; height:6px; background:#070B18; border-radius:50%;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
  tempPickMarker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance);
  mapInstance.panTo([lat, lng]);
}

export function renderIncidentMarkers(incidents, onSelectIncident = null) {
  if (!markersLayer || !mapInstance) return;
  markersLayer.clearLayers();

  if (!incidents || incidents.length === 0) return;

  incidents.forEach(inc => {
    const lat = parseFloat(inc.latitude);
    const lng = parseFloat(inc.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    // Severity styling
    let severityClass = 'moderate';
    let iconChar = '💧';
    if (inc.priority_score >= 80 || inc.water_depth === 'submerged') {
      severityClass = 'critical';
      iconChar = '⚠️';
    } else if (inc.priority_score >= 60 || inc.water_depth === 'waist') {
      severityClass = 'high';
      iconChar = '🌊';
    } else if (inc.status === 'resolved') {
      severityClass = 'resolved';
      iconChar = '✓';
    }

    const pulseHtml = (severityClass === 'critical' || severityClass === 'high') && inc.status !== 'resolved'
      ? `<div class="marker-pulse ${severityClass}"></div>`
      : '';

    const iconHtml = `
      <div class="custom-flood-marker">
        ${pulseHtml}
        <div class="marker-pin ${severityClass}">
          <span style="transform: rotate(45deg); font-size: 13px;">${iconChar}</span>
        </div>
      </div>
    `;

    const markerIcon = L.divIcon({
      className: 'flood-div-icon',
      html: iconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    const marker = L.marker([lat, lng], { icon: markerIcon });

    // Popup content
    const depthFormatted = (inc.water_depth || 'knee').toUpperCase();
    const statusFormatted = (inc.status || 'reported').replace('_', ' ').toUpperCase();

    const popupHtml = `
      <div class="popup-card">
        <div class="popup-header">
          <span class="popup-tracking">${inc.tracking_code}</span>
          <span class="badge badge-${severityClass}">Score ${inc.priority_score}</span>
        </div>
        <div class="popup-title">${escapeHtml(inc.address)}</div>
        <div class="popup-desc">${escapeHtml(inc.description || 'No additional details provided.')}</div>
        <div class="popup-meta">
          <span class="depth-pill">🌊 Depth: ${depthFormatted}</span>
          <span style="font-weight:700; color:var(--text-muted);">${statusFormatted}</span>
        </div>
        <button class="popup-action-btn" id="btn-popup-${inc.id}">
          View Full Incident Details
        </button>
      </div>
    `;

    marker.bindPopup(popupHtml);

    marker.on('popupopen', () => {
      const btn = document.getElementById(`btn-popup-${inc.id}`);
      if (btn && onSelectIncident) {
        btn.onclick = () => onSelectIncident(inc);
      }
    });

    markersLayer.addLayer(marker);
  });
}

export function flyToLocation(lat, lng, zoom = 15) {
  if (mapInstance) {
    mapInstance.flyTo([lat, lng], zoom, {
      duration: 1.2
    });
  }
}

let userLiveMarker = null;
let userAccuracyCircle = null;

export function updateUserLiveMarker(lat, lng, accuracy = 10, centerMap = false) {
  if (!mapInstance || typeof L === 'undefined') return;

  if (!userLiveMarker) {
    const liveIcon = L.divIcon({
      className: 'custom-live-marker',
      html: '<div class="user-live-marker-container"><div class="user-live-pulse"></div><div class="user-live-core"></div></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    userLiveMarker = L.marker([lat, lng], { icon: liveIcon, zIndexOffset: 1000 }).addTo(mapInstance);
  } else {
    userLiveMarker.setLatLng([lat, lng]);
  }

  if (!userAccuracyCircle) {
    userAccuracyCircle = L.circle([lat, lng], {
      radius: Math.max(accuracy, 25),
      color: '#00F0FF',
      fillColor: '#00F0FF',
      fillOpacity: 0.12,
      weight: 1.5
    }).addTo(mapInstance);
  } else {
    userAccuracyCircle.setLatLng([lat, lng]);
    userAccuracyCircle.setRadius(Math.max(accuracy, 25));
  }

  if (centerMap) {
    mapInstance.flyTo([lat, lng], 15, { duration: 1 });
  }
}

export function removeUserLiveMarker() {
  if (!mapInstance) return;
  if (userLiveMarker) {
    mapInstance.removeLayer(userLiveMarker);
    userLiveMarker = null;
  }
  if (userAccuracyCircle) {
    mapInstance.removeLayer(userAccuracyCircle);
    userAccuracyCircle = null;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
