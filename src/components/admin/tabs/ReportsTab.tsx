import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { FileText, Download, Calendar, Building2, User, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
import { reportsAPI } from '@/utils/API.ts';
import * as XLSX from 'xlsx';

interface ReportFile {
    file_id: number;
    filename: string;
    file_size?: number;
}

interface Report {
    report_id: number;
    date_time: string;
    opening_balances_total: number;
    closing_balances_total: number;
    uploaded_by: number;
    operator_id: number;
    operator_name?: string;
    uploaded_by_name?: string;
    status?: string;
    report_file?: ReportFile;
}

interface ReportsTabProps {
    selectedOperator?: string;
}

export function ReportsTab({ selectedOperator = 'all' }: ReportsTabProps) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedReport, setExpandedReport] = useState<number | null>(null);
    const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [filePreview, setFilePreview] = useState<string[][] | null>(null);

    useEffect(() => {
        loadReports();
    }, [selectedOperator]);

    const loadReports = async () => {
        try {
            setLoading(true);
            const { reports: fetchedReports } = await reportsAPI.getAllReports();

            let filteredReports = fetchedReports || [];
            if (selectedOperator !== 'all') {
                filteredReports = filteredReports.filter((report: Report) =>
                    report.operator_name === selectedOperator || String(report.operator_id) === selectedOperator
                );
            }

            const sortedReports = filteredReports.sort((a: Report, b: Report) =>
                new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
            );

            setReports(sortedReports);
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadClick = (report: Report) => {
        setSelectedReport(report);
        setDownloadDialogOpen(true);
    };

    const handleDownloadFile = async () => {
        if (!selectedReport || !selectedReport.report_file) {
            return;
        }

        try {
            setDownloading(true);
            const blob = await reportsAPI.downloadReportFile(selectedReport.report_id);

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = selectedReport.report_file.filename || `report_${selectedReport.report_id}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setDownloadDialogOpen(false);
        } catch (error) {
            console.error('Failed to download file:', error);
        } finally {
            setDownloading(false);
        }
    };

    const toggleExpandReport = (reportId: number) => {
        setExpandedReport(expandedReport === reportId ? null : reportId);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading reports...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Reports</p>
                                <p className="text-3xl font-semibold mt-1">{reports.length}</p>
                            </div>
                            <div className="size-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <FileText className="size-6 text-indigo-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">With Files</p>
                                <p className="text-3xl font-semibold mt-1">
                                    {reports.filter(r => r.report_file).length}
                                </p>
                            </div>
                            <div className="size-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <FileSpreadsheet className="size-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">This Month</p>
                                <p className="text-3xl font-semibold mt-1">
                                    {reports.filter(r => {
                                        const reportDate = new Date(r.date_time);
                                        const now = new Date();
                                        return reportDate.getMonth() === now.getMonth() &&
                                            reportDate.getFullYear() === now.getFullYear();
                                    }).length}
                                </p>
                            </div>
                            <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="size-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Unique Operators</p>
                                <p className="text-3xl font-semibold mt-1">
                                    {new Set(reports.map(r => r.operator_id)).size}
                                </p>
                            </div>
                            <div className="size-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Building2 className="size-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reports List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="size-5" />
                        All Reports
                    </CardTitle>
                    <CardDescription>
                        View and download operator reports in descending order by date
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {reports.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="size-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">No reports found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reports.map((report) => (
                                <div
                                    key={report.report_id}
                                    className="border rounded-lg hover:border-indigo-300 transition-colors"
                                >
                                    {/* Report Header */}
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="size-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                <FileText className="size-5 text-indigo-600" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-semibold">Report #{report.report_id}</h4>
                                                    {report.status && (
                                                        <Badge variant={report.status === 'approved' ? 'default' : 'secondary'}>
                                                            {report.status}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="size-3" />
                                                        {formatDate(report.date_time)}
                                                    </div>
                                                    {report.operator_name && (
                                                        <div className="flex items-center gap-1">
                                                            <Building2 className="size-3" />
                                                            {report.operator_name}
                                                        </div>
                                                    )}
                                                    {report.uploaded_by_name && (
                                                        <div className="flex items-center gap-1">
                                                            <User className="size-3" />
                                                            {report.uploaded_by_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {report.report_file ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownloadClick(report)}
                                                    className="gap-2"
                                                >
                                                    <Download className="size-4" />
                                                    Download
                                                </Button>
                                            ) : (
                                                <Badge variant="secondary" className="text-gray-500">
                                                    No file
                                                </Badge>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleExpandReport(report.report_id)}
                                            >
                                                {expandedReport === report.report_id ? (
                                                    <ChevronUp className="size-4" />
                                                ) : (
                                                    <ChevronDown className="size-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedReport === report.report_id && (
                                        <div className="border-t bg-gray-50 p-4">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Report ID</p>
                                                    <p className="font-medium">#{report.report_id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Opening Balance</p>
                                                    <p className="font-medium">{formatCurrency(report.opening_balances_total || 0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Closing Balance</p>
                                                    <p className="font-medium">{formatCurrency(report.closing_balances_total || 0)}</p>
                                                </div>
                                                {report.report_file && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">File Name</p>
                                                        <p className="font-medium text-sm truncate">{report.report_file.filename}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Download Dialog */}
            <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="size-5 text-green-600" />
                            Download Report File
                        </DialogTitle>
                        <DialogDescription>
                            Download the Excel report submitted by the operator
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Report ID:</span>
                                    <span className="font-medium">#{selectedReport.report_id}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Date:</span>
                                    <span className="font-medium">{formatDate(selectedReport.date_time)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Operator:</span>
                                    <span className="font-medium">{selectedReport.operator_name || 'N/A'}</span>
                                </div>
                                {selectedReport.report_file && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">File Name:</span>
                                        <span className="font-medium text-sm truncate max-w-[200px]">
                      {selectedReport.report_file.filename}
                    </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setDownloadDialogOpen(false)}
                                    disabled={downloading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDownloadFile}
                                    disabled={downloading || !selectedReport.report_file}
                                    className="gap-2"
                                >
                                    {downloading ? (
                                        <>
                                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="size-4" />
                                            Download Excel File
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
