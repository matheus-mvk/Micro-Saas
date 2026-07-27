ALTER TABLE `audit_logs`
  MODIFY `action` ENUM(
    'LOGIN',
    'LOGOUT',
    'AUTH_FAILURE',
    'USER_CREATED',
    'USER_UPDATED',
    'ROLE_CHANGED',
    'CUSTOMER_CHANGED',
    'CARRIER_CHANGED',
    'FREIGHT_PRICING_CHANGED',
    'FREIGHT_SIMULATION_CREATED',
    'FREIGHT_OPTION_SELECTED',
    'SHIPMENT_CREATED',
    'IMPORT_CREATED',
    'ADMIN_OPERATION'
  ) NOT NULL;

ALTER TABLE `branches`
  ADD COLUMN `postal_code` VARCHAR(16) NULL,
  ADD COLUMN `street` VARCHAR(160) NULL,
  ADD COLUMN `number` VARCHAR(40) NULL,
  ADD COLUMN `complement` VARCHAR(120) NULL,
  ADD COLUMN `district` VARCHAR(120) NULL,
  ADD COLUMN `city` VARCHAR(120) NULL,
  ADD COLUMN `state` VARCHAR(2) NULL,
  ADD COLUMN `country` VARCHAR(2) NOT NULL DEFAULT 'BR',
  ADD COLUMN `contact_name` VARCHAR(120) NULL,
  ADD COLUMN `phone` VARCHAR(40) NULL,
  ADD COLUMN `main` BOOLEAN NOT NULL DEFAULT false;

DROP INDEX `branches_tenant_id_active_idx` ON `branches`;
CREATE INDEX `branches_tenant_active_main_idx` ON `branches` (`tenant_id`, `active`, `main`);

ALTER TABLE `carriers`
  ADD COLUMN `legal_name` VARCHAR(180) NULL,
  ADD COLUMN `email` VARCHAR(180) NULL,
  ADD COLUMN `phone` VARCHAR(40) NULL,
  ADD COLUMN `contact_name` VARCHAR(120) NULL,
  ADD COLUMN `site` VARCHAR(180) NULL,
  ADD COLUMN `notes` TEXT NULL;

ALTER TABLE `freight_simulations`
  ADD COLUMN `branch_id` CHAR(36) NULL,
  ADD COLUMN `created_by_id` CHAR(36) NULL,
  ADD COLUMN `chargeable_weight_kg` DECIMAL(10, 3) NULL,
  ADD COLUMN `total_volume_m3` DECIMAL(12, 6) NULL,
  ADD COLUMN `desired_ship_date` DATETIME(3) NULL,
  ADD CONSTRAINT `fs_branch_fk` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fs_created_by_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `fs_tenant_customer_created_idx` ON `freight_simulations` (`tenant_id`, `customer_id`, `created_at`);
CREATE INDEX `fs_tenant_user_created_idx` ON `freight_simulations` (`tenant_id`, `created_by_id`, `created_at`);

