-- =============================================================================
-- UrbanFlow: Seed Data for MySQL 8.x
-- Default Demo Credentials Password for all users: "Password@123"
-- Bcrypt Hash: $2a$10$wT0lR7f394P0t3UeFqU4IuXqW.aH3a3F5hF9eQZ7zG6j4gG7QkSqm
-- =============================================================================

USE `urbanflow_db`;

-- 1. Insert Wards
INSERT INTO `wards` (`id`, `ward_number`, `name`, `zone`, `risk_level`, `center_lat`, `center_lng`, `drainage_capacity_rating`, `officer_contact`) VALUES
(1, 'WARD-14', 'Central Commercial District', 'Zone A - Downtown', 'high', 13.0827, 80.2707, 45, '+91-98401-11014'),
(2, 'WARD-22', 'Riverside Lowlands & Basin', 'Zone B - East Basin', 'critical', 13.0645, 80.2825, 30, '+91-98401-11022'),
(3, 'WARD-08', 'Metro Rail & IT Corridor', 'Zone C - South Corridor', 'moderate', 13.0102, 80.2158, 65, '+91-98401-11008'),
(4, 'WARD-31', 'Coastal Harbor & Fishermans Wharf', 'Zone D - Coastal', 'high', 13.1090, 80.2980, 50, '+91-98401-11031');

-- 2. Insert Users (Password: Password@123)
-- Hash generated using bcrypt (10 salt rounds) for "Password@123"
INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `role`, `phone`, `ward_id`, `is_active`) VALUES
(1, 'Commissioner Rajesh Varma', 'admin@urbanflow.gov', '$2a$10$gN4P5w93kK2K0qA8jVsm..Z3L1Y7uVpWpL2rK7fE6cE8wJ7qZ1a6e', 'admin', '+91-98000-00001', 1, TRUE),
(2, 'Chief Officer Ananya Iyer', 'officer.ananya@urbanflow.gov', '$2a$10$gN4P5w93kK2K0qA8jVsm..Z3L1Y7uVpWpL2rK7fE6cE8wJ7qZ1a6e', 'officer', '+91-98000-00002', 2, TRUE),
(3, 'Dispatch Engineer Marcus Lee', 'officer.marcus@urbanflow.gov', '$2a$10$gN4P5w93kK2K0qA8jVsm..Z3L1Y7uVpWpL2rK7fE6cE8wJ7qZ1a6e', 'officer', '+91-98000-00003', 1, TRUE),
(4, 'Lead Worker Ramesh Kumar', 'crew.ramesh@urbanflow.gov', '$2a$10$gN4P5w93kK2K0qA8jVsm..Z3L1Y7uVpWpL2rK7fE6cE8wJ7qZ1a6e', 'field_worker', '+91-98000-00004', 2, TRUE),
(5, 'Field Tech Priya Sundaram', 'crew.priya@urbanflow.gov', '$2a$10$gN4P5w93kK2K0qA8jVsm..Z3L1Y7uVpWpL2rK7fE6cE8wJ7qZ1a6e', 'field_worker', '+91-98000-00005', 1, TRUE),
(6, 'Citizen Vikram Sen', 'vikram.sen@example.com', '$2a$10$gN4P5w93kK2K0qA8jVsm..Z3L1Y7uVpWpL2rK7fE6cE8wJ7qZ1a6e', 'citizen', '+91-98000-00006', 2, TRUE);

-- 3. Insert Realistic Flood Incidents
INSERT INTO `incidents` (`id`, `tracking_code`, `citizen_name`, `citizen_phone`, `latitude`, `longitude`, `address`, `landmark`, `ward_id`, `water_depth`, `blockage_type`, `description`, `photo_url`, `status`, `priority_score`, `critical_infra_nearby`, `estimated_affected_people`, `reported_by_user_id`, `verified_by_user_id`, `created_at`) VALUES
(1, 'UF-2026-8491', 'Vikram Sen', '+91-98402-33441', 13.0648, 80.2829, 'Bridge Road, Beside General Hospital Subway', 'General Hospital Gate 4', 2, 'submerged', 'river_spill', 'Severe storm run-off overflowed culvert. Ambulances unable to access ER ramp. Water rising quickly.', '/uploads/hospital-subway-flood.svg', 'in_progress', 96.5, TRUE, 350, 6, 2, DATE_SUB(NOW(), INTERVAL 2 HOUR)),

(2, 'UF-2026-8492', 'Dr. Shalini Mehta', '+91-98405-77112', 13.0831, 80.2715, 'North Market Cross Road, Ward 14', 'Old Town Vegetable Market', 1, 'waist', 'drain_overflow', 'Storm drain inlet choked with plastic crates and silt. Market shops taking in water. Pedestrians stranded.', '/uploads/market-drain-overflow.svg', 'assigned', 84.0, FALSE, 200, NULL, 3, DATE_SUB(NOW(), INTERVAL 3 HOUR)),

(3, 'UF-2026-8493', 'Karthik Raja', '+91-98401-99882', 13.0110, 80.2165, 'Main Arterial Road & Metro Junction', 'Pillar 142 Near Metro Entrance', 3, 'knee', 'manhole_open', 'Heavy storm flow dislodged main manhole cover. High vehicle accident risk during downpour. Traffic crawling.', '/uploads/metro-manhole-hazard.svg', 'verified', 72.5, TRUE, 500, NULL, 2, DATE_SUB(NOW(), INTERVAL 1 HOUR)),

