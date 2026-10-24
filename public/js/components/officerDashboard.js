/**
 * UrbanFlow Municipal Officer & Hotspot Triage Component
 */

import { api } from '../api.js';
import { showToast } from './notifications.js';
import { flyToLocation } from '../map.js';

let availableWorkers = [];
let currentIncidentForDispatch = null;
let currentIncidentForTriage = null;

export async function initOfficerDashboard(onDataUpdated = null) {
  await loadAvailableWorkers();
  setupDispatchModal(onDataUpdated);
  setupTriageModal(onDataUpdated);
}

async function loadAvailableWorkers() {
  try {
    const res = await api.getFieldWorkers();
    if (res.success) {
      availableWorkers = res.workers || [];
    }
  } catch (e) {
    console.error('Failed to load workers:', e);
  }
}

export function renderHotspotsView(hotspotsData, containerId = 'hotspots-view-container', onViewOnMap = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!hotspotsData || !hotspotsData.hotspots || hotspotsData.hotspots.length === 0) {
    container.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 2rem; text-align: center; color: var(--text-muted);">
        ✨ No active flood hotspots requiring municipal dispatch! All monitored drainage sectors normal.
      </div>
    `;
    return;
  }

  const incidents = hotspotsData.hotspots;
  const criticalCount = hotspotsData.criticalCount || 0;

  let html = `
    <!-- Top Warning Ticker -->
    ${criticalCount > 0 ? `
      <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid var(--color-critical); border-radius: var(--radius-md); padding: 0.85rem 1.25rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <div class="pulse-dot"></div>
          <strong style="color: #FCA5A5; font-size: 0.95rem;">🚨 ${criticalCount} CRITICAL FLOOD HOTSPOT(S) DETECTED</strong>
          <span style="color: var(--text-muted); font-size: 0.8rem;">Immediate pump deployment and road hazard mitigation required.</span>
        </div>
        <span class="badge badge-critical">PRIORITY ESCALATED</span>
      </div>
    ` : ''}

    <div class="section-header">
      <div class="section-title">
        <span>⚡ Municipal Hotspot Prioritisation Queue</span>
        <span class="badge badge-accent">${incidents.length} Active Hotspots</span>
      </div>
    </div>

    <!-- Hotspot Table -->
    <div class="hotspot-table-container">
      <table class="hotspot-table">
        <thead>
          <tr>
            <th>Priority Index</th>
            <th>Tracking ID</th>
            <th>Location & Ward</th>
            <th>Depth Level</th>
            <th>Blockage Cause</th>
            <th>Status</th>
            <th>Dispatch Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  incidents.forEach(inc => {
    let priorityClass = 'badge-moderate';
    let barColor = 'var(--color-moderate)';
    if (inc.priority_score >= 80) {
      priorityClass = 'badge-critical';
      barColor = 'var(--color-critical)';
    } else if (inc.priority_score >= 60) {
      priorityClass = 'badge-high';
      barColor = 'var(--color-high)';
    }

    html += `
      <tr>
        <td>
          <div class="priority-meter">
            <span class="badge ${priorityClass}" style="min-width: 48px; justify-content: center;">
              ${inc.priority_score}
            </span>
            <div class="priority-bar-bg">
              <div class="priority-bar-fill" style="width: ${inc.priority_score}%; background: ${barColor};"></div>
            </div>
          </div>
        </td>
        <td>
          <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-accent); font-size: 0.8rem;">
            ${inc.tracking_code}
          </span>
          ${inc.critical_infra_nearby ? '<span title="Near Critical Hospital/Metro" style="font-size: 11px; margin-left: 3px;">🏥</span>' : ''}
        </td>
        <td>
          <strong style="color: #FFFFFF; font-size: 0.85rem; display: block;">${escapeHtml(inc.address)}</strong>
          <span style="color: var(--text-dim); font-size: 0.75rem;">${inc.ward_name || 'Ward General'}</span>
        </td>
        <td>
          <span class="depth-pill">🌊 ${(inc.water_depth || 'knee').toUpperCase()}</span>
        </td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">
          ${(inc.blockage_type || 'drain_overflow').replace('_', ' ')}
        </td>
        <td>
          <span class="badge badge-${inc.status === 'resolved' ? 'resolved' : inc.status === 'assigned' ? 'accent' : 'high'}">
            ${(inc.status || 'reported').replace('_', ' ')}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn btn-primary btn-sm btn-action-dispatch" data-id="${inc.id}">
              👷 Dispatch Crew
            </button>
            <button class="btn btn-secondary btn-sm btn-action-triage" data-id="${inc.id}">
              ⚖️ Triage
            </button>
            <button class="btn btn-secondary btn-sm btn-action-map" data-lat="${inc.latitude}" data-lng="${inc.longitude}">
              🗺️ Map
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;

  // Bind row action listeners
  container.querySelectorAll('.btn-action-dispatch').forEach(btn => {
    btn.onclick = () => {
      const incId = parseInt(btn.dataset.id, 10);
      const inc = incidents.find(item => item.id === incId);
      if (inc) openDispatchModal(inc);
    };
  });

  container.querySelectorAll('.btn-action-triage').forEach(btn => {
    btn.onclick = () => {
      const incId = parseInt(btn.dataset.id, 10);
      const inc = incidents.find(item => item.id === incId);
      if (inc) openTriageModal(inc);
    };
  });

  container.querySelectorAll('.btn-action-map').forEach(btn => {
    btn.onclick = () => {
      const lat = parseFloat(btn.dataset.lat);
      const lng = parseFloat(btn.dataset.lng);
      if (onViewOnMap) {
        onViewOnMap(lat, lng);
      } else {
        const mapTab = document.querySelector('[data-view="map"]');
        if (mapTab) mapTab.click();
        flyToLocation(lat, lng);
      }
    };
  });
}

function openDispatchModal(incident) {
  currentIncidentForDispatch = incident;
  const modal = document.getElementById('dispatch-crew-modal');
  if (!modal) return;

  document.getElementById('dispatch-incident-code').innerText = incident.tracking_code;
  document.getElementById('dispatch-incident-address').innerText = incident.address;
  document.getElementById('dispatch-priority-badge').innerText = `Priority Score: ${incident.priority_score}`;

  // Populate worker dropdown
  const workerSelect = document.getElementById('select-field-worker');
  if (workerSelect) {
    workerSelect.innerHTML = availableWorkers.map(w => `
      <option value="${w.id}">
        ${escapeHtml(w.full_name)} (${w.ward_name || 'General Crew'}) • Active Tasks: ${w.active_tasks_count || 0}
      </option>
    `).join('');
  }

  modal.classList.add('active');
}

function setupDispatchModal(onDataUpdated) {
  const modal = document.getElementById('dispatch-crew-modal');
  const form = document.getElementById('dispatch-crew-form');
  const closeBtn = document.getElementById('close-dispatch-modal');

  if (closeBtn && modal) {
    closeBtn.onclick = () => modal.classList.remove('active');
  }

  if (form && modal) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      if (!currentIncidentForDispatch) return;

      const workerId = document.getElementById('select-field-worker').value;
      const crewSize = document.getElementById('input-crew-size').value;
      const equipment = document.getElementById('input-equipment').value;
      const slaHours = document.getElementById('select-sla-hours').value;
      const notes = document.getElementById('input-dispatch-notes').value;

      try {
        const res = await api.assignTask({
          incident_id: currentIncidentForDispatch.id,
          assigned_to_user_id: parseInt(workerId, 10),
          crew_size: parseInt(crewSize, 10),
          equipment_required: equipment,
          sla_hours: parseInt(slaHours, 10),
          notes
        });

        if (res.success) {
          showToast(`Field Crew dispatched to ${currentIncidentForDispatch.tracking_code}!`, 'success');
          modal.classList.remove('active');
          if (onDataUpdated) onDataUpdated();
        } else {
          showToast(res.error || 'Failed to dispatch crew', 'error');
        }
      } catch (err) {
        showToast('Error dispatching task', 'error');
      }
    };
  }
}

function openTriageModal(incident) {
  currentIncidentForTriage = incident;
  const modal = document.getElementById('triage-modal');
  if (!modal) return;

  document.getElementById('triage-incident-code').innerText = incident.tracking_code;
  document.getElementById('select-triage-status').value = incident.status;
  document.getElementById('input-triage-priority').value = incident.priority_score;

  modal.classList.add('active');
}

function setupTriageModal(onDataUpdated) {
  const modal = document.getElementById('triage-modal');
  const form = document.getElementById('triage-form');
  const closeBtn = document.getElementById('close-triage-modal');

  if (closeBtn && modal) {
    closeBtn.onclick = () => modal.classList.remove('active');
  }

  if (form && modal) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      if (!currentIncidentForTriage) return;

      const status = document.getElementById('select-triage-status').value;
      const priority_score = document.getElementById('input-triage-priority').value;
      const notes = document.getElementById('input-triage-notes').value;

      try {
        const res = await api.triageIncident(currentIncidentForTriage.id, {
          status,
          priority_score: parseFloat(priority_score),
          notes
        });

        if (res.success) {
          showToast(`Incident ${currentIncidentForTriage.tracking_code} triaged!`, 'success');
          modal.classList.remove('active');
          if (onDataUpdated) onDataUpdated();
        } else {
          showToast(res.error || 'Failed to triage incident', 'error');
        }
      } catch (err) {
        showToast('Error during triage', 'error');
      }
    };
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
