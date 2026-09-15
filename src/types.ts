export type ReconciliationStatus = "Balanced" | "Shortage" | "Surplus";

export interface Terminal {
  id: string;
  owner_id: string;
  kiosk_location_name: string;
  assigned_operator_name: string;
  access_code: string;
  is_active: boolean;
  created_at: string;
}

export interface ReconciliationLog {
  id: string;
  terminal_id: string;
  log_date: string;
  opening_cash: number;
  net_other_cash_movements: number;
  movement_reason: string | null;
  pos_withdrawal_volume: number;
  pos_deposit_volume: number;
  closing_cash: number;
  calculated_expected_cash: number;
  recorded_variance: number;
  variance_reason: string | null;
  status: ReconciliationStatus;
  submission_timestamp: string;
  is_locked: boolean;
}

export interface TerminalLookup {
  terminal_id: string;
  kiosk_location_name: string;
  assigned_operator_name: string;
  today_is_locked: boolean;
  today_submission_timestamp: string | null;
}

export interface CommissionLog {
  id: string;
  terminal_id: string;
  log_date: string;
  commission_earned: number;
  charges_actual: number;
  charges_expected: number;
  created_at: string;
}
