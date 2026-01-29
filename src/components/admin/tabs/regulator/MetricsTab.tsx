"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    ChevronDown,
    ChevronUp,
    TrendingUp,
    Wallet,
    Percent,
    Users,
} from "lucide-react";
import { reportsAPI } from "@/utils/API.ts";

/* =======================
   Types & formatters
======================= */

export interface Metric {
    regulator_id: number;
    operator_name: string;
    revenue_stake: number;
    ggr_net_cash: number;
    ggr_percent: number;
    iq_fee?: number;
    furgugo_fee?: number;
    month_year: string;
    report_type: string;
}

interface MaglaMetrics {
    total_bet_count: number;
    report_id: number;
    total_winnings: number;
    det_levy: number;
    ggr: number;
    created_at: string;
    status: string;
    metric_id: number;
    total_stake: number;
    ggr_percentage: number;
    gaming_tax: number;
    ngr_post_levy: number;
    date_time: string;
}

interface MaglaReport {
    report_id: number;
    date_time: string;
    opening_balances_total: number;
    closing_balances_total: number;
    uploaded_by: number;
    uploaded_by_name: string;
    operator_id: number;
    operator_name: string;
    status: string;
    report_file: {
        file_id: number;
        filename: string;
    };
}

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

const formatMWK = (value: number) =>
    new Intl.NumberFormat("en-MW", {
        style: "currency",
        currency: "MWK",
        maximumFractionDigits: 2,
    }).format(value);

const formatMWKShort = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
};

/* =======================
   Component
======================= */

function NoMetricsState({ message }: { message?: string }) {
    return (
        <div className="
            flex flex-col items-center justify-center
            py-12 text-center
            text-gray-500 dark:text-gray-400
            border border-dashed border-gray-300 dark:border-gray-600
            rounded-lg
            bg-gray-50 dark:bg-gray-800/50
        ">
            <TrendingUp className="size-8 mb-3 text-gray-400 dark:text-gray-500" />
            <p className="text-sm font-medium">
                {message ?? "No regulator metrics available."}
            </p>
        </div>
    );
}

