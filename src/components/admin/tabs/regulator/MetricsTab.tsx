"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";
import { reportsAPI } from "@/utils/API.ts";

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

/**
 * Full MWK currency formatter (tables + tooltips)
 * Example: MWK 1,234,567.89
 */
const formatMWK = (value: number) =>
    new Intl.NumberFormat("en-MW", {
        style: "currency",
        currency: "MWK",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);

/**
 * Short notation formatter for Y-axis ONLY
 * Examples: 1.2K, 3.4M, 5.6B
 */
const formatMWKShort = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
};

export function MetricsTab({ metrics }: { metrics: Metric[] }) {
    const [regulatorNames, setRegulatorNames] = useState<Record<number, string>>({});
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [regulatorCollapsed, setRegulatorCollapsed] = useState<Record<number, boolean>>({});

    const metricsByRegulator = metrics.reduce((acc, m) => {
        if (!acc[m.regulator_id]) acc[m.regulator_id] = {};
        if (!acc[m.regulator_id][m.operator_name]) {
            acc[m.regulator_id][m.operator_name] = [];
        }
        acc[m.regulator_id][m.operator_name].push(m);
        return acc;
    }, {} as Record<number, Record<string, Metric[]>>);

    useEffect(() => {
        const loadRegulators = async () => {
            const ids = Object.keys(metricsByRegulator).map(Number);
            const entries = await Promise.all(
                ids.map(async id => [id, await reportsAPI.fetchRegulatorName(id)] as const)
            );
            setRegulatorNames(Object.fromEntries(entries));
        };

        if (metrics.length) {
            loadRegulators();
        }
    }, [metrics]);

    const toggleCollapse = (key: string) => {
        setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleRegulatorCollapse = (regulatorId: number) => {
        setRegulatorCollapsed(prev => ({
            ...prev,
            [regulatorId]: !prev[regulatorId],
        }));
    };

    return (
        <div className="space-y-10">
            {Object.entries(metricsByRegulator).map(([regulatorId, operators], rIdx) => (
                <motion.div
                    key={regulatorId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: rIdx * 0.05 }}
                    className="space-y-6"
                >
                    {/* Regulator Header */}
                    <Card className="border-2 border-indigo-200">
                        <CardHeader
                            className="flex flex-row items-center justify-between cursor-pointer"
                            onClick={() => toggleRegulatorCollapse(Number(regulatorId))}
                        >
                            <CardTitle className="text-indigo-700">
                                {regulatorNames[Number(regulatorId)] ?? "Loading regulator…"}
                            </CardTitle>
                            {regulatorCollapsed[Number(regulatorId)] ? (
                                <ChevronDown className="text-indigo-600" />
                            ) : (
                                <ChevronUp className="text-indigo-600" />
                            )}
                        </CardHeader>
                    </Card>

                    <AnimatePresence initial={false}>
                        {!regulatorCollapsed[Number(regulatorId)] &&
                            Object.entries(operators).map(([operator, operatorMetrics], oIdx) => {
                                const collapseKey = `${regulatorId}-${operator}`;

                                const maxY = Math.max(
                                    ...operatorMetrics.map(m =>
                                        Math.max(
                                            m.revenue_stake,
                                            m.ggr_net_cash,
                                            m.iq_fee ?? 0,
                                            m.furgugo_fee ?? 0
                                        )
                                    )
                                );

                                return (
                                    <motion.div
                                        key={collapseKey}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: oIdx * 0.04 }}
                                    >
                                        <Card className="hover:shadow-md transition-shadow">
                                            <CardHeader className="flex flex-row justify-between items-center">
                                                <CardTitle className="text-base">{operator}</CardTitle>
                                                <button
                                                    onClick={() => toggleCollapse(collapseKey)}
                                                    className="text-gray-600 hover:text-indigo-600"
                                                >
                                                    {collapsed[collapseKey] ? <ChevronDown /> : <ChevronUp />}
                                                </button>
                                            </CardHeader>

                                            <AnimatePresence initial={false}>
                                                {!collapsed[collapseKey] && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <CardContent className="flex flex-col gap-4">
                                                            {/* Chart */}
                                                            <ResponsiveContainer width="100%" height={200}>
                                                                <LineChart data={operatorMetrics}>
                                                                    <CartesianGrid strokeDasharray="3 3" />
                                                                    <XAxis dataKey="month_year" />
                                                                    <YAxis
                                                                        domain={[0, Math.ceil(maxY * 1.1)]}
                                                                        tickFormatter={formatMWKShort}
                                                                    />
                                                                    <Tooltip formatter={(v: number) => formatMWK(v)} />
                                                                    <Line type="monotone" dataKey="ggr_net_cash" stroke="#3b82f6" strokeWidth={2} />
                                                                    <Line type="monotone" dataKey="revenue_stake" stroke="#10b981" strokeWidth={2} />
                                                                </LineChart>
                                                            </ResponsiveContainer>

                                                            {/* Table */}
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
                                                                    {operatorMetrics.map((m, i) => (
                                                                        <TableRow key={i}>
                                                                            <TableCell>{m.month_year}</TableCell>
                                                                            <TableCell>{m.report_type}</TableCell>

                                                                            <TableCell
                                                                                className="max-w-[150px] truncate tabular-nums"
                                                                                title={formatMWK(m.revenue_stake)}
                                                                            >
                                                                                {formatMWK(m.revenue_stake)}
                                                                            </TableCell>

                                                                            <TableCell
                                                                                className="max-w-[150px] truncate tabular-nums"
                                                                                title={formatMWK(m.ggr_net_cash)}
                                                                            >
                                                                                {formatMWK(m.ggr_net_cash)}
                                                                            </TableCell>

                                                                            <TableCell>{m.ggr_percent.toFixed(2)}%</TableCell>

                                                                            <TableCell
                                                                                className="max-w-[150px] truncate tabular-nums"
                                                                                title={m.iq_fee ? formatMWK(m.iq_fee) : "-"}
                                                                            >
                                                                                {m.iq_fee ? formatMWK(m.iq_fee) : "-"}
                                                                            </TableCell>

                                                                            <TableCell
                                                                                className="max-w-[150px] truncate tabular-nums"
                                                                                title={m.furgugo_fee ? formatMWK(m.furgugo_fee) : "-"}
                                                                            >
                                                                                {m.furgugo_fee ? formatMWK(m.furgugo_fee) : "-"}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </CardContent>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    );
}