import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {authAPI, managementAPI, reportsAPI, analyticsAPI} from '@/utils/API.ts';
import {
    Plus, LogOut, FileText, Upload, CheckCircle, Clock, XCircle, Building2, ShieldCheck, UserCheck, UserX, Users,
    Download, ArrowUpDown, Filter, BarChart3, Database, TrendingUp
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
import {RegulatorPredictionsTab} from "@/components/admin/tabs/predictions/RegulatorPredictionsTab.tsx";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar} from 'recharts';
import {FilePreview} from "@/components/regulator/FilePreview.tsx";
import {MaglaSubmissionPage} from "@/components/regulator/MaglaSubmissionPage.tsx";
import {MaglaInstructionsDialog} from "@/components/regulator/MaglaInstructionsDialog.tsx";
import type {Regulator} from "@/types/regulator.ts";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MonthPicker } from '@/components/ui/month-picker';
import { tokenManager } from '@/utils/security.ts';

interface RegulatorDashboardProps {
    onSignOut: () => void;
}

export interface RegulatorSubmission {
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

export interface DecodedToken {
    user_id: number;
    email_notification: string;
    regulator_id: number | null;
    operator_id: number | null;
    roles: string[];
    country?: string | null;
    exp: number;
    iat: number;
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
    const [formError, setFormError] = useState<string | null>(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const [uniqueOperators, setUniqueOperators] = useState<UniqueRegulatorUser[]>([]);
    const [regulatorId, setRegulatorId] = useState<number | null>(null);
    const [decoded, setDecoded] = useState<DecodedToken | null>(null);
    const [analytics, setAnalytics] = useState<RegulatorAnalytics | null>(null);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertTitle, setAlertTitle] = useState("");
    const [alertMessage, setAlertMessage] = useState("");
    const [regulators, setRegulators] = useState<Regulator[]>([]);
    const [showMaglaSubmissionForm, setShowMaglaSubmissionForm] = useState(false);
    const [showMaglaInstructions, setShowMaglaInstructions] = useState(false);

    // Determine regulator type based on email or regulator ID
    const isMaglaRegulator = decoded?.email_notification?.toLowerCase().includes('magla') || 
                            regulators.find(r => r.regulator_id === regulatorId)?.regulator_name.toLowerCase().includes('magla');

    const displayUser = decoded
        ? {
            email: decoded.email_notification,
            country: decoded.country,
            role: decoded.roles?.[0],
        }
        : null;

    // Form state
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [month, setMonth] = useState('');
    const [submissionType, setSubmissionType] = useState<'online' | 'offline'>('online');

    const [filterType, setFilterType] = useState<'all' | 'online' | 'offline'>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [activeView, setActiveView] = useState<'overview' | 'submissions' | 'analytics' | 'predictions'>('overview');

    const currentRegulator = decoded?.regulator_id && displayUser?.email
        ? [{ regulator_id: decoded.regulator_id, regulator_name: displayUser.email }]
        : [];

    useEffect(() => {
        const token = tokenManager.getToken();
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
        loadRegulators();
    }, [regulatorId]);

    // const loadUser = async () => {
    //     try {
    //         const userData = await authAPI.getUser();
    //         setUser(userData);
    //     } catch (error) {
    //         console.error('Failed to load user:', error);
    //     }
    // };

    async function loadRegulators() {
        try {
            const regulators = await managementAPI.getRegulators();
            setRegulators((regulators || []).filter(r => r && r.regulator_id));
        } catch (e) {
            console.error('cannot find regulator', e);
        }
    }

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
            console.log('submissions', scoped);
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
        setFormError(null);

