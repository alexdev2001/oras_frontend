import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    LogOut,
    BarChart3,
    Users,
    FileText,
    Landmark,
    Calendar,
    Grid, TrendingUp,
    Goal
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Label } from '@/components/ui/label.tsx';
import { authAPI, managementAPI, reportsAPI } from '@/utils/API.ts';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { OperatorUserManagement } from '@/components/admin/tabs/OperatorUserManagement.tsx';
import {type Metric, MetricsTab} from "@/components/admin/tabs/regulator/MetricsTab.tsx";
import {MonthlySummaryGenerator} from "@/components/summary/MonthlySummaryGenerator.tsx";
import {AdminRegulatorDataTables, type RegulatorAnalytics} from "@/components/admin/AdminRegulatorDataTables.tsx";
import type {DecodedToken, RegulatorSubmission} from "@/components/regulator/RegulatorDashboard.tsx";
import {jwtDecode} from "jwt-decode";
import {AdminRegulatorSubmissions} from "@/components/admin/tabs/regulator/RegulatorSubmissions.tsx";
import { tokenManager } from '@/utils/security.ts';
import { analyticsAPI } from '@/utils/API';
import {RegulatorPredictionsTab} from "@/components/admin/tabs/predictions/RegulatorPredictionsTab.tsx";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Menu, X } from 'lucide-react';

// MAGLA types
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

interface MaglaReport {
    report_id: number;
    date_time: string;
    opening_balances_total: number;
    closing_balances_total: number;
    uploaded_by: number;
    uploaded_by_name: string;
    operator_id: number;
    operator_name: string;
    status: string;
    report_file: {
        file_id: number;
        filename: string;
    };
}

interface MaglaFileBuffer {
    operator_id: number;
    filename: string;
    file_buffer: string;
}

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

const regulatorTabs = [
    { value: 'dashboard', label: 'Overview', icon: Grid },
    { value: 'metrics', label: 'Metrics', icon: BarChart3 },
    { value: 'submissions', label: 'Submissions', icon: FileText },
    { value: 'predictions', label: 'Predictions', icon: TrendingUp },
    { value: 'users', label: 'User Management', icon: Users },
];

