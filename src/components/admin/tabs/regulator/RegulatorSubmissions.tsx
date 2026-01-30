"use client";

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
    FileText,
    CheckCircle,
    Clock,
    ArrowUpDown,
    Download,
    ChevronDown,
    ChevronRight,
    Search,
    Building2,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { reportsAPI } from "@/utils/API.ts";
import { FilePreview } from '@/components/regulator/FilePreview';
import type { RegulatorSubmission } from '@/components/regulator/RegulatorDashboard';
import * as XLSX from 'xlsx';

interface Props {
    submissions: RegulatorSubmission[];
    selectedRegulator?: string;
    selectedMonth?: string;
    regulators?: { regulator_id: number; regulator_name: string }[];
    maglaOperators?: { operator_id: number; operator_name: string; email: string; is_active: boolean }[];
    maglaMetrics?: {
        report_id: number;
        created_at: string;
    }[];
    maglaReports?: {
        report_id: number;
        date_time: string;
        uploaded_by: number;
        uploaded_by_name: string;
        operator_id: number;
        operator_name: string;
        status: string;
        report_file: { file_id: number; filename: string };
    }[];
    maglaFileBuffers?: { operator_id: number; filename: string; file_buffer: string }[];
    isMaglaDataLoading?: boolean;
}

export function AdminRegulatorSubmissions({
                                              submissions,
                                              selectedRegulator = "all",
                                              selectedMonth = "all",
                                              regulators = [],
                                              maglaOperators = [],
                                              maglaMetrics = [],
                                              maglaReports = [],
                                              maglaFileBuffers = [],
                                              isMaglaDataLoading = false,
                                          }: Props) {
    const [sortOrder, setSortOrder] =
        useState<'newest' | 'oldest'>('newest');
    const [openRegulators, setOpenRegulators] =
        useState<Record<string, boolean>>({});
    const [regulatorSearch, setRegulatorSearch] = useState<string>("");

    const [selectedMaglaReport, setSelectedMaglaReport] = useState<{
        report_id: number;
        date_time: string;
        uploaded_by: number;
        uploaded_by_name: string;
        operator_id: number;
        operator_name: string;
        status: string;
        report_file: { file_id: number; filename: string };
    } | null>(null);
    const [selectedMaglaBuffer, setSelectedMaglaBuffer] = useState<{ operator_id: number; filename: string; file_buffer: string } | null>(null);
    const [maglaSheets, setMaglaSheets] = useState<string[]>([]);
    const [maglaCurrentSheetIndex, setMaglaCurrentSheetIndex] = useState(0);
    const [maglaPreviewRows, setMaglaPreviewRows] = useState<any[][] | null>(null);
    const [maglaPreviewError, setMaglaPreviewError] = useState<string | null>(null);

    // Debug function to test base64 parsing
    const debugBase64Parsing = (base64String: string) => {
        try {
            console.log('🔍 [RegulatorSubmissions] Debugging base64 parsing...');
            console.log('Length:', base64String.length);
            console.log('Sample:', base64String.substring(0, 100));
            
            // Check if it's valid base64
            const isValidBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(base64String) && 
                                base64String.length > 0 &&
                                base64String.length % 4 === 0;
            
            console.log('Valid base64:', isValidBase64);
            
            if (!isValidBase64) {
                console.error('❌ [RegulatorSubmissions] Invalid base64 format');
                return false;
            }
            
            // Try to decode
            const binaryString = atob(base64String);
            console.log('✅ [RegulatorSubmissions] Successfully decoded, binary length:', binaryString.length);
            
            return true;
        } catch (error) {
            console.error('❌ [RegulatorSubmissions] Base64 decoding failed:', error);
            return false;
        }
    };
    const [maglaOpen, setMaglaOpen] = useState(true);

    // Convert selectedRegulator name to its ID
    const selectedRegulatorId = useMemo(() => {
        if (selectedRegulator === "all") return null;
        const reg = regulators.find(r => r.regulator_name === selectedRegulator);
        return reg ? reg.regulator_id.toString() : null;
    }, [selectedRegulator, regulators]);

    const formatMonthYear = (rawDate: string | null | undefined) => {
        if (!rawDate) return '';
        const d = new Date(rawDate);
        if (Number.isNaN(d.getTime())) return '';
        return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(d);
    };

    const formatMaglaCellValue = (value: any, columnHeader: string): string => {
        if (value === null || value === undefined || value === '') return '';

        const stringValue = String(value).trim();
        const headerLower = String(columnHeader ?? '').toLowerCase();

        if (headerLower.includes('date')) {
            const numericValue = parseFloat(stringValue.replace(/[,]/g, ''));

            if (!isNaN(numericValue) && numericValue === 0) {
                return '';
            }

            if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 2958465) {
                const excelEpoch = new Date(1900, 0, 1);
                const jsDate = new Date(excelEpoch.getTime() + (numericValue - 2) * 24 * 60 * 60 * 1000);
                if (!isNaN(jsDate.getTime())) {
                    return jsDate.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                }
            }
            return stringValue;
        }

        const shouldNotFormat =
            headerLower.includes('first ticket') ||
            headerLower.includes('last ticket') ||
            headerLower.includes('first ticket #') ||
            headerLower.includes('last ticket #') ||
            headerLower.includes('count') ||
            headerLower.includes('# bets') ||
            headerLower.includes('bets') ||
            headerLower.includes('bet count') ||
            headerLower.includes('bet count #') ||
            headerLower.includes('pending') ||
            headerLower.includes('unsettled') ||
            headerLower.includes('cancelled bets') ||
            headerLower.includes('cancelled') ||
            headerLower.includes('ggr%') ||
            headerLower.includes('%');

        if (shouldNotFormat) {
            return stringValue;
        }

        const cleanValue = stringValue.replace(/[ ,%]/g, '');
        const numericValue = parseFloat(cleanValue);

        if (!isNaN(numericValue)) {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(numericValue);
        }

        return stringValue;
    };

    const findMaglaHeaderRowIndex = (data: any[][]) => {
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            const row = data[i];
            if (Array.isArray(row) && row.some(cell => String(cell ?? '').toLowerCase().includes('date'))) {
                return i;
            }
        }
        return 0;
    };

    const maglaCreatedAtByReportId = useMemo(() => {
        const map = new Map<number, string>();
        maglaMetrics.forEach(m => {
            if (m?.report_id && m?.created_at) map.set(m.report_id, m.created_at);
        });
        return map;
    }, [maglaMetrics]);

    const filesByOperator = useMemo(() => {
        const filteredReports = selectedMonth === 'all'
            ? maglaReports
            : maglaReports.filter(r => {
                const createdAt = maglaCreatedAtByReportId.get(r.report_id);
                const monthYear = (createdAt || '').substring(0, 7);
                return monthYear === selectedMonth;
            });

        return filteredReports.reduce((acc: Record<number, typeof maglaReports>, report) => {
            if (!acc[report.operator_id]) acc[report.operator_id] = [];
            acc[report.operator_id].push(report);
            return acc;
        }, {} as Record<number, typeof maglaReports>);
    }, [maglaReports, maglaCreatedAtByReportId, selectedMonth]);

    const selectMaglaFile = (report: (typeof maglaReports)[number]) => {
        setSelectedMaglaReport(report);
        setMaglaPreviewError(null);

        const exact = maglaFileBuffers.find(b => b.filename === report.report_file.filename);
        const byOperator = maglaFileBuffers.find(b => b.operator_id === report.operator_id);
        const buffer = exact ?? byOperator ?? null;
        setSelectedMaglaBuffer(buffer);

        if (!buffer) {
            setMaglaSheets([]);
            setMaglaPreviewRows(null);
            setMaglaPreviewError('File buffer not found for this report.');
            return;
        }

        // Debug the base64 parsing
        debugBase64Parsing(buffer.file_buffer);

        try {
            // Check if the buffer looks like valid base64 string
            if (!/^[A-Za-z0-9+/]*={0,2}$/.test(buffer.file_buffer) || buffer.file_buffer.length % 4 !== 0) {
                setMaglaSheets([]);
                setMaglaPreviewRows(null);
                setMaglaPreviewError('The selected file is not in the expected format.');
                return;
            }

            // Convert base64 string to Uint8Array
            const binaryString = atob(buffer.file_buffer);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const workbook = XLSX.read(bytes, { type: 'array' });
            const sheetNames = workbook.SheetNames;
            setMaglaSheets(sheetNames);
            const firstSheet = sheetNames[0];
            setMaglaCurrentSheetIndex(0);
            if (!firstSheet) {
                setMaglaPreviewRows(null);
                return;
            }

            const worksheet = workbook.Sheets[firstSheet];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            setMaglaPreviewRows(jsonData);
        } catch (e) {
            setMaglaSheets([]);
            setMaglaPreviewRows(null);
            setMaglaPreviewError('Unable to preview this file.');
        }
    };

    const changeMaglaSheet = (sheetIndex: number) => {
        if (!selectedMaglaBuffer) return;
        try {
            // Check if the buffer looks like valid base64 string
            if (!/^[A-Za-z0-9+/]*={0,2}$/.test(selectedMaglaBuffer.file_buffer) || selectedMaglaBuffer.file_buffer.length % 4 !== 0) return;
            
            // Convert base64 string to Uint8Array
            const binaryString = atob(selectedMaglaBuffer.file_buffer);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const workbook = XLSX.read(bytes, { type: 'array' });
            const sheetName = workbook.SheetNames[sheetIndex];
            if (!sheetName) return;
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            setMaglaCurrentSheetIndex(sheetIndex);
            setMaglaPreviewRows(jsonData);
        } catch {
            setMaglaPreviewError('Unable to preview this sheet.');
        }
    };

    /* -------------------- FILTERED SUBMISSIONS -------------------- */
    const filteredSubmissions = useMemo(() => {
        return submissions.filter(s => {
            const matchesRegulator =
                !selectedRegulatorId || s.regulatorId === selectedRegulatorId;
            const matchesMonth =
                selectedMonth === "all" || s.title.includes(selectedMonth);
            
            // Apply regulator search filter
            const matchesSearch = !regulatorSearch.trim() || 
                s.regulatorName.toLowerCase().includes(regulatorSearch.toLowerCase());
            
            return matchesRegulator && matchesMonth && matchesSearch;
        });
    }, [submissions, selectedRegulatorId, selectedMonth, regulatorSearch]);

    /* -------------------- GROUP BY REGULATOR -------------------- */
    const grouped = useMemo(() => {
        return filteredSubmissions.reduce<Record<string, RegulatorSubmission[]>>(
            (acc, s) => {
                if (!acc[s.regulatorName]) acc[s.regulatorName] = [];
                acc[s.regulatorName].push(s);
                return acc;
            },
            {}
        );
    }, [filteredSubmissions]);

    /* -------------------- FILTER + SORT -------------------- */
    const processSubmissions = (list: RegulatorSubmission[]) => {
        let data = [...list];

        data.sort((a, b) => {
            const da = new Date(a.submittedAt).getTime();
            const db = new Date(b.submittedAt).getTime();
            return sortOrder === 'newest' ? db - da : da - db;
        });

        return data;
    };

    /* -------------------- DOWNLOAD -------------------- */
    const downloadFile = async (reportId: number, fileName: string, regulatorName?: string) => {
        console.log('🔥 Download triggered:', { reportId, fileName, regulatorName });
        try {
            // Show loading state
            let blob;
            
            if (regulatorName?.toLowerCase().includes('igj')) {
                // Use IGJ-specific endpoint for IGJ regulator
                console.log('📡 Calling API getRegulatorSubmitFile for IGJ regulator');
                blob = await reportsAPI.getRegulatorSubmitFile(reportId);
            } else {
                // Use standard report endpoint for other regulators (MAGLA)
                console.log('📡 Calling API downloadReportFile for MAGLA regulator');
                blob = await reportsAPI.downloadReportFile(reportId);
            }
            
            console.log('📦 Received blob:', { size: blob.size, type: blob.type });
            
            // Validate blob before proceeding
            if (!blob || blob.size === 0) {
                throw new Error('Downloaded file is empty or invalid');
            }

            // Create object URL and wait for it to be ready
            const url = URL.createObjectURL(blob);
            console.log('🔗 Created object URL:', url);
            
            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            
            // Add to DOM, trigger download, then cleanup
            document.body.appendChild(link);
            
            // Use a small delay to ensure the blob is fully processed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            console.log('⬇️ Triggering download for:', fileName);
            link.click();
            
            // Cleanup after a longer delay to ensure download starts
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('🧹 Cleaned up download link');
            }, 1000);
            
        } catch (err) {
            console.error('❌ Failed to download file', err);
            // Show user-friendly error message
            alert('Failed to download file. Please try again.');
        }
    };

    /* -------------------- BADGES -------------------- */
    const getStatusBadge = (status: string) =>
        status === 'online' ? (
            <Badge className="bg-green-500">
                <CheckCircle className="size-3 mr-1" />
                Online
            </Badge>
        ) : (
            <Badge className="bg-amber-500">
                <Clock className="size-3 mr-1" />
                Offline
            </Badge>
        );

    /* ==================== RENDER ==================== */
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* ---------- Regulator Search ---------- */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-6">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
                    <Input
                        placeholder="Search by regulator..."
                        value={regulatorSearch}
                        onChange={(e) => setRegulatorSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex gap-3">
                    <Select
                        value={sortOrder}
                        onValueChange={v => setSortOrder(v as any)}
                    >
                        <SelectTrigger className="w-[140px]">
                            <ArrowUpDown className="size-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="oldest">Oldest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ---------- MAGLA FILE VIEWER ---------- */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setMaglaOpen(p => !p)}
                            className="flex items-center gap-2"
                        >
                            {maglaOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                            <CardTitle>MAGLA Submissions</CardTitle>
                            <Badge variant="secondary">{maglaReports.length}</Badge>
                        </button>
                    </div>
                    <CardDescription>Files grouped by operator with preview</CardDescription>
                </CardHeader>
                <CardContent>
                    {!maglaOpen ? null : isMaglaDataLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading MAGLA files...</div>
                    ) : maglaReports.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No MAGLA files available.</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Files by Operator</h3>
                                <div className="space-y-4">
                                    {Object.entries(filesByOperator).map(([operatorId, files]) => {
                                        const operator = maglaOperators.find(op => op.operator_id === Number(operatorId));
                                        return (
                                            <div key={operatorId} className="border border-border rounded-lg p-4 bg-card">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="size-4 text-indigo-600" />
                                                        <h4 className="font-medium text-foreground">
                                                            {operator?.operator_name || `Operator ${operatorId}`}
                                                        </h4>
                                                    </div>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {files.length} {files.length === 1 ? 'file' : 'files'}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-2">
                                                    {files.map((report) => (
                                                        <div
                                                            key={report.report_file.file_id}
                                                            className={`p-3 rounded border cursor-pointer transition-colors ${
                                                                selectedMaglaReport?.report_file.file_id === report.report_file.file_id
                                                                    ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800'
                                                                    : 'hover:bg-muted/50 border-border'
                                                            }`}
                                                            onClick={() => selectMaglaFile(report)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <FileText className="size-4 text-muted-foreground" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium text-foreground truncate">{report.report_file.filename}</span>
                                                                        <span className="text-xs text-muted-foreground">{formatMonthYear(maglaCreatedAtByReportId.get(report.report_id) ?? report.date_time)}</span>
                                                                    </div>
                                                                </div>
                                                                {selectedMaglaReport?.report_file.file_id === report.report_file.file_id && (
                                                                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4">File Preview</h3>
                                {selectedMaglaReport ? (
                                    <div className="border rounded-lg p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                            <div className="min-w-0">
                                                <h4 className="font-medium truncate">{selectedMaglaReport.report_file.filename}</h4>
                                                <div className="text-sm text-muted-foreground mb-3">
                                                    {formatMonthYear(maglaCreatedAtByReportId.get(selectedMaglaReport.report_id) ?? selectedMaglaReport.date_time)}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => downloadFile(selectedMaglaReport.report_id, selectedMaglaReport.report_file.filename, 'MAGLA')}
                                            >
                                                <Download className="size-4 mr-2" />
                                                Download
                                            </Button>
                                        </div>

                                        {maglaPreviewError ? (
                                            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded">
                                                {maglaPreviewError}
                                            </div>
                                        ) : (
                                            <>
                                                {maglaSheets.length > 1 && (
                                                    <div className="flex gap-2 overflow-x-auto mb-3">
                                                        {maglaSheets.map((name, idx) => (
                                                            <Button
                                                                key={name}
                                                                size="sm"
                                                                variant={maglaCurrentSheetIndex === idx ? 'default' : 'outline'}
                                                                onClick={() => changeMaglaSheet(idx)}
                                                            >
                                                                {name}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                )}

                                                {maglaPreviewRows && maglaPreviewRows.length > 0 ? (
                                                    <div className="border rounded-lg overflow-auto max-h-[320px] bg-white dark:bg-slate-800">
                                                        <table className="min-w-full text-sm border-collapse">
                                                            {(() => {
                                                                const headerRowIndex = findMaglaHeaderRowIndex(maglaPreviewRows);
                                                                const headerRow = (maglaPreviewRows[headerRowIndex] ?? []) as any[];
                                                                const maxColumns = Math.max(
                                                                    ...maglaPreviewRows.map(r => (Array.isArray(r) ? r.length : 0))
                                                                );
                                                                const columnsToShow = maxColumns;
                                                                const headers = Array.from({ length: maxColumns }).map((_, idx) => String((headerRow as any[])[idx] ?? ''));
                                                                const allRows = maglaPreviewRows.slice(headerRowIndex + 1);
                                                                const maxRowsToShow = Math.min(allRows.length, 100);
                                                                const rows = allRows.slice(0, maxRowsToShow);

                                                                return (
                                                                    <>
                                                                        <thead>
                                                                        <tr className="border-b last:border-0 bg-muted/50">
                                                                            {Array.from({ length: columnsToShow }).map((_, j) => (
                                                                                <th
                                                                                    key={j}
                                                                                    className="px-3 py-2 border-r last:border-r-0 whitespace-nowrap text-left font-medium text-gray-700 dark:text-gray-200"
                                                                                >
                                                                                    {headerRow[j] === null || headerRow[j] === undefined ? '' : String(headerRow[j])}
                                                                                </th>
                                                                            ))}
                                                                        </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                        {rows.map((row, i) => (
                                                                            <tr key={i} className="border-b last:border-0">
                                                                                {Array.from({ length: columnsToShow }).map((_, j) => (
                                                                                    <td
                                                                                        key={j}
                                                                                        className="px-3 py-2 border-r last:border-r-0 whitespace-nowrap text-gray-700 dark:text-gray-200"
                                                                                    >
                                                                                        {formatMaglaCellValue(Array.isArray(row) ? row[j] : '', headers[j] ?? '')}
                                                                                    </td>
                                                                                ))}
                                                                            </tr>
                                                                        ))}
                                                                        </tbody>
                                                                    </>
                                                                );
                                                            })()}
                                                        </table>
                                                        {(() => {
                                                            const headerRowIndex = findMaglaHeaderRowIndex(maglaPreviewRows);
                                                            const allRows = maglaPreviewRows.slice(headerRowIndex + 1);
                                                            const maxRowsToShow = Math.min(allRows.length, 100);
                                                            return allRows.length > maxRowsToShow ? (
                                                                <div className="text-center py-2 text-xs text-muted-foreground border-t bg-muted/30">
                                                                    Showing first {maxRowsToShow} of {allRows.length} rows
                                                                </div>
                                                            ) : null;
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <div className="p-6 text-center text-gray-500">No previewable data</div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
                                        <FileText className="size-12 mx-auto mb-4 text-muted-foreground" />
                                        <p>Select a file to preview</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ---------- LIST ---------- */}
            <Card>
                <CardContent>
                    {Object.keys(grouped).length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                {regulatorSearch.trim() 
                                    ? `No regulators found matching "${regulatorSearch}"`
                                    : "No regulator submissions available."
                                }
                            </p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([regulator, list]) => {
                        const processed = processSubmissions(list);
                        if (processed.length === 0) return null;

                        const open = openRegulators[regulator] ?? true;

                        return (
                            <div key={regulator} className="mb-10">
                                <button
                                    onClick={() =>
                                        setOpenRegulators(p => ({
                                            ...p,
                                            [regulator]: !open,
                                        }))
                                    }
                                    className="flex items-center gap-2 font-semibold mb-3"
                                >
                                    {open ? (
                                        <ChevronDown className="size-4" />
                                    ) : (
                                        <ChevronRight className="size-4" />
                                    )}
                                    {regulator}
                                    <Badge variant="secondary">{processed.length}</Badge>
                                </button>

                                {open && (
                                    <div className="space-y-4 pl-6">
                                        {processed.map((submission, i) => (
                                            <motion.div
                                                key={submission.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.04 }}
                                                className="border rounded-lg p-4 hover:bg-muted/50 transition-all hover:shadow-md"
                                            >
                                                <div className="flex justify-between mb-2">
                                                    <div>
                                                        <div className="flex gap-2 items-center">
                                                            <h3 className="font-medium">
                                                                {submission.title}
                                                            </h3>
                                                            {getStatusBadge(submission.status)}
                                                        </div>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(
                                                                submission.submittedAt
                                                            ).toLocaleString()}
                                                        </p>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            downloadFile(
                                                                Number(submission.id),
                                                                submission.fileName,
                                                                submission.regulatorName
                                                            )
                                                        }
                                                    >
                                                        <Download className="size-4 mr-2" />
                                                        Download
                                                    </Button>
                                                </div>

                                                <p className="text-sm text-gray-600 mb-3">
                                                    {submission.description}
                                                </p>

                                                <FilePreview
                                                    reportId={Number(submission.id)}
                                                    fileName={submission.fileName}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                        )}
                </CardContent>
            </Card>
        </motion.div>
    );
}