ALTER TABLE `users`
  MODIFY `status` ENUM('ACTIVE', 'INVITED', 'DISABLED', 'DELETED') NOT NULL DEFAULT 'INVITED',
  ADD COLUMN `mfa_enabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `mfa_secret` VARCHAR(512) NULL,
  ADD COLUMN `password_change_required` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `deleted_at` DATETIME(3) NULL;

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
    'ADMIN_OPERATION'
  ) NOT NULL;

CREATE TABLE `tenant_settings` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `country` VARCHAR(2) NOT NULL DEFAULT 'BR',
  `currency` VARCHAR(3) NOT NULL DEFAULT 'BRL',
  `timezone` VARCHAR(80) NOT NULL DEFAULT 'America/Sao_Paulo',
  `onboarding_completed` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `tenant_settings_tenant_id_key` (`tenant_id`),
  CONSTRAINT `tenant_settings_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tenant_onboarding` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `company_done` BOOLEAN NOT NULL DEFAULT false,
  `branch_done` BOOLEAN NOT NULL DEFAULT false,
  `invite_done` BOOLEAN NOT NULL DEFAULT false,
  `completed` BOOLEAN NOT NULL DEFAULT false,
  `current_step` VARCHAR(40) NOT NULL DEFAULT 'company',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `tenant_onboarding_tenant_id_key` (`tenant_id`),
  CONSTRAINT `tenant_onboarding_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `oauth_accounts` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `provider` ENUM('GOOGLE', 'GITHUB') NOT NULL,
  `provider_user_id` VARCHAR(160) NOT NULL,
  `email` VARCHAR(180) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `oauth_accounts_provider_provider_user_id_key` (`provider`, `provider_user_id`),
  UNIQUE INDEX `oauth_accounts_tenant_user_provider_key` (`tenant_id`, `user_id`, `provider`),
  INDEX `oauth_accounts_tenant_email_idx` (`tenant_id`, `email`),
  CONSTRAINT `oauth_accounts_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `oauth_accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NULL,
  `user_id` CHAR(36) NULL,
  `email_hash` VARCHAR(128) NOT NULL,
  `token_hash` VARCHAR(128) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `password_reset_tokens_token_hash_key` (`token_hash`),
  INDEX `password_reset_tokens_email_hash_expires_idx` (`email_hash`, `expires_at`),
  INDEX `password_reset_tokens_tenant_user_used_idx` (`tenant_id`, `user_id`, `used_at`),
  CONSTRAINT `password_reset_tokens_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_invitations` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `email` VARCHAR(180) NOT NULL,
  `role` ENUM('ADMIN', 'MANAGER', 'OPERATOR') NOT NULL,
  `token_hash` VARCHAR(128) NOT NULL,
  `status` ENUM('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  `invited_by_id` CHAR(36) NOT NULL,
  `accepted_by_id` CHAR(36) NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `accepted_at` DATETIME(3) NULL,
  `revoked_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_invitations_token_hash_key` (`token_hash`),
  UNIQUE INDEX `user_invitations_tenant_email_status_key` (`tenant_id`, `email`, `status`),
  INDEX `user_invitations_tenant_status_created_idx` (`tenant_id`, `status`, `created_at`),
  CONSTRAINT `user_invitations_accepted_by_id_fkey` FOREIGN KEY (`accepted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `user_invitations_invited_by_id_fkey` FOREIGN KEY (`invited_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `user_invitations_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `mfa_recovery_codes` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `code_hash` VARCHAR(128) NOT NULL,
  `used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `mfa_recovery_codes_tenant_user_code_key` (`tenant_id`, `user_id`, `code_hash`),
  INDEX `mfa_recovery_codes_tenant_user_used_idx` (`tenant_id`, `user_id`, `used_at`),
  CONSTRAINT `mfa_recovery_codes_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `mfa_recovery_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `mfa_challenges` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `challenge_token_hash` VARCHAR(128) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `mfa_challenges_challenge_token_hash_key` (`challenge_token_hash`),
  INDEX `mfa_challenges_tenant_user_expires_idx` (`tenant_id`, `user_id`, `expires_at`),
  CONSTRAINT `mfa_challenges_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `mfa_challenges_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `oauth_states` (
  `id` CHAR(36) NOT NULL,
  `state_hash` VARCHAR(128) NOT NULL,
  `provider` ENUM('GOOGLE', 'GITHUB') NOT NULL,
  `mode` VARCHAR(20) NOT NULL,
  `tenant_id` CHAR(36) NULL,
  `user_id` CHAR(36) NULL,
  `metadata` JSON NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `oauth_states_state_hash_key` (`state_hash`),
  INDEX `oauth_states_provider_mode_expires_idx` (`provider`, `mode`, `expires_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `users_tenant_mfa_enabled_idx` ON `users`(`tenant_id`, `mfa_enabled`);
