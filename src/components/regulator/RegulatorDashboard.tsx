import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {authAPI, managementAPI, reportsAPI} from '@/utils/API.ts';
import { Plus, LogOut, FileText, Upload, CheckCircle, Clock, XCircle, Building2, ShieldCheck, UserCheck, UserX, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KpiCard } from './KpiCard';
import { ReportInstructionsDialog } from './ReportInstructionDialog';

interface RegulatorDashboardProps {
    onSignOut: () => void;
}

interface RegulatorSubmission {
    id: string;
    regulatorId: string;
    regulatorName: string;
    title: string;
    description: string;
    fileName: string;
    fileUrl: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
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

export function RegulatorDashboard({ onSignOut }: RegulatorDashboardProps) {
    const [submissions, setSubmissions] = useState<RegulatorSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSubmissionForm, setShowSubmissionForm] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [uniqueOperators, setUniqueOperators] = useState<UniqueRegulatorUser[]>([]);

    // Form state
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [month, setMonth] = useState('');
    const [submissionType, setSubmissionType] = useState<'online' | 'offline'>('online');

    useEffect(() => {
        // loadUser();
        loadSubmissions();
        loadUniqueOperators();
    }, []);

    // const loadUser = async () => {
    //     try {
    //         const userData = await authAPI.getUser();
    //         setUser(userData);
    //     } catch (error) {
    //         console.error('Failed to load user:', error);
    //     }
    // };

    async function loadUniqueOperators() {
        try {
            // Get all users and filter for operators associated with this regulator
            const users = await managementAPI.getUsers();

            // Filter users who have regulator role and same regulator_id
            const regulatorUsers = users.filter((u: any) =>
                u.roles?.includes('regulator') || u.roles?.some((r: any) => r.name === 'regulator')
            );

            setUniqueOperators(regulatorUsers as UniqueRegulatorUser[]);
        } catch (error) {
            console.error('Failed to load regulator users:', error);
            setUniqueOperators([]);
        }
    }

    const loadSubmissions = async () => {
        setIsLoading(true);
        try {
            // TODO: Implement API call to fetch regulator submissions
            // For now, using mock data
            setSubmissions([]);
        } catch (error) {
            console.error('Failed to load submissions:', error);
        } finally {
            setIsLoading(false);
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!month || !file) {
            alert('Please select a reporting month and upload a file.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = reportsAPI.submitMetrics(month, submissionType, file);
            if (response !== null) {
                alert(`Report for ${month} (${submissionType}) submitted successfully!`);
                setShowSubmissionForm(false);
                resetForm();
                loadSubmissions();
            }
        } catch (error: any) {
            console.error('Failed to submit:', error);
            alert(error.message || 'Failed to submit file. Check console for network errors.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setMonth('');
        setSubmissionType('online');
        setFile(null);
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
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
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
                                {/* Month */}
                                <div className="space-y-2">
                                    <Label htmlFor="month">Reporting Month *</Label>
                                    <Input
                                        id="month"
                                        type="month"
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        required
                                    />
                                </div>

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
                                <div className="space-y-2">
                                    <Label htmlFor="file">Upload File *</Label>
                                    <Input
                                        id="file"
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"
                                        onChange={handleFileChange}
                                        required
                                    />

                                    {file && (
                                        <p className="text-sm text-gray-600">
                                            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        </p>
                                    )}

                                    <p className="text-sm text-gray-500">
                                        Accepted formats: PDF, DOC, DOCX, XLSX, XLS, CSV (Max 10MB)
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
            <ReportInstructionsDialog
                open={showInstructions}
                onOpenChange={(open) => {
                    setShowInstructions(open);
                    if (!open) {
                        setShowSubmissionForm(true);
                    }
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
                            <p className="text-blue-100 mt-1 text-sm font-medium">{user?.user_metadata?.name || user?.email}</p>
                            <p className="text-sm text-blue-200">{user?.user_metadata?.country || 'Country not set'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => {
                                    setShowInstructions(true);
                                    setShowSubmissionForm(false);
                                }}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                            >
                                <Plus className="size-4 mr-2" />
                                Submit Document
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleSignOut}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                            >
                                <LogOut className="size-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <KpiCard
                        title="Licensed Users"
                        value={uniqueOperators.length}
                        icon={Users}
                    />
                    <KpiCard
                        title="Total Submissions"
                        value={submissions.length}
                        icon={FileText}
                    />
                    <KpiCard
                        title="Active Users"
                        value={uniqueOperators.filter(op => op.is_active).length}
                        icon={UserCheck}
                        color="from-green-500 to-emerald-500"
                    />
                </div>

                {/* Licensed Operators */}
                <div className="mb-10">
                    <Card className="border border-gray-200">
                        <CardContent className="pt-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-600">
                                    Licensed Operators
                                </p>
                                <span className="text-xs text-gray-500">
                  {uniqueOperators.length} total
                </span>
                            </div>

                            {uniqueOperators.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="size-12 mx-auto mb-4 text-gray-400" />
                                    <p>No licensed operators found</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {uniqueOperators.map((op) => {
                                        const isActive = op.is_active;

                                        return (
                                            <div
                                                key={op.user_id}
                                                className="flex items-center gap-3 px-4 py-2 rounded-full border bg-gray-50 hover:bg-gray-100 transition"
                                            >
                                                {/* Icon avatar */}
                                                <div
                                                    className={`h-9 w-9 rounded-full flex items-center justify-center ${
                                                        isActive
                                                            ? 'bg-green-100 text-green-600'
                                                            : 'bg-gray-200 text-gray-500'
                                                    }`}
                                                >
                                                    <Building2 className="h-4 w-4" />
                                                </div>

                                                {/* Operator info */}
                                                <div className="flex flex-col leading-tight">
                          <span className="text-sm font-medium text-gray-800 max-w-[140px] truncate">
                            {op.full_name ?? op.email}
                          </span>

                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        {isActive ? (
                                                            <>
                                                                <UserCheck className="h-3 w-3 text-green-500" />
                                                                Active
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserX className="h-3 w-3 text-gray-400" />
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

                {/* Submissions List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Document Submissions</CardTitle>
                        <CardDescription>View and track your submitted documents</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
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
                        ) : (
                            <div className="space-y-4">
                                {submissions.map((submission, index) => (
                                    <motion.div
                                        key={submission.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="border rounded-lg p-4 hover:bg-gray-50 transition-all hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-medium">{submission.title}</h3>
                                                    {getStatusBadge(submission.status)}
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 mb-3">{submission.description}</p>

                                        <div className="flex items-center gap-2 text-sm">
                                            <FileText className="size-4 text-gray-400" />
                                            <span className="text-gray-600">{submission.fileName}</span>
                                        </div>

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
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}