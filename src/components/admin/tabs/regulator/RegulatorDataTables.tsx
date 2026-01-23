"use client";

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { motion } from 'motion/react';
import {
    TrendingUp,
    TrendingDown,
    ArrowUpDown,
    Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs.tsx';
import { Input } from '@/components/ui/input.tsx';
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
    TOTAL: number;
    [key: string]: number | string;
}

interface RegulatorDataTablesProps {
    regulatorId: number;
}

type SortOrder = 'asc' | 'desc';

export function RegulatorDataTables({ regulatorId }: RegulatorDataTablesProps) {
    const [monthlyOnline, setMonthlyOnline] = useState<MonthlyData[]>([]);
    const [monthlyOffline, setMonthlyOffline] = useState<MonthlyData[]>([]);
    const [monthlyCombined, setMonthlyCombined] = useState<MonthlyData[]>([]);

    const [perOpOnlineStake, setPerOpOnlineStake] = useState<PerOperatorData[]>([]);
    const [perOpOnlineGGR, setPerOpOnlineGGR] = useState<PerOperatorData[]>([]);
    const [perOpOfflineStake, setPerOpOfflineStake] = useState<PerOperatorData[]>([]);
    const [perOpOfflineGGR, setPerOpOfflineGGR] = useState<PerOperatorData[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const [sortOrders, setSortOrders] = useState<{ online: SortOrder; offline: SortOrder }>({
        online: 'desc',
        offline: 'desc',
    });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const analytics = await analyticsAPI.getRegulatorAnalytics(regulatorId);
            if (!analytics || cancelled) return;

            setMonthlyOnline(analytics.monthly?.online ?? []);
            setMonthlyOffline(analytics.monthly?.offline ?? []);
            setMonthlyCombined(analytics.monthly?.combined ?? []);

            setPerOpOnlineStake(analytics.per_operator?.online?.stake ?? []);
            setPerOpOnlineGGR(analytics.per_operator?.online?.ggr ?? []);
            setPerOpOfflineStake(analytics.per_operator?.offline?.stake ?? []);
            setPerOpOfflineGGR(analytics.per_operator?.offline?.ggr ?? []);
        })();
        return () => { cancelled = true; };
    }, [regulatorId]);

    const monthNames: Record<string, string> = {
        "01": "January","02": "February","03": "March","04": "April",
        "05": "May","06": "June","07": "July","08": "August",
        "09": "September","10": "October","11": "November","12": "December"
    };

    const allMonthKeys = Array.from(
        new Set([
            ...perOpOnlineStake,
            ...perOpOnlineGGR,
            ...perOpOfflineStake,
            ...perOpOfflineGGR,
        ].flatMap(r =>
            Object.keys(r).filter(k => k !== 'operator' && k !== 'TOTAL')
        ))
    ).sort();

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK', minimumFractionDigits: 0 }).format(v);

    const formatPercent = (v: number) => `${(v * 100).toFixed(2)}%`;

    const mergeOperatorMetrics = (stake: PerOperatorData[], ggr: PerOperatorData[]) => {
        const ggrMap = new Map(ggr.map(r => [r.operator, r]));
        return stake.map(stakeRow => {
            const ggrRow = ggrMap.get(stakeRow.operator);
            const merged: PerOperatorData = { operator: stakeRow.operator, TOTAL: stakeRow.TOTAL as number };
            allMonthKeys.forEach(m => {
                const s = Number(stakeRow[m] ?? 0);
                const g = Number(ggrRow?.[m] ?? 0);
                merged[`${m}_payout`] = s - g;
                merged[`${m}_ggr_pct`] = s > 0 ? g / s : 0;
            });
            merged.TOTAL_PAYOUT = (stakeRow.TOTAL as number) - (ggrRow?.TOTAL ?? 0);
            merged.TOTAL_GGR_PCT = (stakeRow.TOTAL as number) > 0 ? (ggrRow?.TOTAL ?? 0) / (stakeRow.TOTAL as number) : 0;
            return merged;
        });
    };

    // Filter operators based on search term
    const filterOperators = (data: PerOperatorData[]) => {
        if (!searchTerm.trim()) return data;
        return data.filter(row => 
            row.operator.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const toggleSort = (tab: 'online' | 'offline') => {
        setSortOrders(prev => ({ ...prev, [tab]: prev[tab] === 'desc' ? 'asc' : 'desc' }));
    };

    const sortByTotal = (rows: PerOperatorData[], tab: 'online' | 'offline') =>
        [...rows].sort((a, b) =>
            sortOrders[tab] === 'desc'
                ? (b.TOTAL as number) - (a.TOTAL as number)
                : (a.TOTAL as number) - (b.TOTAL as number)
        );

    const NoDataState = ({ message }: { message: string }) => (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/30">
            <TrendingDown className="size-8 mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">{message}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <Tabs defaultValue="monthly">
                <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
                    <TabsTrigger value="online">Per Operator (Online)</TabsTrigger>
                    <TabsTrigger value="offline">Per Operator (Offline)</TabsTrigger>
                </TabsList>

                {/* MONTHLY DATA */}
                {(['online', 'offline', 'combined'] as const).map(type => {
                    const rows = type === 'online' ? monthlyOnline : type === 'offline' ? monthlyOffline : monthlyCombined;
                    const headerClass =
                        type === 'online' ? 'from-indigo-100/20 to-blue-100/20 dark:from-indigo-900/30 dark:to-blue-900/30 border-indigo-200 dark:border-indigo-700'
                            : type === 'offline' ? 'from-red-100/20 to-orange-100/20 dark:from-red-900/30 dark:to-orange-900/30 border-red-200 dark:border-red-700'
                                : 'from-purple-100/20 to-indigo-100/20 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-200 dark:border-purple-700';
                    const totalClass =
                        type === 'online' ? 'bg-indigo-100/20 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600'
                            : type === 'offline' ? 'bg-red-100/20 dark:bg-red-900/30 border-red-300 dark:border-red-600'
                                : 'bg-purple-100/20 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600';
                    const Icon = type === 'online' ? <TrendingUp className="size-4 text-green-600"/> : type === 'offline' ? <TrendingDown className="size-4 text-red-600"/> : null;

                    return (
                        <TabsContent key={type} value="monthly" className="mt-6 space-y-4">
                            {rows.length === 0 ? (
                                <NoDataState message={`No ${type} monthly data available.`}/>
                            ) : (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 capitalize">
                                            {type} Gaming <Badge variant="secondary">{type.toUpperCase()}</Badge> {Icon}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm border-collapse">
                                                <thead>
                                                <tr className={`bg-gradient-to-r ${headerClass} border-b-2`}>
                                                    <th className="p-3 text-left">Month</th>
                                                    <th className="p-3 text-right">Stake</th>
                                                    <th className="p-3 text-right">Payout</th>
                                                    <th className="p-3 text-right">Cancelled</th>
                                                    <th className="p-3 text-right">Open Tickets</th>
                                                    <th className="p-3 text-right">GGR</th>
                                                    <th className="p-3 text-right">GGR %</th>
                                                    <th className="p-3 text-right">% Stake</th>
                                                    <th className="p-3 text-right">% GGR</th>
                                                    <th className="p-3 text-right">IGJ</th>
                                                    <th className="p-3 text-right">FUGOGO</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {rows.map((row, idx) => (
                                                    <motion.tr key={idx} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: idx*0.05}} className={`border-b hover:bg-muted/50 ${row.month==='Total'?`font-bold border-t-2 ${totalClass}`:''}`}>
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
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    );
                })}

                {/* PER OPERATOR TABLES WITH ADMIN STYLE */}
                {(['online','offline'] as const).map(tab => {
                    const stakeData = tab==='online'? perOpOnlineStake: perOpOfflineStake;
                    const ggrData = tab==='online'? perOpOnlineGGR: perOpOfflineGGR;
                    const mergedData = mergeOperatorMetrics(filterOperators(stakeData), filterOperators(ggrData));

                    return (
                        <TabsContent key={tab} value={tab} className="space-y-8">
                            {/* Search Bar */}
                            <div className="mb-8">
                                <div className="relative max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
                                    <Input
                                        type="text"
                                        placeholder="Search by operator name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end mb-2">
                                <Button variant="outline" size="sm" onClick={()=>toggleSort(tab)}>
                                    <ArrowUpDown className="size-4 mr-2"/>
                                    {sortOrders[tab]==='desc'?'Highest → Lowest':'Lowest → Highest'}
                                </Button>
                            </div>

                            {/* Stake */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Stake by Operator
                                        <Badge className={`ml-2 ${tab==='online'?'bg-blue-100 text-blue-800':'bg-orange-100 text-orange-800'}`}>STAKE</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className={`w-full border-collapse text-sm ${tab==='online'?'from-blue-50 to-indigo-50 border-blue-200':'from-orange-50 to-red-50 border-orange-200'}`}>
                                            <thead>
                                            <tr className={`border-b-2 ${tab==='online'?'bg-gradient-to-r from-blue-100/20 to-indigo-100/20 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700':'bg-gradient-to-r from-orange-100/20 to-red-100/20 dark:from-orange-900/30 dark:to-red-900/30 border-orange-200 dark:border-orange-700'}`}>
                                                <th className="p-3 text-left font-semibold text-foreground">Operator</th>
                                                {allMonthKeys.map(m=><th key={m} className="p-3 text-right font-semibold text-foreground">{monthNames[m.split('-')[1]]??m}</th>)}
                                                <th className={`p-3 text-right font-semibold ${tab==='online'?'bg-blue-100/20 dark:bg-blue-900/30':'bg-orange-100/20 dark:bg-orange-900/30'}`}>TOTAL</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {stakeData.length===0 && searchTerm.trim()!==''?
                                                <tr><td colSpan={allMonthKeys.length+2} className="p-6"><NoDataState message="No operators found matching your search"/></td></tr>:
                                                sortByTotal(filterOperators(stakeData), tab).map((row,idx)=>(
                                                    <motion.tr key={idx} initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} transition={{delay:idx*0.04}} className="border-b hover:bg-muted/50">
                                                        <td className="p-3 font-medium">{row.operator}</td>
                                                        {allMonthKeys.map(m=><td key={m} className="p-3 text-right font-mono">{row[m]?formatCurrency(row[m] as number):''}</td>)}
                                                        <td className={`p-3 text-right font-mono font-bold ${tab==='online'?'bg-blue-100/20 dark:bg-blue-900/30':'bg-orange-100/20 dark:bg-orange-900/30'}`}>{formatCurrency(row.TOTAL)}</td>
                                                    </motion.tr>
                                                ))
                                            }
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payout */}
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
                                                {allMonthKeys.map(m=><th key={m} className="p-3 text-right font-semibold text-foreground">{monthNames[m.split('-')[1]]??m}</th>)}
                                                <th className="p-3 text-right font-semibold bg-amber-100/20 dark:bg-amber-900/30">TOTAL</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {mergeOperatorMetrics(filterOperators(stakeData), filterOperators(ggrData)).map((row,idx)=>(
                                                <tr key={idx} className="border-b hover:bg-muted/50">
                                                    <td className="p-3 font-medium">{row.operator}</td>
                                                    {allMonthKeys.map(m=><td key={m} className="p-3 text-right font-mono">{formatCurrency(row[`${m}_payout`] as number)}</td>)}
                                                    <td className="p-3 text-right font-mono font-bold bg-amber-100/20 dark:bg-amber-900/30">{formatCurrency(row.TOTAL_PAYOUT as number)}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* GGR */}
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
                                                {allMonthKeys.map(m=><th key={m} className="p-3 text-right font-semibold text-foreground">{monthNames[m.split('-')[1]]??m}</th>)}
                                                <th className="p-3 text-right font-semibold bg-green-100/20 dark:bg-green-900/30">TOTAL</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {ggrData.length===0 && searchTerm.trim()!==''?
                                                <tr><td colSpan={allMonthKeys.length+2} className="p-6"><NoDataState message="No operators found matching your search"/></td></tr>:
                                                sortByTotal(filterOperators(ggrData), tab).map((row,idx)=>(
                                                    <motion.tr key={idx} initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} transition={{delay:idx*0.04}} className="border-b hover:bg-muted/50">
                                                        <td className="p-3 font-medium">{row.operator}</td>
                                                        {allMonthKeys.map(m=><td key={m} className="p-3 text-right font-mono text-green-600 dark:text-green-400">{row[m]?formatCurrency(row[m] as number):''}</td>)}
                                                        <td className="p-3 text-right font-mono font-bold text-green-600 dark:text-green-400 bg-green-100/20 dark:bg-green-900/30">{formatCurrency(row.TOTAL)}</td>
                                                    </motion.tr>
                                                ))
                                            }
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* GGR % */}
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
                                                {allMonthKeys.map(m=><th key={m} className="p-3 text-right font-semibold text-foreground">{monthNames[m.split('-')[1]]??m}</th>)}
                                                <th className="p-3 text-right font-semibold bg-purple-100/20 dark:bg-purple-900/30">TOTAL</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {mergedData.length===0 && searchTerm.trim()!==''?
                                                <tr><td colSpan={allMonthKeys.length+2} className="p-6"><NoDataState message="No operators found matching your search"/></td></tr>:
                                                mergedData.map((row,idx)=>(
                                                <tr key={idx} className="border-b hover:bg-muted/50">
                                                    <td className="p-3 font-medium">{row.operator}</td>
                                                    {allMonthKeys.map(m=><td key={m} className="p-3 text-right font-mono">{formatPercent(row[`${m}_ggr_pct`] as number)}</td>)}
                                                    <td className="p-3 text-right font-mono font-bold bg-purple-100/20 dark:bg-purple-900/30">{formatPercent(row.TOTAL_GGR_PCT as number)}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )
                })}
            </Tabs>
        </div>
    )
}