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
import type {DashboardAnalytics} from "@/types/report.ts";
import type {OperatorPerformance} from "@/types/report.ts";


const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface AnalyticsOverviewProps {
    selectedOperator?: string;
    selectedMonth?: string;
}

interface MarketShareData extends OperatorPerformance {
    marketShare: number;
    [key: string]: any;
}


export function AnalyticsOverview({
                                      selectedOperator = 'all',
                                      selectedMonth = 'all'
                                  }: AnalyticsOverviewProps) {
    const [analytics, setAnalytics] =
        useState<DashboardAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, [selectedOperator]);

    const safeNumber = (val: any) =>
        Number(val || 0);

    const safeLocale = (val: any) =>
        safeNumber(val).toLocaleString();


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

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">
                    Loading analytics...
                </p>
            </div>
        );
    }

    if (!analytics || analytics.totalReports === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <BarChart2 className="size-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">
                        No approved reports available for analysis
                    </p>
                </CardContent>
            </Card>
        );
    }

    const filteredAnalytics =
        selectedMonth === "all"
            ? analytics
            : {
                ...analytics,
                monthlyTrends: analytics.monthlyTrends.filter(
                    (m) => m.month === selectedMonth
                ).sort((a, b) => a.month.localeCompare(b.month)),
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
        analytics.monthlyTrends[
        analytics.monthlyTrends.length - 1
            ] || { totalGGR: 0, totalStake: 0 };
    const previousMonth =
        analytics.monthlyTrends[
        analytics.monthlyTrends.length - 2
            ] || null;

    const totalMarketGGR =
        analytics.operatorPerformance.reduce(
            (sum, op) => sum + safeNumber(op.totalGGR),
            0
        );

    const marketShareData: MarketShareData[] =
        analytics.operatorPerformance.map((op) => ({
            ...op,
            marketShare:
                (safeNumber(op.totalGGR) /
                    (totalMarketGGR || 1)) *
                100,
        }));

    const operatorTrendsData: Record<string, any> = {};

    analytics.operatorMonthlyTrends?.forEach(trend => {
        if (!operatorTrendsData[trend.month]) {
            operatorTrendsData[trend.month] = { month: trend.month };
        }
        operatorTrendsData[trend.month][trend.operatorName] = trend.totalGGR;
    });

    const operatorTrendsArray = Object.values(operatorTrendsData).sort((a: any, b: any) =>
        a.month.localeCompare(b.month)
    );

    const operatorNames = [...new Set(analytics.operatorMonthlyTrends?.map(t => t.operatorName) || [])];

    return (
        <div className="space-y-6">
            {/* KEY METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* --- TOTAL GGR --- */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total GGR</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <span className="text-2xl block">
                            MWK {Number(latestMonth?.totalGGR || 0).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
                            <TrendingUp className="size-4" />
                            Latest month
                        </div>
                    </CardContent>
                </Card>

                {/* TOTAL STAKE */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Stake</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <span className="text-2xl block">MWK {Number(latestMonth?.totalStake || 0).toLocaleString()}</span>
                        <div className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
                            <DollarSign className="size-4" />
                            Latest month
                        </div>
                    </CardContent>
                </Card>

                {/* GAMING TAX */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>
                            Gaming Tax Collected
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl">
                            MWK {Number(latestMonth?.totalGamingTax || 0).toLocaleString('en-MW', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
                            <Activity className="size-4" />
                            12.5% of GGR
                        </div>
                    </CardContent>
                </Card>

                {/* DET LEVY */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>DET Levy</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl">
                            MWK {Number(latestMonth?.totalDETLevy || 0).toLocaleString("en-MW", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
                            <BarChart2 className="size-4" />
                            15% of GGR
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
                        <LineChart data={analytics.monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis dataKey="month" />

                            <YAxis
                                tickFormatter={(value) =>
                                    value >= 1_000_000_000
                                        ? `${(value / 1_000_000_000).toFixed(1)}B`
                                        : value >= 1_000_000
                                            ? `${(value / 1_000_000).toFixed(1)}M`
                                            : value >= 1_000
                                                ? `${(value / 1_000).toFixed(1)}K`
                                                : value
                                }
                            />

                            <Tooltip
                                formatter={(value: number) =>
                                    `MWK ${value.toLocaleString()}`
                                }
                                labelFormatter={(label) => `Month: ${label}`}
                            />

                            <Legend />

                            <Line
                                type="monotone"
                                dataKey="totalGGR"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="GGR (MWK)"
                            />

                            <Line
                                type="monotone"
                                dataKey="totalStake"
                                stroke="#10b981"
                                strokeWidth={2}
                                name="Stake (MWK)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Operator Market Share & GGR Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Operator Market Share */}
                <Card>
                    <CardHeader>
                        <CardTitle>Operator Market Share</CardTitle>
                        <CardDescription>Market share distribution by GGR</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={marketShareData}
                                    dataKey="marketShare"
                                    nameKey="operatorName"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={(entry: any) => `${entry.operatorName}: ${entry.marketShare.toFixed(1)}%`}
                                >
                                    {marketShareData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Total Market GGR:</span>
                                <span>
                                      {new Intl.NumberFormat('en-MW', {
                                          style: 'currency',
                                          currency: 'MWK'
                                      }).format(totalMarketGGR)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Number of Operators:</span>
                                <span>{analytics.operatorPerformance.length}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Operator GGR Comparison */}
                <Card>
                    <CardHeader>
                        <CardTitle>Operator GGR Comparison</CardTitle>
                        <CardDescription>Total GGR by operator</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={analytics.operatorPerformance}
                                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis
                                    dataKey="operatorName"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />

                                {/* Format Y-axis values */}
                                <YAxis
                                    tickFormatter={(value) =>
                                        value >= 1_000_000_000
                                            ? `${(value / 1_000_000_000).toFixed(1)}B`
                                            : value >= 1_000_000
                                                ? `${(value / 1_000_000).toFixed(1)}M`
                                                : value >= 1_000
                                                    ? `${(value / 1_000).toFixed(1)}K`
                                                    : value
                                    }
                                />

                                <Tooltip
                                    formatter={(value: number) => `MWK ${value.toLocaleString()}`}
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                />

                                <Bar dataKey="totalGGR" name="GGR (MWK)">
                                    {analytics.operatorPerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Operator GGR Trends Over Time */}
            <Card>
                <CardHeader>
                    <CardTitle>Operator GGR Trends Over Time</CardTitle>
                    <CardDescription>Compare GGR performance trends across all operators</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={operatorTrendsArray}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis
                                tickFormatter={(value) =>
                                    value >= 1_000_000_000
                                        ? `${(value / 1_000_000_000).toFixed(1)}B`
                                        : value >= 1_000_000
                                            ? `${(value / 1_000_000).toFixed(1)}M`
                                            : value >= 1_000
                                                ? `${(value / 1_000).toFixed(1)}K`
                                                : value
                                }
                            />
                            <Tooltip
                                formatter={(value: number) => `MWK ${value.toLocaleString()}`}
                                labelFormatter={(label) => `Month: ${label}`}
                            />
                            <Legend />
                            {operatorNames.map((name, index) => (
                                <Line
                                    key={name}
                                    type="monotone"
                                    dataKey={name}
                                    stroke={COLORS[index % COLORS.length]}
                                    strokeWidth={2}
                                    name={name}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Product</CardTitle>
                        <CardDescription>GGR breakdown by game type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analytics.productBreakdown}
                                    dataKey="totalGGR"
                                    nameKey="gameType"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    labelLine={true}
                                    label={({ name, value }) => {
                                        const shortName = name.length > 12 ? name.slice(0, 12) + '…' : name;
                                        return `${shortName}: MK ${value.toLocaleString()}`;
                                    }}
                                >
                                    {analytics.productBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>

                                <Tooltip
                                    formatter={(value: number) =>
                                        new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'MWK'
                                        }).format(value)
                                    }
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Product Rankings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Product Performance</CardTitle>
                        <CardDescription>Ranked by GGR</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={analytics.productBreakdown}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis type="number"
                                       tickFormatter={(value) =>
                                           value >= 1_000_000_000
                                               ? `${(value / 1_000_000_000).toFixed(1)}B`
                                               : value >= 1_000_000
                                                   ? `${(value / 1_000_000).toFixed(1)}M`
                                                   : value >= 1_000
                                                       ? `${(value / 1_000).toFixed(1)}K`
                                                       : value
                                       }
                                />

                                <YAxis
                                    dataKey="gameType"
                                    type="category"
                                    width={150}
                                    tick={{ fontSize: 12 }}
                                />

                                <Tooltip
                                    formatter={(value: number) => `MWK ${value.toLocaleString()}`}
                                />

                                <Bar dataKey="totalGGR" fill="#3b82f6" name="GGR" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Operator Performance */}
            <Card>
                <CardHeader>
                    <CardTitle>Operator Performance</CardTitle>
                    <CardDescription>Top operators by GGR</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analytics.operatorPerformance.map((operator, index) => {
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
                                            <p className="text-xl">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MWK' })
                                                    .format(operator.totalGGR)}
                                            </p>
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
                    <CardDescription>Monthly breakdown of gaming tax and DET levy</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />

                            <YAxis
                                tickFormatter={(value) =>
                                    value >= 1_000_000_000
                                        ? `${(value / 1_000_000_000).toFixed(1)}B`
                                        : value >= 1_000_000
                                            ? ` ${(value / 1_000_000).toFixed(1)}M`
                                            : value >= 1_000
                                                ? ` ${(value / 1_000).toFixed(1)}K`
                                                : ` ${value}`
                                }
                            />

                            <Tooltip
                                formatter={(value: number) =>
                                    new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'MWK'
                                    }).format(value)
                                }
                            />
                            <Legend />

                            <Bar dataKey="totalGamingTax" fill="#ef4444" name="Gaming Tax (12.5%)" />
                            <Bar dataKey="totalDETLevy" fill="#f59e0b" name="DET Levy (15%)" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}