/**
 * UrbanFlow Field Worker Mobile Dashboard
 * Touch-optimized for smartphones & tablets in stormy weather
 */

import { api } from '../api.js';
import { showToast } from './notifications.js';

let activeProofTaskId = null;

export function initFieldDashboard(onTaskUpdated = null) {
  setupProofModal(onTaskUpdated);
}

export function renderFieldTasks(tasks, containerId = 'field-tasks-container', onTaskUpdated = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!tasks || tasks.length === 0) {
    container.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 2.5rem; text-align: center; color: var(--text-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎉</div>
        <h3 style="color: #FFFFFF; font-size: 1.1rem; margin-bottom: 0.25rem;">No Pending Tasks Assigned</h3>
        <p style="font-size: 0.85rem;">All work orders are up to date. Stand by for municipal emergency dispatches.</p>
      </div>
    `;
    return;
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

    // SLA countdown calculation
    const deadline = new Date(task.sla_deadline);
    const now = new Date();
    const diffMin = Math.round((deadline - now) / 60000);
    let slaLabel = `${diffMin}m remaining`;
    let slaClass = 'badge-accent';
    if (diffMin <= 0) {
      slaLabel = `SLA BREACHED (+${Math.abs(diffMin)}m)`;
      slaClass = 'badge-critical';
    } else if (diffMin <= 30) {
      slaLabel = `URGENT (${diffMin}m left)`;
      slaClass = 'badge-high';
    }

    html += `
      <div class="kpi-card ${isCritical && !isResolved ? 'critical' : isResolved ? 'success' : ''}" style="padding: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.6rem;">
          <div>
            <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-accent); font-size: 0.85rem;">${task.tracking_code}</span>
            <span class="badge ${slaClass}" style="margin-left: 0.5rem;">${isResolved ? 'COMPLETED' : slaLabel}</span>
          </div>
          <span class="badge badge-${isResolved ? 'resolved' : task.status === 'in_progress' ? 'high' : 'accent'}">
            ${task.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <h3 style="font-size: 1.1rem; font-weight: 800; color: #FFFFFF; margin-bottom: 0.3rem;">${escapeHtml(task.address)}</h3>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          ${escapeHtml(task.landmark || 'No landmark')} • ${task.ward_name || 'Ward Area'}
        </p>

        <!-- Incident details pill row -->
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.85rem;">
          <span class="depth-pill">🌊 Depth: ${(task.water_depth || 'knee').toUpperCase()}</span>
          <span class="depth-pill" style="background: rgba(255, 149, 0, 0.15); color: #FDBA74; border-color: rgba(255, 149, 0, 0.3);">
            ⚠️ Cause: ${(task.blockage_type || 'drain_overflow').replace('_', ' ')}
          </span>
          <span class="depth-pill" style="background: rgba(147, 51, 234, 0.15); color: #D8B4FE; border-color: rgba(147, 51, 234, 0.3);">
            👥 Crew: ${task.crew_size || 3} Personnel
          </span>
        </div>

        <div style="font-size: 0.8rem; background: var(--bg-surface); padding: 0.6rem 0.85rem; border-radius: 6px; margin-bottom: 1rem; border-left: 3px solid var(--color-accent);">
          <strong>Required Equipment:</strong> ${escapeHtml(task.equipment_required || 'Standard submersible pumps')}
        </div>

        ${task.incident_photo ? `
          <div style="margin-bottom: 1rem;">
            <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.3rem;">CITIZEN REPORT PHOTO:</div>
            <img src="${task.incident_photo}" style="width: 100%; max-height: 180px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-subtle);" />
          </div>
        ` : ''}

        ${task.proof_photo_url ? `
          <div style="margin-bottom: 1rem;">
            <div style="font-size: 0.75rem; color: var(--color-resolved); margin-bottom: 0.3rem;">YOUR SUBMITTED RESOLUTION PROOF:</div>
            <img src="${task.proof_photo_url}" style="width: 100%; max-height: 180px; object-fit: cover; border-radius: 8px; border: 1px solid var(--color-resolved);" />
          </div>
        ` : ''}

        <!-- Touch-Friendly Field Actions -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-top: auto;">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}" target="_blank" class="btn btn-secondary" style="font-size: 0.82rem;">
            🧭 GPS Route
          </a>

          ${!isResolved ? `
            <button class="btn btn-primary btn-step-status" data-id="${task.id}" data-current="${task.status}">
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

  // Status button actions
  container.querySelectorAll('.btn-step-status').forEach(btn => {
    btn.onclick = async () => {
      const taskId = parseInt(btn.dataset.id, 10);
      const currentStatus = btn.dataset.current;

      if (currentStatus === 'assigned') {
        const formData = new FormData();
        formData.set('status', 'en_route');
        formData.set('notes', 'Field crew deployed and en route to incident location.');
        await updateTask(taskId, formData, onTaskUpdated);
      } else if (currentStatus === 'en_route') {
        const formData = new FormData();
        formData.set('status', 'on_site');
        formData.set('notes', 'Field crew arrived on site. Dewatering and unblocking active.');
        await updateTask(taskId, formData, onTaskUpdated);
      } else {
        // Open proof modal for final resolution
        openProofModal(taskId);
      }
    };
  });
}

async function updateTask(taskId, formData, callback) {
  try {
    const res = await api.updateTaskStatus(taskId, formData);
    if (res.success) {
      showToast(res.message || 'Status updated!', 'success');
      if (callback) callback();
    } else {
      showToast(res.error || 'Failed to update task', 'error');
    }
  } catch (err) {
    showToast('Network error while updating task', 'error');
  }
}

function openProofModal(taskId) {
  activeProofTaskId = taskId;
  const modal = document.getElementById('proof-resolution-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

function setupProofModal(onTaskUpdated) {
  const modal = document.getElementById('proof-resolution-modal');
  const form = document.getElementById('proof-resolution-form');
  const closeBtn = document.getElementById('close-proof-modal');

  if (closeBtn && modal) {
    closeBtn.onclick = () => modal.classList.remove('active');
  }

  if (form && modal) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      if (!activeProofTaskId) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Submitting Proof...';

      try {
        const formData = new FormData(form);
        formData.set('status', 'resolved');

        const res = await api.updateTaskStatus(activeProofTaskId, formData);
        if (res.success) {
          showToast('Task marked RESOLVED and proof verified!', 'success');
          modal.classList.remove('active');
          form.reset();
          if (onTaskUpdated) onTaskUpdated();
        } else {
          showToast(res.error || 'Failed to submit proof', 'error');
        }
      } catch (err) {
        showToast('Error uploading proof', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Complete &amp; Submit Proof';
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
