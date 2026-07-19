CREATE TABLE `tenants` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `document` VARCHAR(32) NULL,
  `slug` VARCHAR(80) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `tenants_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `branches` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `code` VARCHAR(40) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `branches_tenant_id_code_key` (`tenant_id`, `code`),
  INDEX `branches_tenant_id_active_idx` (`tenant_id`, `active`),
  CONSTRAINT `branches_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `branch_id` CHAR(36) NULL,
  `name` VARCHAR(140) NOT NULL,
  `email` VARCHAR(180) NOT NULL,
  `password_hash` VARCHAR(255) NULL,
  `role` ENUM('ADMIN', 'MANAGER', 'OPERATOR') NOT NULL DEFAULT 'OPERATOR',
  `status` ENUM('ACTIVE', 'INVITED', 'DISABLED') NOT NULL DEFAULT 'INVITED',
  `last_login_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_tenant_id_email_key` (`tenant_id`, `email`),
  INDEX `users_tenant_id_status_idx` (`tenant_id`, `status`),
  INDEX `users_tenant_id_role_idx` (`tenant_id`, `role`),
  CONSTRAINT `users_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `users_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `refresh_tokens` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `family_id` CHAR(36) NOT NULL,
  `user_agent` VARCHAR(255) NULL,
  `ip_hash` VARCHAR(128) NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `revoked_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `rotated_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `refresh_tokens_tenant_id_token_hash_key` (`tenant_id`, `token_hash`),
  INDEX `refresh_tokens_tenant_id_user_id_revoked_at_idx` (`tenant_id`, `user_id`, `revoked_at`),
  CONSTRAINT `refresh_tokens_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `customers` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `document` VARCHAR(32) NULL,
  `email` VARCHAR(180) NULL,
  `phone` VARCHAR(40) NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `customers_tenant_id_document_key` (`tenant_id`, `document`),
  INDEX `customers_tenant_id_active_name_idx` (`tenant_id`, `active`, `name`),
  CONSTRAINT `customers_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `carriers` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `document` VARCHAR(32) NULL,
  `code` VARCHAR(40) NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `carriers_tenant_id_document_key` (`tenant_id`, `document`),
  UNIQUE INDEX `carriers_tenant_id_code_key` (`tenant_id`, `code`),
  INDEX `carriers_tenant_id_active_name_idx` (`tenant_id`, `active`, `name`),
  CONSTRAINT `carriers_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `freight_simulations` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `customer_id` CHAR(36) NULL,
  `carrier_id` CHAR(36) NULL,
  `origin_postal_code` VARCHAR(16) NOT NULL,
  `destination_postal_code` VARCHAR(16) NOT NULL,
  `real_weight_kg` DECIMAL(10, 3) NOT NULL,
  `cubic_weight_kg` DECIMAL(10, 3) NULL,
  `length_cm` DECIMAL(10, 2) NULL,
  `width_cm` DECIMAL(10, 2) NULL,
  `height_cm` DECIMAL(10, 2) NULL,
  `cargo_value` DECIMAL(12, 2) NULL,
  `distance_km` DECIMAL(10, 2) NULL,
  `estimated_price` DECIMAL(12, 2) NULL,
  `estimated_deadline_days` INTEGER NULL,
  `status` ENUM('DRAFT', 'QUEUED', 'CALCULATED', 'FAILED') NOT NULL DEFAULT 'DRAFT',
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `freight_simulations_tenant_id_status_created_at_idx` (`tenant_id`, `status`, `created_at`),
  INDEX `freight_simulations_tenant_id_origin_postal_code_destination_postal_code_idx` (`tenant_id`, `origin_postal_code`, `destination_postal_code`),
  CONSTRAINT `freight_simulations_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `freight_simulations_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `freight_simulations_carrier_id_fkey` FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `import_jobs` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `created_by_id` CHAR(36) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `file_type` VARCHAR(16) NOT NULL,
  `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
  `total_rows` INTEGER NOT NULL DEFAULT 0,
  `processed_rows` INTEGER NOT NULL DEFAULT 0,
  `error_summary` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `import_jobs_tenant_id_status_created_at_idx` (`tenant_id`, `status`, `created_at`),
  CONSTRAINT `import_jobs_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `import_jobs_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NULL,
  `actor_id` CHAR(36) NULL,
  `action` ENUM('LOGIN', 'LOGOUT', 'AUTH_FAILURE', 'USER_CREATED', 'USER_UPDATED', 'ROLE_CHANGED', 'CUSTOMER_CHANGED', 'CARRIER_CHANGED', 'IMPORT_CREATED', 'ADMIN_OPERATION') NOT NULL,
  `entity_type` VARCHAR(80) NULL,
  `entity_id` CHAR(36) NULL,
  `request_id` VARCHAR(64) NULL,
  `ip_hash` VARCHAR(128) NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `audit_logs_tenant_id_action_created_at_idx` (`tenant_id`, `action`, `created_at`),
  INDEX `audit_logs_actor_id_created_at_idx` (`actor_id`, `created_at`),
  CONSTRAINT `audit_logs_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `audit_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