CREATE TABLE `customer_addresses` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `type` ENUM('MAIN', 'PICKUP', 'DELIVERY', 'BILLING', 'OTHER') NOT NULL DEFAULT 'OTHER',
  `label` VARCHAR(80) NULL,
  `postal_code` VARCHAR(16) NOT NULL,
  `street` VARCHAR(160) NOT NULL,
  `number` VARCHAR(40) NULL,
  `complement` VARCHAR(120) NULL,
  `district` VARCHAR(120) NULL,
  `city` VARCHAR(120) NOT NULL,
  `state` VARCHAR(2) NOT NULL,
  `country` VARCHAR(2) NOT NULL DEFAULT 'BR',
  `latitude` DECIMAL(10, 7) NULL,
  `longitude` DECIMAL(10, 7) NULL,
  `main` BOOLEAN NOT NULL DEFAULT false,
  `pickup` BOOLEAN NOT NULL DEFAULT false,
  `delivery` BOOLEAN NOT NULL DEFAULT false,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `cust_addr_customer_idx` (`tenant_id`, `customer_id`, `active`),
  INDEX `cust_addr_postal_idx` (`tenant_id`, `postal_code`),
  CONSTRAINT `cust_addr_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cust_addr_customer_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `carrier_services` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `carrier_id` CHAR(36) NOT NULL,
  `code` VARCHAR(40) NOT NULL,
  `name` VARCHAR(140) NOT NULL,
  `modality` VARCHAR(60) NOT NULL,
  `description` VARCHAR(255) NULL,
  `default_deadline_days` INTEGER NOT NULL,
  `cubic_factor` DECIMAL(10, 3) NOT NULL,
  `min_weight_kg` DECIMAL(10, 3) NULL,
  `max_weight_kg` DECIMAL(10, 3) NULL,
  `minimum_value` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `carrier_services_code_key` (`tenant_id`, `carrier_id`, `code`),
  INDEX `carrier_services_lookup_idx` (`tenant_id`, `status`, `carrier_id`),
  CONSTRAINT `carrier_services_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `carrier_services_carrier_fk` FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `carrier_coverages` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `carrier_service_id` CHAR(36) NOT NULL,
  `origin_state` VARCHAR(2) NULL,
  `destination_state` VARCHAR(2) NULL,
  `origin_postal_code_start` VARCHAR(16) NULL,
  `origin_postal_code_end` VARCHAR(16) NULL,
  `destination_postal_code_start` VARCHAR(16) NULL,
  `destination_postal_code_end` VARCHAR(16) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `carrier_cov_service_idx` (`tenant_id`, `carrier_service_id`, `status`),
  INDEX `carrier_cov_state_idx` (`tenant_id`, `origin_state`, `destination_state`, `status`),
  CONSTRAINT `carrier_cov_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `carrier_cov_service_fk` FOREIGN KEY (`carrier_service_id`) REFERENCES `carrier_services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `freight_rate_tables` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `carrier_service_id` CHAR(36) NOT NULL,
  `name` VARCHAR(140) NOT NULL,
  `version` INTEGER NOT NULL DEFAULT 1,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'BRL',
  `valid_from` DATETIME(3) NOT NULL,
  `valid_to` DATETIME(3) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `frt_service_version_key` (`tenant_id`, `carrier_service_id`, `version`),
  INDEX `frt_lookup_idx` (`tenant_id`, `carrier_service_id`, `status`, `valid_from`, `valid_to`),
  CONSTRAINT `frt_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `frt_service_fk` FOREIGN KEY (`carrier_service_id`) REFERENCES `carrier_services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `freight_rate_ranges` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `rate_table_id` CHAR(36) NOT NULL,
  `min_weight_kg` DECIMAL(10, 3) NOT NULL,
  `max_weight_kg` DECIMAL(10, 3) NOT NULL,
  `base_price` DECIMAL(12, 2) NOT NULL,
  `price_per_kg` DECIMAL(12, 4) NOT NULL,
  `excess_price_per_kg` DECIMAL(12, 4) NULL,
  `deadline_days` INTEGER NOT NULL,
  `priority` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `frr_lookup_idx` (`tenant_id`, `rate_table_id`, `min_weight_kg`, `max_weight_kg`),
  CONSTRAINT `frr_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `frr_table_fk` FOREIGN KEY (`rate_table_id`) REFERENCES `freight_rate_tables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `freight_additional_charges` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `rate_table_id` CHAR(36) NOT NULL,
  `type` ENUM('FIXED', 'AD_VALOREM', 'GRIS', 'TOLL', 'INSURANCE', 'ADDITION', 'DISCOUNT') NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `fixed_amount` DECIMAL(12, 2) NULL,
  `percentage` DECIMAL(9, 6) NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fac_lookup_idx` (`tenant_id`, `rate_table_id`, `active`, `type`),
  CONSTRAINT `fac_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fac_table_fk` FOREIGN KEY (`rate_table_id`) REFERENCES `freight_rate_tables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `freight_simulation_addresses` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `simulation_id` CHAR(36) NOT NULL,
  `type` ENUM('MAIN', 'PICKUP', 'DELIVERY', 'BILLING', 'OTHER') NOT NULL,
  `postal_code` VARCHAR(16) NOT NULL,
  `street` VARCHAR(160) NOT NULL,
  `number` VARCHAR(40) NULL,
  `complement` VARCHAR(120) NULL,
  `district` VARCHAR(120) NULL,
  `city` VARCHAR(120) NOT NULL,
  `state` VARCHAR(2) NOT NULL,
  `country` VARCHAR(2) NOT NULL DEFAULT 'BR',
  `latitude` DECIMAL(10, 7) NULL,
  `longitude` DECIMAL(10, 7) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `fsa_sim_type_idx` (`tenant_id`, `simulation_id`, `type`),
  CONSTRAINT `fsa_sim_fk` FOREIGN KEY (`simulation_id`) REFERENCES `freight_simulations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `freight_simulation_packages` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `simulation_id` CHAR(36) NOT NULL,
  `quantity` INTEGER NOT NULL,
  `weight_kg` DECIMAL(10, 3) NOT NULL,
  `length_cm` DECIMAL(10, 2) NOT NULL,
  `width_cm` DECIMAL(10, 2) NOT NULL,
  `height_cm` DECIMAL(10, 2) NOT NULL,
  `volume_m3` DECIMAL(12, 6) NOT NULL,
  `description` VARCHAR(160) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `fsp_sim_idx` (`tenant_id`, `simulation_id`),
  CONSTRAINT `fsp_sim_fk` FOREIGN KEY (`simulation_id`) REFERENCES `freight_simulations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `freight_simulation_options` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `simulation_id` CHAR(36) NOT NULL,
  `carrier_id` CHAR(36) NOT NULL,
  `carrier_service_id` CHAR(36) NOT NULL,
  `rate_table_id` CHAR(36) NOT NULL,
  `rate_range_id` CHAR(36) NOT NULL,
  `carrier_name` VARCHAR(160) NOT NULL,
  `service_name` VARCHAR(140) NOT NULL,
  `service_code` VARCHAR(40) NOT NULL,
  `rate_table_version` INTEGER NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'BRL',
  `real_weight_kg` DECIMAL(10, 3) NOT NULL,
  `cubic_weight_kg` DECIMAL(10, 3) NOT NULL,
  `chargeable_weight_kg` DECIMAL(10, 3) NOT NULL,
  `distance_km` DECIMAL(10, 2) NULL,
  `deadline_days` INTEGER NOT NULL,
  `estimated_delivery_at` DATETIME(3) NOT NULL,
  `total_price` DECIMAL(12, 2) NOT NULL,
  `cheapest` BOOLEAN NOT NULL DEFAULT false,
  `fastest` BOOLEAN NOT NULL DEFAULT false,
  `selected` BOOLEAN NOT NULL DEFAULT false,
  `selected_at` DATETIME(3) NULL,
  `unavailable_reason` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `fso_sim_price_idx` (`tenant_id`, `simulation_id`, `total_price`),
  INDEX `fso_carrier_service_idx` (`tenant_id`, `carrier_id`, `carrier_service_id`, `created_at`),
  CONSTRAINT `fso_sim_fk` FOREIGN KEY (`simulation_id`) REFERENCES `freight_simulations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fso_carrier_fk` FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fso_service_fk` FOREIGN KEY (`carrier_service_id`) REFERENCES `carrier_services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fso_table_fk` FOREIGN KEY (`rate_table_id`) REFERENCES `freight_rate_tables`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fso_range_fk` FOREIGN KEY (`rate_range_id`) REFERENCES `freight_rate_ranges`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `freight_simulation_price_components` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `option_id` CHAR(36) NOT NULL,
  `type` ENUM('BASE', 'MINIMUM_ADJUSTMENT', 'WEIGHT', 'EXCESS_WEIGHT', 'FIXED', 'AD_VALOREM', 'GRIS', 'TOLL', 'INSURANCE', 'ADDITION', 'DISCOUNT', 'TOTAL') NOT NULL,
  `label` VARCHAR(120) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `fspc_option_idx` (`tenant_id`, `option_id`, `sort_order`),
  CONSTRAINT `fspc_option_fk` FOREIGN KEY (`option_id`) REFERENCES `freight_simulation_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `shipments` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `simulation_id` CHAR(36) NOT NULL,
  `selected_option_id` CHAR(36) NOT NULL,
  `customer_id` CHAR(36) NULL,
  `branch_id` CHAR(36) NULL,
  `carrier_id` CHAR(36) NOT NULL,
  `carrier_service_id` CHAR(36) NOT NULL,
  `created_by_id` CHAR(36) NULL,
  `tracking_code` VARCHAR(80) NOT NULL,
  `external_reference` VARCHAR(80) NULL,
  `real_weight_kg` DECIMAL(10, 3) NOT NULL,
  `chargeable_weight_kg` DECIMAL(10, 3) NOT NULL,
  `cargo_value` DECIMAL(12, 2) NULL,
  `freight_value` DECIMAL(12, 2) NOT NULL,
  `estimated_delivery_at` DATETIME(3) NOT NULL,
  `delivered_at` DATETIME(3) NULL,
  `status` ENUM('CREATED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'RETURNING', 'RETURNED', 'CANCELED') NOT NULL DEFAULT 'CREATED',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `shipments_simulation_key` (`simulation_id`),
  UNIQUE INDEX `shipments_option_key` (`selected_option_id`),
  UNIQUE INDEX `shipments_tracking_key` (`tenant_id`, `tracking_code`),
  INDEX `shipments_status_eta_idx` (`tenant_id`, `status`, `estimated_delivery_at`),
  INDEX `shipments_customer_idx` (`tenant_id`, `customer_id`, `created_at`),
  INDEX `shipments_carrier_idx` (`tenant_id`, `carrier_id`, `created_at`),
  CONSTRAINT `shipments_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `shipments_sim_fk` FOREIGN KEY (`simulation_id`) REFERENCES `freight_simulations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `shipments_option_fk` FOREIGN KEY (`selected_option_id`) REFERENCES `freight_simulation_options`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `shipments_customer_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `shipments_branch_fk` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `shipments_carrier_fk` FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `shipments_service_fk` FOREIGN KEY (`carrier_service_id`) REFERENCES `carrier_services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `shipments_user_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `shipment_addresses` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `shipment_id` CHAR(36) NOT NULL,
  `type` ENUM('MAIN', 'PICKUP', 'DELIVERY', 'BILLING', 'OTHER') NOT NULL,
  `postal_code` VARCHAR(16) NOT NULL,
  `street` VARCHAR(160) NOT NULL,
  `number` VARCHAR(40) NULL,
  `complement` VARCHAR(120) NULL,
  `district` VARCHAR(120) NULL,
  `city` VARCHAR(120) NOT NULL,
  `state` VARCHAR(2) NOT NULL,
  `country` VARCHAR(2) NOT NULL DEFAULT 'BR',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ship_addr_ship_idx` (`tenant_id`, `shipment_id`, `type`),
  CONSTRAINT `ship_addr_shipment_fk` FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `shipment_packages` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `shipment_id` CHAR(36) NOT NULL,
  `simulation_package_id` CHAR(36) NULL,
  `quantity` INTEGER NOT NULL,
  `weight_kg` DECIMAL(10, 3) NOT NULL,
  `length_cm` DECIMAL(10, 2) NOT NULL,
  `width_cm` DECIMAL(10, 2) NOT NULL,
  `height_cm` DECIMAL(10, 2) NOT NULL,
  `volume_m3` DECIMAL(12, 6) NOT NULL,
  `description` VARCHAR(160) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ship_pkg_ship_idx` (`tenant_id`, `shipment_id`),
  CONSTRAINT `ship_pkg_shipment_fk` FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ship_pkg_sim_pkg_fk` FOREIGN KEY (`simulation_package_id`) REFERENCES `freight_simulation_packages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
