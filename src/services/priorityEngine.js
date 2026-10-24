/**
 * UrbanFlow Hotspot Prioritisation Engine
 * 
 * Computes an objective risk & priority score (0 - 100) combining:
 * 1. Water Depth Severity (Weight: 35%)
 * 2. Critical Infrastructure Proximity (Weight: 25%)
 * 3. Precipitation & Rain Warning Factor (Weight: 20%)
 * 4. Incident Urgency & Age Escalation (Weight: 20%)
 */

export function calculatePriorityScore({
  waterDepth,
  criticalInfraNearby = false,
  rainIntensityMm = 25, // default moderate downpour mm/hr
  createdAt = new Date(),
  blockageType = 'drain_overflow'
}) {
  // 1. Water Depth Factor (0 - 35 points)
  let depthScore = 10;
  switch (waterDepth) {
    case 'submerged':
      depthScore = 35; // Vehicles stranded / impassable
      break;
    case 'waist':
      depthScore = 28; // Dangerous pedestrian current
      break;
    case 'knee':
      depthScore = 18; // Curb flooded, sidewalk compromised
      break;
    case 'ankle':
      depthScore = 8;  // Minor standing water
      break;
    default:
      depthScore = 10;
  }

  // 2. Critical Infrastructure Factor (0 - 25 points)
  let infraScore = criticalInfraNearby ? 25 : 5;
  // If manhole is open, add extra safety hazard penalty
  if (blockageType === 'manhole_open') {
    infraScore = Math.min(25, infraScore + 10);
  }

  // 3. Rain Forecast Factor (0 - 20 points)
  // Higher mm/hr precipitation increases overflow velocity
  let rainScore = 5;
  if (rainIntensityMm >= 50) {
    rainScore = 20; // Extreme torrential downpour
  } else if (rainIntensityMm >= 30) {
    rainScore = 15; // Heavy rain
  } else if (rainIntensityMm >= 15) {
    rainScore = 10; // Moderate rain
  } else {
    rainScore = 5;
  }

  // 4. Age Escalation Factor (0 - 20 points)
  // Older unresolved incidents get higher priority over time
  const now = new Date();
  const created = new Date(createdAt);
  const ageInHours = Math.max(0, (now.getTime() - created.getTime()) / (1000 * 60 * 60));
  
  let ageScore = 5;
  if (ageInHours >= 4) {
    ageScore = 20; // Breached initial target window
  } else if (ageInHours >= 2) {
    ageScore = 15;
  } else if (ageInHours >= 1) {
    ageScore = 10;
  } else {
    ageScore = 5;
  }

  const totalScore = Math.min(100, Math.round((depthScore + infraScore + rainScore + ageScore) * 10) / 10);
  return totalScore;
}

/**
 * Cluster analysis: Finds groups of incidents within a given radius (km)
 */
export function clusterIncidents(incidents, radiusKm = 0.5) {
  const clusters = [];
  const visited = new Set();

  function distance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  for (let i = 0; i < incidents.length; i++) {
    if (visited.has(incidents[i].id)) continue;

    const clusterGroup = [incidents[i]];
    visited.add(incidents[i].id);

    for (let j = i + 1; j < incidents.length; j++) {
      if (visited.has(incidents[j].id)) continue;
      const dist = distance(
        parseFloat(incidents[i].latitude),
        parseFloat(incidents[i].longitude),
        parseFloat(incidents[j].latitude),
        parseFloat(incidents[j].longitude)
      );

      if (dist <= radiusKm) {
        clusterGroup.push(incidents[j]);
        visited.add(incidents[j].id);
      }
    }

    const avgLat = clusterGroup.reduce((sum, item) => sum + parseFloat(item.latitude), 0) / clusterGroup.length;
    const avgLng = clusterGroup.reduce((sum, item) => sum + parseFloat(item.longitude), 0) / clusterGroup.length;
    const maxPriority = Math.max(...clusterGroup.map(item => item.priority_score || 0));

    clusters.push({
      clusterId: `cluster-${i + 1}`,
      incidentCount: clusterGroup.length,
      centerLat: avgLat,
      centerLng: avgLng,
      maxPriority,
      severity: maxPriority >= 80 ? 'critical' : maxPriority >= 60 ? 'high' : 'moderate',
      incidents: clusterGroup
    });
  }

  return clusters;
}
