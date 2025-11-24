import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { reportsAPI } from '@/utils/API.ts';
import type { OperatorReport } from '@/types/report.ts';
import { CheckCircle, XCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.tsx';
import { Label } from '@/components/ui/label.tsx';

export function ReportApproval() {
    const [pendingReports, setPendingReports] = useState<OperatorReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
    const [reviewingReport, setReviewingReport] = useState<OperatorReport | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadPendingReports();
    }, []);

    const loadPendingReports = async () => {
        setIsLoading(true);
        try {
            const  reports  = await reportsAPI.getPendingReports();
            setPendingReports(reports.sort((a: OperatorReport, b: OperatorReport) =>
                new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
            ));
        } catch (error) {
            console.error('Failed to load pending reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpanded = (reportId: string) => {
        const newExpanded = new Set(expandedReports);
        if (newExpanded.has(reportId)) {
            newExpanded.delete(reportId);
        } else {
            newExpanded.add(reportId);
        }
        setExpandedReports(newExpanded);
    };

    const handleReview = async (action: 'approved' | 'rejected') => {
        if (!reviewingReport) return;

        setIsSubmitting(true);
        try {
            await reportsAPI.reviewReport(reviewingReport.id, action, reviewNotes);
            setReviewingReport(null);
            setReviewNotes('');
            loadPendingReports();
        } catch (error) {
            console.error('Failed to review report:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading pending reports...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Pending Reports</CardTitle>
                            <CardDescription>Review and approve operator submissions</CardDescription>
                        </div>
                        <Badge className="bg-yellow-500">{pendingReports.length} Pending</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {pendingReports.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="size-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">No pending reports to review</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingReports.map((report) => {
                                const isExpanded = expandedReports.has(report.id);
                                return (
                                    <div key={report.id} className="border rounded-lg">
                                        <div className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3>{report.operatorName}</h3>
                                                        <Badge variant="outline">
                                                            {new Date(report.year, report.month - 1).toLocaleDateString('en-US', {
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        Submitted {new Date(report.submittedAt).toLocaleDateString()} at{' '}
                                                        {new Date(report.submittedAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-green-600 hover:text-green-700"
                                                                onClick={() => setReviewingReport(report)}
                                                            >
                                                                <CheckCircle className="size-4 mr-1" />
                                                                Approve
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Approve Report</DialogTitle>
                                                                <DialogDescription>
                                                                    Are you sure you want to approve this report from {report.operatorName}?
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <div className="space-y-2">
                                                                    <Label>Notes (optional)</Label>
                                                                    <Textarea
                                                                        value={reviewNotes}
                                                                        onChange={(e) => setReviewNotes(e.target.value)}
                                                                        placeholder="Add any notes about this approval..."
                                                                        rows={3}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setReviewingReport(null);
                                                                        setReviewNotes('');
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleReview('approved')}
                                                                    disabled={isSubmitting}
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                >
                                                                    {isSubmitting ? 'Approving...' : 'Confirm Approval'}
                                                                </Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700"
                                                                onClick={() => setReviewingReport(report)}
                                                            >
                                                                <XCircle className="size-4 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Reject Report</DialogTitle>
                                                                <DialogDescription>
                                                                    Please provide a reason for rejecting this report from {report.operatorName}.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <div className="space-y-2">
                                                                    <Label>Rejection Reason *</Label>
                                                                    <Textarea
                                                                        value={reviewNotes}
                                                                        onChange={(e) => setReviewNotes(e.target.value)}
                                                                        placeholder="Explain why this report is being rejected..."
                                                                        rows={4}
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setReviewingReport(null);
                                                                        setReviewNotes('');
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleReview('rejected')}
                                                                    disabled={isSubmitting || !reviewNotes.trim()}
                                                                    variant="destructive"
                                                                >
                                                                    {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                                                                </Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
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
                                                    <p className="text-sm text-gray-500">DET Levy</p>
                                                    <p className="font-medium">${report.totalDETLevy?.toLocaleString() || 0}</p>
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleExpanded(report.id)}
                                                className="w-full"
                                            >
                                                {isExpanded ? (
                                                    <>
                                                        <ChevronUp className="size-4 mr-2" />
                                                        Hide Details
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown className="size-4 mr-2" />
                                                        Show Details
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {isExpanded && (
                                            <div className="border-t bg-gray-50 p-4">
                                                <h4 className="font-medium mb-3">Game Breakdown</h4>
                                                <div className="space-y-2">
                                                    {report.gameBreakdown?.map((game, index) => (
                                                        <div key={index} className="grid grid-cols-6 gap-4 bg-white p-3 rounded border text-sm">
                                                            <div>
                                                                <p className="text-gray-500 text-xs">Game Type</p>
                                                                <p className="font-medium">{game.gameType}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 text-xs">Bet Count</p>
                                                                <p>{game.betCount?.toLocaleString() || 0}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 text-xs">Stake</p>
                                                                <p>${game.stake?.toLocaleString() || 0}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 text-xs">Winnings</p>
                                                                <p>${game.winnings?.toLocaleString() || 0}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 text-xs">GGR</p>
                                                                <p className="font-medium text-green-600">${game.ggr?.toLocaleString() || 0}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 text-xs">GGR %</p>
                                                                <p>{game.ggrPercentage?.toFixed(2) || 0}%</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-4 pt-4 border-t">
                                                    <h4 className="font-medium mb-3">Balance Information</h4>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Opening Balance</p>
                                                            <p className="font-medium">${report.openingBalance?.toLocaleString() || 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Closing Balance</p>
                                                            <p className="font-medium">${report.closingBalance?.toLocaleString() || 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Difference</p>
                                                            <p className={`font-medium ${report.balanceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {report.balanceDifference >= 0 ? '+' : ''}${report.balanceDifference?.toLocaleString() || 0}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
