import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    LogOut,
    BarChart3,
    FileCheck,
    Users,
    Database,
    FileText,
    Filter,
    Building2,
    Menu,
    X,
    Landmark,
    Calendar,
    Grid
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsOverview } from './tabs/AnalyticsOverview.tsx';
import { ReconciliationView } from './tabs/ReconciliationView.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Label } from '@/components/ui/label.tsx';
import { ReportsTab } from './tabs/ReportsTab.tsx';
import { authAPI, managementAPI, reportsAPI } from '@/utils/API.ts';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { OperatorUserManagement } from '@/components/admin/tabs/OperatorUserManagement.tsx';
import type { Operator } from '@/components/admin/tabs/OperatorUserManagement.tsx';
import {type Metric, MetricsTab} from "@/components/admin/tabs/regulator/MetricsTab.tsx";
import {MonthlySummaryGenerator} from "@/components/summary/MonthlySummaryGenerator.tsx";
import {AdminRegulatorDataTables} from "@/components/admin/AdminRegulatorDataTables.tsx";
import type {DecodedToken, RegulatorSubmission} from "@/components/regulator/RegulatorDashboard.tsx";
import {jwtDecode} from "jwt-decode";
import {AdminRegulatorSubmissions} from "@/components/admin/tabs/regulator/RegulatorSubmissions.tsx";
import type { DashboardAnalytics } from '@/types/report';
import { analyticsAPI } from '@/utils/API';

interface AdminDashboardProps {
    onSignOut: () => void;
}

interface User {
    email?: string;
    user_metadata?: {
        name?: string;
        role?: string;
    };
}

interface Regulator {
    regulator_id: number;
    regulator_name: string;
}

const operatorTabs = [
    { value: 'overview', label: 'Analytics Overview', icon: BarChart3 },
    { value: 'reports', label: 'Reports', icon: FileText },
    { value: 'reconciliation', label: 'EMS Reconciliation', icon: Database },
    { value: 'users', label: 'User Management', icon: Users },
];

const regulatorTabs = [
    { value: 'dashboard', label: 'Overview', icon: Grid },
    { value: 'metrics', label: 'Metrics', icon: BarChart3 },
    { value: 'submissions', label: 'Submissions', icon: FileText },
    { value: 'users', label: 'User Management', icon: Users },
];

