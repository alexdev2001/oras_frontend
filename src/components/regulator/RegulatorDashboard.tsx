import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, X, AlertCircle, CheckCircle, FileText, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Regulator } from '@/types/regulator';

// Define missing types locally
interface MaglaReport {
    report_id: number;
    date_time: string;
    opening_balances_total: number;
    closing_balances_total: number;
    total_stake: number;
    total_winnings: number;
    total_ggr: number;
    total_bet_count: number;
    status: string;
}

interface MaglaMetrics {
    total_bet_count: number;
    report_id: number;
    total_winnings: number;
    total_stake: number;
    total_ggr: number;
    date_time: string;
}

interface FileBuffer {
    operator_id: number;
    filename: string;
    file_buffer: string;
}

interface MaglaOperator {
    operator_id: number;
    operator_name: string;
    email: string;
    is_active: boolean;
}

interface ParsedSheet {
    name: string;
    data: any[][];
    range: string;
}

interface ParsedWorkbook {
    sheets: ParsedSheet[];
    sheetNames: string[];
}

import { Plus, LogOut, Upload, XCircle, Building2, ShieldCheck, UserCheck, UserX, Users,
    ArrowUpDown, Filter, BarChart3, Database, TrendingUp, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { motion } from 'motion/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KpiCard } from './KpiCard';
import { ReportInstructionsDialog } from './ReportInstructionDialog';
import {jwtDecode} from 'jwt-decode';
import {RegulatorDataTables} from "@/components/admin/tabs/regulator/RegulatorDataTables.tsx";
import {RegulatorPredictionsTab} from "@/components/admin/tabs/predictions/RegulatorPredictionsTab.tsx";
import {MaglaDataTables} from "@/components/admin/tabs/magla/MaglaDataTables.tsx";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar} from 'recharts';
import {FilePreview} from "@/components/regulator/FilePreview.tsx";
import {MaglaSubmissionPage} from "@/components/regulator/MaglaSubmissionPage.tsx";
import {MaglaInstructionsDialog} from "@/components/regulator/MaglaInstructionsDialog.tsx";
import {RegulatorOperatorsTab} from "@/components/regulator/RegulatorOperatorsTab.tsx";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MonthPicker } from '@/components/ui/month-picker';
import { tokenManager } from '@/utils/security.ts';
import { managementAPI, reportsAPI, analyticsAPI, authAPI } from '@/utils/API.ts';

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

interface MaglaReportsResponse {
    reports: MaglaReport[];
}

interface FileBuffer {
    operator_id: number;
    filename: string;
    file_buffer: string;
}

interface ParsedSheet {
    name: string;
    data: any[][];
    range: string;
}

