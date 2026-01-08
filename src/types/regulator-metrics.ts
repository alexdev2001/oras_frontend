export type RegulatorMetric = {
    id: number;
    regulator_id: number;
    report_file_id: number;
    operator_name: string;
    month_year: string;
    report_type: string;
    revenue_stake: number;
    payout_payments: number;
    ggr_net_cash: number;
    cancelled_bets: number | null;
    open_tickets: number | null;
    ggr_percent: number;
    iq_fee: number;
    furgugo_fee: number;
};