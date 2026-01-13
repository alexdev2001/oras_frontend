import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { motion, AnimatePresence } from 'motion/react';
import {
    Download,
    TrendingUp,
    TrendingDown,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs.tsx';
import { analyticsAPI } from '@/utils/API.ts';

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

interface RegulatorAnalytics {
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

export function AdminRegulatorDataTables() {
    const [analytics, setAnalytics] = useState<RegulatorAnalytics[]>([]);
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await analyticsAPI.getRegulatorAnalyticsAdmin();
            if (!res || cancelled) return;
            setAnalytics(res);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const toggleRegulator = (idx: number) => {
        setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const isOpen = (idx: number) => expanded[idx] ?? true; // open by default

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

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);

    const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

    return (
        <div className="space-y-8">

            {analytics.map((reg, regIdx) => {
                const allMonthKeys = Array.from(
                    new Set([
                        ...reg.per_operator.online.stake.flatMap(r =>
                            Object.keys(r).filter(k => k !== 'operator' && k !== 'TOTAL')
                        ),
                        ...reg.per_operator.online.ggr.flatMap(r =>
                            Object.keys(r).filter(k => k !== 'operator' && k !== 'TOTAL')
                        ),
                        ...reg.per_operator.offline.stake.flatMap(r =>
                            Object.keys(r).filter(k => k !== 'operator' && k !== 'TOTAL')
                        ),
                        ...reg.per_operator.offline.ggr.flatMap(r =>
                            Object.keys(r).filter(k => k !== 'operator' && k !== 'TOTAL')
                        ),
                    ])
                ).sort();

                return (
                    <Card key={regIdx} className="shadow-sm">
                        {/* Collapsible Header */}
                        <CardHeader
                            className="cursor-pointer select-none"
                            onClick={() => toggleRegulator(regIdx)}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold">
                                        {reg.regulator_name}
                                    </CardTitle>
                                    <CardDescription>
                                        Detailed performance overview
                                    </CardDescription>
                                </div>
                                {isOpen(regIdx) ? (
                                    <ChevronDown className="size-5 text-gray-500" />
                                ) : (
                                    <ChevronRight className="size-5 text-gray-500" />
                                )}
                            </div>
                        </CardHeader>

                        {/* Collapsible Content */}
                        <AnimatePresence initial={false}>
                            {isOpen(regIdx) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                >
                                    <CardContent>
                                        <Tabs defaultValue="monthly" className="w-full">
                                            <TabsList className="mb-6">
                                                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                                <TabsTrigger value="online">Online</TabsTrigger>
                                                <TabsTrigger value="offline">Offline</TabsTrigger>
                                            </TabsList>

                                            {/* MONTHLY SUMMARY */}
                                            <TabsContent value="monthly" className="space-y-6">
                                                {(['online', 'offline', 'combined'] as const).map(type => {
                                                    const rows = reg.monthly[type];
                                                    const headerClass =
                                                        type === 'online'
                                                            ? 'from-indigo-50 to-blue-50 border-indigo-200'
                                                            : type === 'offline'
                                                                ? 'from-red-50 to-orange-50 border-red-200'
                                                                : 'from-purple-50 to-indigo-50 border-purple-200';
                                                    const totalClass =
                                                        type === 'online'
                                                            ? 'bg-indigo-50 border-indigo-300'
                                                            : type === 'offline'
                                                                ? 'bg-red-50 border-red-300'
                                                                : 'bg-purple-50 border-purple-300';

                                                    return (
                                                        <div key={type} className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold capitalize">{type} Gaming</h3>
                                                                <Badge variant="secondary">{type.toUpperCase()}</Badge>
                                                                {type !== 'combined' &&
                                                                    (type === 'online'
                                                                        ? <TrendingUp className="size-4 text-green-600" />
                                                                        : <TrendingDown className="size-4 text-red-600" />)}
                                                            </div>

                                                            <div className="overflow-x-auto">
                                                                <table className="w-full border-collapse text-sm">
                                                                    <thead>
                                                                    <tr className={`bg-gradient-to-r ${headerClass} border-b-2`}>
                                                                        <th className="p-3 text-left font-semibold text-gray-700">Month</th>
                                                                        <th className="p-3 text-right font-semibold text-gray-700">Stake</th>
                                                                        <th className="p-3 text-right font-semibold text-gray-700">Payout</th>
                                                                        <th className="p-3 text-right font-semibold text-gray-700">Cancelled</th>
                                                                        <th className="p-3 text-right font-semibold text-gray-700">Open Tickets</th>
                                                                        <th className="p-3 text-right font-semibold text-gray-700">GGR</th>
                                                                        <th className="p-3 text-right font-semibold text-gray-700">GGR %</th>
                                                                        <th className="p-3 text-right font-semibold text-gray-700">% from Stake</th>
                                                                        <th className="p-3 text-right font-semibold text-gray-700">% from GGR</th>
                                                                        <th className="p-3 text-right font-semibold text-gray-700">IGJ</th>
                                                                        <th className="p-3 text-right font-semibold text-gray-700">FUGOGO</th>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {rows.map((row, idx) => (
                                                                        <motion.tr
                                                                            key={idx}
                                                                            initial={{ opacity: 0, y: 10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            transition={{ delay: idx * 0.05 }}
                                                                            className={`border-b hover:bg-gray-50 transition ${row.month === 'Total' ? `font-bold border-t-2 ${totalClass}` : ''}`}
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
                                                        </div>
                                                    );
                                                })}
                                            </TabsContent>

                                            {/* PER OPERATOR */}
                                            {(['online', 'offline'] as const).map(tab => {
                                                const stakeData = tab === 'online' ? reg.per_operator.online.stake : reg.per_operator.offline.stake;
                                                const ggrData = tab === 'online' ? reg.per_operator.online.ggr : reg.per_operator.offline.ggr;

                                                return (
                                                    <TabsContent key={tab} value={tab} className="space-y-6">
                                                        {/* Stake Table */}
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle className="text-lg">
                                                                    Stake by Operator
                                                                    <Badge className={`ml-2 ${tab === 'online' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                                        STAKE
                                                                    </Badge>
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full border-collapse text-sm">
                                                                        <thead>
                                                                        <tr className={`bg-gradient-to-r ${tab === 'online' ? 'from-blue-50 to-indigo-50 border-blue-200' : 'from-orange-50 to-red-50 border-orange-200'} border-b-2`}>
                                                                            <th className="p-3 text-left font-semibold text-gray-700">Operator</th>
                                                                            {allMonthKeys.map(m => {
                                                                                const [, month] = m.split('-');
                                                                                return <th key={m} className="p-3 text-right font-semibold text-gray-700">{monthNames[month] ?? m}</th>;
                                                                            })}
                                                                            <th className={`p-3 text-right font-semibold ${tab === 'online' ? 'bg-blue-50' : 'bg-orange-50'}`}>TOTAL</th>
                                                                        </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                        {stakeData.map((row, idx) => (
                                                                            <motion.tr key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="border-b hover:bg-gray-50 transition">
                                                                                <td className="p-3 font-medium">{row.operator}</td>
                                                                                {allMonthKeys.map(m => (
                                                                                    <td key={m} className="p-3 text-right font-mono">{row[m] ? formatCurrency(row[m] as number) : ''}</td>
                                                                                ))}
                                                                                <td className={`p-3 text-right font-mono font-bold ${tab === 'online' ? 'bg-blue-50' : 'bg-orange-50'}`}>{formatCurrency(row.TOTAL as number)}</td>
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
                                                                <CardTitle className="text-lg">
                                                                    GGR by Operator
                                                                    <Badge className="ml-2 bg-green-100 text-green-800">GGR</Badge>
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full border-collapse text-sm">
                                                                        <thead>
                                                                        <tr className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                                                                            <th className="p-3 text-left font-semibold text-gray-700">Operator</th>
                                                                            {allMonthKeys.map(m => {
                                                                                const [, month] = m.split('-');
                                                                                return <th key={m} className="p-3 text-right font-semibold text-gray-700">{monthNames[month] ?? m}</th>;
                                                                            })}
                                                                            <th className="p-3 text-right font-semibold text-green-100">TOTAL</th>
                                                                        </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                        {ggrData.map((row, idx) => (
                                                                            <motion.tr key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="border-b hover:bg-gray-50 transition">
                                                                                <td className="p-3 font-medium">{row.operator}</td>
                                                                                {allMonthKeys.map(m => (
                                                                                    <td key={m} className="p-3 text-right font-mono text-green-700">{row[m] ? formatCurrency(row[m] as number) : ''}</td>
                                                                                ))}
                                                                                <td className="p-3 text-right font-mono font-bold text-green-800 bg-green-50">{formatCurrency(row.TOTAL as number)}</td>
                                                                            </motion.tr>
                                                                        ))}
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
            })}
        </div>
    );
}