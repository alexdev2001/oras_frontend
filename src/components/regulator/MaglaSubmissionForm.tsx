import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { reportsAPI } from '@/utils/API.ts';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MonthPicker } from '@/components/ui/month-picker';
import type { DecodedToken } from '@/components/regulator/RegulatorDashboard';
import { jwtDecode } from 'jwt-decode';
import { tokenManager } from '@/utils/security.ts';

interface MaglaSubmissionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmitSuccess: () => void;
}

export function MaglaSubmissionForm({ open, onOpenChange, onSubmitSuccess }: MaglaSubmissionFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'processing' | 'success' | 'error'>('idle');
    const [regulatorId, setRegulatorId] = useState<number | null>(null);
    const [uploadedBy, setUploadedBy] = useState<number | null>(null);
    const [month, setMonth] = useState('');
    const [submissionType, setSubmissionType] = useState<'online' | 'offline'>('online');

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type for Magla regulator (accepting more formats)
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

            // Validate file size (max 15MB for Magla)
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

        if (!month || !selectedFile) {
            setError("Please select a reporting month and upload a file.");
            return;
        }

        setIsSubmitting(true);
        setUploadStatus("validating");

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setUploadStatus("processing");

            // Use the same API endpoint as IGJ regulator but with Magla-specific logic
            const response = await reportsAPI.submitMetrics(month, submissionType, selectedFile);
            
            if (response !== null) {
                setUploadStatus("success");
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Reset form and close dialog
                setMonth('');
                setSubmissionType('online');
                setSelectedFile(null);
                setUploadStatus('idle');
                setError('');
                
                onSubmitSuccess();
                onOpenChange(false);
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
                return { text: 'Upload failed. Please check the file and try again.', color: 'red' };
            default:
                return null;
        }
    };

    const statusMessage = getStatusMessage();

    const handleClose = () => {
        if (!isSubmitting) {
            setMonth('');
            setSubmissionType('online');
            setSelectedFile(null);
            setUploadStatus('idle');
            setError('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Upload className="w-4 h-4 text-blue-600" />
                        </div>
                        Submit Document
                    </DialogTitle>
                    <DialogDescription>
                        Upload regulatory document for compliance
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Month Selection */}
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

                    {/* Submission Type */}
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
                                    className="accent-blue-600"
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
                                    className="accent-blue-600"
                                    required
                                />
                                Offline
                            </label>
                        </div>
                    </div>

                    {/* File Upload Area */}
                    <div className="space-y-2">
                        <Label htmlFor="magla-file">Document File *</Label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-ring transition-colors">
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
                                        <FileSpreadsheet className="size-10 mx-auto text-blue-600" />
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
                                        <Upload className="size-10 mx-auto text-muted-foreground" />
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

                    {/* Status Messages */}
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

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Remove requirements section */}

                    <DialogFooter className="flex gap-3">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !selectedFile || !month}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="size-4 mr-2" />
                                    Submit Document
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
