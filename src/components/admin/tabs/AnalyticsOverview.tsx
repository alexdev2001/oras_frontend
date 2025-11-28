import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { TrendingUp, DollarSign, BarChart2, Activity } from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { analyticsAPI } from "@/utils/API.ts";
import type { DashboardAnalytics } from "@/types/report.ts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface AnalyticsOverviewProps {
    selectedOperator?: string;
    selectedMonth?: string;
}

export function AnalyticsOverview({
                                      selectedOperator = 'all',
                                      selectedMonth = 'all'
                                  }: AnalyticsOverviewProps) {

    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadAnalytics = async () => {
        try {
            setIsLoading(true);

            let operatorId: number | null = null;

            if (selectedOperator !== "all") {
                operatorId = Number(selectedOperator);

                if (isNaN(operatorId)) {
                    console.error("Invalid operator ID");
                    return;
                }
            }

            const fetched = await analyticsAPI.getAnalyticsByOperatorId(operatorId);
            setAnalytics(fetched);

        } catch (error) {
            console.error("Failed to load analytics:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [selectedOperator]);

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading analytics...</p>
            </div>
        );
    }

    if (!analytics || analytics.totalReports === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <BarChart2 className="size-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No approved reports available for analysis</p>
                </CardContent>
            </Card>
        );
    }

    // ----------------------------------------
    // APPLY MONTH FILTER
    // ----------------------------------------

    const filteredAnalytics =
        selectedMonth === "all"
            ? analytics
            : {
                ...analytics,
                monthlyTrends: analytics.monthlyTrends.filter(
                    (m) => m.month === selectedMonth
                ),
            };

    if (filteredAnalytics.monthlyTrends.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <BarChart2 className="size-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No data available for the selected month</p>
                </CardContent>
            </Card>
        );
    }

    const latestMonth =
        filteredAnalytics.monthlyTrends[filteredAnalytics.monthlyTrends.length - 1];
    const previousMonth =
        filteredAnalytics.monthlyTrends[filteredAnalytics.monthlyTrends.length - 2];

    const formatMWK = (value: number) => {
        if (value >= 1_000_000_000) return `MWK ${(value / 1_000_000_000).toFixed(1)}B`;
        if (value >= 1_000_000) return `MWK ${(value / 1_000_000).toFixed(1)}M`;
        return `MWK ${value.toLocaleString()}`;
    };

    const ggrGrowth = previousMonth
        ? ((latestMonth.totalGGR - previousMonth.totalGGR) / previousMonth.totalGGR) * 100
        : 0;

    const stakeGrowth = previousMonth
        ? ((latestMonth.totalStake - previousMonth.totalStake) / previousMonth.totalStake) * 100
        : 0;

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Total GGR */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total GGR</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl md:text-3xl ">
                                MWK {latestMonth.totalGGR.toLocaleString()}
                            </span>
                            {ggrGrowth !== 0 && (
                                <span
                                    className={`text-sm md:text-base ${ggrGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {ggrGrowth > 0 ? '+' : ''}
                                    {ggrGrowth.toFixed(1)}%
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
                            <TrendingUp className="w-4 h-4" />
                            Latest month
                        </div>
                    </CardContent>
                </Card>

                {/* Total Stake */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Stake</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl md:text-3xl ">
                                MWK {latestMonth.totalStake.toLocaleString()}
                            </span>
                            {stakeGrowth !== 0 && (
                                <span
                                    className={`text-sm md:text-base ${stakeGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {stakeGrowth > 0 ? '+' : ''}
                                    {stakeGrowth.toFixed(1)}%
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
                            <DollarSign className="w-4 h-4" />
                            Latest month
                        </div>
                    </CardContent>
                </Card>

                {/* Gaming Tax */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Gaming Tax Collected</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl md:text-3xl">
                            MWK {latestMonth.totalGamingTax.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
                            <Activity className="w-4 h-4" />
                            20% of GGR
                        </div>
                    </CardContent>
                </Card>

                {/* DET Levy */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>DET Levy</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl md:text-3xl">
                            MWK {latestMonth.totalDETLevy.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
                            <BarChart2 className="w-4 h-4" />
                            5% of GGR
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Trends */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Trends</CardTitle>
                    <CardDescription>GGR and Stake over time</CardDescription>
                </CardHeader>

                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={filteredAnalytics.monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis
                                tickFormatter={(value) => {
                                    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
                                    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                                    return value.toLocaleString();
                                }}
                            />
                            <Tooltip formatter={(value: number) => formatMWK(value)} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line type="monotone" dataKey="totalGGR" stroke="#3b82f6" strokeWidth={1.5} />
                            <Line type="monotone" dataKey="totalStake" stroke="#10b981" strokeWidth={1.5} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Product Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <Card>
                    <CardHeader>
                        <CardTitle>GGR by Product</CardTitle>
                        <CardDescription>Breakdown by game type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={filteredAnalytics.productBreakdown}
                                    dataKey="totalGGR"
                                    nameKey="gameType"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    label={(entry: any) => {
                                        const value = entry.totalGGR;
                                        let formatted =
                                            value >= 1_000_000_000
                                                ? `${(value / 1_000_000_000).toFixed(1)}B`
                                                : value >= 1_000_000
                                                    ? `${(value / 1_000_000).toFixed(1)}M`
                                                    : value.toLocaleString();
                                        return `MWK ${formatted}`;
                                    }}
                                >
                                    {filteredAnalytics.productBreakdown.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatMWK(value)} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Product Performance Ranking */}
                <Card>
                    <CardHeader>
                        <CardTitle>Product Performance</CardTitle>
                        <CardDescription>Ranked by GGR</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={filteredAnalytics.productBreakdown.map(entry => ({
                                    ...entry,
                                    scaledGGR: entry.totalGGR / 1_000_000,
                                }))}
                                layout="vertical"
                                margin={{ left: 50, right: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `${value.toFixed(0)}M`} />
                                <YAxis dataKey="gameType" type="category" width={120} />
                                <Tooltip formatter={(value: number) => `MWK ${(value * 1_000_000).toLocaleString()}`} />
                                <Bar dataKey="scaledGGR" fill="#3b82f6" name="GGR (Millions)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Operator Performance */}
            <Card>
                <CardHeader>
                    <CardTitle>Operator Performance</CardTitle>
                    <CardDescription>Top operators ranked by GGR</CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="space-y-4">
                        {filteredAnalytics.operatorPerformance.map((operator, index) => {
                            const ggrPercentage = (operator.totalGGR / operator.totalStake) * 100;

                            return (
                                <div key={operator.operatorName} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p>{operator.operatorName}</p>
                                                <p className="text-sm text-gray-500">{operator.reportCount} reports</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xl">MWK {operator.totalGGR.toLocaleString()}</p>
                                            <p className="text-sm text-gray-500">{ggrPercentage.toFixed(2)}% GGR</p>
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-indigo-600 h-2 rounded-full"
                                            style={{ width: `${Math.min(ggrPercentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Tax & Levy Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Tax & Levy Collection</CardTitle>
                    <CardDescription>Monthly gaming tax and DET levy</CardDescription>
                </CardHeader>

                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={filteredAnalytics.monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(value) => `MWK ${(value / 1_000_000).toFixed(1)}M`} />
                            <Tooltip formatter={(value: number) => `MWK ${value.toLocaleString()}`} />
                            <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                            <Bar dataKey="totalGamingTax" fill="#ef4444" name="Gaming Tax (20%)" />
                            <Bar dataKey="totalDETLevy" fill="#f59e0b" name="DET Levy (5%)" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}