export function MetricsTab({
                               metrics,
                               selectedRegulator = "all",
                               selectedMonth = "all",
                               regulators = [],
                               maglaMetrics = [],
                               maglaReports = [],
                               isMaglaDataLoading = false,
                           }: {
    metrics: Metric[];
    selectedRegulator?: string;
    selectedMonth?: string;
    regulators?: { regulator_id: number; regulator_name: string }[];
    maglaMetrics?: MaglaMetrics[];
    maglaReports?: MaglaReport[];
    isMaglaDataLoading?: boolean;
}) {
    const [regulatorNames, setRegulatorNames] = useState<Record<number, string>>({});
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [regulatorCollapsed, setRegulatorCollapsed] = useState<Record<number, boolean>>({});
    const [maglaCollapsed, setMaglaCollapsed] = useState(false);

    const selectedRegulatorId = useMemo(() => {
        if (selectedRegulator === "all") return null;
        const reg = regulators.find(r => r.regulator_name === selectedRegulator);
        return reg ? reg.regulator_id : null;
    }, [selectedRegulator, regulators]);

    const filteredMetrics = useMemo(() => {
        return metrics.filter(m => {
            const matchesRegulator =
                selectedRegulatorId === null || m.regulator_id === selectedRegulatorId;
            const matchesMonth =
                selectedMonth === "all" || m.month_year === selectedMonth;
            return matchesRegulator && matchesMonth;
        });
    }, [metrics, selectedRegulatorId, selectedMonth]);

    const maglaRows = useMemo(() => {
        if (!maglaMetrics.length) return [];

        const reportById = new Map<number, MaglaReport>();
        maglaReports.forEach(r => reportById.set(r.report_id, r));

        return maglaMetrics
            .map(metric => {
                const report = reportById.get(metric.report_id);
                const operatorName = report?.operator_name ?? 'Unknown operator';
                const month_year = (metric.created_at || metric.date_time || report?.date_time || '').substring(0, 7);
                const computedGgrPercentage = metric.total_stake > 0 ? metric.ggr / metric.total_stake : 0;
                return {
                    operator_name: operatorName,
                    month_year,
                    total_stake: metric.total_stake,
                    ggr: metric.ggr,
                    ggr_percentage: computedGgrPercentage,
                    det_levy: metric.det_levy,
                    gaming_tax: metric.gaming_tax,
                    total_winnings: metric.total_winnings,
                };
            })
            .filter(r => {
                if (!r.month_year) return false;
                return selectedMonth === 'all' || r.month_year === selectedMonth;
            });
    }, [maglaMetrics, maglaReports, selectedMonth]);

    const maglaByOperator = useMemo(() => {
        return maglaRows.reduce((acc, row) => {
            if (!acc[row.operator_name]) acc[row.operator_name] = [];
            acc[row.operator_name].push(row);
            return acc;
        }, {} as Record<string, typeof maglaRows>);
    }, [maglaRows]);

    const metricsByRegulator = useMemo(() => {
        return filteredMetrics.reduce((acc, m) => {
            if (!acc[m.regulator_id]) acc[m.regulator_id] = {};
            if (!acc[m.regulator_id][m.operator_name]) acc[m.regulator_id][m.operator_name] = [];
            acc[m.regulator_id][m.operator_name].push(m);
            return acc;
        }, {} as Record<number, Record<string, Metric[]>>);
    }, [filteredMetrics]);

    useEffect(() => {
        const loadRegulators = async () => {
            const ids = Object.keys(metricsByRegulator).map(Number);
            const entries = await Promise.all(
                ids.map(async id => [id, await reportsAPI.fetchRegulatorName(id)] as const)
            );
            setRegulatorNames(Object.fromEntries(entries));
        };
        if (metrics.length) loadRegulators();
    }, [metrics, metricsByRegulator]);



    const hasIgjMetrics = !!metrics?.length;
    const hasMaglaMetrics = isMaglaDataLoading || maglaRows.length > 0;

    if (!hasIgjMetrics && !hasMaglaMetrics) {
        return (
            <div className="space-y-6">
                <NoMetricsState />
            </div>
        );
    }

    return (
        <TooltipProvider delayDuration={150}>
            <div className="space-y-12">
                {/* MAGLA SECTION */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                    className="space-y-8"
                >
                    <Card className="border-2 border-indigo-200">
                        <CardHeader
                            className="flex flex-row items-center justify-between cursor-pointer"
                            onClick={() => setMaglaCollapsed(p => !p)}
                        >
                            <CardTitle className="text-indigo-700">MAGLA</CardTitle>
                            {maglaCollapsed ? <ChevronDown /> : <ChevronUp />}
                        </CardHeader>
                    </Card>

                    <AnimatePresence initial={false}>
                        {!maglaCollapsed && (
                            <>
                                {isMaglaDataLoading ? (
                                    <div className="space-y-6">
                                        <NoMetricsState message="Loading MAGLA metrics…" />
                                    </div>
                                ) : maglaRows.length === 0 ? (
                                    <div className="space-y-6">
                                        <NoMetricsState message="No MAGLA metrics available." />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-6">
                                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                                Regulator Overview
                                            </h3>

                                            {(() => {
                                                const allRows = maglaRows;
                                                const totalGgr = allRows.reduce((s, r) => s + r.ggr, 0);
                                                const totalStake = allRows.reduce((s, r) => s + r.total_stake, 0);
                                                const operatorTotals = Object.entries(maglaByOperator).map(([name, rows]) => ({
                                                    operator: name,
                                                    ggr: rows.reduce((s, r) => s + r.ggr, 0),
                                                }));
                                                const topOperators = [...operatorTotals].sort((a, b) => b.ggr - a.ggr).slice(0, 5);

                                                return (
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <Kpi icon={Wallet} label="Total Stake" value={formatMWK(totalStake)} />
                                                            <Kpi icon={TrendingUp} label="Total GGR" value={formatMWK(totalGgr)} />
                                                            <Kpi
                                                                icon={Percent}
                                                                label="Avg GGR %"
                                                                value={totalStake > 0 ? `${((totalGgr / totalStake) * 100).toFixed(2)}%` : '0.00%'}
                                                            />
                                                            <Kpi icon={Users} label="Operators" value={operatorTotals.length.toString()} />
                                                        </div>

                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle className="text-sm">Market Share (GGR)</CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <ResponsiveContainer width="100%" height={220}>
                                                                    <PieChart>
                                                                        <Pie
                                                                            data={operatorTotals}
                                                                            dataKey="ggr"
                                                                            nameKey="operator"
                                                                            outerRadius={80}
                                                                        >
                                                                            {operatorTotals.map((_, i) => (
                                                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                                            ))}
                                                                        </Pie>
                                                                        <RechartsTooltip formatter={(v: number) => formatMWK(v)} />
                                                                    </PieChart>
                                                                </ResponsiveContainer>
                                                            </CardContent>
                                                        </Card>

                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle className="text-sm">Top Operators</CardTitle>
                                                            </CardHeader>
                                                            <CardContent className="space-y-3">
                                                                {topOperators.map(o => (
                                                                    <div key={o.operator}>
                                                                        <div className="flex justify-between text-xs">
                                                                            <span className="truncate max-w-[70%]">{o.operator}</span>
                                                                            <span>{formatMWKShort(o.ggr)}</span>
                                                                        </div>
                                                                        <div className="h-2 bg-gray-200 rounded">
                                                                            <div
                                                                                className="h-2 bg-indigo-500 rounded"
                                                                                style={{ width: `${topOperators[0].ggr > 0 ? (o.ggr / topOperators[0].ggr) * 100 : 0}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="border-t pt-6">
                                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                                Operator Breakdown
                                            </h3>
                                        </div>

                                        {Object.entries(maglaByOperator).map(([operator, rows]) => {
                                            const collapseKey = `magla-${operator}`;
                                            const sorted = [...rows].sort((a, b) => a.month_year.localeCompare(b.month_year));

                                            const maxY = Math.max(
                                                ...sorted.map(r => Math.max(r.total_stake, r.ggr))
                                            );

                                            return (
                                                <Card key={collapseKey}>
                                                    <CardHeader className="flex justify-between items-center">
                                                        <CardTitle className="text-base">{operator}</CardTitle>
                                                        <button
                                                            onClick={() =>
                                                                setCollapsed(p => ({
                                                                    ...p,
                                                                    [collapseKey]: !p[collapseKey],
                                                                }))
                                                            }
                                                        >
                                                            {collapsed[collapseKey] ? <ChevronDown /> : <ChevronUp />}
                                                        </button>
                                                    </CardHeader>

                                                    {!collapsed[collapseKey] && (
                                                        <CardContent className="space-y-4">
                                                            <ResponsiveContainer width="100%" height={200}>
                                                                <LineChart data={sorted}>
                                                                    <CartesianGrid strokeDasharray="3 3" />
                                                                    <XAxis dataKey="month_year" />
                                                                    <YAxis tickFormatter={formatMWKShort} domain={[0, maxY * 1.1]} />
                                                                    <RechartsTooltip formatter={(v: number) => formatMWK(v)} />
                                                                    <Line type="monotone" dataKey="ggr" stroke="#3b82f6" strokeWidth={2} />
                                                                    <Line type="monotone" dataKey="total_stake" stroke="#10b981" strokeWidth={2} />
                                                                </LineChart>
                                                            </ResponsiveContainer>

                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Month</TableHead>
                                                                        <TableHead>Total Stake</TableHead>
                                                                        <TableHead>Payout</TableHead>
                                                                        <TableHead>GGR</TableHead>
                                                                        <TableHead>GGR %</TableHead>
                                                                        <TableHead>DET Levy</TableHead>
                                                                        <TableHead>Gaming Tax</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {sorted.map((r, i) => (
                                                                        <TableRow key={i}>
                                                                            <TableCell>{r.month_year}</TableCell>
                                                                            <TableCell>{formatMWK(r.total_stake)}</TableCell>
                                                                            <TableCell>{formatMWK(r.total_winnings)}</TableCell>
                                                                            <TableCell>{formatMWK(r.ggr)}</TableCell>
                                                                            <TableCell>{(r.total_stake > 0 ? (r.ggr / r.total_stake) * 100 : 0).toFixed(2)}%</TableCell>
                                                                            <TableCell>{formatMWK(r.det_levy)}</TableCell>
                                                                            <TableCell>{formatMWK(r.gaming_tax)}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </CardContent>
                                                    )}
                                                </Card>
                                            );
                                        })}
                                    </>
                                )}
                            </>
                        )}
                    </AnimatePresence>
                </motion.div>

                {Object.entries(metricsByRegulator).map(([regulatorId, operators], rIdx) => {
                    const allMetrics = Object.values(operators).flat();

                    const totalGGR = allMetrics.reduce((s, m) => s + m.ggr_net_cash, 0);
                    const totalStake = allMetrics.reduce((s, m) => s + m.revenue_stake, 0);

                    const operatorTotals = Object.entries(operators).map(([name, ms]) => ({
                        operator: name,
                        ggr: ms.reduce((s, m) => s + m.ggr_net_cash, 0),
                    }));

                    const topOperators = [...operatorTotals]
                        .sort((a, b) => b.ggr - a.ggr)
                        .slice(0, 5);

                    return (
                        <motion.div
                            key={regulatorId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: rIdx * 0.05 }}
                            className="space-y-8"
                        >
                            {/* REGULATOR HEADER */}
                            <Card className="border-2 border-indigo-200">
                                <CardHeader
                                    className="flex flex-row items-center justify-between cursor-pointer"
                                    onClick={() =>
                                        setRegulatorCollapsed(p => ({
                                            ...p,
                                            [Number(regulatorId)]: !p[Number(regulatorId)],
                                        }))
                                    }
                                >
                                    <CardTitle className="text-indigo-700">
                                        {regulatorNames[Number(regulatorId)] ?? "Loading regulator…"}
                                    </CardTitle>
                                    {regulatorCollapsed[Number(regulatorId)] ? <ChevronDown /> : <ChevronUp />}
                                </CardHeader>
                            </Card>

                            <AnimatePresence initial={false}>
                                {!regulatorCollapsed[Number(regulatorId)] && (
                                    <>
                                        {/* OVERVIEW */}
                                        <div className="space-y-6">
                                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                                Regulator Overview
                                            </h3>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <Kpi icon={Wallet} label="Total Stake" value={formatMWK(totalStake)} />
                                                    <Kpi icon={TrendingUp} label="Total GGR" value={formatMWK(totalGGR)} />
                                                    <Kpi
                                                        icon={Percent}
                                                        label="Avg GGR %"
                                                        value={`${((totalGGR / totalStake) * 100).toFixed(2)}%`}
                                                    />
                                                    <Kpi icon={Users} label="Operators" value={operatorTotals.length.toString()} />
                                                </div>

                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-sm">Market Share (GGR)</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <ResponsiveContainer width="100%" height={220}>
                                                            <PieChart>
                                                                <Pie
                                                                    data={operatorTotals}
                                                                    dataKey="ggr"
                                                                    nameKey="operator"
                                                                    outerRadius={80}
                                                                >
                                                                    {operatorTotals.map((_, i) => (
                                                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <RechartsTooltip formatter={(v: number) => formatMWK(v)} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </CardContent>
                                                </Card>

                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-sm">Top Operators</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3">
                                                        {topOperators.map(o => (
                                                            <div key={o.operator}>
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="truncate max-w-[70%]">{o.operator}</span>
                                                                    <span>{formatMWKShort(o.ggr)}</span>
                                                                </div>
                                                                <div className="h-2 bg-gray-200 rounded">
                                                                    <div
                                                                        className="h-2 bg-indigo-500 rounded"
                                                                        style={{ width: `${(o.ggr / topOperators[0].ggr) * 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>

                                        {/* DIVIDER */}
                                        <div className="border-t pt-6">
                                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                                Operator Breakdown
                                            </h3>
                                        </div>

                                        {/* ORIGINAL CONTENT */}
                                        {Object.entries(operators).map(([operator, operatorMetrics]) => {
                                            const collapseKey = `${regulatorId}-${operator}`;

                                            const sortedOperatorMetrics = [...operatorMetrics].sort((a, b) => a.month_year.localeCompare(b.month_year));

                                            const maxY = Math.max(
                                                ...sortedOperatorMetrics.map(m =>
                                                    Math.max(
                                                        m.revenue_stake,
                                                        m.ggr_net_cash,
                                                        m.iq_fee ?? 0,
                                                        m.furgugo_fee ?? 0
                                                    )
                                                )
                                            );

                                            return (
                                                <Card key={collapseKey}>
                                                    <CardHeader className="flex justify-between items-center">
                                                        <CardTitle className="text-base">{operator}</CardTitle>
                                                        <button
                                                            onClick={() =>
                                                                setCollapsed(p => ({
                                                                    ...p,
                                                                    [collapseKey]: !p[collapseKey],
                                                                }))
                                                            }
                                                        >
                                                            {collapsed[collapseKey] ? <ChevronDown /> : <ChevronUp />}
                                                        </button>
                                                    </CardHeader>

                                                    {!collapsed[collapseKey] && (
                                                        <CardContent className="space-y-4">
                                                            <ResponsiveContainer width="100%" height={200}>
                                                                <LineChart data={sortedOperatorMetrics}>
                                                                    <CartesianGrid strokeDasharray="3 3" />
                                                                    <XAxis dataKey="month_year" />
                                                                    <YAxis tickFormatter={formatMWKShort} domain={[0, maxY * 1.1]} />
                                                                    <RechartsTooltip formatter={(v: number) => formatMWK(v)} />
                                                                    <Line type="monotone" dataKey="ggr_net_cash" stroke="#3b82f6" strokeWidth={2} />
                                                                    <Line type="monotone" dataKey="revenue_stake" stroke="#10b981" strokeWidth={2} />
                                                                </LineChart>
                                                            </ResponsiveContainer>

                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Month</TableHead>
                                                                        <TableHead>Report Type</TableHead>
                                                                        <TableHead>Revenue Stake</TableHead>
                                                                        <TableHead>GGR</TableHead>
                                                                        <TableHead>GGR %</TableHead>
                                                                        <TableHead>IQ Fee</TableHead>
                                                                        <TableHead>Furgugo Fee</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {sortedOperatorMetrics.map((m, i) => (
                                                                        <TableRow key={i}>
                                                                            <TableCell>{m.month_year}</TableCell>
                                                                            <TableCell>{m.report_type}</TableCell>
                                                                            <TableCell>{formatMWK(m.revenue_stake)}</TableCell>
                                                                            <TableCell>{formatMWK(m.ggr_net_cash)}</TableCell>
                                                                            <TableCell>{m.ggr_percent.toFixed(2)}%</TableCell>
                                                                            <TableCell>{m.iq_fee ? formatMWK(m.iq_fee) : "-"}</TableCell>
                                                                            <TableCell>{m.furgugo_fee ? formatMWK(m.furgugo_fee) : "-"}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </CardContent>
                                                    )}
                                                </Card>
                                            );
                                        })}
                                    </>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}


function Kpi({ icon: Icon, label, value }: any) {
    return (
        <Card>
            <CardContent className="flex items-center gap-3 p-4">
                <Icon className="text-indigo-600 shrink-0" />
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className="font-semibold truncate max-w-[160px] whitespace-nowrap cursor-default">
                                {value}
                            </p>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start" className="text-xs">
                            {value}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </CardContent>
        </Card>
    );
}