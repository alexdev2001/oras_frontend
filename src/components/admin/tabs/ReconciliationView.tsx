import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { reportsAPI } from '@/utils/API.ts';
import type { OperatorReport, EMSComparison } from '@/types/report.ts';
import { AlertCircle, CheckCircle, Search, FileText, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import {Textarea} from "@/components/ui/textarea.tsx";
import type {Report} from "@/components/admin/tabs/ReportsTab.tsx";

export function ReconciliationView() {
    const [approvedReports, setApprovedReports] = useState<OperatorReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<OperatorReport | null>(null);
    const [emsData, setEmsData] = useState({
        totalGGR: '',
        totalStake: '',
        totalBetCount: ''
    });
    const [comparison, setComparison] = useState<EMSComparison | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isComparing, setIsComparing] = useState(false);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const formatNumber = (value) => {
        if (!value) return "";

        if (value.endsWith(".")) return Number(value.slice(0, -1)).toLocaleString("en-US") + ".";

        if (value.includes(".")) {
            const [intPart, decPart] = value.split(".");
            const formattedInt = Number(intPart).toLocaleString("en-US");
            return `${formattedInt}.${decPart}`;
        }

        return Number(value).toLocaleString("en-US");
    };

    const handleChangeGGR = (e) => {
        let raw = e.target.value;

        raw = raw.replace(/,/g, "");

        if (!/^\d*\.?\d*$/.test(raw)) return;

        setEmsData({
            ...emsData,
            totalGGR: formatNumber(raw)
        });
    };

    const handleChangeStake = (e) => {
        let raw = e.target.value;

        raw = raw.replace(/,/g, "");

        if (!/^\d*\.?\d*$/.test(raw)) return;

        setEmsData({
            ...emsData,
            totalStake: formatNumber(raw)
        });
    };

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setIsLoading(true);
        try {
            const reports = await reportsAPI.getPendingReports();
            setApprovedReports(
                reports.sort(
                    (a: OperatorReport, b: OperatorReport) =>
                        new Date(b.submittedAt).getTime() -
                        new Date(a.submittedAt).getTime()
                )
            );
        } catch (error) {
            console.error('Failed to load approved reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompare = async () => {
        if (!selectedReport) return;

        const reportGGR = selectedReport.totalGGR;
        const emsGGR = parseFloat(emsData.totalGGR.replace(/,/g, ""));

        if (isNaN(emsGGR)) return;

        const percentDiff = Math.abs(emsGGR - reportGGR) / reportGGR * 100;
        const isMatch = percentDiff <= 2;

        if (isMatch) {
            try {
                await reportsAPI.reviewReport(selectedReport.id, 'approved');

                await reportsAPI.notifyOperators(Number(selectedReport.operatorId));

                setComparison({
                    reportId: selectedReport.id,
                    operatorName: selectedReport.operatorName,
                    month: selectedReport.month,
                    year: selectedReport.year,
                    matchStatus: "matched",
                    discrepancies: []
                });

            } catch (error) {
                console.error("Approval error:", error);
                alert("Failed to approve report.");
            }
        } else {
            setComparison({
                reportId: selectedReport.id,
                operatorName: selectedReport.operatorName,
                month: selectedReport.month,
                year: selectedReport.year,
                matchStatus: "mismatch",
                discrepancies: [
                    {
                        field: "GGR",
                        reportValue: reportGGR,
                        emsValue: emsGGR,
                        percentDifference: percentDiff,
                        difference: emsGGR - reportGGR
                    }
                ]
            });
        }
    };

    const resetComparison = () => {
        setSelectedReport(null);
        setComparison(null);
        setEmsData({ totalGGR: '', totalStake: '', totalBetCount: '' });
    };

    const handleReject = async () => {
        if (!selectedReport || !rejectionReason.trim()) return;

        setIsRejecting(true);
        try {
            await reportsAPI.reviewReport(selectedReport.id, 'rejected');
            try {
                await reportsAPI.notifyReportRejection(
                    Number(selectedReport.operatorId),
                    rejectionReason
                );
            } catch (e) {
                console.error('Failed to send rejection notification:', e);
            }
            resetComparison();
            await loadReports();

        } catch (error) {
            console.error('Failed to reject report:', error);
        } finally {
            setIsRejecting(false);
            setIsRejectDialogOpen(false);
        }
    };

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading reports...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>EMS Reconciliation</CardTitle>
                    <CardDescription>Compare operator reports with EMS data for verification</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Report Selection */}
                        <div className="space-y-2">
                            <Label>Select Report to Verify</Label>
                            <Select
                                value={selectedReport?.id || ''}
                                onValueChange={(value) => {
                                    const report = approvedReports.find(r => r.id === value);
                                    setSelectedReport(report || null);
                                    setComparison(null);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a report..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {approvedReports.map((report) => (
                                        <SelectItem key={report.id} value={report.id}>
                                            {report.operatorName} -{' '}
                                            {new Date(report.year, report.month - 1).toLocaleDateString('en-US', {
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedReport && !comparison && (
                            <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                                <div>
                                    <h4 className="font-medium mb-3">Operator Report Data</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Total GGR</p>
                                            <p className="font-medium">
                                                MWK {selectedReport.totalGGR?.toLocaleString("en-US")}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">Total Stake</p>
                                            <p className="font-medium">
                                                MWK {selectedReport.totalStake?.toLocaleString("en-US")}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">Total Bet Count</p>
                                            <p className="font-medium">
                                                {selectedReport.totalBetCount?.toLocaleString("en-US")}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3">Enter EMS Data</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ems-ggr">EMS Total GGR (MWK)</Label>
                                            <Input
                                                id="ems-ggr"
                                                type="text"
                                                inputMode="decimal"
                                                pattern="[0-9]*[.,]?[0-9]*"
                                                value={emsData.totalGGR}
                                                onChange={handleChangeGGR}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ems-stake">EMS Total Stake (MWK)</Label>
                                            <Input
                                                id="ems-ggr"
                                                type="text"
                                                inputMode="decimal"
                                                pattern="[0-9]*[.,]?[0-9]*"
                                                value={emsData.totalStake}
                                                onChange={handleChangeStake}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ems-betcount">EMS Bet Count</Label>
                                            <Input
                                                id="ems-betcount"
                                                type="number"
                                                value={emsData.totalBetCount}
                                                onChange={(e) => setEmsData({ ...emsData, totalBetCount: e.target.value })}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={resetComparison}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCompare}
                                        disabled={isComparing || !emsData.totalGGR || !emsData.totalStake || !emsData.totalBetCount}
                                    >
                                        <Search className="size-4 mr-2" />
                                        {isComparing ? 'Comparing...' : 'Compare Data'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {comparison && (
                            <div className="border rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Reconciliation Results</h4>
                                    {comparison.matchStatus === 'matched' ? (
                                        <Badge className="bg-green-500">
                                            <CheckCircle className="size-3 mr-1" />
                                            Matched
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-red-500">
                                            <AlertCircle className="size-3 mr-1" />
                                            Discrepancies Found
                                        </Badge>
                                    )}
                                </div>

                                {comparison.matchStatus === 'matched' ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="size-5 text-green-600" />
                                            <p className="text-green-800">
                                                All values match within acceptable tolerance. Report is verified.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="size-5 text-red-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="font-medium text-red-800 mb-2">
                                                        {comparison.discrepancies.length} discrepancy(ies) detected
                                                    </p>
                                                    <div className="space-y-2">
                                                        {comparison.discrepancies.map((discrepancy, index) => (
                                                            <div key={index} className="bg-white rounded p-3 text-sm">
                                                                <div className="grid grid-cols-4 gap-4">
                                                                    <div>
                                                                        <p className="text-gray-500">Field</p>
                                                                        <p className="font-medium">{discrepancy.field}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500">Operator Value</p>
                                                                        <p className="font-medium">
                                                                            {discrepancy.field.includes('Count')
                                                                                ? discrepancy.reportValue.toLocaleString()
                                                                                : `$${discrepancy.reportValue.toLocaleString()}`
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500">EMS Value</p>
                                                                        <p className="font-medium">
                                                                            {discrepancy.field.includes('Count')
                                                                                ? discrepancy.emsValue.toLocaleString()
                                                                                : `$${discrepancy.emsValue.toLocaleString()}`
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500">Difference</p>
                                                                        <p className="font-medium text-red-600">
                                                                            {discrepancy.percentDifference
                                                                                ? `${discrepancy.percentDifference.toFixed(2)}%`
                                                                                : discrepancy.difference.toLocaleString()
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <p className="text-sm text-yellow-800">
                                                <strong>Action Required:</strong> Contact operator to investigate and resolve discrepancies.
                                                Consider flagging this report for further review.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-4 border-t">
                                    <Button variant="outline" onClick={resetComparison}>
                                        Compare Another Report
                                    </Button>
                                    {comparison.matchStatus !== 'matched' && (
                                        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="destructive">
                                                    <XCircle className="size-4 mr-2" />
                                                    Reject Report
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Reject Report</DialogTitle>
                                                    <DialogDescription>
                                                        Provide a detailed reason for rejecting this report. The operator will be notified.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                                                        <Textarea
                                                            id="rejection-reason"
                                                            placeholder="Describe the issues found during reconciliation and why the report is being rejected..."
                                                            value={rejectionReason}
                                                            onChange={(e) => setRejectionReason(e.target.value)}
                                                            className="min-h-32"
                                                        />
                                                    </div>
                                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                        <p className="text-sm text-yellow-800">
                                                            <strong>Note:</strong> Rejecting this report will change its status to "Rejected" and notify the operator to submit a corrected version.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" onClick={() => {
                                                        setIsRejectDialogOpen(false);
                                                        setRejectionReason('');
                                                    }}>
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={handleReject}
                                                        disabled={isRejecting || !rejectionReason.trim()}
                                                    >
                                                        {isRejecting ? 'Submitting...' : 'Submit Rejection'}
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline">
                                                <FileText className="size-4 mr-2" />
                                                View Full Report
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Full Report Details</DialogTitle>
                                                <DialogDescription>
                                                    {selectedReport?.operatorName} -{' '}
                                                    {new Date(selectedReport?.year || 0, (selectedReport?.month || 1) - 1).toLocaleDateString('en-US', {
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div>
                                                    <h4 className="font-medium mb-2">Summary Metrics</h4>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div className="bg-gray-50 p-3 rounded">
                                                            <p className="text-gray-500">Total Stake</p>
                                                            <p className="font-medium">${selectedReport?.totalStake.toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-gray-50 p-3 rounded">
                                                            <p className="text-gray-500">Total GGR</p>
                                                            <p className="font-medium">${selectedReport?.totalGGR.toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-gray-50 p-3 rounded">
                                                            <p className="text-gray-500">GGR %</p>
                                                            <p className="font-medium">{selectedReport?.overallGGRPercentage.toFixed(2)}%</p>
                                                        </div>
                                                        <div className="bg-gray-50 p-3 rounded">
                                                            <p className="text-gray-500">Total Bet Count</p>
                                                            <p className="font-medium">{selectedReport?.totalBetCount.toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-gray-50 p-3 rounded">
                                                            <p className="text-gray-500">Gaming Tax</p>
                                                            <p className="font-medium">${selectedReport?.totalGamingTax.toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-gray-50 p-3 rounded">
                                                            <p className="text-gray-500">DET Levy</p>
                                                            <p className="font-medium">${selectedReport?.totalDETLevy.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium mb-2">Game Breakdown</h4>
                                                    <div className="space-y-2 text-sm">
                                                        {selectedReport?.gameBreakdown.map((game, index) => (
                                                            <div key={index} className="bg-gray-50 p-3 rounded">
                                                                <p className="font-medium mb-2">{game.gameType}</p>
                                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                                    <div>
                                                                        <p className="text-gray-500">Stake</p>
                                                                        <p>${game.stake.toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        )}

                        {!selectedReport && (
                            <div className="text-center py-12">
                                <FileText className="size-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">Select a report to begin EMS reconciliation</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
