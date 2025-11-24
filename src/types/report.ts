export interface DashboardAnalytics {
    monthlyTrends: MonthlyTrend[];
    operatorPerformance: OperatorPerformance[];
    productBreakdown: ProductBreakdown[];
    totalReports: number;
}

export interface ParsedMetric {
    metric_id: number;
    report_id: number;
    total_bet_count: number;
    total_stake: number;
    total_winnings: number;
    ggr_percentage: number;
    det_levy: number;
    gaming_tax: number;
    ggr: number;
    ngr_post_levy: number;
    created_at: string;
    status: "approved" | "unapproved" | "rejected";
}

export interface GameBreakdown {
    gameType: string;
    betCount: number;
    stake: number;
    winnings: number;
    ggr: number;
    ggrPercentage: number;
    detLevy: number;
    gamingTax: number;
    netRevenue: number;
}

export interface MonthlyTrend {
    month: string;
    totalGGR: number;
    totalStake: number;
    totalWinnings: number;
    totalBetCount: number;
    totalDETLevy: number;
    totalGamingTax: number;
    reportCount: number;
}

export interface OperatorPerformance {
    operatorName: string;
    totalGGR: number;
    totalStake: number;
    reportCount: number;
}

export interface ProductBreakdown {
    gameType: string;
    totalGGR: number;
    totalStake: number;
    totalBetCount: number;
    [key: string]: any;
}

export interface EMSComparison {
    reportId: string;
    operatorName: string;
    month: number;
    year: number;
    discrepancies: Discrepancy[];
    matchStatus: 'matched' | 'mismatch';
}

export interface Discrepancy {
    field: string;
    reportValue: number;
    emsValue: number;
    difference: number;
    percentDifference?: number;
}

export interface DataQuality {
    missingMonths: MissingMonth[];
    invalidRows: InvalidRow[];
    validationErrors: any[];
    balanceDiscrepancies: BalanceDiscrepancy[];
    totalIssues: number;
}

export interface MissingMonth {
    operatorId: string;
    expected: string;
}

export interface InvalidRow {
    reportId: string;
    issue: string;
}

export interface BalanceDiscrepancy {
    reportId: string;
    openingBalance: number;
    closingBalance: number;
    expectedClosingBalance: number;
    difference: number;
}

export interface OperatorReport {
    id: string;
    operatorId: string;
    operatorName: string;
    month: number;
    year: number;
    gameBreakdown: GameBreakdown[];
    totalStake: number;
    totalGGR: number;
    totalWinnings: number;
    totalBetCount: number;
    overallGGRPercentage: number;
    totalDETLevy: number;
    totalGamingTax: number;
    totalNetRevenue: number;
    openingBalance: number;
    closingBalance: number;
    balanceDifference: number;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
}