        if (!month || !file) {
            setFormError("Please select a reporting month and upload a file.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await reportsAPI.submitMetrics(month, submissionType, file);
            if (response !== null) {
                setAlertTitle("Submission Successful");
                setAlertMessage(`Report for ${month} (${submissionType}) submitted successfully!`);
                setShowAlert(true);
                setShowSubmissionForm(false);
                resetForm();
                if (regulatorId !== null) {
                    loadSubmissions();
                    loadUniqueOperators(regulatorId);
                    loadAnalytics(regulatorId);
                }
            }
        } catch (error: any) {
            console.error('Failed to submit:', error);

            const backendMessage =
                error?.response?.data?.detail ||
                error?.message ||
                'Submission failed. Please check your file format.';

            setFormError(backendMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const downloadFile = async (reportId: number, fileName: string) => {
        console.log('triggered')
        try {
            const blob = await reportsAPI.getRegulatorSubmitFile(reportId);

            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download file', err);
        }
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
                    <Badge className="bg-muted text-muted-foreground flex items-center gap-1">
                        <XCircle className="size-3" />
                        Unknown
                    </Badge>
                );
        }
    };

    const combinedMonthly = analytics?.monthly?.combined
        ?.sort((a, b) => a.month.localeCompare(b.month)) ?? [];
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

    const isPdf = (fileName: string) =>
        fileName.toLowerCase().endsWith('.pdf');

    const isPreviewable = (fileName: string) =>
        isPdf(fileName);

    const getFileExtension = (fileName: string) =>
        fileName.split('.').pop()?.toUpperCase() ?? 'FILE';


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
                                className="bg-card/10 border-border text-foreground hover:bg-card/20 backdrop-blur-sm"
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
                                {formError && (
                                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        <strong className="block font-medium mb-1">Error</strong>
                                        {formError}
                                    </div>
                                )}
                                {/* Month */}
                                <MonthPicker
                                    value={month}
                                    onChange={setMonth}
                                    label="Reporting Month"
                                    required
                                    className="relative"
                                />

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
                                {/* File Upload */}
                                <div className="space-y-2">
                                    <Label htmlFor="file">Upload File *</Label>

                                    <Input
                                        id="file"
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"
                                        onChange={handleFileChange}
                                        required
                                        className={formError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                    />

                                    {file && (
                                        <p className="text-sm text-muted-foreground">
                                            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        </p>
                                    )}

                                    <p className="text-sm text-muted-foreground">
                                        Accepted formats: XLSX, XLS, CSV (Max 10MB)
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

    if (showMaglaSubmissionForm) {
        return (
            <MaglaSubmissionPage
                onCancel={() => setShowMaglaSubmissionForm(false)}
                onSubmitSuccess={() => {
                    if (regulatorId !== null) {
                        loadSubmissions();
                        loadUniqueOperators(regulatorId);
                        loadAnalytics(regulatorId);
                    }
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <ReportInstructionsDialog
                open={showInstructions}
                onOpenChange={(open) => {
                    setShowInstructions(open);
                }}
                onGetStarted={() => {
                    setShowSubmissionForm(true);
                }}
            />

            {/* Magla Instructions Dialog */}
            <MaglaInstructionsDialog
                open={showMaglaInstructions}
                onOpenChange={(open) => {
                    setShowMaglaInstructions(open);
                }}
                onGetStarted={() => {
                    setShowMaglaSubmissionForm(true);
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
                            <p className="text-blue-100 mt-1 text-sm font-medium">
                                {displayUser?.email}
                            </p>

                            <p className="text-sm text-blue-200">
                                {displayUser?.country ?? 'Country not set'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <Button
                                onClick={() => {
                                    if (isMaglaRegulator) {
                                        setShowMaglaInstructions(true);
                                        setShowMaglaSubmissionForm(false);
                                    } else {
                                        setShowInstructions(true);
                                        setShowSubmissionForm(false);
                                    }
                                }}
                                className="bg-card/10 border-border text-foreground hover:bg-card/20 backdrop-blur-sm"
                            >
                                <Plus className="size-4 mr-2" />
                                Submit Document
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleSignOut}
                                className="bg-card/10 border-border text-foreground hover:bg-card/20 hover:text-foreground backdrop-blur-sm"
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
                            { id: 'predictions', label: 'Predictions', icon: TrendingUp },
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
                                        <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                                            Loading analytics...
                                        </div>
                                    ) : monthlyTrendData.length === 0 ? (
                                        <div className="h-[240px] flex items-center justify-center text-muted-foreground">
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
                                                        border: '1px solid hsl(var(--border))',
                                                        backgroundColor: 'hsl(var(--background))',
                                                        color: 'hsl(var(--foreground))',
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
                                        <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                                            Loading analytics...
                                        </div>
                                    ) : topOperators.length === 0 ? (
                                        <div className="h-[240px] flex items-center justify-center text-muted-foreground">
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
                                                    formatter={(value: number) => [
                                                        <span style={{ color: '#1f2937', fontWeight: 'bold' }}>
                                                            MWK {value.toLocaleString('en-US')}
                                                        </span>,
                                                        'GGR'
                                                    ]}
                                                    contentStyle={{
                                                        borderRadius: '8px',
                                                        border: '1px solid hsl(var(--border))',
                                                        backgroundColor: 'hsl(var(--background))',
                                                        color: 'hsl(var(--foreground))',
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
                            <Card className="border border-border">
                                <CardContent className="pt-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Licensed Operators
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                      {uniqueOperators.length} total
                    </span>
                                    </div>

                                    {uniqueOperators.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Users className="size-12 mx-auto mb-4 text-muted-foreground" />
                                            <p>No licensed operators found</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-3">
                                            {uniqueOperators.map((op) => {
                                                const isActive = op.is_active;

                                                return (
                                                    <div
                                                        key={op.user_id}
                                                        className="flex items-center gap-3 px-4 py-2 rounded-full border bg-muted hover:bg-muted/80 transition"
                                                    >
                                                        {/* Icon avatar */}
                                                        <div
                                                            className={`h-9 w-9 rounded-full flex items-center justify-center ${
                                                                isActive
                                                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                                                    : 'bg-muted text-muted-foreground'
                                                            }`}
                                                        >
                                                            <Building2 className="h-4 w-4" />
                                                        </div>

                                                        {/* Operator info */}
                                                        <div className="flex flex-col leading-tight">
                              <span className="text-sm font-medium text-foreground max-w-[140px] truncate">
                                {op.full_name ?? op.email}
                              </span>

                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                {isActive ? (
                                                                    <>
                                                                        <UserCheck className="h-3 w-3 text-green-500" />
                                                                        Active
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UserX className="h-3 w-3 text-muted-foreground" />
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
                                        <Button onClick={() => {
                                            if (isMaglaRegulator) {
                                                setShowMaglaInstructions(true);
                                            } else {
                                                setShowInstructions(true);
                                            }
                                        }}>
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
                                                className="border rounded-lg p-4 hover:bg-muted/50 transition-all hover:shadow-md"
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
                                                        onClick={() => downloadFile(
                                                            Number(submission.id),
                                                            submission.fileName
                                                        )}
                                                        className="ml-4"
                                                    >
                                                        <Download className="size-4 mr-2" />
                                                        Download
                                                    </Button>
                                                </div>

                                                <p className="text-sm text-gray-600 mb-3">{submission.description}</p>

                                                <div className="flex items-center gap-2 text-sm">
                                                    <FileText className="size-4 text-gray-400" />
                                                    <span className="text-gray-600 font-medium">
                                                        {submission.fileName}
                                                    </span>
                                                </div>

                                                <FilePreview
                                                    reportId={Number(submission.id)}
                                                    fileName={submission.fileName}
                                                />

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

                {/* PREDICTIONS TAB */}
                {activeView === 'predictions' && regulatorId !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <RegulatorPredictionsTab
                            regulators={regulators}
                            regulatorAnalytics={analytics ? [analytics] : []}
                            decodedRegulatorId={regulatorId}
                        />
                    </motion.div>
                )}
            </div>

            <Dialog open={showAlert} onOpenChange={setShowAlert}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{alertTitle}</DialogTitle>
                        <DialogDescription>{alertMessage}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setShowAlert(false)}>OK</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface KpiProps {
    icon: React.ElementType;
    label: string;
    value: string;
}

function Kpi({
                                           icon: Icon,
                                           label,
                                           value
                                       }: KpiProps) {
    return (
        <Card>
            <CardContent className="flex items-center gap-3 p-4">
                <Icon className="text-indigo-600 shrink-0"/>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className="font-semibold truncate max-w-[160px] whitespace-nowrap cursor-default">
                                {value}
                            </p>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start" className="text-xs">
                            {value}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </CardContent>
        </Card>
    );
}

