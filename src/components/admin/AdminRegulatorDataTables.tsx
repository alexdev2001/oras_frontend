"use client";

import { useState, useMemo } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { motion, AnimatePresence } from "motion/react";
import {
    TrendingUp,
    TrendingDown,
    ChevronDown,
    ChevronRight,
    ArrowUpDown,
    Search,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";

interface MonthlyData {
    month: string;
    stake: number;
    payout: number;
    cancelled: number;
    open_tickets: number;
    ggr: number;
    ggr_pct: number;
    percent_from_stake: number;
    percent_from_ggr: number;
    igj: number;
    fugogo: number;
}

interface PerOperatorData {
    operator: string;
    TOTAL: number;
    [key: string]: number | string;
}

export interface RegulatorAnalytics {
    regulator_id: number;
    regulator_name: string;
    monthly: {
        online: MonthlyData[];
        offline: MonthlyData[];
        combined: MonthlyData[];
    };
    per_operator: {
        online: {
            stake: PerOperatorData[];
            ggr: PerOperatorData[];
        };
        offline: {
            stake: PerOperatorData[];
            ggr: PerOperatorData[];
        };
    };
}

type SortOrder = "desc" | "asc";

export function AdminRegulatorDataTables({
                                             analytics,
                                             selectedRegulator,
                                             selectedMonth = "all",
                                         }: {
    analytics: RegulatorAnalytics[];
    selectedRegulator: string;
    selectedMonth?: string;
}) {
    const [expanded, setExpanded] = useState<Record<number, boolean>>(
        () => Object.fromEntries(analytics.map((_, idx) => [idx, true]))
    );
    const [activeTabs, setActiveTabs] = useState<Record<number, string>>({});
    const [sortOrders, setSortOrders] = useState<Record<number, SortOrder>>({});
    const [operatorSearch, setOperatorSearch] = useState<Record<number, string>>({});
    const [regulatorSearch, setRegulatorSearch] = useState<string>("");

    const monthNames: Record<string, string> = {
        "01": "January",
        "02": "February",
        "03": "March",
        "04": "April",
        "05": "May",
        "06": "June",
        "07": "July",
        "08": "August",
        "09": "September",
        "10": "October",
        "11": "November",
        "12": "December",
    };

    const selectedMonthName =
        selectedMonth === "all" ? "all" : monthNames[selectedMonth.split("-")[1]] ?? selectedMonth;

    const filteredMonthlyRows = (rows: MonthlyData[]) =>
        selectedMonthName === "all"
            ? rows
            : rows.filter(r => r.month === selectedMonthName || r.month === "Total");

    const monthKeyToName = (key: string) => {
        const monthPart = key.split("-")[1];
        if (!monthPart) return key;
        return monthNames[monthPart] ?? key;
    };

    const filteredAnalytics = useMemo(() => {
        let filtered = analytics;
        
        // Apply dashboard-level regulator filter
        if (selectedRegulator !== "all") {
            filtered = filtered.filter((r) => r.regulator_name === selectedRegulator);
        }
        
        // Apply search filter
        if (regulatorSearch.trim()) {
            filtered = filtered.filter((r) => 
                r.regulator_name.toLowerCase().includes(regulatorSearch.toLowerCase())
            );
        }
        
        return filtered;
    }, [analytics, selectedRegulator, regulatorSearch]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-MW", { style: "currency", currency: "MWK", minimumFractionDigits: 0 }).format(value);

    const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

    const toggleRegulator = (idx: number) => {
        setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));
        setActiveTabs((prev) => ({ ...prev, [idx]: prev[idx] ?? "monthly" }));
        setSortOrders((prev) => ({ ...prev, [idx]: prev[idx] ?? "desc" }));
    };

    const setTabForRegulator = (regIdx: number, value: string) => {
        setActiveTabs((prev) => ({ ...prev, [regIdx]: value }));
    };

    const toggleSortOrder = (regIdx: number) => {
        setSortOrders((prev) => ({
            ...prev,
            [regIdx]: prev[regIdx] === "desc" ? "asc" : "desc",
        }));
    };

    const sortByTotal = (rows: PerOperatorData[], regIdx: number) =>
        [...rows].sort((a, b) =>
            (sortOrders[regIdx] ?? "desc") === "desc"
                ? (b.TOTAL as number) - (a.TOTAL as number)
                : (a.TOTAL as number) - (b.TOTAL as number)
        );

    const mergeOperatorMetrics = (stakeRows: PerOperatorData[], ggrRows: PerOperatorData[], monthKeys: string[]) => {
        const ggrMap = new Map(ggrRows.map((r) => [r.operator, r]));
        return stakeRows.map((stakeRow) => {
            const ggrRow = ggrMap.get(stakeRow.operator);
            const merged: PerOperatorData = { operator: stakeRow.operator, TOTAL: stakeRow.TOTAL as number };

            monthKeys.forEach((m) => {
                const stake = Number(stakeRow[m] ?? 0);
                const ggr = Number(ggrRow?.[m] ?? 0);
                merged[`${m}_stake`] = stake;
                merged[`${m}_ggr`] = ggr;
                merged[`${m}_payout`] = stake - ggr;
                merged[`${m}_ggr_pct`] = stake > 0 ? ggr / stake : 0;
            });

            merged.TOTAL_PAYOUT = (stakeRow.TOTAL as number) - (ggrRow?.TOTAL as number ?? 0);
            merged.TOTAL_GGR_PCT = stakeRow.TOTAL > 0 ? (ggrRow?.TOTAL as number ?? 0) / stakeRow.TOTAL : 0;
            return merged;
        });
    };

    const filterOperators = (data: PerOperatorData[], searchTerm: string) => {
        if (!searchTerm.trim()) return data;
        return data.filter(row => 
            row.operator.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const getMonthKeysForRegulator = (reg: RegulatorAnalytics, selectedMonth: string) => {
        const keys = Array.from(
            new Set([
                ...reg.per_operator.online.stake.flatMap((r) => Object.keys(r)),
                ...reg.per_operator.online.ggr.flatMap((r) => Object.keys(r)),
                ...reg.per_operator.offline.stake.flatMap((r) => Object.keys(r)),
                ...reg.per_operator.offline.ggr.flatMap((r) => Object.keys(r)),
            ])
        ).filter((k) => k !== "operator" && k !== "TOTAL");

        if (selectedMonth === "all") return keys.sort();

        // Include TOTAL key always
        return keys.includes(selectedMonth) ? [selectedMonth, "TOTAL"] : ["TOTAL"];
    };

    function NoDataState({ message }: { message: string }) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground w-full border border-dashed rounded-lg bg-muted/30">
                <TrendingDown className="size-8 mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">{message}</p>
            </div>
        );
    }

    if (analytics.length === 0) return <NoDataState message="No regulator analytics data available." />;

    return (
        <div className="space-y-8">
            {/* Regulator Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
                <Input
                    placeholder="Search by regulator..."
                    value={regulatorSearch}
                    onChange={(e) => setRegulatorSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {filteredAnalytics.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {regulatorSearch.trim() 
                            ? `No regulators found matching "${regulatorSearch}"`
                            : "No regulator analytics data available."
                        }
                    </p>
                </div>
            ) : (
                filteredAnalytics.map((reg, regIdx) => {
                const allMonthKeys = selectedMonth === 'all'
                    ? Array.from(new Set([
                        ...reg.per_operator.online.stake.flatMap(r => Object.keys(r)),
                        ...reg.per_operator.online.ggr.flatMap(r => Object.keys(r)),
                    ])).filter(k => k !== 'operator' && k !== 'TOTAL').sort((a, b) => a.localeCompare(b))
                    : [selectedMonth, 'TOTAL'];

                return (
                    <Card key={regIdx} className="shadow-sm">
                        <CardHeader className="cursor-pointer select-none" onClick={() => toggleRegulator(regIdx)}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold">{reg.regulator_name}</CardTitle>
                                    <CardDescription>Detailed performance overview</CardDescription>
                                </div>
                                {expanded[regIdx] ? <ChevronDown className="size-5 text-gray-500" /> : <ChevronRight className="size-5 text-gray-500" />}
                            </div>
                        </CardHeader>

                        <AnimatePresence initial={false}>
                            {expanded[regIdx] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                >
                                    <CardContent>
                                        <Tabs value={activeTabs[regIdx] ?? "monthly"} onValueChange={(val) => setTabForRegulator(regIdx, val)}>
                                            <TabsList className="mb-6">
                                                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                                <TabsTrigger value="online">Online per operator</TabsTrigger>
                                                <TabsTrigger value="offline">Offline per operator</TabsTrigger>
                                            </TabsList>

                                            {/* MONTHLY TABLES */}
                                            <TabsContent value="monthly" className="space-y-6">
                                                {(["online", "offline", "combined"] as const).map((type) => {
                                                    const rows = filteredMonthlyRows(reg.monthly[type]).sort((a, b) => a.month.localeCompare(b.month));

                                                    const headerClass =
                                                        type === "online"
                                                            ? "from-indigo-100/20 to-blue-100/20 dark:from-indigo-900/30 dark:to-blue-900/30 border-indigo-200 dark:border-indigo-700"
                                                            : type === "offline"
                                                                ? "from-red-100/20 to-orange-100/20 dark:from-red-900/30 dark:to-orange-900/30 border-red-200 dark:border-red-700"
                                                                : "from-purple-100/20 to-indigo-100/20 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-200 dark:border-purple-700";

                                                    const totalClass =
                                                        type === "online"
                                                            ? "bg-indigo-100/20 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600"
                                                            : type === "offline"
                                                                ? "bg-red-100/20 dark:bg-red-900/30 border-red-300 dark:border-red-600"
                                                                : "bg-purple-100/20 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600";

                                                    return (
                                                        <div key={type} className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold capitalize">{type} Gaming</h3>
                                                                <Badge variant="secondary">{type.toUpperCase()}</Badge>
                                                                {type !== "combined" && (type === "online" ? <TrendingUp className="size-4 text-green-600" /> : <TrendingDown className="size-4 text-red-600" />)}
                                                            </div>
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full border-collapse text-sm">
                                                                    <thead>
                                                                    <tr className={`bg-gradient-to-r ${headerClass} border-b-2`}>
                                                                        <th className="p-3 text-left">Month</th>
                                                                        <th className="p-3 text-right">Stake</th>
                                                                        <th className="p-3 text-right">Payout</th>
                                                                        <th className="p-3 text-right">Cancelled</th>
                                                                        <th className="p-3 text-right">Open Tickets</th>
                                                                        <th className="p-3 text-right">GGR</th>
                                                                        <th className="p-3 text-right">GGR %</th>
                                                                        <th className="p-3 text-right">% from Stake</th>
                                                                        <th className="p-3 text-right">% from GGR</th>
                                                                        <th className="p-3 text-right">IGJ</th>
                                                                        <th className="p-3 text-right">FUGOGO</th>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {rows.length === 0 ? (
                                                                        <tr>
                                                                            <td colSpan={11} className="p-6">
                                                                                <NoDataState message={`No ${type} monthly data available.`} />
                                                                            </td>
                                                                        </tr>
                                                                    ) : (
                                                                        rows.map((row, idx) => (
                                                                            <motion.tr
                                                                                key={idx}
                                                                                initial={{ opacity: 0, y: 10 }}
                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                transition={{ delay: idx * 0.05 }}
                                                                                className={`border-b hover:bg-muted/50 ${row.month === "Total" ? `font-bold border-t-2 ${totalClass}` : ""}`}
                                                                            >
                                                                                <td className="p-3">{row.month}</td>
                                                                                <td className="p-3 text-right font-mono">{formatCurrency(row.stake)}</td>
                                                                                <td className="p-3 text-right font-mono">{formatCurrency(row.payout)}</td>
                                                                                <td className="p-3 text-right font-mono">{formatCurrency(row.cancelled)}</td>
                                                                                <td className="p-3 text-right font-mono">{formatCurrency(row.open_tickets)}</td>
                                                                                <td className="p-3 text-right font-mono text-green-600 dark:text-green-400 font-semibold">{formatCurrency(row.ggr)}</td>
                                                                                <td className="p-3 text-right font-mono">{formatPercent(row.ggr_pct)}</td>
                                                                                <td className="p-3 text-right font-mono">{formatPercent(row.percent_from_stake)}</td>
                                                                                <td className="p-3 text-right font-mono">{formatPercent(row.percent_from_ggr)}</td>
                                                                                <td className="p-3 text-right font-mono text-blue-600 dark:text-blue-400">{formatCurrency(row.igj)}</td>
                                                                                <td className="p-3 text-right font-mono text-purple-600 dark:text-purple-400">{formatCurrency(row.fugogo)}</td>
                                                                            </motion.tr>
                                                                        ))
                                                                    )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </TabsContent>

                                            {(["online", "offline"] as const).map((tab) => {
                                                const stakeData = sortByTotal(
                                                    tab === "online" ? reg.per_operator.online.stake : reg.per_operator.offline.stake,
                                                    regIdx
                                                );
                                                const ggrData = tab === "online" ? reg.per_operator.online.ggr : reg.per_operator.offline.ggr;
                                                const mergedData = mergeOperatorMetrics(stakeData, ggrData, allMonthKeys);
                                                
                                                // Apply operator search filtering
                                                const searchTerm = operatorSearch[regIdx] || "";
                                                const filteredStakeData = filterOperators(stakeData, searchTerm);
                                                const filteredGgrData = filterOperators(ggrData, searchTerm);
                                                const filteredMergedData = filterOperators(mergedData, searchTerm);

                                                return (
                                                    <TabsContent key={tab} value={tab} className="space-y-6">
                                                        {/* Search and Sort controls */}
                                                        <div className="flex justify-between items-center gap-4 mb-2">
                                                            <div className="relative max-w-sm">
                                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
                                                                <Input
                                                                    placeholder="Search by operator..."
                                                                    value={searchTerm}
                                                                    onChange={(e) => setOperatorSearch(prev => ({ ...prev, [regIdx]: e.target.value }))}
                                                                    className="pl-10"
                                                                />
                                                            </div>
                                                            <Button variant="outline" size="sm" onClick={() => toggleSortOrder(regIdx)} className="flex items-center gap-2">
                                                                <ArrowUpDown className="size-4" />
                                                                {(sortOrders[regIdx] ?? "desc") === "desc" ? "Highest → Lowest" : "Lowest → Highest"}
                                                            </Button>
                                                        </div>

                                                        {/* Stake Table */}
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle className="text-lg">
                                                                    Stake by Operator
                                                                    <Badge className={`ml-2 ${tab === "online" ? "bg-blue-100/20 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200" : "bg-orange-100/20 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200"}`}>STAKE</Badge>
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full border-collapse text-sm">
                                                                        <thead>
                                                                        <tr className={`bg-gradient-to-r ${tab === "online" ? "from-blue-100/20 to-indigo-100/20 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700" : "from-orange-100/20 to-red-100/20 dark:from-orange-900/30 dark:to-red-900/30 border-orange-200 dark:border-orange-700"} border-b-2`}>
                                                                            <th className="p-3 text-left font-semibold text-foreground">Operator</th>
                                                                            {allMonthKeys.map((m) => (
                                                                                <th key={m} className="p-3 text-right font-semibold text-foreground">
                                                                                    {monthNames[m.split("-")[1]] ?? m}
                                                                                </th>
                                                                            ))}
                                                                            <th className={`p-3 text-right font-semibold ${tab === "online" ? "bg-blue-100/20 dark:bg-blue-900/30" : "bg-orange-100/20 dark:bg-orange-900/30"}`}>TOTAL</th>
                                                                        </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                        {filteredStakeData.length === 0 ? (
                                                                            <tr>
                                                                                <td colSpan={allMonthKeys.length + 2} className="p-6">
                                                                                    {searchTerm.trim() ? (
                                                                                        <div className="text-center text-muted-foreground">
                                                                                            <p>No operators found matching "{searchTerm}"</p>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <NoDataState message="No stake data available for this regulator." />
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        ) : (
                                                                            filteredStakeData.map((row, idx) => (
                                                                                <motion.tr key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="border-b hover:bg-muted/50">
                                                                                    <td className="p-3 font-medium">{row.operator}</td>
                                                                                    {allMonthKeys.map((m) => (
                                                                                        <td key={m} className="p-3 text-right font-mono">{row[m] ? formatCurrency(row[m] as number) : ""}</td>
                                                                                    ))}
                                                                                    <td className={`p-3 text-right font-mono font-bold ${tab === "online" ? "bg-blue-100/20 dark:bg-blue-900/30" : "bg-orange-100/20 dark:bg-orange-900/30"}`}>{formatCurrency(row.TOTAL)}</td>
                                                                                </motion.tr>
                                                                            ))
                                                                        )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </CardContent>
                                                        </Card>

                                                        {/* Payout Table */}
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle className="text-lg">
                                                                    Payout by Operator
                                                                    <Badge className="ml-2 bg-amber-100/20 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">PAYOUT</Badge>
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full border-collapse text-sm">
                                                                        <thead>
                                                                        <tr className="bg-gradient-to-r from-amber-100/20 to-orange-100/20 dark:from-amber-900/30 dark:to-orange-900/30 border-b-2 border-amber-200 dark:border-amber-700">
                                                                            <th className="p-3 text-left font-semibold text-foreground">Operator</th>
                                                                            {allMonthKeys.map((m) => (
                                                                                <th key={m} className="p-3 text-right font-semibold text-foreground">{monthNames[m.split("-")[1]] ?? m}</th>
                                                                            ))}
                                                                            <th className="p-3 text-right font-semibold bg-amber-100/20 dark:bg-amber-900/30">TOTAL</th>
                                                                        </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                        {filteredMergedData.length === 0 ? (
                                                                            <tr>
                                                                                <td colSpan={allMonthKeys.length + 2} className="p-6">
                                                                                    {searchTerm.trim() ? (
                                                                                        <div className="text-center text-muted-foreground">
                                                                                            <p>No operators found matching "{searchTerm}"</p>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <NoDataState message="No payout data available for this regulator." />
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        ) : (
                                                                            filteredMergedData.map((row, idx) => (
                                                                                <tr key={idx} className="border-b hover:bg-muted/50">
                                                                                    <td className="p-3 font-medium">{row.operator}</td>
                                                                                    {allMonthKeys.map((m) => (
                                                                                        <td key={m} className="p-3 text-right font-mono">{formatCurrency(row[`${m}_payout`] as number)}</td>
                                                                                    ))}
                                                                                    <td className="p-3 text-right font-mono font-bold bg-amber-100/20 dark:bg-amber-900/30">{formatCurrency(row.TOTAL_PAYOUT as number)}</td>
                                                                                </tr>
                                                                            ))
                                                                        )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </CardContent>
                                                        </Card>

                                                        {/* GGR Table */}
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle className="text-lg">
                                                                    GGR by Operator
                                                                    <Badge className="ml-2 bg-green-100/20 dark:bg-green-900/30 text-green-800 dark:text-green-200">GGR</Badge>
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full border-collapse text-sm">
                                                                        <thead>
                                                                        <tr className="bg-gradient-to-r from-green-100/20 to-emerald-100/20 dark:from-green-900/30 dark:to-emerald-900/30 border-b-2 border-green-200 dark:border-green-700">
                                                                            <th className="p-3 text-left font-semibold text-foreground">Operator</th>
                                                                            {allMonthKeys.map((m) => (
                                                                                <th key={m} className="p-3 text-right font-semibold text-foreground">{monthNames[m.split("-")[1]] ?? m}</th>
                                                                            ))}
                                                                            <th className="p-3 text-right font-semibold bg-green-100/20 dark:bg-green-900/30">TOTAL</th>
                                                                        </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                        {filteredGgrData.length === 0 ? (
                                                                            <tr>
                                                                                <td colSpan={allMonthKeys.length + 2} className="p-6">
                                                                                    {searchTerm.trim() ? (
                                                                                        <div className="text-center text-muted-foreground">
                                                                                            <p>No operators found matching "{searchTerm}"</p>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <NoDataState message="No GGR data available for this regulator." />
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        ) : (
                                                                            filteredGgrData.map((row, idx) => (
                                                                                <tr key={idx} className="border-b hover:bg-muted/50">
                                                                                    <td className="p-3 font-medium">{row.operator}</td>
                                                                                    {allMonthKeys.map((m) => (
                                                                                        <td key={m} className="p-3 text-right font-mono text-green-600 dark:text-green-400">{row[m] ? formatCurrency(row[m] as number) : ""}</td>
                                                                                    ))}
                                                                                    <td className="p-3 text-right font-mono font-bold text-green-600 dark:text-green-400 bg-green-100/20 dark:bg-green-900/30">{formatCurrency(row.TOTAL)}</td>
                                                                                </tr>
                                                                            ))
                                                                        )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </CardContent>
                                                        </Card>

                                                        {/* GGR % Table */}
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle className="text-lg">
                                                                    GGR % by Operator
                                                                    <Badge className="ml-2 bg-purple-100/20 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">GGR %</Badge>
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full border-collapse text-sm">
                                                                        <thead>
                                                                        <tr className="bg-gradient-to-r from-purple-100/20 to-indigo-100/20 dark:from-purple-900/30 dark:to-indigo-900/30 border-b-2 border-purple-200 dark:border-purple-700">
                                                                            <th className="p-3 text-left font-semibold text-foreground">Operator</th>
                                                                            {allMonthKeys.map((m) => (
                                                                                <th key={m} className="p-3 text-right font-semibold text-foreground">{monthNames[m.split("-")[1]] ?? m}</th>
                                                                            ))}
                                                                            <th className="p-3 text-right font-semibold bg-purple-100/20 dark:bg-purple-900/30">TOTAL</th>
                                                                        </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                        {filteredMergedData.length === 0 ? (
                                                                            <tr>
                                                                                <td colSpan={allMonthKeys.length + 2} className="p-6">
                                                                                    {searchTerm.trim() ? (
                                                                                        <div className="text-center text-muted-foreground">
                                                                                            <p>No operators found matching "{searchTerm}"</p>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <NoDataState message="No GGR percentage data available for this regulator." />
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        ) : (
                                                                            filteredMergedData.map((row, idx) => (
                                                                                <tr key={idx} className="border-b hover:bg-muted/50">
                                                                                    <td className="p-3 font-medium">{row.operator}</td>
                                                                                    {allMonthKeys.map((m) => (
                                                                                        <td key={m} className="p-3 text-right font-mono">{formatPercent(row[`${m}_ggr_pct`] as number)}</td>
                                                                                    ))}
                                                                                    <td className="p-3 text-right font-mono font-bold bg-purple-100/20 dark:bg-purple-900/30">{formatPercent(row.TOTAL_GGR_PCT as number)}</td>
                                                                                </tr>
                                                                            ))
                                                                        )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </TabsContent>
                                                );
                                            })}
                                        </Tabs>
                                    </CardContent>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                );
            })
            )}
        </div>
    );
}