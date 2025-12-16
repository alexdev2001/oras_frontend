import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import {authAPI, reportsAPI} from '@/utils/API.ts';
import { Plus, LogOut, FileText, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';

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

export function RegulatorDashboard({ onSignOut }: RegulatorDashboardProps) {
    const [submissions, setSubmissions] = useState<RegulatorSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSubmissionForm, setShowSubmissionForm] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form state
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [month, setMonth] = useState('')
    const [submissionType, setSubmissionType] =
        useState<'online' | 'offline'>('online');

    useEffect(() => {
        // loadUser();
        loadSubmissions();
    }, []);

    // const loadUser = async () => {
    //     try {
    //         const userData = await authAPI.getUser();
    //         setUser(userData);
    //     } catch (error) {
    //         console.error('Failed to load user:', error);
    //     }
    // };

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
            await reportsAPI.submitMetrics(
                month,
                submissionType,
                file
            );

            alert(`Report for ${month} (${submissionType}) submitted successfully!`);

            setShowSubmissionForm(false);
            resetForm();
            loadSubmissions();

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
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white border-b">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1>Submit Document</h1>
                                <p className="text-gray-600">Upload regulatory documents</p>
                            </div>
                            <Button variant="outline" onClick={() => setShowSubmissionForm(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card>
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white border-b sticky top-0 z-50"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1>Regulator Portal</h1>
                            <p className="text-gray-600">{user?.user_metadata?.name}</p>
                            <p className="text-sm text-gray-500">{user?.user_metadata?.country || 'Country not set'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setShowSubmissionForm(true)}>
                                <Plus className="size-4 mr-2" />
                                Submit Document
                            </Button>
                            <Button variant="outline" onClick={handleSignOut}>
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
                    {[
                        {
                            status: 'approved',
                            count: submissions.filter(s => s.status === 'approved').length,
                            color: 'from-green-500 to-emerald-500',
                            icon: CheckCircle,
                        },
                        {
                            status: 'pending',
                            count: submissions.filter(s => s.status === 'pending').length,
                            color: 'from-yellow-500 to-orange-500',
                            icon: Clock,
                        },
                        {
                            status: 'rejected',
                            count: submissions.filter(s => s.status === 'rejected').length,
                            color: 'from-red-500 to-pink-500',
                            icon: XCircle,
                        },
                    ].map((item, index) => (
                        <motion.div
                            key={item.status}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="overflow-hidden">
                                <div className={`h-2 bg-gradient-to-r ${item.color}`} />
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 capitalize mb-1">{item.status}</p>
                                            <p className="text-4xl">{item.count}</p>
                                        </div>
                                        <item.icon className={`size-12 opacity-20`} />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
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
                                <Button onClick={() => setShowSubmissionForm(true)}>
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
