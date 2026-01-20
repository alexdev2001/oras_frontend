"use client";

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
    FileText,
    CheckCircle,
    Clock,
    Filter,
    ArrowUpDown,
    Download,
    ChevronDown,
    ChevronRight,
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

interface Props {
    submissions: RegulatorSubmission[];
    selectedRegulator?: string;
    selectedMonth?: string;
    regulators?: { regulator_id: number; regulator_name: string }[];
}

export function AdminRegulatorSubmissions({
                                              submissions,
                                              selectedRegulator = "all",
                                              selectedMonth = "all",
                                              regulators = [],
                                          }: Props) {
    const [filterType, setFilterType] =
        useState<'all' | 'online' | 'offline'>('all');
    const [sortOrder, setSortOrder] =
        useState<'newest' | 'oldest'>('newest');
    const [openRegulators, setOpenRegulators] =
        useState<Record<string, boolean>>({});

    // Convert selectedRegulator name to its ID
    const selectedRegulatorId = useMemo(() => {
        if (selectedRegulator === "all") return null;
        const reg = regulators.find(r => r.regulator_name === selectedRegulator);
        return reg ? reg.regulator_id.toString() : null;
    }, [selectedRegulator, regulators]);

    /* -------------------- FILTERED SUBMISSIONS -------------------- */
    const filteredSubmissions = useMemo(() => {
        return submissions.filter(s => {
            const matchesRegulator =
                !selectedRegulatorId || s.regulatorId === selectedRegulatorId;
            const matchesMonth =
                selectedMonth === "all" || s.title.includes(selectedMonth);
            return matchesRegulator && matchesMonth;
        });
    }, [submissions, selectedRegulatorId, selectedMonth]);

    /* -------------------- STATS -------------------- */
    const totalOnline = filteredSubmissions.filter(s => s.status === 'online').length;
    const totalOffline = filteredSubmissions.filter(s => s.status === 'offline').length;

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

        if (filterType !== 'all') {
            data = data.filter(s => s.status === filterType);
        }

        data.sort((a, b) => {
            const da = new Date(a.submittedAt).getTime();
            const db = new Date(b.submittedAt).getTime();
            return sortOrder === 'newest' ? db - da : da - db;
        });

        return data;
    };

    /* -------------------- DOWNLOAD -------------------- */
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
            {/* ---------- STATS ---------- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    {
                        label: 'Total Submissions',
                        value: filteredSubmissions.length,
                        color: 'from-indigo-500 to-blue-500',
                        icon: FileText,
                    },
                    {
                        label: 'Online',
                        value: totalOnline,
                        color: 'from-green-500 to-emerald-500',
                        icon: CheckCircle,
                    },
                    {
                        label: 'Offline',
                        value: totalOffline,
                        color: 'from-amber-500 to-orange-500',
                        icon: Clock,
                    },
                ].map(stat => (
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
                                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center border">
                                    <stat.icon className="size-5 text-slate-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ---------- LIST ---------- */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Regulator Submissions</CardTitle>
                            <CardDescription>
                                Submissions grouped by regulator
                            </CardDescription>
                        </div>

                        <div className="flex gap-3">
                            <Select
                                value={filterType}
                                onValueChange={v => setFilterType(v as any)}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <Filter className="size-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="offline">Offline</SelectItem>
                                </SelectContent>
                            </Select>

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
                </CardHeader>

                <CardContent>
                    {Object.entries(grouped).map(([regulator, list]) => {
                        const processed = processSubmissions(list);
                        if (processed.length === 0) return null;

                        const open = openRegulators[regulator] ?? true;

                        return (
                            <div key={regulator} className="mb-6">
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
                                                className="border rounded-lg p-4 hover:bg-gray-50"
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
                                                                submission.fileName
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
                    })}
                </CardContent>
            </Card>
        </motion.div>
    );
}