ALTER TABLE `audit_logs`
  MODIFY `action` ENUM(
    'LOGIN',
    'LOGOUT',
    'AUTH_FAILURE',
    'TENANT_REGISTERED',
    'PASSWORD_RESET_REQUESTED',
    'PASSWORD_RESET_COMPLETED',
    'OAUTH_LINKED',
    'OAUTH_UNLINKED',
    'MFA_CHANGED',
    'USER_INVITED',
    'USER_CREATED',
    'USER_UPDATED',
    'ROLE_CHANGED',
    'SESSION_REVOKED',
    'ONBOARDING_UPDATED',
    'CUSTOMER_CHANGED',
    'CARRIER_CHANGED',
    'FREIGHT_PRICING_CHANGED',
    'FREIGHT_SIMULATION_CREATED',
    'FREIGHT_OPTION_SELECTED',
    'SHIPMENT_CREATED',
    'IMPORT_CREATED',
    'IMPORT_STARTED',
    'IMPORT_COMPLETED',
    'IMPORT_FAILED',
    'IMPORT_CANCELED',
    'IMPORT_RETRIED',
    'IMPORT_FILE_DOWNLOADED',
    'ADMIN_OPERATION'
  ) NOT NULL;

ALTER TABLE `import_jobs`
  ADD COLUMN `type` ENUM('CUSTOMERS', 'CARRIERS') NOT NULL DEFAULT 'CUSTOMERS',
  ADD COLUMN `stored_filename` VARCHAR(255) NULL,
  ADD COLUMN `mime_type` VARCHAR(120) NULL,
  ADD COLUMN `size_bytes` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `file_hash` VARCHAR(128) NULL,
  ADD COLUMN `success_rows` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `error_rows` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `skipped_rows` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `progress` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `mapping` JSON NULL,
  ADD COLUMN `options` JSON NULL,
  ADD COLUMN `started_at` DATETIME(3) NULL,
  ADD COLUMN `finished_at` DATETIME(3) NULL,
  ADD COLUMN `failure_reason` VARCHAR(500) NULL;

CREATE INDEX `import_jobs_tenant_type_created_idx` ON `import_jobs`(`tenant_id`, `type`, `created_at`);
CREATE INDEX `import_jobs_tenant_user_created_idx` ON `import_jobs`(`tenant_id`, `created_by_id`, `created_at`);
CREATE INDEX `import_jobs_tenant_file_hash_idx` ON `import_jobs`(`tenant_id`, `file_hash`);

CREATE TABLE `import_row_results` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `import_job_id` CHAR(36) NOT NULL,
  `row_number` INTEGER NOT NULL,
  `status` ENUM('SUCCESS', 'ERROR', 'SKIPPED') NOT NULL,
  `external_reference` VARCHAR(180) NULL,
  `normalized_data` JSON NULL,
  `error_code` VARCHAR(80) NULL,
  `error_message` VARCHAR(500) NULL,
  `created_resource_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `import_row_results_job_row_key` (`tenant_id`, `import_job_id`, `row_number`),
  INDEX `import_row_results_job_status_idx` (`tenant_id`, `import_job_id`, `status`),
  CONSTRAINT `import_row_results_import_job_id_fkey` FOREIGN KEY (`import_job_id`) REFERENCES `import_jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `import_row_results_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
