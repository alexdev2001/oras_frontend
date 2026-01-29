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
    Search,
} from 'lucide-react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs.tsx';
import { Input } from '@/components/ui/input.tsx';
import { reportsAPI, managementAPI } from '@/utils/API.ts';

interface MaglaOperator {
    operator_id: number;
    operator_name: string;
    email: string;
    is_active: boolean;
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

interface OperatorMetrics {
    operator: MaglaOperator;
    metrics: MaglaMetrics[];
    monthlyData: MonthlyOperatorData[];
}

interface MonthlyOperatorData {
    month: string;
    total_stake: number;
    total_winnings: number;
    ggr: number;
    det_levy: number;
    gaming_tax: number;
    ngr_post_levy: number;
    total_bet_count: number;
    ggr_percentage: number;
}

export function MaglaDataTables() {
    const [operators, setOperators] = useState<MaglaOperator[]>([]);
    const [operatorMetrics, setOperatorMetrics] = useState<OperatorMetrics[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedOperator, setSelectedOperator] = useState<string>('all');

    useEffect(() => {
        loadMaglaAnalytics();
    }, []);

    const loadMaglaAnalytics = async () => {
        setIsLoading(true);
        try {
            // Load all operators
            const operatorsData = await managementAPI.getOperators();
            setOperators(operatorsData);

            // Load metrics for each operator
            const allOperatorMetrics: OperatorMetrics[] = [];
            
            for (const operator of operatorsData) {
                try {
                    const metrics = await reportsAPI.getOperatorMetrics(operator.operator_id);
                    
                    // Group metrics by month
                    const monthlyDataMap = new Map<string, MonthlyOperatorData>();
                    
                    (metrics as MaglaMetrics[]).forEach(metric => {
                        const month = metric.created_at.substring(0, 7); // YYYY-MM format
                        
                        if (!monthlyDataMap.has(month)) {
                            monthlyDataMap.set(month, {
                                month,
                                total_stake: 0,
                                total_winnings: 0,
                                ggr: 0,
                                det_levy: 0,
                                gaming_tax: 0,
                                ngr_post_levy: 0,
                                total_bet_count: 0,
                                ggr_percentage: 0
                            });
                        }
                        
                        const monthData = monthlyDataMap.get(month)!;
                        monthData.total_stake += metric.total_stake;
                        monthData.total_winnings += metric.total_winnings;
                        monthData.ggr += metric.ggr;
                        monthData.det_levy += metric.det_levy;
                        monthData.gaming_tax += metric.gaming_tax;
                        monthData.ngr_post_levy += metric.ngr_post_levy;
                        monthData.total_bet_count += metric.total_bet_count;
                        monthData.ggr_percentage = monthData.total_stake > 0 ? monthData.ggr / monthData.total_stake : 0;
                    });
                    
                    const monthlyData = Array.from(monthlyDataMap.values())
                        .sort((a, b) => a.month.localeCompare(b.month));
                    
                    allOperatorMetrics.push({
                        operator,
                        metrics: metrics as MaglaMetrics[],
                        monthlyData
                    });
                } catch (error) {
                    console.error(`Failed to load metrics for operator ${operator.operator_id}:`, error);
                }
            }
            
            setOperatorMetrics(allOperatorMetrics);
        } catch (error) {
            console.error('Failed to load Magla analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const monthNames: Record<string, string> = {
        "01": "January", "02": "February", "03": "March", "04": "April",
        "05": "May", "06": "June", "07": "July", "08": "August",
        "09": "September", "10": "October", "11": "November", "12": "December"
    };

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK', minimumFractionDigits: 2 }).format(v);

    const formatPercent = (v: number) => `${(v * 100).toFixed(2)}%`;

    // Filter operators based on search term and selection
    const filteredOperatorMetrics = operatorMetrics.filter(opMetrics => {
        const matchesSearch = !searchTerm.trim() || 
            opMetrics.operator.operator_name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesSelection = selectedOperator === 'all' || 
            opMetrics.operator.operator_id.toString() === selectedOperator;
        
        return matchesSearch && matchesSelection;
    });

    // Get all unique months across all operators
    const allMonths = Array.from(
        new Set(
            operatorMetrics.flatMap(op => 
                op.monthlyData.map(m => m.month)
            )
        )
    ).sort();

    // Calculate summary data across all operators
    const summaryData = allMonths.map(month => {
        const monthData = operatorMetrics.flatMap(op => 
            op.monthlyData.filter(m => m.month === month)
        );
        
        return {
            month,
            total_stake: monthData.reduce((sum, m) => sum + m.total_stake, 0),
            payout: monthData.reduce((sum, m) => sum + m.total_winnings, 0),
            ggr: monthData.reduce((sum, m) => sum + m.ggr, 0),
            det_levy: monthData.reduce((sum, m) => sum + m.det_levy, 0),
            gaming_tax: monthData.reduce((sum, m) => sum + m.gaming_tax, 0),
            ngr_post_levy: monthData.reduce((sum, m) => sum + m.ngr_post_levy, 0),
            total_bet_count: monthData.reduce((sum, m) => sum + m.total_bet_count, 0),
            ggr_percentage: monthData.reduce((sum, m) => sum + m.total_stake, 0) > 0 
                ? monthData.reduce((sum, m) => sum + m.ggr, 0) / monthData.reduce((sum, m) => sum + m.total_stake, 0)
                : 0
        };
    });

    const NoDataState = ({ message }: { message: string }) => (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/30">
            <TrendingDown className="size-8 mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">{message}</p>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading Magla analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="summary">
                <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="operators">Per Operator</TabsTrigger>
                </TabsList>

                {/* SUMMARY TAB */}
                <TabsContent value="summary" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="size-5 text-indigo-600" />
                                Monthly Summary - All Operators
                                <Badge variant="secondary">SUMMARY</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-indigo-100/20 to-purple-100/20 dark:from-indigo-900/30 dark:to-purple-900/30 border-b-2 border-indigo-200 dark:border-indigo-700">
                                            <th className="p-3 text-left">Month</th>
                                            <th className="p-3 text-right">Total Stake</th>
                                            <th className="p-3 text-right">Payout</th>
                                            <th className="p-3 text-right">GGR</th>
                                            <th className="p-3 text-right">GGR %</th>
                                            <th className="p-3 text-right">DET Levy</th>
                                            <th className="p-3 text-right">Gaming Tax</th>
                                            <th className="p-3 text-right">NGR Post Levy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summaryData.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="p-6">
                                                    <NoDataState message="No summary data available." />
                                                </td>
                                            </tr>
                                        ) : (
                                            summaryData.map((row, idx) => (
                                                <motion.tr 
                                                    key={idx} 
                                                    initial={{ opacity: 0, y: 10 }} 
                                                    animate={{ opacity: 1, y: 0 }} 
                                                    transition={{ delay: idx * 0.05 }} 
                                                    className="border-b hover:bg-muted/50"
                                                >
                                                    <td className="p-3 font-medium">
                                                        {monthNames[row.month.split('-')[1]]} {row.month.split('-')[0]}
                                                    </td>
                                                    <td className="p-3 text-right font-mono">{formatCurrency(row.total_stake)}</td>
                                                    <td className="p-3 text-right font-mono">{formatCurrency(row.payout)}</td>
                                                    <td className="p-3 text-right font-mono text-green-600 dark:text-green-400 font-semibold">{formatCurrency(row.ggr)}</td>
                                                    <td className="p-3 text-right font-mono">{formatPercent(row.ggr_percentage)}</td>
                                                    <td className="p-3 text-right font-mono text-blue-600 dark:text-blue-400">{formatCurrency(row.det_levy)}</td>
                                                    <td className="p-3 text-right font-mono text-purple-600 dark:text-purple-400">{formatCurrency(row.gaming_tax)}</td>
                                                    <td className="p-3 text-right font-mono text-orange-600 dark:text-orange-400">{formatCurrency(row.ngr_post_levy)}</td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PER OPERATOR TAB */}
                <TabsContent value="operators" className="mt-6 space-y-6">
                    {/* Filters */}
                    <div className="flex gap-4 items-center">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
                            <Input
                                type="text"
                                placeholder="Search by operator name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full"
                            />
                        </div>
                        <select
                            value={selectedOperator}
                            onChange={(e) => setSelectedOperator(e.target.value)}
                            className="px-3 py-2 border border-border rounded-md bg-background text-sm"
                        >
                            <option value="all">All Operators</option>
                            {operators.map(op => (
                                <option key={op.operator_id} value={op.operator_id.toString()}>
                                    {op.operator_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {filteredOperatorMetrics.length === 0 ? (
                        <NoDataState message="No operators found matching your criteria." />
                    ) : (
                        <>
                            {/* STAKE TABLE */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Stake by Operator
                                        <Badge className="ml-2 bg-blue-100 text-blue-800">STAKE</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-blue-100/20 to-indigo-100/20 dark:from-blue-900/30 dark:to-indigo-900/30 border-b-2 border-blue-200 dark:border-blue-700">
                                                    <th className="p-3 text-left font-semibold text-foreground">Operator</th>
                                                    {allMonths.map(m => (
                                                        <th key={m} className="p-3 text-right font-semibold text-foreground">
                                                            {monthNames[m.split('-')[1]] || m}
                                                        </th>
                                                    ))}
                                                    <th className="p-3 text-right font-semibold bg-blue-100/20 dark:bg-blue-900/30">TOTAL</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredOperatorMetrics.map((opMetrics) => {
                                                    const totalStake = opMetrics.monthlyData.reduce((sum, m) => sum + m.total_stake, 0);
                                                    return (
                                                        <tr key={opMetrics.operator.operator_id} className="border-b hover:bg-muted/50">
                                                            <td className="p-3 font-medium">{opMetrics.operator.operator_name}</td>
                                                            {allMonths.map(month => {
                                                                const monthData = opMetrics.monthlyData.find(m => m.month === month);
                                                                return (
                                                                    <td key={month} className="p-3 text-right font-mono">
                                                                        {monthData ? formatCurrency(monthData.total_stake) : ''}
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="p-3 text-right font-mono font-bold bg-blue-100/20 dark:bg-blue-900/30">
                                                                {formatCurrency(totalStake)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* PAYOUT TABLE */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Payout by Operator
                                        <Badge className="ml-2 bg-amber-100 text-amber-800">PAYOUT</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-amber-100/20 to-orange-100/20 dark:from-amber-900/30 dark:to-orange-900/30 border-b-2 border-amber-200 dark:border-amber-700">
                                                    <th className="p-3 text-left font-semibold text-foreground">Operator</th>
                                                    {allMonths.map(m => (
                                                        <th key={m} className="p-3 text-right font-semibold text-foreground">
                                                            {monthNames[m.split('-')[1]] || m}
                                                        </th>
                                                    ))}
                                                    <th className="p-3 text-right font-semibold bg-amber-100/20 dark:bg-amber-900/30">TOTAL</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredOperatorMetrics.map((opMetrics) => {
                                                    const totalPayout = opMetrics.monthlyData.reduce((sum, m) => sum + m.total_winnings, 0);
                                                    return (
                                                        <tr key={opMetrics.operator.operator_id} className="border-b hover:bg-muted/50">
                                                            <td className="p-3 font-medium">{opMetrics.operator.operator_name}</td>
                                                            {allMonths.map(month => {
                                                                const monthData = opMetrics.monthlyData.find(m => m.month === month);
                                                                return (
                                                                    <td key={month} className="p-3 text-right font-mono">
                                                                        {monthData ? formatCurrency(monthData.total_winnings) : ''}
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="p-3 text-right font-mono font-bold bg-amber-100/20 dark:bg-amber-900/30">
                                                                {formatCurrency(totalPayout)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* GGR TABLE */}
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
                                                <tr className="bg-gradient-to-r from-green-100/20 to-emerald-100/20 dark:from-green-900/30 dark:to-emerald-900/30 border-b-2 border-green-200 dark:border-green-700">
                                                    <th className="p-3 text-left font-semibold text-foreground">Operator</th>
                                                    {allMonths.map(m => (
                                                        <th key={m} className="p-3 text-right font-semibold text-foreground">
                                                            {monthNames[m.split('-')[1]] || m}
                                                        </th>
                                                    ))}
                                                    <th className="p-3 text-right font-semibold bg-green-100/20 dark:bg-green-900/30">TOTAL</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredOperatorMetrics.map((opMetrics) => {
                                                    const totalGgr = opMetrics.monthlyData.reduce((sum, m) => sum + m.ggr, 0);
                                                    return (
                                                        <tr key={opMetrics.operator.operator_id} className="border-b hover:bg-muted/50">
                                                            <td className="p-3 font-medium">{opMetrics.operator.operator_name}</td>
                                                            {allMonths.map(month => {
                                                                const monthData = opMetrics.monthlyData.find(m => m.month === month);
                                                                return (
                                                                    <td key={month} className="p-3 text-right font-mono text-green-600 dark:text-green-400">
                                                                        {monthData ? formatCurrency(monthData.ggr) : ''}
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="p-3 text-right font-mono font-bold text-green-600 dark:text-green-400 bg-green-100/20 dark:bg-green-900/30">
                                                                {formatCurrency(totalGgr)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* GGR % TABLE */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        GGR % by Operator
                                        <Badge className="ml-2 bg-purple-100 text-purple-800">GGR %</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-purple-100/20 to-indigo-100/20 dark:from-purple-900/30 dark:to-indigo-900/30 border-b-2 border-purple-200 dark:border-purple-700">
                                                    <th className="p-3 text-left font-semibold text-foreground">Operator</th>
                                                    {allMonths.map(m => (
                                                        <th key={m} className="p-3 text-right font-semibold text-foreground">
                                                            {monthNames[m.split('-')[1]] || m}
                                                        </th>
                                                    ))}
                                                    <th className="p-3 text-right font-semibold bg-purple-100/20 dark:bg-purple-900/30">TOTAL</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredOperatorMetrics.map((opMetrics) => {
                                                    const totalStake = opMetrics.monthlyData.reduce((sum, m) => sum + m.total_stake, 0);
                                                    const totalGgr = opMetrics.monthlyData.reduce((sum, m) => sum + m.ggr, 0);
                                                    const totalGgrPercentage = totalStake > 0 ? totalGgr / totalStake : 0;
                                                    return (
                                                        <tr key={opMetrics.operator.operator_id} className="border-b hover:bg-muted/50">
                                                            <td className="p-3 font-medium">{opMetrics.operator.operator_name}</td>
                                                            {allMonths.map(month => {
                                                                const monthData = opMetrics.monthlyData.find(m => m.month === month);
                                                                return (
                                                                    <td key={month} className="p-3 text-right font-mono">
                                                                        {monthData ? formatPercent(monthData.ggr_percentage) : ''}
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="p-3 text-right font-mono font-bold bg-purple-100/20 dark:bg-purple-900/30">
                                                                {formatPercent(totalGgrPercentage)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
