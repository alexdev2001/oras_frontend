import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {authAPI, managementAPI, reportsAPI, analyticsAPI} from '@/utils/API.ts';
import {
    Plus, LogOut, FileText, Upload, CheckCircle, Clock, XCircle, Building2, ShieldCheck, UserCheck, UserX, Users,
    Download, ArrowUpDown, Filter, BarChart3, Database
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KpiCard } from './KpiCard';
import { ReportInstructionsDialog } from './ReportInstructionDialog';
import {jwtDecode} from 'jwt-decode';
import {RegulatorDataTables} from "@/components/admin/tabs/regulator/RegulatorDataTables.tsx";
import {ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar} from 'recharts';

interface RegulatorDashboardProps {
    onSignOut: () => void;
}

interface RegulatorSubmission {
    id: string;
    regulatorId: string;
    regulatorName: string;
    title: string;
    description: string;
    fileName: string;
    fileUrl: string;
    submittedAt: string;
    status: 'online' | 'offline';
    reviewNotes?: string;
}

interface UserRole {
    role_id: number;
    name: string;
}

interface UniqueRegulatorUser {
    user_id: string;
    email: string;
    full_name: string | null;
    is_active: boolean;
    roles?: UserRole[];
    operator_id: number | null;
    regulator_id: number;
}

interface DecodedToken {
    user_id: number;
    regulator_id: number | null;
    operator_id: number | null;
    roles: string[];
    exp: number;
}

interface AuthUser {
    email?: string;
    user_metadata?: {
        name?: string;
        country?: string;
    };
}

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

