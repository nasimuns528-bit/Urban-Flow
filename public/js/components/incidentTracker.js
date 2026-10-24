/**
 * UrbanFlow Incident Status Tracker Component
 * Real-time 5-stage progress timeline for citizens
 */

import { api } from '../api.js';
import { showToast } from './notifications.js';

export function initIncidentTracker() {
  const form = document.getElementById('track-search-form');
  const input = document.getElementById('track-search-input');
  const resultsContainer = document.getElementById('tracking-results-container');

  if (!form || !input || !resultsContainer) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = input.value.trim().toUpperCase();
    if (!code) {
      showToast('Please enter a tracking code (e.g., UF-2026-8491)', 'error');
      return;
    }

    resultsContainer.innerHTML = `
      <div style="text-align:center; padding: 2rem; color: var(--text-muted);">
        <div class="pulse-dot" style="margin: 0 auto 0.75rem auto;"></div>
        Querying municipal dispatch network for <strong>${code}</strong>...
      </div>
    `;

    try {
      const res = await api.trackIncident(code);
      if (res.success && res.incident) {
        renderTrackingResult(res.incident, res.timeline, res.task, resultsContainer);
      } else {
        resultsContainer.innerHTML = `
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.5rem; text-align: center;">
            <p style="font-size: 1.1rem; color: var(--color-critical); font-weight: 700; margin-bottom: 0.5rem;">⚠️ No Record Found</p>
            <p style="color: var(--text-muted); font-size: 0.85rem;">We could not locate any active or archived flood report with code <strong>${code}</strong>.</p>
            <p style="color: var(--text-dim); font-size: 0.75rem; margin-top: 0.5rem;">Please check the code or try demo codes: <code>UF-2026-8491</code> or <code>UF-2026-8492</code></p>
          </div>
        `;
      }
    } catch (err) {
      console.error(err);
      resultsContainer.innerHTML = `
        <div style="color: var(--color-critical); padding: 1rem; text-align: center;">
          Failed to fetch tracking details. Please try again.
        </div>
      `;
    }
  });
}

export function searchIncidentCode(code) {
  const input = document.getElementById('track-search-input');
  const form = document.getElementById('track-search-form');
  if (input && form) {
    input.value = code;
    form.dispatchEvent(new Event('submit'));
  }
}

