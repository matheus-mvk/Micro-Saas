-- Indexes targeted at dashboard filters, insight filtering and period comparisons.
CREATE INDEX `freight_simulations_branch_period_idx`
  ON `freight_simulations` (`tenant_id`, `branch_id`, `created_at`);

CREATE INDEX `freight_simulations_carrier_period_idx`
  ON `freight_simulations` (`tenant_id`, `carrier_id`, `created_at`);

CREATE INDEX `freight_options_selected_period_idx`
  ON `freight_simulation_options` (`tenant_id`, `selected`, `created_at`);

CREATE INDEX `shipments_branch_period_idx`
  ON `shipments` (`tenant_id`, `branch_id`, `created_at`);

CREATE INDEX `shipments_service_period_idx`
  ON `shipments` (`tenant_id`, `carrier_service_id`, `created_at`);

CREATE INDEX `insights_filter_idx`
  ON `insights` (`tenant_id`, `status`, `category`, `severity`, `period_start`);
