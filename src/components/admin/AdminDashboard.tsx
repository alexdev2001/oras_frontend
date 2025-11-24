import {useState, useEffect} from "react";
import {Button} from "@/components/ui/button.tsx";
import { LogOut, BarChart3, FileCheck, AlertTriangle, Users, Database, FileText, Filter, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import {AnalyticsOverview} from "@/components/admin/tabs/AnalyticsOverview.tsx";
import {ReportApproval} from "@/components/admin/tabs/ReportApproval.tsx";
import {ReconciliationView} from "@/components/admin/tabs/ReconciliationView.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Label } from '@/components/ui/label.tsx';
import {ReportsTab} from "@/components/admin/tabs/ReportsTab.tsx";
import {authAPI} from "@/utils/API.ts";
import { jwtDecode } from "jwt-decode";
import type { DecodedToken } from "@/types/token.ts";
import {OperatorUserManagement} from "@/components/admin/tabs/OperatorUserManagement.tsx";
import {managementAPI} from "@/utils/API.ts";
import type {Operator} from "@/components/admin/tabs/OperatorUserManagement.tsx";
import {MonthlySummaryGenerator} from "@/components/summary/MonthlySummaryGenerator.tsx";


interface AdminDashboardProps {
    onSignOut: () => void;
}

export function AdminDashboard({ onSignOut }: AdminDashboardProps) {
    const [user, setUser] = useState<DecodedToken | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [operators, setOperators] = useState<Operator[]>([]);
    const [selectedOperator, setSelectedOperator] = useState<string>('all');
    const [loadingOperators, setLoadingOperators] = useState(true)

    useEffect(() => {
        loadUserFromToken();
        loadOperators();
    }, []);

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

    const loadUserFromToken = () => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            console.warn("No auth token found");
            return;
        }

        try {
            const decoded: DecodedToken = jwtDecode(token);
            setUser(decoded);
        } catch (err) {
            console.error("Failed to decode token:", err);
        }
    };

    const handleSignOut = async () => {
        try {
            await authAPI.signout();
            onSignOut();
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1>Admin Dashboard</h1>
                            <p className="text-gray-600">Gaming Operator Reporting System</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right mr-3">
                                <p className="text-sm text-gray-600">{user?.email}</p>
                                <p className="text-xs text-gray-400">Administrator</p>
                            </div>
                            <Button variant="outline" onClick={handleSignOut}>
                                <LogOut className="size-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <MonthlySummaryGenerator />
                <div className="mb-6 bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="size-5 text-gray-600" />
                            <Label htmlFor="operator-filter" className="text-sm font-medium">Filter by Operator:</Label>
                        </div>
                        <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                            <SelectTrigger id="operator-filter" className="w-[280px]">
                                <SelectValue placeholder="Loading operators..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="size-4" />
                                        <span>All Operators</span>
                                    </div>
                                </SelectItem>
                                {operators.map((operator) => (
                                    <SelectItem key={operator.operator_id} value={operator.operator_id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="size-4 text-indigo-600" />
                                            <span>{operator.operator_name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedOperator !== 'all' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOperator('all')}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Clear Filter
                            </Button>
                        )}
                    </div>
                </div>



                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    {/* Tabs */}
                    <div className="relative">
                        {/* Mobile Hamburger Menu */}
                        <div className="sm:hidden relative">
                            <button
                                className="p-2 border rounded"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                ☰
                            </button>

                            {mobileMenuOpen && (
                                <div className="absolute bg-white border rounded mt-2 w-56 z-10 shadow-lg">
                                    {[
                                        { value: 'overview', label: 'Analytics Overview', icon: BarChart3 },
                                        { value: 'approval', label: 'Report Approval', icon: FileCheck },
                                        { value: 'reconciliation', label: 'EMS Reconciliation', icon: Database },
                                        { value: 'quality', label: 'Data Quality', icon: AlertTriangle },
                                    ].map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.value}
                                                className={`flex items-center gap-2 w-full px-4 py-2 text-left ${
                                                    activeTab === tab.value ? 'bg-indigo-100 font-semibold' : ''
                                                }`}
                                                onClick={() => {
                                                    setActiveTab(tab.value);
                                                    setMobileMenuOpen(false);
                                                }}
                                            >
                                                <Icon className="size-4" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Desktop tabs */}
                        <TabsList className="mb-8">
                            <TabsTrigger value="overview">
                                <BarChart3 className="size-4 mr-2" />
                                Analytics Overview
                            </TabsTrigger>
                            <TabsTrigger value="reports">
                                <FileText className="size-4 mr-2" />
                                Reports
                            </TabsTrigger>
                            <TabsTrigger value="approval">
                                <FileCheck className="size-4 mr-2" />
                                Report Approval
                            </TabsTrigger>
                            <TabsTrigger value="reconciliation">
                                <Database className="size-4 mr-2" />
                                EMS Reconciliation
                            </TabsTrigger>
                            <TabsTrigger value="users">
                                <Users className="size-4 mr-2" />
                                User Management
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview">
                        <AnalyticsOverview selectedOperator={selectedOperator} />
                    </TabsContent>

                    <TabsContent value="reports">
                        <ReportsTab selectedOperator={selectedOperator} />
                    </TabsContent>

                    <TabsContent value="approval">
                        <ReportApproval />
                    </TabsContent>

                    <TabsContent value="reconciliation">
                        <ReconciliationView/>
                    </TabsContent>

                    <TabsContent value="users">
                        <OperatorUserManagement/>
                    </TabsContent>


                </Tabs>
            </div>
        </div>
    );
}