function renderTrackingResult(incident, timeline = [], task = null, container) {
  const stages = [
    { key: 'reported', label: '1. Incident Reported', desc: 'Received & logged into municipal system' },
    { key: 'verified', label: '2. Triage & Verified', desc: 'Assessed by Ward Engineering Officer' },
    { key: 'assigned', label: '3. Crew Dispatched', desc: 'Rapid response unit assigned with equipment' },
    { key: 'in_progress', label: '4. Clearing in Progress', desc: 'Dewatering pumps / jetting active on site' },
    { key: 'resolved', label: '5. Resolved & Cleared', desc: 'Drainage restored & water receded' }
  ];

  const currentStatusIndex = getStatusStageIndex(incident.status);

  let timelineHtml = `
    <div class="kpi-card" style="margin-bottom: 1.25rem;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
        <div>
          <span class="badge badge-accent" style="font-family: var(--font-mono); font-size: 0.85rem;">${incident.tracking_code}</span>
          <h2 style="font-size: 1.25rem; font-weight: 800; color: #FFFFFF; margin-top: 0.4rem;">${escapeHtml(incident.address)}</h2>
          <p style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(incident.landmark || 'No landmark specified')} • ${incident.ward_name || 'Ward General'}</p>
        </div>
        <div style="text-align: right;">
          <span class="badge badge-${incident.status === 'resolved' ? 'resolved' : incident.priority_score >= 80 ? 'critical' : 'high'}">
            Status: ${(incident.status || 'reported').replace('_', ' ').toUpperCase()}
          </span>
          <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.3rem;">
            Reported on: ${new Date(incident.created_at).toLocaleString()}
          </div>
        </div>
      </div>
    </div>

    <!-- 5-Stage Stepper -->
    <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
      <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 1rem; color: var(--color-accent);">Live Response Progress</h3>
      <div class="timeline">
  `;

  stages.forEach((stage, idx) => {
    let stepClass = '';
    let markerSymbol = idx + 1;

    if (idx < currentStatusIndex) {
      stepClass = 'completed';
      markerSymbol = '✓';
    } else if (idx === currentStatusIndex) {
      stepClass = 'current';
      markerSymbol = '●';
    }

    timelineHtml += `
      <div class="timeline-step ${stepClass}">
        <div class="timeline-marker" style="display:flex; align-items:center; justify-content:center; font-size:9px; color:#fff; font-weight:bold;">
          ${markerSymbol}
        </div>
        <div class="timeline-title">${stage.label}</div>
        <div class="timeline-desc">${stage.desc}</div>
      </div>
    `;
  });

  timelineHtml += `
      </div>
    </div>
  `;

  // Assigned Crew & Field Equipment Section
  if (task) {
    timelineHtml += `
      <div class="kpi-card" style="margin-bottom: 1.25rem; border-color: rgba(0, 240, 255, 0.3);">
        <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--color-accent); margin-bottom: 0.6rem;">👷 Assigned Municipal Crew</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; font-size: 0.85rem;">
          <div><span style="color: var(--text-dim);">Lead Crew Member:</span> <strong style="color: #fff;">${escapeHtml(task.worker_name || 'Assigned Crew')}</strong></div>
          <div><span style="color: var(--text-dim);">Crew Contact:</span> <strong style="color: #fff;">${escapeHtml(task.worker_phone || 'Municipal Dispatch')}</strong></div>
          <div><span style="color: var(--text-dim);">Crew Size:</span> <strong style="color: #fff;">${task.crew_size || 3} Personnel</strong></div>
          <div><span style="color: var(--text-dim);">Deployed Equipment:</span> <strong style="color: #fff;">${escapeHtml(task.equipment_required || 'Standard Dewatering Pumps')}</strong></div>
        </div>
        ${task.resolution_notes ? `<div style="margin-top: 0.75rem; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 6px; font-size: 0.8rem; color: #94A3B8;"><strong>Crew Notes:</strong> ${escapeHtml(task.resolution_notes)}</div>` : ''}
      </div>
    `;
  }

  // Photos (Before & After)
  if (incident.photo_url || (task && task.proof_photo_url)) {
    timelineHtml += `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.9rem; font-weight: 700; color: #FFFFFF; margin-bottom: 0.75rem;">📷 Photographic Evidence & Verification</h4>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          ${incident.photo_url ? `
            <div style="flex: 1; min-width: 220px;">
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.3rem;">REPORTED FLOOD STATE:</div>
              <img src="${incident.photo_url}" style="width: 100%; border-radius: 8px; border: 1px solid var(--border-subtle); max-height: 200px; object-fit: cover;" />
            </div>
          ` : ''}
          ${task && task.proof_photo_url ? `
            <div style="flex: 1; min-width: 220px;">
              <div style="font-size: 0.75rem; color: var(--color-resolved); margin-bottom: 0.3rem;">CLEARANCE VERIFICATION PROOF:</div>
              <img src="${task.proof_photo_url}" style="width: 100%; border-radius: 8px; border: 1px solid var(--color-resolved); max-height: 200px; object-fit: cover;" />
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Chronological updates log
  if (timeline.length > 0) {
    timelineHtml += `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
        <h4 style="font-size: 0.9rem; font-weight: 700; color: #FFFFFF; margin-bottom: 0.6rem;">📜 Chronological Audit & Activity Log</h4>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${timeline.map(item => `
            <div style="font-size: 0.8rem; padding: 0.5rem; background: var(--bg-surface); border-radius: 6px; border-left: 3px solid var(--color-accent);">
              <div style="display: flex; justify-content: space-between; color: var(--text-dim); font-size: 0.72rem;">
                <span>${item.updated_by_name || 'System / Citizen'} (${item.updated_by_role || 'Reporter'})</span>
                <span>${new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style="color: var(--text-main); margin-top: 0.2rem;">${escapeHtml(item.comments)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = timelineHtml;
}

function getStatusStageIndex(status) {
  switch (status) {
    case 'reported': return 0;
    case 'verified': return 1;
    case 'assigned': return 2;
    case 'in_progress': return 3;
    case 'resolved':
    case 'closed': return 4;
    default: return 0;
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
