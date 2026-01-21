import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { reportsAPI, authAPI } from '@/utils/API.ts';
import type { OperatorReport } from '../../types/report.ts';
import { Plus, LogOut, FileText, CheckCircle, XCircle, Clock, TrendingUp, Award, Target, BarChart3, PieChart, Trophy, Star, Filter, Calendar, Lightbulb } from 'lucide-react';
import { ReportSubmissionForm } from '../report/ReportSubmissionForm.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Progress } from '@/components/ui/progress.tsx';
import { BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Label } from '@/components/ui/label.tsx';
import { jwtDecode } from 'jwt-decode';
import type { DecodedToken } from '@/components/regulator/RegulatorDashboard.tsx';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface OperatorUser {
    user_metadata?: {
        operatorName?: string;
    };
}

interface OperatorDashboardProps {
    onSignOut: () => void;
}

export function OperatorDashboard({ onSignOut }: OperatorDashboardProps) {
    const [reports, setReports] = useState<OperatorReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSubmissionForm, setShowSubmissionForm] = useState(false);
    const [user, setUser] = useState<{ email: string } | null>(null);
    const [activeView, setActiveView] = useState<'dashboard' | 'reports' | 'insights'>('dashboard');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const decoded = jwtDecode<DecodedToken>(token);

            setUser({
                email: decoded.email_notification,
            });
        } catch (err) {
            console.error('Invalid token', err);
        }
    }, []);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setIsLoading(true);
        try {
            const { reports: fetchedReports } = await reportsAPI.getMyReports();
            setReports(fetchedReports.sort((a: OperatorReport, b: OperatorReport) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
            ));
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

    const availableMonths = Array.from(new Set(
        reports.map(r => `${r.year}-${String(r.month).padStart(2, '0')}`)
    )).sort().reverse();

    const filteredReports = selectedMonth === 'all'
        ? reports
        : reports.filter(r => `${r.year}-${String(r.month).padStart(2, '0')}` === selectedMonth);

    const approvedReports = filteredReports.filter(r => r.status === 'approved');
    const totalRevenue = approvedReports.reduce((sum, r) => sum + (r.totalNetRevenue || 0), 0);
    const totalGGR = approvedReports.reduce((sum, r) => sum + (r.totalGGR || 0), 0);
    const avgGGRPercentage = approvedReports.length > 0
        ? approvedReports.reduce((sum, r) => sum + (r.overallGGRPercentage || 0), 0) / approvedReports.length
        : 0;

    const allApprovedReports = reports.filter(r => r.status === 'approved').sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1).getTime();
        const dateB = new Date(b.year, b.month - 1).getTime();
        return dateA - dateB;
    });
    const recentReports = allApprovedReports.slice(-6);
    const trendData = recentReports.map(r => ({
        month: new Date(r.year, r.month - 1).toLocaleDateString('en-US', { month: 'short' }),
        ggr: r.totalGGR || 0,
        revenue: r.totalNetRevenue || 0,
        stake: r.totalStake || 0,
    }));

    const latestApprovedReport = approvedReports[0];
    const gameTypeData = latestApprovedReport?.gameBreakdown?.map(g => ({
        name: g.gameType,
        value: g.ggr,
        percentage: g.ggrPercentage,
    })) || [];

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const allApproved = reports.filter(r => r.status === 'approved');
    const allTotalRevenue = allApproved.reduce((sum, r) => sum + (r.totalNetRevenue || 0), 0);

    const achievements = [
        { icon: Trophy, title: 'First Report', description: 'Submitted your first monthly report', unlocked: reports.length > 0 },
        { icon: Target, title: 'Consistent Reporter', description: 'Submitted 5+ reports', unlocked: reports.length >= 5 },
        { icon: Award, title: 'Revenue Master', description: 'Generated $100K+ in revenue', unlocked: allTotalRevenue >= 100000 },
        { icon: Star, title: 'Approval Rate', description: '90%+ approval rate', unlocked: reports.length > 0 && (allApproved.length / reports.length) >= 0.9 },
    ];

    const formatMWK = (value: number) =>
        new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(value);

    if (showSubmissionForm) {
        return (
            <ReportSubmissionForm
                onCancel={() => setShowSubmissionForm(false)}
                onSubmitSuccess={handleReportSubmitted}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="text-white">
                            <h1 className="text-3xl font-bold tracking-tight">Operator Portal</h1>
                            <p className="text-blue-100 mt-1 text-sm font-medium">
                                {user?.email}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <Button
                                onClick={() => setShowSubmissionForm(true)}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                            >
                                <Plus className="size-4 mr-2" />
                                Submit Report
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleSignOut}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                            >
                                <LogOut className="size-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                            { id: 'reports', label: 'Reports', icon: FileText },
                            { id: 'insights', label: 'Insights', icon: TrendingUp },
                        ].map((tab) => (
                            <Button
                                key={tab.id}
                                variant={activeView === tab.id ? 'default' : 'ghost'}
                                onClick={() => setActiveView(tab.id as any)}
                                className={activeView === tab.id
                                    ? 'bg-card text-primary hover:bg-card/90'
                                    : 'text-foreground hover:bg-muted/50'
                                }
                            >
                                <tab.icon className="size-4 mr-2" />
                                {tab.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Month Filter */}
                {availableMonths.length > 0 && (
                    <div className="mb-6 bg-card border rounded-lg p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="size-5 text-muted-foreground" />
                                <Label htmlFor="month-filter" className="text-sm font-medium">Filter by Month:</Label>
                            </div>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger id="month-filter" className="w-[280px] border-input focus:border-ring focus:ring-ring">
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
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    Clear Filter
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {activeView === 'dashboard' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {[
                                { title: 'Total Reports', value: filteredReports.length, icon: FileText, suffix: '' },
                                {
                                    title: 'Total Revenue',
                                    value: formatMWK(totalRevenue),
                                    icon: TrendingUp,
                                },
                                {
                                    title: 'Total GGR',
                                    value: formatMWK(totalGGR),
                                    icon: BarChart3,
                                },
                                { title: 'Avg GGR %', value: avgGGRPercentage, icon: Target, suffix: '%', decimals: 2 },
                            ].map((stat) => (
                                <div key={stat.title}>
                                <Card>
                                        <CardHeader className="pb-2">
                                            <CardDescription className="flex items-center justify-between">
                                                <span>{stat.title}</span>
                                                <stat.icon className="size-4 text-muted-foreground" />
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl">
                                                {stat.prefix || ''}{stat.format ? stat.value.toLocaleString() : stat.decimals ? stat.value.toFixed(stat.decimals) : stat.value}{stat.suffix || ''}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                                                <YAxis />
                                                <Tooltip
                                                    formatter={(value: number) => `$${value.toLocaleString()}`}
                                                    contentStyle={{ 
                                                        borderRadius: '8px', 
                                                        border: '1px solid var(--border)',
                                                        backgroundColor: 'var(--card)',
                                                        color: 'var(--card-foreground)'
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
                                        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                            No data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

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
                                                    contentStyle={{ 
                                                        borderRadius: '8px', 
                                                        border: '1px solid var(--border)',
                                                        backgroundColor: 'var(--card)',
                                                        color: 'var(--card-foreground)'
                                                    }}
                                                />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                            No data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

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
                                    {achievements.map((achievement) => (
                                        <div
                                            key={achievement.title}
                                            className={`p-4 rounded-lg border-2 ${
                                                achievement.unlocked
                                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 shadow-sm'
                                                    : 'bg-muted border-border opacity-60'
                                            }`}
                                        >
                                            <achievement.icon className={`size-8 mb-2 ${achievement.unlocked ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`} />
                                            <h4 className="font-medium mb-1">{achievement.title}</h4>
                                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                                            {achievement.unlocked && (
                                                <Progress value={100} className="mt-2 h-1" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeView === 'reports' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {[
                                { status: 'approved', count: reports.filter(r => r.status === 'approved').length, color: 'from-green-500 to-emerald-500', icon: CheckCircle },
                                { status: 'pending', count: reports.filter(r => r.status === 'pending').length, color: 'from-yellow-500 to-orange-500', icon: Clock },
                                { status: 'rejected', count: reports.filter(r => r.status === 'rejected').length, color: 'from-red-500 to-pink-500', icon: XCircle },
                            ].map((item) => (
                                <Card key={item.status} className="overflow-hidden border-0 shadow-lg">
                                    <div className={`h-2 bg-gradient-to-r ${item.color}`} />
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground capitalize mb-1">{item.status}</p>
                                                <p className="text-4xl">{item.count}</p>
                                            </div>
                                            <item.icon className="size-12 opacity-20" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card className="shadow-lg border-0">
                            <CardHeader>
                                <CardTitle>Submitted Reports</CardTitle>
                                <CardDescription>View and track your monthly submissions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
                                ) : reports.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium text-foreground">No reports yet</h3>
                                        <p className="text-muted-foreground mb-6">Submit your first monthly report to get started.</p>
                                        <Button onClick={() => setShowSubmissionForm(true)}>Submit First Report</Button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="px-4 py-4 text-sm font-semibold">Period</th>
                                                <th className="px-4 py-4 text-sm font-semibold">Submitted</th>
                                                <th className="px-4 py-4 text-sm font-semibold text-right">Revenue</th>
                                                <th className="px-4 py-4 text-sm font-semibold text-right">GGR</th>
                                                <th className="px-4 py-4 text-sm font-semibold text-center">Status</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                            {filteredReports.map((report) => (
                                                <tr key={report.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <div className="font-medium">
                                                            {new Date(report.year, report.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-muted-foreground">
                                                        {new Date(report.submittedAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-right font-medium">
                                                        ${report.totalNetRevenue?.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-right font-medium text-indigo-600">
                                                        ${report.totalGGR?.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        {getStatusBadge(report.status)}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeView === 'insights' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lightbulb className="size-5 text-yellow-600" />
                                    Insights
                                </CardTitle>
                                <CardDescription>Performance analysis</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {totalRevenue > 0 ? (
                                        <>
                                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                                <h4 className="font-semibold text-blue-900 mb-1">Revenue Performance</h4>
                                                <p className="text-sm text-blue-800">Your average GGR percentage is {avgGGRPercentage.toFixed(2)}%, which is within the healthy range for your operator type.</p>
                                            </div>
                                            <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                                                <h4 className="font-semibold text-green-900 mb-1">Consistency</h4>
                                                <p className="text-sm text-green-800">You have a {((allApproved.length / reports.length) * 100).toFixed(0)}% approval rate across all submissions.</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            Submit more reports to unlock detailed insights.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="size-5 text-indigo-600" />
                                    Performance Targets
                                </CardTitle>
                                <CardDescription>Monthly goals and progress</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Monthly Revenue Target</span>
                                            <span className="font-medium">{((totalRevenue / 500000) * 100).toFixed(1)}%</span>
                                        </div>
                                        <Progress value={(totalRevenue / 500000) * 100} className="h-2" />
                                        <p className="text-xs text-gray-500 mt-2">$500,000 Milestone</p>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Report Accuracy</span>
                                            <span className="font-medium">95%</span>
                                        </div>
                                        <Progress value={95} className="h-2" />
                                        <p className="text-xs text-gray-500 mt-2">Based on administrative feedback</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}