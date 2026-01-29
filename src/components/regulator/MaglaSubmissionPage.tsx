import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { reportsAPI, managementAPI } from '@/utils/API.ts';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MonthPicker } from '@/components/ui/month-picker';
import type { DecodedToken } from '@/components/regulator/RegulatorDashboard';
import { jwtDecode } from 'jwt-decode';
import { tokenManager } from '@/utils/security.ts';

interface MaglaSubmissionPageProps {
    onCancel: () => void;
    onSubmitSuccess: () => void;
}

export function MaglaSubmissionPage({ onCancel, onSubmitSuccess }: MaglaSubmissionPageProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'processing' | 'success' | 'error'>('idle');
    const [regulatorId, setRegulatorId] = useState<number | null>(null);
    const [uploadedBy, setUploadedBy] = useState<number | null>(null);
    const [month, setMonth] = useState('');
    const [operators, setOperators] = useState<any[]>([]);
    const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');

    useEffect(() => {
        const token = tokenManager.getToken();
        if (token) {
            try {
                const decoded = jwtDecode<DecodedToken>(token);
                setRegulatorId(decoded.regulator_id);
                setUploadedBy(decoded.user_id);
            } catch (err) {
                console.error("Invalid token", err);
            }
        }
    }, []);

    useEffect(() => {
        // Load operators when component mounts
        const loadOperators = async () => {
            try {
                const operatorsData = await managementAPI.getOperators();
                setOperators(operatorsData);
            } catch (error) {
                console.error('Failed to load operators:', error);
            }
        };

        loadOperators();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.oasis.opendocument.spreadsheet',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|xls|ods|pdf|docx?|csv)$/i)) {
                setError('Please upload a valid file (.xlsx, .xls, .pdf, .doc, .docx, .csv)');
                setSelectedFile(null);
                setUploadStatus('error');
                return;
            }

            if (file.size > 15 * 1024 * 1024) {
                setError('File size must be less than 15MB');
                setSelectedFile(null);
                setUploadStatus('error');
                return;
            }

            setSelectedFile(file);
            setError('');
            setUploadStatus('idle');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (regulatorId === null || uploadedBy === null) {
            setError("Authentication missing. Please log in again.");
            return;
        }

        if (!month || !selectedFile || !selectedOperatorId) {
            setError("Please select a reporting month, operator, and upload a file.");
            return;
        }

        setIsSubmitting(true);
        setUploadStatus("validating");

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setUploadStatus("processing");

            const response = await reportsAPI.submitReport(parseInt(selectedOperatorId), uploadedBy, selectedFile, month);
            
            if (response !== null) {
                setUploadStatus("success");
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                setMonth('');
                setSelectedOperatorId('');
                setSelectedFile(null);
                setUploadStatus('idle');
                setError('');
                
                onSubmitSuccess();
            }
        } catch (err: any) {
            console.error("Submission error:", err);
            const backendMessage = err?.response?.data?.detail || err?.message || "Failed to submit document";
            setError(backendMessage);
            setUploadStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusMessage = () => {
        switch (uploadStatus) {
            case 'validating':
                return { text: 'Validating document structure...', color: 'blue' };
            case 'processing':
                return { text: 'Processing regulatory data...', color: 'blue' };
            case 'success':
                return { text: 'Document submitted successfully!', color: 'green' };
            case 'error':
                return { text: 'Upload failed. Please check file and try again.', color: 'red' };
            default:
                return null;
        }
    };

    const statusMessage = getStatusMessage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/40">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="text-white">
                            <h1 className="text-3xl font-bold tracking-tight">Submit Document</h1>
                            <p className="text-blue-100 mt-1 text-sm">Upload regulatory documents for compliance</p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="bg-card/10 border-border text-foreground hover:bg-card/20 backdrop-blur-sm"
                        >
                            <ArrowLeft className="size-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card className="shadow-lg border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Upload className="w-4 h-4 text-blue-600" />
                            </div>
                            Regulatory Submission
                        </CardTitle>
                        <CardDescription>
                            Submit compliance documents for regulatory authority
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    <strong className="block font-medium mb-1">Error</strong>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="month">Reporting Month *</Label>
                                <MonthPicker
                                    value={month}
                                    onChange={setMonth}
                                    label=""
                                    required
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="operator">Operator *</Label>
                                <select
                                    id="operator"
                                    value={selectedOperatorId}
                                    onChange={(e) => setSelectedOperatorId(e.target.value)}
                                    required
                                    className="w-full p-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select an operator</option>
                                    {operators.length === 0 ? (
                                        <option value="" disabled>No operators available</option>
                                    ) : (
                                        operators.map((operator) => (
                                            <option key={operator.operator_id} value={operator.operator_id.toString()}>
                                                {operator.operator_name}
                                            </option>
                                        ))
                                    )}
                                </select>
                                {operators.length === 0 && (
                                    <p className="text-sm text-muted-foreground">Loading operators...</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="magla-file">Document File *</Label>
                                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-ring transition-colors">
                                    <input
                                        id="magla-file"
                                        type="file"
                                        accept=".xlsx,.xls,.ods,.pdf,.doc,.docx,.csv"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <label htmlFor="magla-file" className="cursor-pointer">
                                        {selectedFile ? (
                                            <div className="space-y-3">
                                                <FileSpreadsheet className="size-12 mx-auto text-blue-600" />
                                                <div>
                                                    <p className="font-medium text-blue-900">{selectedFile.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setSelectedFile(null);
                                                        setUploadStatus('idle');
                                                    }}
                                                >
                                                    Change File
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <Upload className="size-12 mx-auto text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">Click to upload document</p>
                                                    <p className="text-sm text-muted-foreground">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Supported: Excel, PDF, Word, CSV (Max 15MB)
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {statusMessage && (
                                <Alert className={
                                    statusMessage.color === 'green'
                                        ? 'border-green-200 bg-green-50'
                                        : statusMessage.color === 'red'
                                            ? 'border-red-200 bg-red-50'
                                            : 'border-blue-200 bg-blue-50'
                                }>
                                    {statusMessage.color === 'green' ? (
                                        <CheckCircle className="size-4 text-green-600" />
                                    ) : statusMessage.color === 'red' ? (
                                        <AlertCircle className="size-4 text-red-600" />
                                    ) : (
                                        <div className="size-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    )}
                                    <AlertDescription className={
                                        statusMessage.color === 'green'
                                            ? 'text-green-800'
                                            : statusMessage.color === 'red'
                                                ? 'text-red-800'
                                                : 'text-blue-800'
                                    }>
                                        {statusMessage.text}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={onCancel}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !selectedFile || !month || !selectedOperatorId}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="size-4 mr-2" />
                                            Submit Document
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}