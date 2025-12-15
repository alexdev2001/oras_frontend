import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { reportsAPI, authAPI } from '@/utils/API.ts';
import type { ParsedMetric} from '@/types/report.ts';
import { ReportSubmissionForm } from '../report/ReportSubmissionForm.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import type {DecodedToken} from "@/types/token.ts";
import {jwtDecode} from "jwt-decode";
import {managementAPI} from "@/utils/API.ts";
import type {OperatorReport} from "@/types/report.ts";
import { Plus, LogOut, FileText, CheckCircle, XCircle, Clock, TrendingUp, Award, Target, BarChart3, PieChart, Trophy, Star, Filter, Calendar, Lightbulb } from 'lucide-react';
import {Progress} from "@/components/ui/progress.tsx";
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import {Label} from "@/components/ui/label.tsx";
import type {TransformedReport} from "@/types/report.ts";

interface OperatorDashboardProps {
    onSignOut: () => void;
}

export function OperatorDashboard({ onSignOut }: OperatorDashboardProps) {
    const [reports, setReports] = useState<TransformedReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSubmissionForm, setShowSubmissionForm] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [operatorId, setOperatorId] = useState<number | null>(null);
    const [operatorName, setOperatorName] = useState<string>("");
    const [userId, setUserId] = useState<number | null>(null);
    const [activeView, setActiveView] = useState<'dashboard' | 'reports' | 'insights'>('dashboard');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("authToken");

        if (!token) return;

        try {
            const decoded = jwtDecode<DecodedToken>(token);

            setOperatorId(decoded.operator_id ?? null);
            setUserId(decoded.user_id ?? null);

            console.log("Decoded token:", decoded);

        } catch (err) {
            console.error("Failed to decode token:", err);
        }
    }, []);

    useEffect(() => {
        if (!operatorId) return;

        const fetchOperatorName = async () => {
            try {
                const operators = await managementAPI.getOperators();
                const matched = operators.find(op => op.operator_id === operatorId);

                if (matched) {
                    setOperatorName(matched.operator_name);
                } else {
                    console.warn("Operator not found for ID:", operatorId);
                }
            } catch (err) {
                console.error("Failed to load operators:", err);
            }
        };

        fetchOperatorName();
    }, [operatorId]);

    useEffect(() => {
        if (operatorId === null) return;

        const loadReports = async () => {
            setIsLoading(true);
            try {
                const res = await reportsAPI.getMyReports(operatorId);
                console.log('raw', res);
                const transformed = transformReports(res);
                setReports(transformed);
            } finally {
                setIsLoading(false);
            }
        };

        loadReports();
    }, [operatorId]);

    const loadUser = async () => {
        try {
            const userData = await authAPI.getUser();
            setUser(userData);
        } catch (error) {
            console.error('Failed to load user:', error);
        }
    };

    const transformReports = (raw: ParsedMetric[]): TransformedReport[] =>
        raw.map((r) => {
            const date = new Date(r.date_time);

            return {
                ...r,
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                submittedAt: r.created_at,

                totalStake: r.total_stake,
                totalGGR: r.ggr,
                overallGGRPercentage: r.ggr_percentage,
                totalNetRevenue: r.ngr_post_levy,

                gameBreakdown: [],
            };
        });

    const loadReports = async () => {
        setIsLoading(true);
        try {
            const fetchedReports = await reportsAPI.getMyReports(operatorId);
            setReports(fetchedReports.sort((a: ParsedMetric, b: ParsedMetric) => b.report_id - a.report_id));
            console.log(fetchedReports);
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReportSubmitted = () => {
        setShowSubmissionForm(false);
        loadReports();
    };

    const handleSignOut = async () => {
        try {
            await authAPI.signout();
            onSignOut();
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500"><CheckCircle className="size-3 mr-1" />Approved</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500"><XCircle className="size-3 mr-1" />Rejected</Badge>;
            default:
                return <Badge className="bg-yellow-500"><Clock className="size-3 mr-1" />Pending</Badge>;
        }
    };

    // Get unique months from reports
    const availableMonths = Array.from(new Set(
        reports.map(r => `${r.year}-${String(r.month).padStart(2, '0')}`)
    )).sort().reverse();

    // Filter reports based on selected month
    const filteredReports = selectedMonth === 'all'
        ? reports
        : reports.filter(r => `${r.year}-${String(r.month).padStart(2, '0')}` === selectedMonth);

    console.log('filteredReports', filteredReports);

    // Calculate insights based on filtered reports
    const approvedReports = filteredReports.filter(r => r.status === 'approved');
    const totalRevenue = approvedReports.reduce((sum, r) => sum + (r.totalNetRevenue || 0), 0);
    const totalGGR = approvedReports.reduce((sum, r) => sum + (r.totalGGR || 0), 0);
    const avgGGRPercentage = approvedReports.length > 0
        ? approvedReports.reduce((sum, r) => sum + (r.overallGGRPercentage || 0), 0) / approvedReports.length
        : 0;

    // Recent trend (last 6 months) from all approved reports
    const allApprovedReports = reports.filter(r => r.status === 'approved');
    const recentReports = allApprovedReports.slice(0, 6).reverse();
    const trendData = recentReports.map(r => ({
        month: new Date(r.year, r.month - 1).toLocaleDateString('en-US', { month: 'short' }),
        ggr: r.totalGGR || 0,
        revenue: r.totalNetRevenue || 0,
        stake: r.totalStake || 0,
    }));

    // Game type breakdown from latest approved report (filtered or all)
    const latestApprovedReport = approvedReports[0];
    const gameTypeData = latestApprovedReport?.gameBreakdown?.map(g => ({
        name: g.gameType,
        value: g.ggr,
        percentage: g.ggrPercentage,
    })) || [];

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    // Achievement milestones (based on all reports, not filtered)
    const allApproved = reports.filter(r => r.status === 'approved');
    const allTotalRevenue = allApproved.reduce((sum, r) => sum + (r.totalNetRevenue || 0), 0);

    const achievements = [
        {
            icon: Trophy,
            title: 'First Report',
            description: 'Submitted your first monthly report',
            unlocked: reports.length > 0,
        },
        {
            icon: Target,
            title: 'Consistent Reporter',
            description: 'Submitted 5+ reports',
            unlocked: reports.length >= 5,
        },
        {
            icon: Award,
            title: 'Revenue Master',
            description: 'Generated $100K+ in revenue',
            unlocked: allTotalRevenue >= 100000,
        },
        {
            icon: Star,
            title: 'Approval Rate',
            description: '90%+ approval rate',
            unlocked: reports.length > 0 && (allApproved.length / reports.length) >= 0.9,
        },
    ];

    if (showSubmissionForm) {
        return (
            <ReportSubmissionForm
                onCancel={() => setShowSubmissionForm(false)}
                onSubmitSuccess={handleReportSubmitted}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white border-b sticky top-0 z-50"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1>Operator Portal</h1>
                            <p className="text-gray-600">{operatorName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setShowSubmissionForm(true)}>
                                <Plus className="size-4 mr-2" />
                                Submit Report
                            </Button>
                            <Button variant="outline" onClick={handleSignOut}>
                                <LogOut className="size-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 mt-4">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                            { id: 'reports', label: 'Reports', icon: FileText },
                            { id: 'insights', label: 'Insights', icon: TrendingUp },
                        ].map((tab) => (
                            <Button
                                key={tab.id}
                                variant={activeView === tab.id ? 'default' : 'ghost'}
                                onClick={() => setActiveView(tab.id as any)}
                            >
                                <tab.icon className="size-4 mr-2" />
                                {tab.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Month Filter */}
                {availableMonths.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-white border rounded-lg p-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="size-5 text-gray-600" />
                                <Label htmlFor="month-filter" className="text-sm font-medium">Filter by Month:</Label>
                            </div>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger id="month-filter" className="w-[280px]">
                                    <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-4" />
                                            <span>All Months</span>
                                        </div>
                                    </SelectItem>
                                    {availableMonths.map((monthKey) => {
                                        const [year, month] = monthKey.split('-');
                                        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
                                            month: 'long',
                                            year: 'numeric'
                                        });
                                        return (
                                            <SelectItem key={monthKey} value={monthKey}>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="size-4 text-indigo-600" />
                                                    <span>{monthName}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            {selectedMonth !== 'all' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedMonth('all')}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    Clear Filter
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {activeView === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Hero Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                {[
                                    {
                                        title: 'Total Reports',
                                        value: filteredReports.length,
                                        icon: FileText,
                                        suffix: '',
                                    },
                                    {
                                        title: 'Total Revenue',
                                        value: totalRevenue.toLocaleString('en-MW', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }),
                                        icon: TrendingUp,
                                        prefix: 'MWK ',
                                        format: true,
                                    },
                                    {
                                        title: 'Total GGR',
                                        value: totalGGR.toLocaleString('en-MW', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        icon: BarChart3,
                                        prefix: 'MWK ',
                                        format: true,
                                    },
                                    {
                                        title: 'Avg GGR %',
                                        value: avgGGRPercentage,
                                        icon: Target,
                                        suffix: '%',
                                        decimals: 2,
                                    },
                                ].map((stat, index) => (
                                    <motion.div
                                        key={stat.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="h-full"
                                    >
                                        <Card className="h-full flex flex-col justify-between min-h-[140px]">
                                            <CardHeader className="pb-2">
                                                <CardDescription className="flex items-center justify-between">
                                                    <span>{stat.title}</span>
                                                    <stat.icon className="size-4 text-gray-400" />
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent>
                                                <motion.div
                                                    initial={{ scale: 0.5 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                                                    className="text-3xl"
                                                >
                                                    {stat.prefix || ''}
                                                    {stat.format
                                                        ? stat.value
                                                        : stat.decimals
                                                            ? stat.value.toFixed(stat.decimals)
                                                            : stat.value}
                                                    {stat.suffix || ''}
                                                </motion.div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Revenue Trend */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <BarChart3 className="size-5 text-indigo-600" />
                                                Revenue Trend
                                            </CardTitle>
                                            <CardDescription>Last 6 months performance</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {trendData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <AreaChart data={trendData}>
                                                        <defs>
                                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>

                                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

                                                        <XAxis dataKey="month" />

                                                        {/* Format Y-axis values to fit: 1.2M, 340K, etc. */}
                                                        <YAxis
                                                            tickFormatter={(value: number) => {
                                                                if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
                                                                if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
                                                                return value;
                                                            }}
                                                        />

                                                        <Tooltip
                                                            formatter={(value: number) =>
                                                                `MWK ${value.toLocaleString('en-MW', {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2
                                                                })}`
                                                            }
                                                            contentStyle={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e5e7eb'
                                                            }}
                                                        />

                                                        <Area
                                                            type="monotone"
                                                            dataKey="revenue"
                                                            stroke="#3b82f6"
                                                            fillOpacity={1}
                                                            fill="url(#colorRevenue)"
                                                            animationDuration={1000}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-[250px] flex items-center justify-center text-gray-400">
                                                    No data available
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Game Type Distribution */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <PieChart className="size-5 text-indigo-600" />
                                                Game Type Distribution
                                            </CardTitle>
                                            <CardDescription>Latest report breakdown</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {gameTypeData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <RechartsPieChart>
                                                        <Pie
                                                            data={gameTypeData}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percentage }) => `${name}: ${percentage?.toFixed(1)}%`}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                            animationDuration={1000}
                                                        >
                                                            {gameTypeData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(value: number) => `$${value.toLocaleString()}`}
                                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                        />
                                                    </RechartsPieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-[250px] flex items-center justify-center text-gray-400">
                                                    No data available
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </div>

                            {/* Achievements */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Trophy className="size-5 text-yellow-600" />
                                            Achievements
                                        </CardTitle>
                                        <CardDescription>Track your milestones</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            {achievements.map((achievement, index) => (
                                                <motion.div
                                                    key={achievement.title}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.7 + index * 0.1 }}
                                                    className={`p-4 rounded-lg border-2 transition-all ${
                                                        achievement.unlocked
                                                            ? 'bg-yellow-50 border-yellow-300 shadow-sm'
                                                            : 'bg-gray-50 border-gray-200 opacity-60'
                                                    }`}
                                                >
                                                    <motion.div
                                                        animate={achievement.unlocked ? { rotate: [0, 10, -10, 0] } : {}}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        <achievement.icon className={`size-8 mb-2 ${achievement.unlocked ? 'text-yellow-600' : 'text-gray-400'}`} />
                                                    </motion.div>
                                                    <h4 className="font-medium mb-1">{achievement.title}</h4>
                                                    <p className="text-sm text-gray-600">{achievement.description}</p>
                                                    {achievement.unlocked && (
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: '100%' }}
                                                            transition={{ duration: 0.8, delay: 0.2 }}
                                                        >
                                                            <Progress value={100} className="mt-2 h-1" />
                                                        </motion.div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </motion.div>
                    )}

                    {activeView === 'reports' && (
                        <motion.div
                            key="reports"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Status Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {[
                                    {
                                        status: 'approved',
                                        count: reports.filter(r => r.status === 'approved').length,
                                        color: 'from-green-500 to-emerald-500',
                                        icon: CheckCircle,
                                    },
                                    {
                                        status: 'pending',
                                        count: reports.filter(r => r.status === 'pending').length,
                                        color: 'from-yellow-500 to-orange-500',
                                        icon: Clock,
                                    },
                                    {
                                        status: 'rejected',
                                        count: reports.filter(r => r.status === 'rejected').length,
                                        color: 'from-red-500 to-pink-500',
                                        icon: XCircle,
                                    },
                                ].map((item, index) => (
                                    <motion.div
                                        key={item.status}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className="overflow-hidden border-0 shadow-lg">
                                            <div className={`h-2 bg-gradient-to-r ${item.color}`} />
                                            <CardContent className="pt-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-600 capitalize mb-1">{item.status}</p>
                                                        <p className="text-4xl">{item.count}</p>
                                                    </div>
                                                    <item.icon className={`size-12 opacity-20`} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Reports List */}
                            <Card className="shadow-lg border-0">
                                <CardHeader>
                                    <CardTitle>Submitted Reports</CardTitle>
                                    <CardDescription>View and track your monthly submissions</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="text-center py-8 text-gray-500">Loading reports...</div>
                                    ) : reports.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-center py-12"
                                        >
                                            <FileText className="size-12 mx-auto text-gray-400 mb-4" />
                                            <p className="text-gray-600 mb-4">No reports submitted yet</p>
                                            <Button onClick={() => setShowSubmissionForm(true)}>
                                                <Plus className="size-4 mr-2" />
                                                Submit Your First Report
                                            </Button>
                                        </motion.div>
                                    ) : (
                                        <div className="space-y-4">
                                            {reports.map((report, index) => (
                                                <motion.div
                                                    key={report.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="border rounded-lg p-4 hover:bg-gray-50 transition-all hover:shadow-md"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-medium">
                                                                    {new Date(report.year, report.month - 1).toLocaleDateString('en-US', {
                                                                        month: 'long',
                                                                        year: 'numeric'
                                                                    })}
                                                                </h3>
                                                                {getStatusBadge(report.status)}
                                                            </div>
                                                            <p className="text-sm text-gray-500">
                                                                Submitted {new Date(report.submittedAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Total Stake</p>
                                                            <p className="font-medium">${report.totalStake?.toLocaleString() || 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">GGR</p>
                                                            <p className="font-medium">${report.totalGGR?.toLocaleString() || 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">GGR %</p>
                                                            <p className="font-medium">{report.overallGGRPercentage?.toFixed(2) || 0}%</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Gaming Tax</p>
                                                            <p className="font-medium">${report.totalGamingTax?.toLocaleString() || 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Net Revenue</p>
                                                            <p className="font-medium text-green-600">${report.totalNetRevenue?.toLocaleString() || 0}</p>
                                                        </div>
                                                    </div>

                                                    {report.reviewNotes && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            className="mt-3 p-3 bg-gray-100 rounded text-sm"
                                                        >
                                                            <p className="font-medium text-gray-700">Review Notes:</p>
                                                            <p className="text-gray-600">{report.reviewNotes}</p>
                                                        </motion.div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {activeView === 'insights' && (
                        <motion.div
                            key="insights"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Performance Metrics */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lightbulb className="size-5 text-indigo-600" />
                                        Performance Insights
                                    </CardTitle>
                                    <CardDescription>Key recommendations based on your data</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {approvedReports.length >= 2 && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200"
                                            >
                                                <TrendingUp className="size-5 text-blue-600 mt-0.5" />
                                                <div>
                                                    <h4 className="font-medium mb-1">Revenue Trend</h4>
                                                    <p className="text-sm text-gray-600">
                                                        {approvedReports[0].totalNetRevenue > approvedReports[1].totalNetRevenue ? (
                                                            <>Your revenue increased by <span className="font-medium text-green-600">${(approvedReports[0].totalNetRevenue - approvedReports[1].totalNetRevenue).toLocaleString()}</span> from last month!</>
                                                        ) : (
                                                            <>Revenue decreased by <span className="font-medium text-red-600">${(approvedReports[1].totalNetRevenue - approvedReports[0].totalNetRevenue).toLocaleString()}</span> from last month.</>
                                                        )}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}

                                        {latestApprovedReport && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200"
                                            >
                                                <Target className="size-5 text-purple-600 mt-0.5" />
                                                <div>
                                                    <h4 className="font-medium mb-1">Best Performing Game</h4>
                                                    <p className="text-sm text-gray-600">
                                                        {latestApprovedReport.gameBreakdown?.sort((a, b) => b.ggr - a.ggr)[0]?.gameType || 'N/A'} generated the highest GGR with <span className="font-medium text-purple-600">${latestApprovedReport.gameBreakdown?.sort((a, b) => b.ggr - a.ggr)[0]?.ggr.toLocaleString() || 0}</span>
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}

                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200"
                                        >
                                            <Award className="size-5 text-green-600 mt-0.5" />
                                            <div>
                                                <h4 className="font-medium mb-1">Approval Rate</h4>
                                                <p className="text-sm text-gray-600">
                                                    Your approval rate is <span className="font-medium text-green-600">{reports.length > 0 ? ((approvedReports.length / reports.length) * 100).toFixed(1) : 0}%</span> - {
                                                    reports.length > 0 && (approvedReports.length / reports.length) >= 0.9
                                                        ? 'Excellent work!'
                                                        : 'Keep improving data quality for better approval rates.'
                                                }
                                                </p>
                                            </div>
                                        </motion.div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* GGR Trend Chart */}
                            <Card className="shadow-lg border-0">
                                <CardHeader>
                                    <CardTitle>GGR & Stake Trend Analysis</CardTitle>
                                    <CardDescription>Compare your GGR and stake over time</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {trendData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={trendData}>
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip
                                                    formatter={(value: number) => `$${value.toLocaleString()}`}
                                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                />
                                                <Legend />
                                                <Bar dataKey="ggr" fill="#3b82f6" name="GGR" animationDuration={1000} />
                                                <Bar dataKey="stake" fill="#8b5cf6" name="Stake" animationDuration={1000} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                                            No data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Game Performance Table */}
                            {latestApprovedReport && (
                                <Card className="shadow-lg border-0">
                                    <CardHeader>
                                        <CardTitle>Latest Report - Game Breakdown</CardTitle>
                                        <CardDescription>Detailed performance by game type</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {latestApprovedReport.gameBreakdown?.sort((a, b) => b.ggr - a.ggr).map((game, index) => (
                                                <motion.div
                                                    key={game.gameType}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-gradient-to-r from-white to-gray-50"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-medium">{game.gameType}</h4>
                                                        <Badge variant="outline" className="bg-blue-50">
                                                            {game.ggrPercentage.toFixed(1)}% GGR
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-500">Stake</p>
                                                            <p className="font-medium">${game.stake.toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">GGR</p>
                                                            <p className="font-medium text-blue-600">${game.ggr.toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Gaming Tax</p>
                                                            <p className="font-medium">${game.gamingTax.toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Net Revenue</p>
                                                            <p className="font-medium text-green-600">${game.netRevenue.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <Progress value={game.ggrPercentage} className="h-2" />
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}