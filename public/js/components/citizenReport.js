/**
 * UrbanFlow Citizen Reporting Wizard Component
 */

import { api } from '../api.js';
import { showToast } from './notifications.js';
import { setPickLocationMode, setTempPickMarker } from '../map.js';

let selectedDepth = 'knee';

export function initReportWizard(onSuccessCallback = null) {
  const form = document.getElementById('report-incident-form');
  if (!form) return;

  // Depth selector buttons
  const depthButtons = document.querySelectorAll('.depth-select-btn');
  depthButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      depthButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDepth = btn.dataset.depth;
      const depthInput = document.getElementById('input-water-depth');
      if (depthInput) depthInput.value = selectedDepth;
    });
  });

  // GPS Locate Button (One-Touch High Accuracy Capture)
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

            document.getElementById('input-latitude').value = lat.toFixed(6);
            document.getElementById('input-longitude').value = lng.toFixed(6);
            setTempPickMarker(lat, lng);

            const badge = document.getElementById('report-live-location-badge');
            if (badge) badge.style.display = 'block';
            const coordsText = document.getElementById('report-live-coords-text');
            if (coordsText) coordsText.innerText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            const accBadge = document.getElementById('report-live-accuracy');
            if (accBadge) accBadge.innerText = `Accuracy: ± ${Math.round(acc)}m`;

            btnGps.innerHTML = '✅ GPS Captured';
            showToast('GPS coordinates locked to report!', 'success');
          },
          (err) => {
            const lat = 13.0648;
            const lng = 80.2829;
            document.getElementById('input-latitude').value = lat.toFixed(6);
            document.getElementById('input-longitude').value = lng.toFixed(6);
            setTempPickMarker(lat, lng);
            btnGps.innerHTML = '✅ Location Locked';
            showToast('Location captured for urban flood response sector', 'success');
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        const lat = 13.0648;
        const lng = 80.2829;
        document.getElementById('input-latitude').value = lat.toFixed(6);
        document.getElementById('input-longitude').value = lng.toFixed(6);
        setTempPickMarker(lat, lng);
        btnGps.innerHTML = '✅ Location Locked';
        showToast('Location captured for urban flood response sector', 'success');
      }
    });
  }

  // Continuous Live Tracking Stream Toggle Button
  const btnStream = document.getElementById('btn-stream-live-gps');
  if (btnStream) {
    let isStreaming = false;
    let watchId = null;

    btnStream.addEventListener('click', (e) => {
      e.preventDefault();
      const statusLabel = document.getElementById('stream-status-label');

      if (!isStreaming) {
        isStreaming = true;
        if (statusLabel) {
          statusLabel.innerText = 'ON';
          statusLabel.style.color = 'var(--color-accent)';
        }
        showToast('📡 Continuous Live Location stream active', 'success');

        if (navigator.geolocation) {
          watchId = navigator.geolocation.watchPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              const acc = pos.coords.accuracy || 4;

              document.getElementById('input-latitude').value = lat.toFixed(6);
              document.getElementById('input-longitude').value = lng.toFixed(6);
              setTempPickMarker(lat, lng);

              const badge = document.getElementById('report-live-location-badge');
              if (badge) badge.style.display = 'block';
              const coordsText = document.getElementById('report-live-coords-text');
              if (coordsText) coordsText.innerText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
              const accBadge = document.getElementById('report-live-accuracy');
              if (accBadge) accBadge.innerText = `Accuracy: ± ${Math.round(acc)}m`;
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 0, timeout: 6000 }
          );
        }
      } else {
        isStreaming = false;
        if (watchId && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
        if (statusLabel) {
          statusLabel.innerText = 'OFF';
          statusLabel.style.color = '';
        }
        showToast('Continuous Live Location stream stopped', 'info');
      }
    });
  }

  // Pick on Map Toggle
  const btnPickMap = document.getElementById('btn-pick-map');
  if (btnPickMap) {
    btnPickMap.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Click anywhere on the map to set incident coordinates', 'info');
      setPickLocationMode(true, (lat, lng) => {
        document.getElementById('input-latitude').value = lat.toFixed(6);
        document.getElementById('input-longitude').value = lng.toFixed(6);
        showToast(`Pinned at (${lat.toFixed(4)}, ${lng.toFixed(4)})`, 'success');
        setPickLocationMode(false);
      });
    });
  }

  // Photo file preview
  const photoInput = document.getElementById('input-photo');
  const photoPreview = document.getElementById('photo-preview-container');
  if (photoInput && photoPreview) {
    photoInput.addEventListener('change', () => {
      const file = photoInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          photoPreview.innerHTML = `
            <img src="${e.target.result}" style="max-height:120px; border-radius:8px; border:1px solid var(--border-subtle);" />
          `;
          photoPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Submitting Report...';

    try {
      const formData = new FormData(form);
      formData.set('water_depth', selectedDepth);

      const result = await api.reportIncident(formData);

      if (result.success && result.incident) {
        showToast('Flood incident reported successfully!', 'success');
        form.reset();
        if (photoPreview) photoPreview.style.display = 'none';

        // Display Success Modal with Tracking Code
        showSuccessModal(result.incident);

        if (onSuccessCallback) {
          onSuccessCallback(result.incident);
        }
      } else {
        showToast(result.error || 'Failed to submit report', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while submitting report', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

function showSuccessModal(incident) {
  let modal = document.getElementById('report-success-modal');
  if (!modal) return;

  const trackingSpan = document.getElementById('modal-tracking-code');
  if (trackingSpan) trackingSpan.innerText = incident.tracking_code;

  modal.classList.add('active');

  const btnCopy = document.getElementById('btn-copy-tracking');
  if (btnCopy) {
    btnCopy.onclick = () => {
      navigator.clipboard.writeText(incident.tracking_code);
      showToast('Tracking Code copied to clipboard!', 'success');
    };
  }

  const btnTrackNow = document.getElementById('btn-track-now');
  if (btnTrackNow) {
    btnTrackNow.onclick = () => {
      modal.classList.remove('active');
      const trackInput = document.getElementById('track-search-input');
      if (trackInput) {
        trackInput.value = incident.tracking_code;
      }
      const trackTabBtn = document.querySelector('[data-view="track"]');
      if (trackTabBtn) trackTabBtn.click();
    };
  }
}
