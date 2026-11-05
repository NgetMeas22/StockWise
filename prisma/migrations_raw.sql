-- StockWise Raw SQL constraints and immutability triggers

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Negative stock prevention check on inventory_balances
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_quantity_on_hand_non_negative'
  ) THEN
    ALTER TABLE inventory_balances
    ADD CONSTRAINT check_quantity_on_hand_non_negative
    CHECK (quantity_on_hand >= 0);
  END IF;
END $$;

-- Negative stock and delta checks on stock_movements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_stock_movement_quantity_delta_nonzero'
  ) THEN
    ALTER TABLE stock_movements
    ADD CONSTRAINT check_stock_movement_quantity_delta_nonzero
    CHECK (quantity_delta <> 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_stock_movement_quantity_after_non_negative'
  ) THEN
    ALTER TABLE stock_movements
    ADD CONSTRAINT check_stock_movement_quantity_after_non_negative
    CHECK (quantity_after >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_stock_movement_reason_length'
  ) THEN
    ALTER TABLE stock_movements
    ADD CONSTRAINT check_stock_movement_reason_length
    CHECK (
      (movement_type NOT IN ('ADJUSTMENT', 'REVERSAL'))
      OR (char_length(trim(reason)) >= 3)
    );
  END IF;
END $$;

-- Immutability triggers on stock_movements and audit_logs
CREATE OR REPLACE FUNCTION prevent_update_or_delete_on_immutable_ledger()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Updates and deletions are strictly prohibited on immutable ledger table %', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stock_movements_immutable'
  ) THEN
    CREATE TRIGGER trg_stock_movements_immutable
    BEFORE UPDATE OR DELETE ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION prevent_update_or_delete_on_immutable_ledger();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_logs_immutable'
  ) THEN
    CREATE TRIGGER trg_audit_logs_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_update_or_delete_on_immutable_ledger();
  END IF;
END $$;