interface ParsedWorkbook {
    sheets: ParsedSheet[];
    sheetNames: string[];
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
    // Add custom CSS for scrollbar hiding safely
    useEffect(() => {
        const existingStyle = document.head.querySelector('style[data-scrollbar-hide]');
        if (!existingStyle) {
            const style = document.createElement('style');
            style.setAttribute('data-scrollbar-hide', 'true');
            style.textContent = `
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

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
    const [maglaMetrics, setMaglaMetrics] = useState<MaglaMetrics[]>([]);
    const [maglaOperators, setMaglaOperators] = useState<any[]>([]);
    const [isMaglaDataLoading, setIsMaglaDataLoading] = useState(false);
    const [maglaReports, setMaglaReports] = useState<MaglaReport[]>([]);
    const [fileBuffers, setFileBuffers] = useState<FileBuffer[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileBuffer | null>(null);
    const [selectedMaglaReport, setSelectedMaglaReport] = useState<MaglaReport | null>(null);
    const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
    const [sheetNameScroll, setSheetNameScroll] = useState(0);
    const [sheets, setSheets] = useState<string[]>([]);

    const formatMonthYear = (rawDate: string | null | undefined) => {
        if (!rawDate) return '';
        const d = new Date(rawDate);
        if (Number.isNaN(d.getTime())) return '';
        return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(d);
    };
    const [parsedWorkbook, setParsedWorkbook] = useState<ParsedWorkbook | null>(null);

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
    const [isReloadingData, setIsReloadingData] = useState(false);
    const [month, setMonth] = useState('');
    const [submissionType, setSubmissionType] = useState<'online' | 'offline'>('online');

    const [filterType, setFilterType] = useState<'all' | 'online' | 'offline'>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [activeView, setActiveView] = useState<'overview' | 'submissions' | 'analytics' | 'predictions' | 'operators'>('overview');

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
        
        // Load Magla-specific data if this is a Magla regulator
        if (isMaglaRegulator) {
            loadMaglaData();
        }
    }, [regulatorId, isMaglaRegulator]);

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
                // Handle different response structures
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

            // Load file buffers
            try {
                const buffersData = await reportsAPI.getFileBuffers();
                setFileBuffers(buffersData as FileBuffer[]);
            } catch (error) {
                console.error('Failed to load file buffers:', error);
                setFileBuffers([]);
            }
        } catch (error) {
            console.error('Failed to load Magla data:', error);
        } finally {
            setIsMaglaDataLoading(false);
        }
    };

    // Utility function for graceful data reloading after submissions
    const gracefulReloadData = async (currentRegulatorId: number | null, showMessage: (title: string, message: string) => void) => {
        if (!currentRegulatorId) return;

        setIsReloadingData(true);
        
        try {
            // Reload all necessary data in parallel for better performance
            await Promise.all([
                loadSubmissions(),
                loadUniqueOperators(currentRegulatorId),
                loadAnalytics(currentRegulatorId),
                // Also reload Magla data if this is a Magla regulator
                ...(isMaglaRegulator ? [loadMaglaData()] : [])
            ]);
            
            showMessage("Success!", "Data submitted successfully! All data has been refreshed.");
        } catch (error) {
            console.error('Error reloading data after submission:', error);
            showMessage("Success!", "Data submitted successfully! Some data may need manual refresh.");
        } finally {
            setIsReloadingData(false);
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
                setShowSubmissionForm(false);
                resetForm();
                
                // Use graceful reload utility function
                await gracefulReloadData(regulatorId, (title, message) => {
                    setAlertTitle(title);
                    setAlertMessage(message);
                    setShowAlert(true);
                });
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
        ?.sort((a, b) => {
            // Convert month names to numbers for proper sorting
            const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const aMonthIndex = monthOrder.indexOf(a.month);
            const bMonthIndex = monthOrder.indexOf(b.month);
            
            // Handle "Total" row - always put it last
            if (a.month === 'Total') return 1;
            if (b.month === 'Total') return -1;
            
            return aMonthIndex - bMonthIndex;
        }) ?? [];
    
    const totalStake = combinedMonthly.reduce((sum, row) => sum + (row.stake || 0), 0);
    const totalGgr = combinedMonthly.reduce((sum, row) => sum + (row.ggr || 0), 0);
    const avgGgrPct = combinedMonthly.length
        ? combinedMonthly.reduce((sum, row) => sum + (row.ggr_pct || 0), 0) / combinedMonthly.length
        : 0;

    const monthlyTrendData = combinedMonthly
        .filter(row => row.month !== 'Total') // Remove the Total row from the chart
        .map((row) => ({
            month: row.month, // Keep the month name as-is (January, February, etc.)
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

    // Process Magla metrics for charts
    
    const maglaMonthlyData = maglaMetrics.reduce((acc: any[], metric) => {
        const month = metric.date_time.substring(0, 7); // YYYY-MM format
        const existingMonth = acc.find(item => item.month === month);
        
        if (existingMonth) {
            existingMonth.total_stake += metric.total_stake;
            existingMonth.ggr += metric.ggr;
            existingMonth.total_winnings += metric.total_winnings;
            existingMonth.gaming_tax += metric.gaming_tax;
            existingMonth.det_levy += metric.det_levy;
        } else {
            acc.push({
                month,
                total_stake: metric.total_stake,
                ggr: metric.ggr,
                total_winnings: metric.total_winnings,
                gaming_tax: metric.gaming_tax,
                det_levy: metric.det_levy
            });
        }
        
        return acc;
    }, []).sort((a, b) => a.month.localeCompare(b.month));

    const maglaOperatorData = maglaOperators.map(operator => {
        const operatorMetrics = maglaMetrics.filter(m => m.report_id === operator.operator_id);
        const totalGgr = operatorMetrics.reduce((sum, m) => sum + m.ggr, 0);
        const totalStake = operatorMetrics.reduce((sum, m) => sum + m.total_stake, 0);
        
        return {
            operator: operator.operator_name || `Operator ${operator.operator_id}`,
            ggr: totalGgr,
            total_stake: totalStake
        };
    }).sort((a, b) => b.ggr - a.ggr).slice(0, 5);

    
    const maglaMonthlyTrendData = maglaMonthlyData.map((row) => {
        const [year, month] = row.month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
            month: `${monthNames[parseInt(month) - 1]} ${year}`,
            total_stake: row.total_stake,
            ggr: row.ggr,
        };
    });

    // Create a mapping between reports and file buffers for efficient lookup
    const reportToBufferMap = new Map<number, FileBuffer>();
    maglaReports.forEach(report => {
        // Try exact filename match first
        const exactMatch = fileBuffers.find(buffer => buffer.filename === report.report_file.filename);
        if (exactMatch) {
            reportToBufferMap.set(report.report_file.file_id, exactMatch);
        } else {
            // Fallback: find any buffer for this operator
            const operatorMatch = fileBuffers.find(buffer => buffer.operator_id === report.operator_id);
            if (operatorMatch) {
                reportToBufferMap.set(report.report_file.file_id, operatorMatch);
            }
        }
    });

    // Group magla reports by operator (instead of fileBuffers)
    const filesByOperator = maglaReports.reduce((acc: Record<number, any[]>, report) => {
        if (!acc[report.operator_id]) {
            acc[report.operator_id] = [];
        }
        acc[report.operator_id].push(report);
        return acc;
    }, {});


    // Check for duplicate operator names
    const operatorNames = maglaOperators.map(op => op.operator_name);
    const duplicateNames = operatorNames.filter((name, index) => operatorNames.indexOf(name) !== index);

    // Helper function to handle file selection
    const handleFileSelect = async (reportFile: { file_id: number; filename: string }) => {
        const reportForSelection = maglaReports.find(r => r.report_file.file_id === reportFile.file_id) ?? null;
        setSelectedMaglaReport(reportForSelection);
        
        // First try to find exact match using our mapping
        let matchingFileBuffer = reportToBufferMap.get(reportFile.file_id);
        
        if (matchingFileBuffer) {
            // Verify this is actually the right file
            if (matchingFileBuffer.filename !== reportFile.filename) {
                
                // Try to find the exact file by filename
                const exactFile = fileBuffers.find(fb => fb.filename === reportFile.filename);
                if (exactFile) {
                    matchingFileBuffer = exactFile;
                } else {
                    console.error('No exact file found for filename:', reportFile.filename);
                }
            }
        } else {
            // Fallback: try filename matching
            matchingFileBuffer = fileBuffers.find(fb => fb.filename === reportFile.filename);
            
            if (!matchingFileBuffer) {
                // Final fallback: try operator_id matching
                const report = maglaReports.find(r => r.report_file.file_id === reportFile.file_id);
                if (report) {
                    const operatorBuffers = fileBuffers.filter(fb => fb.operator_id === report.operator_id);
                    
                    if (operatorBuffers.length > 0) {
                        matchingFileBuffer = operatorBuffers[0];
                    }
                }
            }
        }
        
        if (!matchingFileBuffer) {
            console.error('No matching file buffer found for:', reportFile);
            console.error('Total fileBuffers available:', fileBuffers.length);
            console.error('Available filenames:', fileBuffers.map(fb => fb.filename));
            console.error('Report to buffer mapping keys:', Array.from(reportToBufferMap.keys()));
            setAlertTitle("File Not Found");
            setAlertMessage("The file buffer for this report could not be found. Please try refreshing the page.");
            setShowAlert(true);
            return;
        }
        
        setSelectedFile(matchingFileBuffer);
        
        // Try to maintain current sheet selection if possible
        const previousSheetName = sheets[currentSheetIndex];
        
        try {
            // Check if the buffer looks like valid hex string
            const isValidHex = /^[0-9a-fA-F]*$/.test(matchingFileBuffer.file_buffer) && 
                              matchingFileBuffer.file_buffer.length > 0 &&
                              matchingFileBuffer.file_buffer.length % 2 === 0; // Hex strings should have even length
            
            if (!isValidHex) {
                console.error('File buffer is not valid hex format');
                console.error('Buffer sample:', matchingFileBuffer.file_buffer.substring(0, 200));
                
                // Set user-friendly error message
                setAlertTitle("File Format Error");
                setAlertMessage("The selected file is not in the expected format. Please contact support.");
                setShowAlert(true);
                
                setSheets(['Sheet1', 'Sheet2', 'Sheet3']);
                setParsedWorkbook(null);
                return;
            }
            
            // Convert hex string to Uint8Array
            const bytes = new Uint8Array(matchingFileBuffer.file_buffer.length / 2);
            for (let i = 0; i < matchingFileBuffer.file_buffer.length; i += 2) {
                bytes[i / 2] = parseInt(matchingFileBuffer.file_buffer.substr(i, 2), 16);
            }
            
            // Try to parse the Excel file from the binary data
            let workbook;
            
            try {
                workbook = XLSX.read(bytes, { type: 'array' });
            } catch (error1) {
                
                // Try as buffer
                try {
                    workbook = XLSX.read(bytes.buffer, { type: 'buffer' });
                } catch (error2) {
                    throw new Error('Unable to parse Excel file from hex data');
                }
            }
            
            // Extract sheet names and data
            const sheetNames = workbook.SheetNames;
            const parsedSheets: ParsedSheet[] = [];
            
            sheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                const range = worksheet['!ref'] || 'A1:A1';
                
                parsedSheets.push({
                    name: sheetName,
                    data: jsonData as any[][],
                    range
                });
            });
            
            const parsedData: ParsedWorkbook = {
                sheets: parsedSheets,
                sheetNames
            };
            
            setParsedWorkbook(parsedData);
            setSheets(sheetNames);
            
            // Smart sheet selection: try to maintain previous sheet selection
            if (previousSheetName && sheetNames.includes(previousSheetName)) {
                const newSheetIndex = sheetNames.indexOf(previousSheetName);
                setCurrentSheetIndex(newSheetIndex);
            } else {
                setCurrentSheetIndex(0);
            }
        } catch (error) {
            console.error('Error parsing Excel file from hex data:', error);
            
            // Set user-friendly error message
            setAlertTitle("File Preview Error");
            setAlertMessage("The selected file could not be previewed. The file may be corrupted or in an unsupported format.");
            setShowAlert(true);
            
            // Fallback to dummy sheet names if parsing fails
            setSheets(['Sheet1', 'Sheet2', 'Sheet3']);
            setParsedWorkbook(null);
        }
    };

    // Enhanced formatting function with column-specific logic
    const formatCellValue = (value: any, columnHeader: string): string => {
        if (value === null || value === undefined || value === '') return '';
        
        const stringValue = String(value).trim();
        const headerLower = columnHeader.toLowerCase();
        
        // Handle Excel date serial numbers for Date columns
        if (headerLower.includes('date')) {
            const numericValue = parseFloat(stringValue.replace(/[,]/g, ''));
            
            if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 2958465) {
                const excelEpoch = new Date(1900, 0, 1);
                const jsDate = new Date(excelEpoch.getTime() + (numericValue - 2) * 24 * 60 * 60 * 1000);
                
                if (!isNaN(jsDate.getTime())) {
                    const formattedDate = jsDate.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric'
                    });
                    return formattedDate;
                }
            }
            return stringValue;
        }
        
        // Check if this column should NOT be formatted with commas
        const shouldNotFormat = 
            headerLower.includes('first ticket') || 
            headerLower.includes('last ticket') ||
            headerLower.includes('count') ||
            headerLower.includes('# bets') ||
            headerLower.includes('bets') ||
            headerLower.includes('ggr%') ||
            headerLower.includes('%');
        
        if (shouldNotFormat) {
            return stringValue;
        }
        
        // Format with comma separators and 2 decimal places for all other columns
        const cleanValue = stringValue.replace(/[,\s%]/g, '');
        const numericValue = parseFloat(cleanValue);
        
        if (!isNaN(numericValue)) {
            const formatted = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(numericValue);
            return formatted;
        }
        
        return stringValue;
    };

    // Component to render Excel table with enhanced features
    const ExcelTableViewer = ({ data, fileName, sheetNameScroll, setSheetNameScroll }: { 
        data: any[][], 
        fileName: string,
        sheetNameScroll: number,
        setSheetNameScroll: (scroll: number) => void
    }) => {
        if (!data || data.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    No data available in this sheet
                </div>
            );
        }

        const maxColumns = Math.max(...data.map(row => Array.isArray(row) ? row.length : 0));
        const maxRowsToShow = Math.min(data.length, 100); // Increased limit for better viewing
        
        // Find the actual header row (look for row containing "Date")
        let columnHeaders = [];
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            const row = data[i];
            if (Array.isArray(row) && row.some(cell => String(cell).toLowerCase().includes('date'))) {
                columnHeaders = row;
                break;
            }
        }
        
        // Fallback to first row if no header row found
        if (columnHeaders.length === 0 && data.length > 0) {
            columnHeaders = Array.isArray(data[0]) ? data[0] : [];
        }
        
        // Download function
        const handleDownload = async () => {
            if (selectedFile) {
                try {
                    // Convert hex back to binary and create blob
                    const bytes = new Uint8Array(selectedFile.file_buffer.length / 2);
                    for (let i = 0; i < selectedFile.file_buffer.length; i += 2) {
                        bytes[i / 2] = parseInt(selectedFile.file_buffer.substr(i, 2), 16);
                    }
                    
                    const blob = new Blob([bytes], { 
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                    });
                    
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Download failed:', error);
                    setAlertTitle("Download Failed");
                    setAlertMessage("Unable to download the file. Please try again.");
                    setShowAlert(true);
                }
            }
        };

        return (
            <div className="h-full flex flex-col">
                {/* Header with download button */}
                <div className="flex justify-between items-center p-4 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground truncate max-w-[300px]">
                            {fileName}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="flex items-center gap-2"
                    >
                        <Download className="size-4" />
                        Download
                    </Button>
                </div>

                {/* Sheet names navigation */}
                {sheets.length > 1 && (
                    <div className="flex items-center p-2 border-b bg-muted/20">
                        <div className="flex gap-2 overflow-x-auto flex-1 scrollbar-hide">
                            {sheets.map((sheetName, index) => (
                                <Button
                                    key={index}
                                    variant={currentSheetIndex === index ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setCurrentSheetIndex(index)}
                                    className="text-xs px-4 py-2 whitespace-nowrap flex-shrink-0"
                                >
                                    {sheetName}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Table container with constrained height */}
                <div className="flex-1 overflow-auto border">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-muted/50 sticky top-0 z-10">
                            {data.slice(0, 1).map((headerRow, headerIndex) => (
                                <tr key={headerIndex}>
                                    {Array.from({ length: maxColumns }).map((_, colIndex) => (
                                        <th
                                            key={colIndex}
                                            className="border border-border px-3 py-2 text-left font-medium bg-muted/80 whitespace-nowrap"
                                        >
                                            {Array.isArray(headerRow) && headerRow[colIndex] ? String(headerRow[colIndex]) : ''}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {data.slice(1, maxRowsToShow).map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-muted/30 transition-colors">
                                    {Array.from({ length: maxColumns }).map((_, colIndex) => (
                                        <td
                                            key={colIndex}
                                            className="border border-border px-3 py-2 whitespace-nowrap"
                                        >
                                            {Array.isArray(row) && row[colIndex] !== undefined && row[colIndex] !== null
                                                ? formatCellValue(row[colIndex], columnHeaders[colIndex] || '')
                                                : ''
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data.length > maxRowsToShow && (
                        <div className="text-center py-2 text-xs text-muted-foreground border-t bg-muted/30">
                            Showing first {maxRowsToShow} of {data.length} rows
                        </div>
                    )}
                </div>
            </div>
        );
    };


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
                onSubmitSuccess={async () => {
                    // Use graceful reload utility function
                    await gracefulReloadData(regulatorId, (title, message) => {
                        setAlertTitle(title);
                        setAlertMessage(message);
                        setShowAlert(true);
                    });
                    setShowMaglaSubmissionForm(false);
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
                            <ThemeToggle />
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

                    {/* Reload Indicator */}
                    {isReloadingData && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-blue-500/20 border border-blue-400/30 rounded-lg px-3 py-2 flex items-center gap-2"
                        >
                            <div className="size-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-blue-100 text-sm font-medium">Refreshing data...</span>
                        </motion.div>
                    )}

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 mt-6">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'submissions', label: 'Submissions', icon: FileText },
                            { id: 'analytics', label: 'Data Analytics', icon: Database },
                            { id: 'predictions', label: 'Predictions', icon: TrendingUp },
                            ...(isMaglaRegulator ? [{ id: 'operators', label: 'Operators', icon: Building2 }] : [])
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
                                value={isMaglaRegulator ? maglaReports.length : submissions.length}
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
                            {isMaglaRegulator ? (
                                // Magla-specific charts
                                <>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <BarChart3 className="size-5 text-indigo-600" />
                                                Monthly Performance
                                            </CardTitle>
                                            <CardDescription>
                                                Combined performance across all operators
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {isMaglaDataLoading ? (
                                                <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                                                    Loading Magla analytics...
                                                </div>
                                            ) : maglaMonthlyTrendData.length === 0 ? (
                                                <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                                                    No Magla analytics data available yet
                                                </div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height={240}>
                                                    <AreaChart data={maglaMonthlyTrendData} margin={{ top: 40, right: 30, left: 0, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="maglaStake" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                            </linearGradient>
                                                            <linearGradient id="maglaGgr" x1="0" y1="0" x2="0" y2="1">
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
                                                            dataKey="total_stake"
                                                            name="Total Stake"
                                                            stroke="#4f46e5"
                                                            fill="url(#maglaStake)"
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="ggr"
                                                            name="GGR"
                                                            stroke="#22c55e"
                                                            fill="url(#maglaGgr)"
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
                                                Highest contributing operators across all metrics
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {isMaglaDataLoading ? (
                                                <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                                                    Loading Magla analytics...
                                                </div>
                                            ) : maglaOperatorData.length === 0 ? (
                                                <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                                                    No Magla operator analytics available
                                                </div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height={240}>
                                                    <BarChart
                                                        data={maglaOperatorData}
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
                                                        <Bar dataKey="ggr" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                // Original regulator charts
                                <>
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
                                </>
                            )}
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
                        {/* Stats Overview - Only show Total Submissions for Magla regulators */}
                        {isMaglaRegulator ? (
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Total Submissions</p>
                                                <p className="text-3xl font-semibold mt-1">{maglaReports.length}</p>
                                            </div>
                                            <div className="size-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                <FileText className="size-6 text-indigo-600" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
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
                        )}

                        {/* Submissions List */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>
                                            {isMaglaRegulator ? 'File Viewer' : 'Document Submissions'}
                                        </CardTitle>
                                        <CardDescription>
                                            {isMaglaRegulator ? 'View and navigate through operator files' : 'View and track your submitted documents'}
                                        </CardDescription>
                                    </div>

                                    {!isMaglaRegulator && submissions.length > 0 && (
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
                                {isMaglaRegulator ? (
                                    // Magla File Viewer
                                    isMaglaDataLoading ? (
                                        <div className="text-center py-8 text-gray-500">Loading files...</div>
                                    ) : maglaReports.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-center py-12"
                                        >
                                            <FileText className="size-12 mx-auto text-gray-400 mb-4" />
                                            <p className="text-gray-600 mb-4">No files available</p>
                                            <Button onClick={() => setShowMaglaInstructions(true)}>
                                                <Plus className="size-4 mr-2" />
                                                Submit First File
                                            </Button>
                                        </motion.div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Files by Operator */}
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
                                                                    {files.map((report, index) => (
                                                                        <div
                                                                            key={index}
                                                                            className={`p-3 rounded border cursor-pointer transition-colors ${
                                                                                selectedFile?.filename === report.report_file.filename
                                                                                    ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800'
                                                                                    : 'hover:bg-muted/50 border-border'
                                                                            }`}
                                                                            onClick={() => handleFileSelect(report.report_file)}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <FileText className="size-4 text-muted-foreground" />
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-sm font-medium text-foreground">{report.report_file.filename}</span>
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            {formatMonthYear((report as any).created_at ?? report.date_time)}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                {selectedFile?.filename === report.report_file.filename && (
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

                                            {/* Sheet Navigation and Preview */}
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4">File Preview</h3>
                                                {selectedFile ? (
    <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-2">{selectedFile.filename}</h4>
        <div className="text-sm text-muted-foreground mb-3">
            {formatMonthYear((selectedMaglaReport as any)?.created_at ?? selectedMaglaReport?.date_time)}
        </div>
        
        {/* Excel Preview */}
        <div className="bg-background rounded border">
            {parsedWorkbook && parsedWorkbook.sheets[currentSheetIndex] ? (
                <ExcelTableViewer 
                    data={parsedWorkbook.sheets[currentSheetIndex].data} 
                    fileName={selectedFile?.filename || 'excel-file.xlsx'}
                    sheetNameScroll={sheetNameScroll}
                    setSheetNameScroll={setSheetNameScroll}
                />
            ) : (
                <div className="bg-muted/20 rounded p-8 text-center">
                    <div className="text-muted-foreground mb-2">
                        Currently viewing: {sheets[currentSheetIndex] || 'Sheet1'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Unable to parse Excel file content
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        File buffer length: {selectedFile.file_buffer.length} characters
                    </div>
                </div>
            )}
        </div>
    </div>
                                                ) : (
                                                    <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
                                                        <FileText className="size-12 mx-auto mb-4 text-muted-foreground" />
                                                        <p>Select a file to preview</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    // Original Regulator Submissions
                                    isLoading ? (
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
                                    )
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
                        {isMaglaRegulator ? (
                            <MaglaDataTables />
                        ) : (
                            <RegulatorDataTables regulatorId={regulatorId} />
                        )}
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

                {/* OPERATORS TAB - Only for MAGLA */}
                {activeView === 'operators' && isMaglaRegulator && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <RegulatorOperatorsTab />
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
                    <p className="font-semibold truncate max-w-[160px] whitespace-nowrap cursor-default" title={value}>
                        {value}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

