import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { reportsAPI, authAPI } from '@/utils/API.ts';
import type { ParsedMetric} from '@/types/report.ts';
import { Plus, LogOut, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ReportSubmissionForm } from '../report/ReportSubmissionForm.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import type {DecodedToken} from "@/types/token.ts";
import {jwtDecode} from "jwt-decode";

interface OperatorDashboardProps {
    onSignOut: () => void;
}

export function OperatorDashboard({ onSignOut }: OperatorDashboardProps) {
    const [reports, setReports] = useState<ParsedMetric[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSubmissionForm, setShowSubmissionForm] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [operatorId, setOperatorId] = useState<number | null>(null);
    const [userId, setUserId] = useState<number | null>(null);

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
        if (operatorId === null) return;

        const loadReports = async () => {
            try {
                const fetched = await reportsAPI.getMyReports(operatorId);
                setReports(fetched);
            } catch (err: any) {
                console.error("Failed to load reports:", err);
            } finally {
                setIsLoading(false);
            }x
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
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1>Operator Portal</h1>
                            <p className="text-gray-600">{user?.user_metadata?.operatorName}</p>
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
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Reports</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl">{reports.length}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Approved</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                <span className="text-3xl text-green-600">
                  {reports.filter(r => r.status === 'approved').length}
                </span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Pending Review</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                <span className="text-3xl text-yellow-600">
                  {reports.filter(r => r.status === 'unapproved').length}
                </span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Rejected</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                <span className="text-3xl text-red-600">
                  {reports.filter(r => r.status === 'rejected').length}
                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Reports List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Submitted Reports</CardTitle>
                        <CardDescription>View and track your monthly submissions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">Loading reports...</div>
                        ) : reports.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="size-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600 mb-4">No reports submitted yet</p>
                                <Button onClick={() => setShowSubmissionForm(true)}>
                                    <Plus className="size-4 mr-2" />
                                    Submit Your First Report
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reports.map((report) => (
                                    <div
                                        key={report.report_id}
                                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-medium">
                                                        {new Date(report.created_at).toLocaleDateString('en-US', {
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </h3>
                                                    {getStatusBadge(report.status)}
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Submitted {new Date(report.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Total Stake</p>
                                                <p className="font-medium">MWK{report.total_stake?.toLocaleString() || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">GGR</p>
                                                <p className="font-medium">MWK{report.ggr?.toLocaleString() || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">GGR %</p>
                                                <p className="font-medium">{report?.ggr_percentage.toFixed(2) || 0}%</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Gaming Tax</p>
                                                <p className="font-medium">MWK{report.gaming_tax?.toLocaleString() || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Net Gaming Revenue After Tax</p>
                                                <p className="font-medium text-green-600">MWK{report.ngr_post_levy?.toLocaleString() || 0}</p>
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}