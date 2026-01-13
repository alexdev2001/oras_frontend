import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { motion } from 'motion/react';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import {analyticsAPI} from "@/utils/API.ts";

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
    [key: string]: number | string;
}

interface RegulatorDataTablesProps {
    regulatorId: number;
}

export function RegulatorDataTables({ regulatorId }: RegulatorDataTablesProps) {
    const [monthlyOnline, setMonthlyOnline] = useState<MonthlyData[]>([]);
    const [monthlyOffline, setMonthlyOffline] = useState<MonthlyData[]>([]);
    const [monthlyCombined, setMonthlyCombined] = useState<MonthlyData[]>([]);
    const [perOpOnlineStake, setPerOpOnlineStake] = useState<PerOperatorData[]>([]);
    const [perOpOnlineGGR, setPerOpOnlineGGR] = useState<PerOperatorData[]>([]);
    const [perOpOfflineStake, setPerOpOfflineStake] = useState<PerOperatorData[]>([]);
    const [perOpOfflineGGR, setPerOpOfflineGGR] = useState<PerOperatorData[]>([]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const analytics = await analyticsAPI.getRegulatorAnalytics(regulatorId);
            console.log('analytics', analytics);
            if (!analytics || cancelled) return;

            setMonthlyOnline(analytics?.monthly?.online ?? []);
            setMonthlyOffline(analytics?.monthly?.offline ?? []);
            setMonthlyCombined(analytics?.monthly?.combined ?? []);

            setPerOpOnlineStake(analytics?.per_operator?.online?.stake ?? []);
            setPerOpOnlineGGR(analytics?.per_operator?.online?.ggr ?? []);
            setPerOpOfflineStake(analytics?.per_operator?.offline?.stake ?? []);
            setPerOpOfflineGGR(analytics?.per_operator?.offline?.ggr ?? []);
        })();

        return () => {
            cancelled = true;
        };
    }, [regulatorId]);

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

    const allMonthKeys = Array.from(
        new Set(
            perOpOnlineGGR.flatMap((row) =>
                Object.keys(row).filter((key) => key !== "operator" && key !== "TOTAL")
            )
        )
    ).sort()

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatPercent = (value: number) => {
        return `${(value * 100).toFixed(2)}%`;
    };

    const handleDownloadExcel = () => {
        // TODO: Implement Excel download from backend
        alert('Excel download will be implemented with backend integration');
    };

    return (
        <div className="space-y-6">
            {/* Header with Download */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Data Analytics</h2>
                    <p className="text-sm text-gray-600">Comprehensive metrics and operator performance</p>
                </div>
                <Button onClick={handleDownloadExcel} className="bg-indigo-600 hover:bg-indigo-700">
                    <Download className="size-4 mr-2" />
                    Download Excel
                </Button>
            </div>

            <Tabs defaultValue="monthly" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
                    <TabsTrigger value="online">Per Operator (Online)</TabsTrigger>
                    <TabsTrigger value="offline">Per Operator (Offline)</TabsTrigger>
                </TabsList>

                {/* MONTHLY SUMMARY TAB */}
                <TabsContent value="monthly" className="space-y-6 mt-6">
                    {/* Online Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        Online Gaming
                                        <Badge className="bg-green-100 text-green-800">ONLINE</Badge>
                                    </CardTitle>
                                    <CardDescription>Monthly performance metrics for online gaming operations</CardDescription>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <TrendingUp className="size-4 text-green-600" />
                                    <span className="font-medium">12% IGJ | 8% FUGOGO</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b-2 border-indigo-200">
                                        <th className="text-left p-3 font-semibold text-gray-700">Month</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">Stake</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">Payout</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">Cancelled</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">Open Tickets</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">GGR</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">GGR %</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">% from Stake</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">% from GGR</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">IGJ</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">FUGOGO</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {monthlyOnline.map((row, idx) => (
                                        <motion.tr
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`border-b hover:bg-gray-50 transition ${
                                                row.month === 'Total' ? 'bg-indigo-50 font-bold border-t-2 border-indigo-300' : ''
                                            }`}
                                        >
                                            <td className="p-3">{row.month}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.stake)}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.payout)}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.cancelled)}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.open_tickets)}</td>
                                            <td className="p-3 text-right font-mono text-green-700 font-semibold">{formatCurrency(row.ggr)}</td>
                                            <td className="p-3 text-right font-mono">{formatPercent(row.ggr_pct)}</td>
                                            <td className="p-3 text-right font-mono">{formatPercent(row.percent_from_stake)}</td>
                                            <td className="p-3 text-right font-mono">{formatPercent(row.percent_from_ggr)}</td>
                                            <td className="p-3 text-right font-mono text-blue-700">{formatCurrency(row.igj)}</td>
                                            <td className="p-3 text-right font-mono text-purple-700">{formatCurrency(row.fugogo)}</td>
                                        </motion.tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Offline Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        Offline Gaming
                                        <Badge className="bg-red-100 text-red-800">OFFLINE</Badge>
                                    </CardTitle>
                                    <CardDescription>Monthly performance metrics for offline gaming operations</CardDescription>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <TrendingDown className="size-4 text-red-600" />
                                    <span className="font-medium">3% IGJ | 5% FUGOGO</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="bg-gradient-to-r from-red-50 to-orange-50 border-b-2 border-red-200">
                                        <th className="text-left p-3 font-semibold text-gray-700">Month</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">Stake</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">Payout</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">Cancelled</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">Open Tickets</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">GGR</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">GGR %</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">% from Stake</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">% from GGR</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">IGJ</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">FUGOGO</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {monthlyOffline.map((row, idx) => (
                                        <motion.tr
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`border-b hover:bg-gray-50 transition ${
                                                row.month === 'Total' ? 'bg-red-50 font-bold border-t-2 border-red-300' : ''
                                            }`}
                                        >
                                            <td className="p-3">{row.month}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.stake)}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.payout)}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.cancelled)}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.open_tickets)}</td>
                                            <td className="p-3 text-right font-mono text-green-700 font-semibold">{formatCurrency(row.ggr)}</td>
                                            <td className="p-3 text-right font-mono">{formatPercent(row.ggr_pct)}</td>
                                            <td className="p-3 text-right font-mono">{formatPercent(row.percent_from_stake)}</td>
                                            <td className="p-3 text-right font-mono">{formatPercent(row.percent_from_ggr)}</td>
                                            <td className="p-3 text-right font-mono text-blue-700">{formatCurrency(row.igj)}</td>
                                            <td className="p-3 text-right font-mono text-purple-700">{formatCurrency(row.fugogo)}</td>
                                        </motion.tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Combined Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        Combined (Online + Offline)
                                        <Badge className="bg-purple-100 text-purple-800">TOTAL</Badge>
                                    </CardTitle>
                                    <CardDescription>Aggregated performance across all gaming channels</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-200">
                                        <th className="text-left p-3 font-semibold text-gray-700">Month</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">Stake</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">Payout</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">Cancelled</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">Open Tickets</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">GGR</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">GGR %</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">% from Stake</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">% from GGR</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">IGJ</th>
                                        <th className="text-right p-3 font-semibold text-gray-700">FUGOGO</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {monthlyCombined.map((row, idx) => (
                                        <motion.tr
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`border-b hover:bg-gray-50 transition ${
                                                row.month === 'Total' ? 'bg-purple-50 font-bold border-t-2 border-purple-300' : ''
                                            }`}
                                        >
                                            <td className="p-3">{row.month}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.stake)}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.payout)}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.cancelled)}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.open_tickets)}</td>
                                            <td className="p-3 text-right font-mono text-green-700 font-semibold">{formatCurrency(row.ggr)}</td>
                                            <td className="p-3 text-right font-mono">{formatPercent(row.ggr_pct)}</td>
                                            <td className="p-3 text-right font-mono">{formatPercent(row.percent_from_stake)}</td>
                                            <td className="p-3 text-right font-mono">{formatPercent(row.percent_from_ggr)}</td>
                                            <td className="p-3 text-right font-mono text-blue-700">{formatCurrency(row.igj)}</td>
                                            <td className="p-3 text-right font-mono text-purple-700">{formatCurrency(row.fugogo)}</td>
                                        </motion.tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PER OPERATOR ONLINE TAB */}
                <TabsContent value="online" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                Stake by Operator (Online)
                                <Badge className="bg-blue-100 text-blue-800">STAKE</Badge>
                            </CardTitle>
                            <CardDescription>Monthly stake breakdown per operator for online gaming</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                                        <th className="text-left p-3 font-semibold text-gray-700">Operator</th>

                                        {allMonthKeys.map((monthKey) => {
                                            const [year, month] = monthKey.split("-");
                                            return (
                                                <th key={monthKey} className="text-right p-3 font-semibold text-gray-700">
                                                    {monthNames[month] ?? monthKey}
                                                </th>
                                            );
                                        })}

                                        <th className="text-right p-3 font-semibold text-gray-700 bg-blue-100">TOTAL</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {perOpOnlineStake.map((row, idx) => (
                                        <motion.tr
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="border-b hover:bg-gray-50 transition"
                                        >
                                            <td className="p-3 font-medium">{row.operator}</td>

                                            {allMonthKeys.map((monthKey) => (
                                                <td key={monthKey} className="p-3 text-right font-mono">
                                                    {row[monthKey] !== undefined ? formatCurrency(row[monthKey] as number) : ""}
                                                </td>
                                            ))}

                                            <td className="p-3 text-right font-mono font-bold bg-blue-50">
                                                {formatCurrency(row.TOTAL as number)}
                                            </td>
                                        </motion.tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* GGR Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                GGR by Operator (Online)
                                <Badge className="bg-green-100 text-green-800">GGR</Badge>
                            </CardTitle>
                            <CardDescription>Monthly GGR breakdown per operator for online gaming</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                                        <th className="text-left p-3 font-semibold text-gray-700">Operator</th>

                                        {allMonthKeys.map((monthKey) => {
                                            const [year, month] = monthKey.split("-");
                                            return (
                                                <th key={monthKey} className="text-right p-3 font-semibold text-gray-700">
                                                    {monthNames[month] ?? monthKey}
                                                </th>
                                            );
                                        })}

                                        <th className="text-right p-3 font-semibold text-gray-700 bg-green-100">TOTAL</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {perOpOnlineGGR.map((row, idx) => (
                                        <motion.tr
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="border-b hover:bg-gray-50 transition"
                                        >
                                            <td className="p-3 font-medium">{row.operator}</td>

                                            {allMonthKeys.map((monthKey) => (
                                                <td key={monthKey} className="p-3 text-right font-mono text-green-700">
                                                    {row[monthKey] !== undefined ? formatCurrency(row[monthKey] as number) : ""}
                                                </td>
                                            ))}

                                            <td className="p-3 text-right font-mono font-bold text-green-800 bg-green-50">
                                                {formatCurrency(row.TOTAL as number)}
                                            </td>
                                        </motion.tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PER OPERATOR OFFLINE TAB */}
                <TabsContent value="offline" className="space-y-6 mt-6">
                    {/* Stake Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                Stake by Operator (Offline)
                                <Badge className="bg-orange-100 text-orange-800">STAKE</Badge>
                            </CardTitle>
                            <CardDescription>Monthly stake breakdown per operator for offline gaming</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-orange-200">
                                        <th className="text-left p-3 font-semibold text-gray-700">Operator</th>

                                        {/* Dynamic month headers */}
                                        {allMonthKeys.map((monthKey) => {
                                            const [year, month] = monthKey.split("-");
                                            return (
                                                <th key={monthKey} className="text-right p-3 font-semibold text-gray-700">
                                                    {monthNames[month] ?? monthKey}
                                                </th>
                                            );
                                        })}

                                        <th className="text-right p-3 font-semibold text-gray-700 bg-orange-100">TOTAL</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {perOpOfflineStake.map((row, idx) => (
                                        <motion.tr
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="border-b hover:bg-gray-50 transition"
                                        >
                                            <td className="p-3 font-medium">{row.operator}</td>

                                            {/* Dynamic month values or blank */}
                                            {allMonthKeys.map((monthKey) => (
                                                <td key={monthKey} className="p-3 text-right font-mono">
                                                    {row[monthKey] !== undefined ? formatCurrency(row[monthKey] as number) : ""}
                                                </td>
                                            ))}

                                            <td className="p-3 text-right font-mono font-bold bg-orange-50">
                                                {formatCurrency(row.TOTAL as number)}
                                            </td>
                                        </motion.tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* GGR Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                GGR by Operator (Offline)
                                <Badge className="bg-green-100 text-green-800">GGR</Badge>
                            </CardTitle>
                            <CardDescription>Monthly GGR breakdown per operator for offline gaming</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                                        <th className="text-left p-3 font-semibold text-gray-700">Operator</th>

                                        {/* Dynamic month headers */}
                                        {allMonthKeys.map((monthKey) => {
                                            const [year, month] = monthKey.split("-");
                                            return (
                                                <th key={monthKey} className="text-right p-3 font-semibold text-gray-700">
                                                    {monthNames[month] ?? monthKey}
                                                </th>
                                            );
                                        })}

                                        <th className="text-right p-3 font-semibold text-gray-700 bg-green-100">TOTAL</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {perOpOfflineGGR.map((row, idx) => (
                                        <motion.tr
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="border-b hover:bg-gray-50 transition"
                                        >
                                            <td className="p-3 font-medium">{row.operator}</td>

                                            {allMonthKeys.map((monthKey) => (
                                                <td key={monthKey} className="p-3 text-right font-mono text-green-700">
                                                    {row[monthKey] !== undefined ? formatCurrency(row[monthKey] as number) : ""}
                                                </td>
                                            ))}

                                            <td className="p-3 text-right font-mono font-bold text-green-800 bg-green-50">
                                                {formatCurrency(row.TOTAL as number)}
                                            </td>
                                        </motion.tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
