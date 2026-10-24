-- =============================================================================
-- UrbanFlow: Localised Flood and Drainage Response System
-- Database Schema for MySQL 8.x
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `urbanflow_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `urbanflow_db`;

-- Drop tables in reverse foreign-key order for clean initialization
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `incident_updates`;
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `incidents`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `wards`;

-- -----------------------------------------------------------------------------
-- Table: wards (Municipal Administrative Zones)
-- -----------------------------------------------------------------------------
CREATE TABLE `wards` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ward_number` VARCHAR(20) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `zone` VARCHAR(50) NOT NULL,
    `risk_level` ENUM('low', 'moderate', 'high', 'critical') DEFAULT 'moderate',
    `center_lat` DECIMAL(10, 7) NOT NULL,
    `center_lng` DECIMAL(10, 7) NOT NULL,
    `drainage_capacity_rating` INT DEFAULT 70 COMMENT 'Percentage score of drainage throughput',
    `officer_contact` VARCHAR(100) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: users (Citizens, Field Workers, Municipal Officers, Admins)
-- -----------------------------------------------------------------------------
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(120) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('citizen', 'field_worker', 'officer', 'admin') NOT NULL DEFAULT 'citizen',
    `phone` VARCHAR(25) NULL,
    `ward_id` INT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_users_ward` FOREIGN KEY (`ward_id`) REFERENCES `wards`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: incidents (Citizen & Sensor Flood Reports)
-- -----------------------------------------------------------------------------
CREATE TABLE `incidents` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tracking_code` VARCHAR(30) NOT NULL UNIQUE,
    `citizen_name` VARCHAR(100) NOT NULL DEFAULT 'Anonymous Citizen',
    `citizen_phone` VARCHAR(25) NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `landmark` VARCHAR(150) NULL,
    `ward_id` INT NULL,
    `water_depth` ENUM('ankle', 'knee', 'waist', 'submerged') NOT NULL,
    `blockage_type` ENUM('drain_overflow', 'silt_debris', 'manhole_open', 'river_spill', 'culvert_blocked', 'other') NOT NULL,
    `description` TEXT NULL,
    `photo_url` VARCHAR(255) NULL,
    `status` ENUM('reported', 'verified', 'assigned', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'reported',
    `priority_score` FLOAT NOT NULL DEFAULT 20.0 COMMENT '0-100 calculated hotspot priority rating',
    `critical_infra_nearby` BOOLEAN DEFAULT FALSE COMMENT 'Near hospital, school, metro, substation',
    `estimated_affected_people` INT DEFAULT 10,
    `reported_by_user_id` INT NULL,
    `verified_by_user_id` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_incidents_ward` FOREIGN KEY (`ward_id`) REFERENCES `wards`(`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_incidents_reporter` FOREIGN KEY (`reported_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_incidents_verifier` FOREIGN KEY (`verified_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: tasks (Field Crew Work Orders)
-- -----------------------------------------------------------------------------
CREATE TABLE `tasks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `incident_id` INT NOT NULL,
    `assigned_by_user_id` INT NOT NULL,
    `assigned_to_user_id` INT NOT NULL,
    `crew_size` INT DEFAULT 3,
    `equipment_required` VARCHAR(255) DEFAULT 'Submersible pump, de-silting jetter, safety cones',
    `status` ENUM('assigned', 'en_route', 'on_site', 'in_progress', 'resolved', 'deferred') NOT NULL DEFAULT 'assigned',
    `sla_deadline` DATETIME NOT NULL,
    `dispatched_at` DATETIME NULL,
    `on_site_at` DATETIME NULL,
    `resolved_at` DATETIME NULL,
    `resolution_notes` TEXT NULL,
    `proof_photo_url` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_tasks_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tasks_assigner` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`),
    CONSTRAINT `fk_tasks_worker` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: incident_updates (Chronological Progress Log for Citizens & Auditing)
-- -----------------------------------------------------------------------------
CREATE TABLE `incident_updates` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `incident_id` INT NOT NULL,
    `updated_by_user_id` INT NULL,
    `previous_status` VARCHAR(50) NULL,
    `new_status` VARCHAR(50) NOT NULL,
    `comments` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_updates_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_updates_user` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: audit_logs (System Action Trails for Administrators)
-- -----------------------------------------------------------------------------
CREATE TABLE `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INT NOT NULL,
    `details` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Indexes for High Performance Queries (Geospatial, Status, SLA tracking)
-- -----------------------------------------------------------------------------
CREATE INDEX `idx_incidents_status` ON `incidents`(`status`);
CREATE INDEX `idx_incidents_priority` ON `incidents`(`priority_score` DESC);
CREATE INDEX `idx_incidents_tracking` ON `incidents`(`tracking_code`);
CREATE INDEX `idx_incidents_coords` ON `incidents`(`latitude`, `longitude`);
CREATE INDEX `idx_incidents_ward` ON `incidents`(`ward_id`);
CREATE INDEX `idx_tasks_assigned_to` ON `tasks`(`assigned_to_user_id`, `status`);
CREATE INDEX `idx_tasks_incident` ON `tasks`(`incident_id`);
CREATE INDEX `idx_users_role_email` ON `users`(`role`, `email`);