(4, 'UF-2026-8494', 'Fatima Banu', '+91-98408-22334', 13.1095, 80.2985, 'Port Access Bypass Lane 3', 'Wharf Gate 2', 4, 'ankle', 'silt_debris', 'Construction debris blocking storm gutter channel. Water accumulating on curbside.', '/uploads/wharf-silt-gutter.svg', 'reported', 41.0, FALSE, 40, NULL, NULL, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),

(5, 'UF-2026-8490', 'Gaurav K.', '+91-98403-44119', 13.0632, 80.2810, 'Canal Bank Colony, 2nd Cross', 'Near Community Hall', 2, 'waist', 'drain_overflow', 'Blocked culvert cleared by pumping crew. Silt removed and drains flushing normally.', '/uploads/cleared-drainage-proof.svg', 'resolved', 25.0, FALSE, 150, 6, 2, DATE_SUB(NOW(), INTERVAL 8 HOUR));

-- 4. Insert Field Tasks (Work Orders)
INSERT INTO `tasks` (`id`, `incident_id`, `assigned_by_user_id`, `assigned_to_user_id`, `crew_size`, `equipment_required`, `status`, `sla_deadline`, `dispatched_at`, `on_site_at`, `resolved_at`, `resolution_notes`, `proof_photo_url`, `created_at`) VALUES
(1, 1, 2, 4, 4, 'Two 500-GPM High Flow Dewatering Pumps, Emergency Warning Cones', 'in_progress', DATE_ADD(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 90 MINUTE), DATE_SUB(NOW(), INTERVAL 45 MINUTE), NULL, 'Pumps active on hospital ER access lane. Diverted 40% volume into auxiliary retention line.', NULL, DATE_SUB(NOW(), INTERVAL 100 MINUTE)),

(2, 2, 3, 5, 3, 'High pressure jetting vacuum truck, safety barriers', 'assigned', DATE_ADD(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 20 MINUTE), NULL, NULL, 'En route to North Market Cross Road. Expected on site in 15 mins.', NULL, DATE_SUB(NOW(), INTERVAL 25 MINUTE)),

(3, 5, 2, 4, 3, 'Dewatering trailer pump & mechanical excavator', 'resolved', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 7 HOUR), DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Culvert obstruction removed (tree logs & compacted mud). Water level receded completely to normal curb height.', '/uploads/cleared-drainage-proof.svg', DATE_SUB(NOW(), INTERVAL 7 HOUR));

-- 5. Insert Incident Updates (Tracking Timeline)
INSERT INTO `incident_updates` (`incident_id`, `updated_by_user_id`, `previous_status`, `new_status`, `comments`, `created_at`) VALUES
(1, NULL, 'none', 'reported', 'Citizen reported critical water surge near General Hospital ER gate.', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(1, 2, 'reported', 'verified', 'Officer Ananya Iyer verified report via live CCTV. Water level evaluated as Submerged (Emergency Tier 1).', DATE_SUB(NOW(), INTERVAL 105 MINUTE)),
(1, 2, 'verified', 'assigned', 'Dispatched Rapid Response Crew #4 (Lead: Ramesh Kumar) with 2x dewatering pump units.', DATE_SUB(NOW(), INTERVAL 100 MINUTE)),
(1, 4, 'assigned', 'in_progress', 'Field Crew on site. Dewatering pumps deployed. Water level dropping from vehicle tire height.', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),

(2, NULL, 'none', 'reported', 'Citizen reported waist-deep flood at Old Town Vegetable Market.', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(2, 3, 'reported', 'verified', 'Officer Marcus Lee verified drain choke. High priority assigned due to commercial density.', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 3, 'verified', 'assigned', 'Assigned to Field Tech Priya Sundaram with jetting truck unit.', DATE_SUB(NOW(), INTERVAL 25 MINUTE)),

(5, NULL, 'none', 'reported', 'Citizen report logged for Canal Bank Colony.', DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(5, 2, 'reported', 'assigned', 'Assigned directly to Rapid Dewatering Unit.', DATE_SUB(NOW(), INTERVAL 7 HOUR)),
(5, 4, 'assigned', 'in_progress', 'Crew deployed excavator and opened blocked spillway.', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(5, 4, 'in_progress', 'resolved', 'Water fully drained. Manhole covers secured. Verified by local ward supervisor.', DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- 6. Insert System Audit Logs
INSERT INTO `audit_logs` (`user_id`, `action`, `entity_type`, `entity_id`, `details`, `created_at`) VALUES
(1, 'SYSTEM_INIT', 'DATABASE', 1, 'Initialised UrbanFlow resilient municipal schema for Zone A-D', DATE_SUB(NOW(), INTERVAL 10 HOUR)),
(2, 'TASK_DISPATCH', 'INCIDENT', 1, 'Dispatched Crew 4 with 2 pumps to Hospital ER sub-drain', DATE_SUB(NOW(), INTERVAL 100 MINUTE)),
(3, 'TASK_DISPATCH', 'INCIDENT', 2, 'Dispatched Crew 5 to North Market', DATE_SUB(NOW(), INTERVAL 25 MINUTE));