export function AdminDashboard({ onSignOut }: AdminDashboardProps) {
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [regulators, setRegulators] = useState<Regulator[]>([]);
    const [selectedRegulator, setSelectedRegulator] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [submissions, setSubmissions] = useState<RegulatorSubmission[]>([]);
    const [regulatorAnalytics, setRegulatorAnalytics] = useState<RegulatorAnalytics[]>([]);
    const [decodedRegulatorId, setDecodedRegulatorId] = useState<number | null>(null);
    
    // MAGLA state
    const [maglaOperators, setMaglaOperators] = useState<MaglaOperator[]>([]);
    const [maglaMetrics, setMaglaMetrics] = useState<MaglaMetrics[]>([]);
    const [maglaReports, setMaglaReports] = useState<MaglaReport[]>([]);
    const [maglaFileBuffers, setMaglaFileBuffers] = useState<MaglaFileBuffer[]>([]);
    const [isMaglaDataLoading, setIsMaglaDataLoading] = useState(false);

    useEffect(() => {
        const token = tokenManager.getToken();
        if (!token) return;

        try {
            const decoded = jwtDecode<DecodedToken>(token);

            setUser({
                email: decoded.email_notification,
                user_metadata: {
                    role: decoded.roles?.[0],
                },
            });

            if (decoded.regulator_id) {
                const loggedInRegulator = regulators.find(
                    (reg) => reg.regulator_id === decoded.regulator_id
                );
                if (loggedInRegulator) {
                    setSelectedRegulator(loggedInRegulator.regulator_name);
                }
                setDecodedRegulatorId(decoded.regulator_id);
            }
        } catch (err) {
            console.error('Invalid token', err);
        }
    }, [regulators]);

    useEffect(() => {
        loadRegulators();
        loadRegulatorMetrics();
        loadSubmissions();
        loadRegulatorAnalytics();
        loadMaglaData();
    }, []);

    const loadRegulators = async () => {
        try {
            const regulatorsData = await managementAPI.getRegulators();
            setRegulators((regulatorsData || []).filter(r => r && r.regulator_id));
        } catch (error) {
            console.error('Failed to load regulators:', error);
        }
    };

    const loadRegulatorAnalytics = async () => {
        try {
            const regulatorAnalyticsData = await analyticsAPI.getRegulatorAnalyticsAdmin();
            if (regulatorAnalyticsData) {
                setRegulatorAnalytics(regulatorAnalyticsData);
            }
        } catch (e) {
            console.error('Failed to load regulator analytics:', e);
        }
    }

    const loadSubmissions = async () => {
        try {
            const submissionsData = await reportsAPI.getRegulatorSubmissionData();
            setSubmissions(submissionsData);
        } catch (e) {
            console.error('Failed to load submissions:', e);
        }
    }

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

    const loadMaglaData = async () => {
        setIsMaglaDataLoading(true);
        try {
            // Load operators
            const operators = await managementAPI.getOperators();
            setMaglaOperators(operators);

            // Load metrics for each operator
            const allMetrics: MaglaMetrics[] = [];
            for (const operator of operators) {
                try {
                    const metrics = await reportsAPI.getOperatorMetrics(operator.operator_id);
                    allMetrics.push(...(metrics as MaglaMetrics[]));
                } catch (error) {
                    console.error(`Failed to load metrics for operator ${operator.operator_id}:`, error);
                }
            }
            setMaglaMetrics(allMetrics);

            // Load Magla reports
            try {
                const reportsData = await reportsAPI.getMaglaReports();
                if (reportsData && reportsData.reports) {
                    setMaglaReports(reportsData.reports);
                } else if (Array.isArray(reportsData)) {
                    setMaglaReports(reportsData);
                } else {
                    setMaglaReports([]);
                }
            } catch (error) {
                console.error('Failed to load Magla reports:', error);
                setMaglaReports([]);
            }

            try {
                const buffersData = await reportsAPI.getFileBuffers();
                setMaglaFileBuffers(buffersData as MaglaFileBuffer[]);
            } catch (error) {
                console.error('Failed to load Magla file buffers:', error);
                setMaglaFileBuffers([]);
            }
        } catch (error) {
            console.error('Failed to load Magla data:', error);
        } finally {
            setIsMaglaDataLoading(false);
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

    // Render tabs for regulator mode
    const tabs = regulatorTabs;

    // Render content for regulator tabs (placeholder for now)
    function RegulatorTabContent({ value }: { value: string }) {
        return (
            <div className="text-center ">
                <p className="text-gray-600">
                    {value === 'dashboard' && (
                        <AdminRegulatorDataTables
                            analytics={regulatorAnalytics}
                            selectedRegulator={selectedRegulator}
                            selectedMonth={selectedMonth}
                            maglaOperators={maglaOperators}
                            maglaMetrics={maglaMetrics}
                            maglaReports={maglaReports}
                            isMaglaDataLoading={isMaglaDataLoading}
                        />
                    )}
                    {value === 'metrics' && (
                        <MetricsTab
                            metrics={metrics}
                            selectedRegulator={selectedRegulator}
                            selectedMonth={selectedMonth}
                            regulators={regulators}
                            maglaMetrics={maglaMetrics}
                            maglaReports={maglaReports}
                            isMaglaDataLoading={isMaglaDataLoading}
                        />
                    )}
                    {value === 'submissions' && (
                        <AdminRegulatorSubmissions
                            submissions={submissions}
                            selectedRegulator={selectedRegulator}
                            selectedMonth={selectedMonth}
                            regulators={regulators}
                            maglaOperators={maglaOperators}
                            maglaMetrics={maglaMetrics}
                            maglaReports={maglaReports}
                            maglaFileBuffers={maglaFileBuffers}
                            isMaglaDataLoading={isMaglaDataLoading}
                        />
                    )}
                    {value === 'predictions' && (
                        <RegulatorPredictionsTab
                            regulators={regulators}
                            regulatorAnalytics={regulatorAnalytics}
                            decodedRegulatorId={decodedRegulatorId}
                        />
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
        <div className="min-h-screen bg-background">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="text-white">
                            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                            <p className="text-blue-100 mt-1 text-sm font-medium">Gaming Regulatory Reporting System</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right mr-2 hidden sm:block">
                                <p className="text-sm font-medium text-white">{user?.email}</p>
                                <p className="text-xs text-blue-100">Administrator</p>
                            </div>
                            <ThemeToggle />
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
                <div className="mb-6">
                    
                    {/* Main Filter Card */}
                    <Card className="relative shadow-md border-0 bg-card/90 backdrop-blur-sm dark:bg-card/95 overflow-hidden">
                        {/* Inner Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 rounded-[--radius] pointer-events-none" />
                        
                        {/* Sports Betting Graphics Background */}
                        <div className="absolute inset-0 opacity-45 dark:opacity-30 pointer-events-none">
                            {/* Top Right Section */}
                            <img 
                                src="/src/assets/sports-betting/trophy.svg" 
                                alt="Trophy" 
                                className="absolute right-20 top-2 w-12 h-12 opacity-35"
                            />
                            <img 
                                src="/src/assets/sports-betting/slot-machine.svg" 
                                alt="Slot Machine" 
                                className="absolute right-2 top-4 w-14 h-14 opacity-35"
                            />
                            <img 
                                src="/src/assets/sports-betting/roulette-wheel.svg" 
                                alt="Roulette Wheel" 
                                className="absolute right-12 top-16 w-12 h-12 opacity-40"
                            />
                            
                            {/* Middle Right Section */}
                            <img 
                                src="/src/assets/sports-betting/poker-cards.svg" 
                                alt="Poker Cards" 
                                className="absolute right-16 top-32 w-16 h-16 opacity-35"
                            />
                            <img 
                                src="/src/assets/sports-betting/betting-ticket.svg" 
                                alt="Betting Ticket" 
                                className="absolute right-4 top-40 w-12 h-12 opacity-35"
                            />
                            <img 
                                src="/src/assets/sports-betting/casino-chips.svg" 
                                alt="Casino Chips" 
                                className="absolute right-24 top-44 w-14 h-14 opacity-40"
                            />
                            
                            {/* Lower Middle Right Section */}
                            <img 
                                src="/src/assets/sports-betting/basketball.svg" 
                                alt="Basketball" 
                                className="absolute right-8 top-60 w-12 h-12 opacity-35"
                            />
                            <img 
                                src="/src/assets/sports-betting/soccer-ball.svg" 
                                alt="Soccer Ball" 
                                className="absolute right-20 top-68 w-12 h-12 opacity-30"
                            />
                            <img 
                                src="/src/assets/sports-betting/dice.svg" 
                                alt="Dice" 
                                className="absolute right-2 top-72 w-12 h-12 opacity-30"
                            />
                            
                            {/* Bottom Right Section */}
                            <img 
                                src="/src/assets/sports-betting/casino-chips.svg" 
                                alt="Casino Chips Stack" 
                                className="absolute right-12 bottom-8 w-14 h-14 opacity-35"
                            />
                            <img 
                                src="/src/assets/sports-betting/poker-cards.svg" 
                                alt="More Cards" 
                                className="absolute right-28 bottom-12 w-12 h-12 opacity-30"
                            />
                            <img 
                                src="/src/assets/sports-betting/trophy.svg" 
                                alt="Second Trophy" 
                                className="absolute right-4 bottom-20 w-10 h-10 opacity-25"
                            />
                            
                            {/* Additional Right Side Elements */}
                            <img 
                                src="/src/assets/sports-betting/roulette-wheel.svg" 
                                alt="Small Roulette" 
                                className="absolute right-32 top-24 w-10 h-10 opacity-25"
                            />
                            <img 
                                src="/src/assets/sports-betting/slot-machine.svg" 
                                alt="Small Slot" 
                                className="absolute right-36 top-56 w-10 h-10 opacity-25"
                            />
                            <img 
                                src="/src/assets/sports-betting/basketball.svg" 
                                alt="Small Basketball" 
                                className="absolute right-40 bottom-16 w-10 h-10 opacity-20"
                            />
                            <img 
                                src="/src/assets/sports-betting/dice.svg" 
                                alt="Small Dice" 
                                className="absolute right-44 top-40 w-10 h-10 opacity-20"
                            />
                            
                            {/* Pattern Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-purple-500/3 to-red-500/3 dark:from-blue-500/6 dark:via-purple-500/6 dark:to-red-500/6" />
                        </div>
                        
                        <CardContent className="relative p-6">
                            
                            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                {/* Logo Section with Enhanced Styling */}
                                <div className="flex items-center relative">
                                    {/* Logo Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-400/30 dark:to-purple-400/30 rounded-xl blur-xl" />
                                    
                                    {/* Enhanced Logo Container */}
                                    <div className="relative flex items-center justify-center size-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg ring-2 ring-white/10 dark:ring-black/20">
                                        {/* Inner Pattern */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-xl" />
                                        
                                        {/* Logo Icon */}
                                        <Goal className="relative size-10 text-white drop-shadow-sm" />
                                    </div>
                                </div>
                                
                                {/* Filters with Enhanced Styling */}
                                <div className="relative flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-1 lg:justify-end">
                                {/* Regulator Filter */}
                                <div className="flex flex-col gap-2 w-full sm:w-auto">
                                    <Label
                                        htmlFor="regulator-filter"
                                        className="text-sm font-semibold text-foreground flex items-center gap-2"
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
                                            className="w-full sm:w-[220px] border-input focus:border-ring focus:ring-ring"
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
                                                    value={reg.regulator_name}
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
                                        className="text-sm font-semibold text-foreground flex items-center gap-2"
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
                                            className="w-full sm:w-[200px] border-input focus:border-ring focus:ring-ring"
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
                        </div>
                    </CardContent>
                </Card>
                </div>

                <MonthlySummaryGenerator mode="regulator"/>

                {/* Tabs Section */}
                <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
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
                                    <div className="mt-2 border rounded-lg bg-card shadow-lg overflow-hidden">
                                        {tabs.map((tab) => {
                                            const Icon = tab.icon;
                                            return (
                                                <button
                                                    key={tab.value}
                                                    className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors ${
                                                        activeTab === tab.value
                                                            ? 'bg-muted text-foreground font-semibold border-l-4 border-ring'
                                                            : 'text-muted-foreground hover:bg-muted/50'
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
                            <TabsList className="hidden lg:inline-flex mb-6 bg-muted p-1">
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
                            {regulatorTabs.map(tab => (
                                <TabsContent key={tab.value} value={tab.value} className="mt-0">
                                    <RegulatorTabContent value={tab.value} />
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}