export function RegulatorDashboard({ onSignOut }: RegulatorDashboardProps) {
    const [submissions, setSubmissions] = useState<RegulatorSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSubmissionForm, setShowSubmissionForm] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [user] = useState<AuthUser | null>(null);
    const [uniqueOperators, setUniqueOperators] = useState<UniqueRegulatorUser[]>([]);
    const [regulatorId, setRegulatorId] = useState<number | null>(null);
    const [decoded, setDecoded] = useState<DecodedToken | null>(null);
    const [analytics, setAnalytics] = useState<RegulatorAnalytics | null>(null);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

    // Form state
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [month, setMonth] = useState('');
    const [submissionType, setSubmissionType] = useState<'online' | 'offline'>('online');

    const [filterType, setFilterType] = useState<'all' | 'online' | 'offline'>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [activeView, setActiveView] = useState<'overview' | 'submissions' | 'analytics'>('overview');

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const decodedToken = jwtDecode<DecodedToken>(token);
            setDecoded(decodedToken);
            setRegulatorId(decodedToken.regulator_id);
        } catch (err) {
            console.error('Invalid token', err);
        }
    }, []);

    useEffect(() => {
        if (!regulatorId) return;

        loadSubmissions();
        loadUniqueOperators(regulatorId);
        loadAnalytics(regulatorId);
    }, [regulatorId]);

    // const loadUser = async () => {
    //     try {
    //         const userData = await authAPI.getUser();
    //         setUser(userData);
    //     } catch (error) {
    //         console.error('Failed to load user:', error);
    //     }
    // };

    async function loadUniqueOperators(regulatorId: number) {
        try {
            const users = await managementAPI.getUsers();

            const regulatorUsers = users.filter((u: any) => {
                const hasRegulatorRole =
                    u.roles?.includes('regulator') ||
                    u.roles?.some((r: any) => r.name === 'regulator');

                return hasRegulatorRole && u.regulator_id === regulatorId;
            });

            setUniqueOperators(regulatorUsers as UniqueRegulatorUser[]);
        } catch (error) {
            console.error('Failed to load regulator users:', error);
            setUniqueOperators([]);
        }
    }

    const loadSubmissions = async () => {
        setIsLoading(true);
        try {
            const allSubmissions = await reportsAPI.getRegulatorSubmissionData();
            const scoped = regulatorId
                ? (allSubmissions as RegulatorSubmission[]).filter(
                    (submission) => Number(submission.regulatorId) === regulatorId
                )
                : allSubmissions;
            setSubmissions(scoped as RegulatorSubmission[]);
        } catch (error) {
            console.error('Failed to load submissions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAnalytics = async (currentRegulatorId: number) => {
        setIsAnalyticsLoading(true);
        try {
            const data = await analyticsAPI.getRegulatorAnalytics(currentRegulatorId);
            setAnalytics(data as RegulatorAnalytics);
        } catch (error) {
            console.error('Failed to load regulator analytics:', error);
            setAnalytics(null);
        } finally {
            setIsAnalyticsLoading(false);
        }
    };

    const filteredAndSortedSubmissions = submissions
        .filter(submission => {
            if (filterType === 'all') return true;
            return submission.status === filterType;
        })
        .sort((a, b) => {
            const dateA = new Date(a.submittedAt).getTime();
            const dateB = new Date(b.submittedAt).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });


    const handleSignOut = async () => {
        try {
            await authAPI.signout();
            onSignOut();
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!month || !file) {
            alert('Please select a reporting month and upload a file.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await reportsAPI.submitMetrics(month, submissionType, file);
            if (response !== null) {
                alert(`Report for ${month} (${submissionType}) submitted successfully!`);
                setShowSubmissionForm(false);
                resetForm();
                if (regulatorId !== null) {
                    loadSubmissions();
                }
            }
        } catch (error: any) {
            console.error('Failed to submit:', error);
            alert(error.message || 'Failed to submit file. Check console for network errors.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownload = (fileUrl: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetForm = () => {
        setMonth('');
        setSubmissionType('online');
        setFile(null);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'online':
                return (
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                        <CheckCircle className="size-3" />
                        Online
                    </Badge>
                );
            case 'offline':
                return (
                    <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                        <XCircle className="size-3" />
                        Offline
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
                        <XCircle className="size-3" />
                        Unknown
                    </Badge>
                );
        }
    };

    const combinedMonthly = analytics?.monthly?.combined ?? [];
    const totalStake = combinedMonthly.reduce((sum, row) => sum + (row.stake || 0), 0);
    const totalGgr = combinedMonthly.reduce((sum, row) => sum + (row.ggr || 0), 0);
    const avgGgrPct = combinedMonthly.length
        ? combinedMonthly.reduce((sum, row) => sum + (row.ggr_pct || 0), 0) / combinedMonthly.length
        : 0;

    const monthlyTrendData = combinedMonthly.map((row) => ({
        month: row.month,
        stake: row.stake,
        ggr: row.ggr,
    }));

    const onlineGgrRows = analytics?.per_operator?.online?.ggr ?? [];
    const offlineGgrRows = analytics?.per_operator?.offline?.ggr ?? [];
    const operatorTotalsMap = new Map<string, number>();

    onlineGgrRows.forEach((row) => {
        operatorTotalsMap.set(
            row.operator,
            (operatorTotalsMap.get(row.operator) || 0) + (row.TOTAL || 0),
        );
    });

    offlineGgrRows.forEach((row) => {
        operatorTotalsMap.set(
            row.operator,
            (operatorTotalsMap.get(row.operator) || 0) + (row.TOTAL || 0),
        );
    });

    const topOperators = Array.from(operatorTotalsMap.entries())
        .map(([operator, ggrTotal]) => ({ operator, ggrTotal }))
        .sort((a, b) => b.ggrTotal - a.ggrTotal)
        .slice(0, 5);

    function formatNumberShort(value: number) {
        if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + 'B';
        if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
        if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
        return value.toString();
    }

    if (showSubmissionForm) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
                <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 shadow-lg">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div className="text-white">
                                <h1 className="text-3xl font-bold tracking-tight">Submit Document</h1>
                                <p className="text-blue-100 mt-1 text-sm">Upload regulatory documents</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setShowSubmissionForm(false)}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card className="shadow-lg border-0">
                        <CardHeader>
                            <CardTitle>Document Submission</CardTitle>
                            <CardDescription>
                                Select the reporting month, submission type, and upload the document
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Month */}
                                <div className="space-y-2">
                                    <Label htmlFor="month">Reporting Month *</Label>
                                    <Input
                                        id="month"
                                        type="month"
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Online / Offline */}
                                <div className="space-y-2">
                                    <Label>Submission Type *</Label>
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="submission_type"
                                                value="online"
                                                checked={submissionType === 'online'}
                                                onChange={() => setSubmissionType('online')}
                                                className="accent-indigo-600"
                                                required
                                            />
                                            Online
                                        </label>

                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="submission_type"
                                                value="offline"
                                                checked={submissionType === 'offline'}
                                                onChange={() => setSubmissionType('offline')}
                                                className="accent-indigo-600"
                                                required
                                            />
                                            Offline
                                        </label>
                                    </div>
                                </div>

                                {/* File Upload */}
                                <div className="space-y-2">
                                    <Label htmlFor="file">Upload File *</Label>
                                    <Input
                                        id="file"
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"
                                        onChange={handleFileChange}
                                        required
                                    />

                                    {file && (
                                        <p className="text-sm text-gray-600">
                                            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        </p>
                                    )}

                                    <p className="text-sm text-gray-500">
                                        Accepted formats: PDF, DOC, DOCX, XLSX, XLS, CSV (Max 10MB)
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="size-4 mr-2" />
                                                Submit
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowSubmissionForm(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
            <ReportInstructionsDialog
                open={showInstructions}
                onOpenChange={(open) => {
                    setShowInstructions(open);
                    if (!open) {
                        setShowSubmissionForm(true);
                    }
                }}
            />

            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 shadow-lg sticky top-0 z-50"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="text-white">
                            <h1 className="text-3xl font-bold tracking-tight">Regulator Portal</h1>
                            <p className="text-blue-100 mt-1 text-sm font-medium">{user?.user_metadata?.name || user?.email}</p>
                            <p className="text-sm text-blue-200">{user?.user_metadata?.country || 'Country not set'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => {
                                    setShowInstructions(true);
                                    setShowSubmissionForm(false);
                                }}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                            >
                                <Plus className="size-4 mr-2" />
                                Submit Document
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

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 mt-6">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'submissions', label: 'Submissions', icon: FileText },
                            { id: 'analytics', label: 'Data Analytics', icon: Database },
                        ].map((tab) => (
                            <Button
                                key={tab.id}
                                variant={activeView === tab.id ? 'default' : 'ghost'}
                                onClick={() => setActiveView(tab.id as any)}
                                className={activeView === tab.id
                                    ? 'bg-white text-indigo-600 hover:bg-white/90'
                                    : 'text-white hover:bg-white/10'
                                }
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
                {/* OVERVIEW TAB */}
                {activeView === 'overview' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <KpiCard
                                title="Licensed Users"
                                value={uniqueOperators.length}
                                icon={Users}
                            />
                            <KpiCard
                                title="Total Submissions"
                                value={submissions.length}
                                icon={FileText}
                            />
                            <KpiCard
                                title="Active Users"
                                value={uniqueOperators.filter(op => op.is_active).length}
                                icon={UserCheck}
                                color="from-green-500 to-emerald-500"
                            />
                        </div>

                        {/* Analytics Overview for this Regulator */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="size-5 text-indigo-600" />
                                        Monthly Performance
                                    </CardTitle>
                                    <CardDescription>
                                        Combined online and offline performance for this regulator
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isAnalyticsLoading ? (
                                        <div className="h-[240px] flex items-center justify-center text-gray-500">
                                            Loading analytics...
                                        </div>
                                    ) : monthlyTrendData.length === 0 ? (
                                        <div className="h-[240px] flex items-center justify-center text-gray-400">
                                            No analytics data available yet
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={240}>
                                            <AreaChart data={monthlyTrendData} margin={{ top: 40, right: 30, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="regStake" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="regGgr" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                                <XAxis dataKey="month" />
                                                <YAxis
                                                    domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.05)]}
                                                    tickFormatter={(value) => {
                                                        if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + 'B';
                                                        if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
                                                        if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
                                                        return value.toString();
                                                    }}
                                                    width={60}
                                                />
                                                <Tooltip
                                                    formatter={(value: number) => `MWK ${value.toLocaleString('en-US')}`}
                                                    contentStyle={{
                                                        borderRadius: '8px',
                                                        border: '1px solid #e5e7eb',
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="stake"
                                                    name="Stake"
                                                    stroke="#4f46e5"
                                                    fill="url(#regStake)"
                                                    label={false}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="ggr"
                                                    name="GGR"
                                                    stroke="#22c55e"
                                                    fill="url(#regGgr)"
                                                    label={({ x, y, value }) => {
                                                        if (!value) return null;
                                                        return (
                                                            <text
                                                                x={x}
                                                                y={y - 10}
                                                                fill="#22c55e"
                                                                fontSize={12}
                                                                fontWeight="500"
                                                                textAnchor="middle"
                                                            >
                                                                {formatNumberShort(value)}
                                                            </text>
                                                        );
                                                    }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="size-5 text-indigo-600" />
                                        Top Operators by GGR
                                    </CardTitle>
                                    <CardDescription>
                                        Highest contributing operators for this regulator
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isAnalyticsLoading ? (
                                        <div className="h-[240px] flex items-center justify-center text-gray-500">
                                            Loading analytics...
                                        </div>
                                    ) : topOperators.length === 0 ? (
                                        <div className="h-[240px] flex items-center justify-center text-gray-400">
                                            No operator analytics available
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={240}>
                                            <BarChart
                                                data={topOperators}
                                                margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                                <XAxis dataKey="operator" />
                                                <YAxis
                                                    tickFormatter={(value) => {
                                                        if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + 'B';
                                                        if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
                                                        if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
                                                        return value.toString();
                                                    }}
                                                    width={60}
                                                />
                                                <Tooltip
                                                    formatter={(value: number) =>
                                                        `MWK ${value.toLocaleString('en-US')}`
                                                    }
                                                    contentStyle={{
                                                        borderRadius: '8px',
                                                        border: '1px solid #e5e7eb',
                                                    }}
                                                />
                                                <Bar dataKey="ggrTotal" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Licensed Operators */}
                        <div className="mb-10">
                            <Card className="border border-gray-200">
                                <CardContent className="pt-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-600">
                                            Licensed Operators
                                        </p>
                                        <span className="text-xs text-gray-500">
                      {uniqueOperators.length} total
                    </span>
                                    </div>

                                    {uniqueOperators.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <Users className="size-12 mx-auto mb-4 text-gray-400" />
                                            <p>No licensed operators found</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-3">
                                            {uniqueOperators.map((op) => {
                                                const isActive = op.is_active;

                                                return (
                                                    <div
                                                        key={op.user_id}
                                                        className="flex items-center gap-3 px-4 py-2 rounded-full border bg-gray-50 hover:bg-gray-100 transition"
                                                    >
                                                        {/* Icon avatar */}
                                                        <div
                                                            className={`h-9 w-9 rounded-full flex items-center justify-center ${
                                                                isActive
                                                                    ? 'bg-green-100 text-green-600'
                                                                    : 'bg-gray-200 text-gray-500'
                                                            }`}
                                                        >
                                                            <Building2 className="h-4 w-4" />
                                                        </div>

                                                        {/* Operator info */}
                                                        <div className="flex flex-col leading-tight">
                              <span className="text-sm font-medium text-gray-800 max-w-[140px] truncate">
                                {op.full_name ?? op.email}
                              </span>

                                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                {isActive ? (
                                                                    <>
                                                                        <UserCheck className="h-3 w-3 text-green-500" />
                                                                        Active
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UserX className="h-3 w-3 text-gray-400" />
                                                                        Inactive
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Role badge */}
                                                        <div className="ml-2 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                                            <ShieldCheck className="h-3 w-3" />
                                                            Regulator
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                )}

                {/* SUBMISSIONS TAB */}
                {activeView === 'submissions' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {[
                                {
                                    label: 'Total Submissions',
                                    value: submissions.length,
                                    color: 'from-indigo-500 to-blue-500',
                                    icon: FileText,
                                },
                                {
                                    label: 'Online',
                                    value: submissions.filter(s => s.status === 'online').length,
                                    color: 'from-green-500 to-emerald-500',
                                    icon: CheckCircle,
                                },
                                {
                                    label: 'Offline',
                                    value: submissions.filter(s => s.status === 'offline').length,
                                    color: 'from-amber-500 to-orange-500',
                                    icon: Clock,
                                },
                            ].map((stat) => (
                                <Card key={stat.label} className="overflow-hidden border-0 shadow-md">
                                    <div className={`h-1.5 bg-gradient-to-r ${stat.color}`} />
                                    <CardContent className="pt-4 pb-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs uppercase tracking-wide text-gray-500">
                                                    {stat.label}
                                                </p>
                                                <p className="text-3xl font-semibold mt-1">
                                                    {stat.value}
                                                </p>
                                            </div>
                                            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                                <stat.icon className="size-5 text-slate-500" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Submissions List */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Document Submissions</CardTitle>
                                        <CardDescription>View and track your submitted documents</CardDescription>
                                    </div>

                                    {submissions.length > 0 && (
                                        <div className="flex items-center gap-3">
                                            {/* Filter by Type */}
                                            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                                                <SelectTrigger className="w-[140px]">
                                                    <Filter className="size-4 mr-2" />
                                                    <SelectValue placeholder="Filter" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Types</SelectItem>
                                                    <SelectItem value="online">Online</SelectItem>
                                                    <SelectItem value="offline">Offline</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {/* Sort by Date */}
                                            <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                                                <SelectTrigger className="w-[140px]">
                                                    <ArrowUpDown className="size-4 mr-2" />
                                                    <SelectValue placeholder="Sort" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="newest">Newest First</SelectItem>
                                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="text-center py-8 text-gray-500">Loading submissions...</div>
                                ) : submissions.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-12"
                                    >
                                        <FileText className="size-12 mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-600 mb-4">No documents submitted yet</p>
                                        <Button onClick={() => setShowInstructions(true)}>
                                            <Plus className="size-4 mr-2" />
                                            Submit Your First Document
                                        </Button>
                                    </motion.div>
                                ) : filteredAndSortedSubmissions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No submissions match the selected filter
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredAndSortedSubmissions.map((submission, index) => (
                                            <motion.div
                                                key={submission.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="border rounded-lg p-4 hover:bg-gray-50 transition-all hover:shadow-md"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-medium">{submission.title}</h3>
                                                            {getStatusBadge(submission.status)}
                                                        </div>
                                                        <p className="text-sm text-gray-500">
                                                            Submitted {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                        </p>
                                                    </div>

                                                    {/* Download Button */}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDownload(submission.fileUrl, submission.fileName)}
                                                        className="ml-4"
                                                    >
                                                        <Download className="size-4 mr-2" />
                                                        Download
                                                    </Button>
                                                </div>

                                                <p className="text-sm text-gray-600 mb-3">{submission.description}</p>

                                                <div className="flex items-center gap-2 text-sm">
                                                    <FileText className="size-4 text-gray-400" />
                                                    <span className="text-gray-600 font-medium">{submission.fileName}</span>
                                                </div>

                                                {submission.reviewNotes && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="mt-3 p-3 bg-gray-100 rounded text-sm"
                                                    >
                                                        <p className="font-medium text-gray-700">Review Notes:</p>
                                                        <p className="text-gray-600">{submission.reviewNotes}</p>
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

                {/* ANALYTICS TAB */}
                {activeView === 'analytics' && regulatorId !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <RegulatorDataTables regulatorId={regulatorId} />
                    </motion.div>
                )}
            </div>
        </div>
    );
}