export function AdminDashboard({ onSignOut }: AdminDashboardProps) {
    const [user, setUser] = useState<User | null>(null);
    const [mode, setMode] = useState<'operator' | 'regulator'>('regulator');
    const [activeTab, setActiveTab] = useState('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [operators, setOperators] = useState<Operator[]>([]);
    const [selectedOperator, setSelectedOperator] = useState<string>('all');
    const [regulators, setRegulators] = useState<Regulator[]>([]);
    const [selectedRegulator, setSelectedRegulator] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [loadingOperators, setLoadingOperators] = useState(true);
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [submissions, setSubmissions] = useState<RegulatorSubmission[]>([]);
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const decoded = jwtDecode<DecodedToken>(token);

            setUser({
                email: decoded.email_notification,
                user_metadata: {
                    role: decoded.roles?.[0],
                },
            });
        } catch (err) {
            console.error('Invalid token', err);
        }
    }, []);

    useEffect(() => {
        loadOperators();
        loadRegulators();
        loadRegulatorMetrics();
        loadSubmissions();
        loadAnalytics();
    }, []);
    const loadRegulators = async () => {
        try {
            const regulatorsData = await managementAPI.getRegulators();
            setRegulators((regulatorsData || []).filter(r => r && r.regulator_id));
        } catch (error) {
            console.error('Failed to load regulators:', error);
        }
    };

    const loadSubmissions = async () => {
        try {
            const submissionsData = await reportsAPI.getRegulatorSubmissionData();
            setSubmissions(submissionsData);
        } catch (e) {
            console.error('Failed to load submissions:', e);
        }
    }

    const loadAnalytics = async () => {
        try {
            setIsAnalyticsLoading(true);

            let operatorId: number | null = null;

            if (mode === 'operator' && selectedOperator !== 'all') {
                operatorId = Number(selectedOperator);
            }

            const data = await analyticsAPI.getAnalyticsByOperatorId(operatorId);
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            setAnalytics(null);
        } finally {
            setIsAnalyticsLoading(false);
        }
    };

    useEffect(() => {
        // Reset active tab when mode changes
        setActiveTab(mode === 'operator' ? 'overview' : 'dashboard');
        setMobileMenuOpen(false);
    }, [mode]);

    const loadOperators = async () => {
        try {
            setLoadingOperators(true);
            const operatorsData = await managementAPI.getOperators();
            setOperators((operatorsData || []).filter(op => op && op.operator_id));
        } catch (error) {
            console.error('Failed to load operators:', error);
        } finally {
            setLoadingOperators(false);
        }
    };

    const loadRegulatorMetrics = async () => {
        try {
            const metricsData = await reportsAPI.getRegulatorMetrics();
            if (metricsData) {
                setMetrics(metricsData);
            }
        } catch (error) {
            console.error('Failed to load regulator metrics:', error);
        }
    };

    // const loadUser = async () => {
    //     try {
    //         const userData = await authAPI.getUser();
    //         setUser(userData);
    //     } catch (err) {
    //         console.error("Failed to load user:", err);
    //     }
    // };

    const handleSignOut = async () => {
        try {
            await authAPI.signout();
            onSignOut();
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    };

    // Render tabs based on mode
    const tabs = mode === 'operator' ? operatorTabs : regulatorTabs;

    // Render content for regulator tabs (placeholder for now)
    function RegulatorTabContent({ value }: { value: string }) {
        return (
            <div className="text-center ">
                <p className="text-gray-600">
                    {value === 'dashboard' && (
                        <AdminRegulatorDataTables/>
                    )}
                    {value === 'metrics' && (
                        <MetricsTab
                            metrics={metrics}
                            selectedRegulator={selectedRegulator}
                            selectedMonth={selectedMonth}
                        />
                    )}
                    {value === 'submissions' && (
                        <AdminRegulatorSubmissions submissions={submissions}/>
                    )}
                </p>
                {value === 'users' && <OperatorUserManagement />}
            </div>
        );
    }

    const getLast12Months = () => {
        const months: { value: string; label: string }[] = [];
        const now = new Date(); // Tue Jan 06 2026

        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");

            months.push({
                value: `${year}-${month}`,
                label: date.toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                }),
            });
        }

        return months;
    };

    const months = getLast12Months();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="text-white">
                            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                            <p className="text-blue-100 mt-1 text-sm font-medium">Gaming Operator Reporting System</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right mr-2 hidden sm:block">
                                <p className="text-sm font-medium text-white">{user?.email}</p>
                                <p className="text-xs text-blue-100">Administrator</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleSignOut}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                            >
                                <LogOut className="size-4 mr-2" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Mode Switcher & Filters Card */}
                <Card className="mb-6 shadow-md border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            {/* Mode Switcher */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-sm font-semibold text-gray-700">View Mode</Label>
                                <div className="inline-flex rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 p-1 shadow-inner">
                                    <button
                                        onClick={() => setMode('regulator')}
                                        className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                                            mode === 'regulator'
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md transform scale-105'
                                                : 'text-gray-700 hover:text-gray-900'
                                        }`}
                                    >
                                        <FileCheck className="size-4 inline mr-2" />
                                        Regulator
                                    </button>
                                    <button
                                        onClick={() => setMode('operator')}
                                        className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                                            mode === 'operator'
                                                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md transform scale-105'
                                                : 'text-gray-700 hover:text-gray-900'
                                        }`}
                                    >
                                        <Building2 className="size-4 inline mr-2" />
                                        Operator
                                    </button>
                                </div>
                            </div>


                            {/* Filters - Only show for operator mode */}
                            {mode === 'operator' && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-1 lg:justify-end">
                                    {/* Operator Filter */}
                                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                                        <Label htmlFor="operator-filter" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Filter className="size-4 text-indigo-600" />
                                            Operator
                                        </Label>
                                        <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                                            <SelectTrigger id="operator-filter" className="w-full sm:w-[220px] border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                                                <SelectValue placeholder="Loading operators..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    <span className="font-medium">All Operators</span>
                                                </SelectItem>
                                                {operators.map(op => (
                                                    <SelectItem key={op.operator_id} value={op.operator_id.toString()}>
                                                        {op.operator_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Month Filter */}
                                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                                        <Label htmlFor="month-filter" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Filter className="size-4 text-indigo-600" />
                                            Month
                                        </Label>
                                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                            <SelectTrigger id="month-filter" className="w-full sm:w-[200px] border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                                                <SelectValue placeholder="All Months" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    <span className="font-medium">All Months</span>
                                                </SelectItem>

                                                {months.map(month => (
                                                    <SelectItem key={month.value} value={month.value}>
                                                        {month.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {/* Filters - Only show for regulator mode */}
                            {mode === 'regulator' && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-1 lg:justify-end">
                                    {/* Regulator Filter */}
                                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                                        <Label
                                            htmlFor="regulator-filter"
                                            className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                                        >
                                            <Landmark className="size-4 text-purple-600" />
                                            Regulator
                                        </Label>
                                        <Select
                                            value={selectedRegulator}
                                            onValueChange={setSelectedRegulator}
                                        >
                                            <SelectTrigger
                                                id="regulator-filter"
                                                className="w-full sm:w-[220px] border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                                            >
                                                <SelectValue placeholder="Loading regulators..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                        <span className="font-medium">
                            All Regulators
                        </span>
                                                </SelectItem>
                                                {regulators.map((reg) => (
                                                    <SelectItem
                                                        key={reg.regulator_id}
                                                        value={reg.regulator_id.toString()}
                                                    >
                                                        {reg.regulator_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Month Filter */}
                                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                                        <Label
                                            htmlFor="regulator-month-filter"
                                            className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                                        >
                                            <Calendar className="size-4 text-purple-600" />
                                            Month
                                        </Label>
                                        <Select
                                            value={selectedMonth}
                                            onValueChange={setSelectedMonth}
                                        >
                                            <SelectTrigger
                                                id="regulator-month-filter"
                                                className="w-full sm:w-[200px] border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                                            >
                                                <SelectValue placeholder="All Months" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                        <span className="font-medium">
                            All Months
                        </span>
                                                </SelectItem>
                                                {months.map((month) => (
                                                    <SelectItem
                                                        key={month.value}
                                                        value={month.value}
                                                    >
                                                        {month.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <MonthlySummaryGenerator mode={mode}/>

                {/* Tabs Section */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            {/* Mobile Hamburger Menu */}
                            <div className="lg:hidden mb-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="w-full justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        {(() => {
                                            const activeTabData = tabs.find(t => t.value === activeTab);
                                            const Icon = activeTabData?.icon;
                                            return Icon ? <Icon className="size-4" /> : null;
                                        })()}
                                        {tabs.find(t => t.value === activeTab)?.label}
                                    </span>
                                    {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
                                </Button>

                                {mobileMenuOpen && (
                                    <div className="mt-2 border rounded-lg bg-white shadow-lg overflow-hidden">
                                        {tabs.map((tab) => {
                                            const Icon = tab.icon;
                                            return (
                                                <button
                                                    key={tab.value}
                                                    className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors ${
                                                        activeTab === tab.value
                                                            ? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 font-semibold border-l-4 border-indigo-600'
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                    onClick={() => {
                                                        setActiveTab(tab.value);
                                                        setMobileMenuOpen(false);
                                                    }}
                                                >
                                                    <Icon className="size-5" />
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Desktop Tabs */}
                            <TabsList className="hidden lg:inline-flex mb-6 bg-gradient-to-r from-slate-100 to-slate-50 p-1">
                                {tabs.map(tab => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                                    >
                                        <tab.icon className="size-4 mr-2" />
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {/* Tabs Content */}
                            {mode === 'operator' ? (
                                <>
                                    <TabsContent value="overview" className="mt-0">
                                        <AnalyticsOverview
                                            selectedOperator={selectedOperator}
                                            selectedMonth={selectedMonth}
                                        />
                                    </TabsContent>

                                    <TabsContent value="reports" className="mt-0">
                                        <ReportsTab selectedOperator={selectedOperator} selectedMonth={selectedMonth} />
                                    </TabsContent>

                                    <TabsContent value="reconciliation" className="mt-0">
                                        <ReconciliationView/>
                                    </TabsContent>

                                    <TabsContent value="users" className="mt-0">
                                        <OperatorUserManagement/>
                                    </TabsContent>
                                </>
                            ) : (
                                <>
                                    {regulatorTabs.map(tab => (
                                        <TabsContent key={tab.value} value={tab.value} className="mt-0">
                                            <RegulatorTabContent value={tab.value} />
                                        </TabsContent>
                                    ))}
                                </>
                            )}
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}