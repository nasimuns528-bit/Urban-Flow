/**
 * UrbanFlow Municipal Administrator Analytics & Resilience Overview
 * Powered by Chart.js
 */

import { api } from '../api.js';

let chartInstance1 = null;
let chartInstance2 = null;

export async function renderAdminAnalytics(containerId = 'admin-view-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
      <div class="pulse-dot" style="margin: 0 auto 0.75rem auto;"></div>
      Loading Municipal Resilience Telemetry &amp; MySQL 8 Analytics...
    </div>
  `;

  try {
    const [overviewRes, chartsRes, wardsRes] = await Promise.all([
      api.getAnalyticsOverview(),
      api.getAnalyticsCharts(),
      api.getWards()
    ]);

    const m = overviewRes.metrics || {};
    const charts = chartsRes || {};
    const wards = wardsRes.wards || [];

    let html = `
      <!-- KPI Top Row -->
      <div class="grid-4" style="margin-bottom: 1.25rem;">
        <div class="kpi-card ${m.criticalHotspots > 0 ? 'critical' : ''}">
          <div class="kpi-header">
            <span class="kpi-label">Active Flood Incidents</span>
            <span class="kpi-icon">🌊</span>
          </div>
          <div class="kpi-value">${m.activeIncidents || 0}</div>
          <div class="kpi-subtext">Total Logged: ${m.totalIncidents || 0}</div>
        </div>

        <div class="kpi-card critical">
          <div class="kpi-header">
            <span class="kpi-label">Critical Hotspots</span>
            <span class="kpi-icon">🚨</span>
          </div>
          <div class="kpi-value">${m.criticalHotspots || 0}</div>
          <div class="kpi-subtext">Priority Index &gt; 80 / Submerged</div>
        </div>

        <div class="kpi-card warning">
          <div class="kpi-header">
            <span class="kpi-label">Avg Crew Dispatch</span>
            <span class="kpi-icon">⚡</span>
          </div>
          <div class="kpi-value">${m.avgDispatchMinutes || 20}<span style="font-size: 1rem; font-weight: 600;"> min</span></div>
          <div class="kpi-subtext">Avg Resolution: ${m.avgResolutionMinutes || 85} min</div>
        </div>

        <div class="kpi-card success">
          <div class="kpi-header">
            <span class="kpi-label">Clearance Rate</span>
            <span class="kpi-icon">📈</span>
          </div>
          <div class="kpi-value">${m.resolutionRatePercent || 0}%</div>
          <div class="kpi-subtext">${m.deployedWorkers || 0} of ${m.totalWorkers || 0} Crews Deployed</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid-2" style="margin-bottom: 1.5rem;">
        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: #FFFFFF; margin-bottom: 1rem;">
            📊 Ward Flood Frequency vs. Drainage Capacity Rating
          </h3>
          <div style="height: 260px; position: relative;">
            <canvas id="chart-ward-vulnerability"></canvas>
          </div>
        </div>

        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: #FFFFFF; margin-bottom: 1rem;">
            🥧 Drainage Blockage Categorization
          </h3>
          <div style="height: 260px; position: relative;">
            <canvas id="chart-blockage-types"></canvas>
          </div>
        </div>
      </div>

      <!-- Municipal Wards Table -->
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
        <div class="section-header">
          <div class="section-title">
            <span>🏛️ Municipal Wards &amp; Drainage Infrastructure Status</span>
          </div>
        </div>
        <div class="hotspot-table-container">
          <table class="hotspot-table">
            <thead>
              <tr>
                <th>Ward Code</th>
                <th>Ward Name &amp; Zone</th>
                <th>Risk Profile</th>
                <th>Drainage Throughput Capacity</th>
                <th>Active Floods</th>
                <th>Emergency Officer Contact</th>
              </tr>
            </thead>
            <tbody>
              ${wards.map(w => `
                <tr>
                  <td><strong style="color: var(--color-accent); font-family: var(--font-mono);">${w.ward_number}</strong></td>
                  <td>
                    <strong style="color: #FFFFFF;">${escapeHtml(w.name)}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-dim);">${escapeHtml(w.zone)}</div>
                  </td>
                  <td>
                    <span class="badge badge-${w.risk_level === 'critical' ? 'critical' : w.risk_level === 'high' ? 'high' : 'accent'}">
                      ${w.risk_level.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span style="font-weight: 700; color: #FFFFFF;">${w.drainage_capacity_rating}%</span>
                      <div class="priority-bar-bg" style="width: 80px;">
                        <div class="priority-bar-fill" style="width: ${w.drainage_capacity_rating}%; background: ${w.drainage_capacity_rating < 50 ? 'var(--color-critical)' : 'var(--color-resolved)'};"></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge ${w.active_incidents_count > 0 ? 'badge-high' : 'badge-resolved'}">
                      ${w.active_incidents_count || 0} Incidents
                    </span>
                  </td>
                  <td style="color: var(--text-muted); font-family: var(--font-mono); font-size: 0.8rem;">
                    ${w.officer_contact || 'N/A'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Build Chart 1: Ward Vulnerability Bar Chart
    buildWardChart(charts.wardVulnerability || []);

    // Build Chart 2: Blockage Types Doughnut
    buildBlockageChart(charts.blockageTypeDistribution || []);
  } catch (err) {
    console.error('Analytics error:', err);
    container.innerHTML = `
      <div style="color: var(--color-critical); padding: 1.5rem; text-align: center;">
        Failed to load analytics datasets.
      </div>
    `;
  }
}

function buildWardChart(wardData) {
  const canvas = document.getElementById('chart-ward-vulnerability');
  if (!canvas || typeof Chart === 'undefined') return;

  if (chartInstance1) chartInstance1.destroy();

  const labels = wardData.map(item => item.ward_number || item.ward_name);
  const incidents = wardData.map(item => item.incident_count || 0);
  const capacity = wardData.map(item => item.drainage_capacity_rating || 50);

  chartInstance1 = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Flood Incidents',
          data: incidents,
          backgroundColor: '#FF3B30',
          borderRadius: 6
        },
        {
          label: 'Drainage Capacity %',
          data: capacity,
          backgroundColor: '#00F0FF',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#94A3B8', font: { family: 'Plus Jakarta Sans', size: 11 } }
        }
      },
      scales: {
        x: {
          ticks: { color: '#64748B' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        },
        y: {
          ticks: { color: '#64748B' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        }
      }
    }
  });
}

function buildBlockageChart(blockageData) {
  const canvas = document.getElementById('chart-blockage-types');
  if (!canvas || typeof Chart === 'undefined') return;

  if (chartInstance2) chartInstance2.destroy();

  const labels = blockageData.map(item => (item.blockage_type || 'other').replace('_', ' ').toUpperCase());
  const counts = blockageData.map(item => item.count || 0);

  chartInstance2 = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: counts,
          backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'],
          borderWidth: 2,
          borderColor: '#0E172A'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#94A3B8', font: { family: 'Plus Jakarta Sans', size: 11 } }
        }
      }
    }
  });
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
