import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { reportsAPI } from '@/utils/API.ts';
import { ArrowLeft, Upload, FileSpreadsheet, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { ReportInstructionsDialog } from './ReportInstructionsDialog';
import { Alert, AlertDescription } from '@/components/ui/alert.tsx';
import type {DecodedToken} from "@/types/token.ts";
import {jwtDecode} from "jwt-decode";
import { tokenManager } from '@/utils/security.ts';

interface ReportSubmissionFormProps {
    onCancel: () => void;
    onSubmitSuccess: () => void;
}

export function ReportSubmissionForm({ onCancel, onSubmitSuccess }: ReportSubmissionFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'processing' | 'success' | 'error'>('idle');
    const [operatorId, setOperatorId] = useState<number | null>(null);
    const [uploadedBy, setUploadedBy] = useState<number | null>(null);


    useEffect(() => {
        const token = tokenManager.getToken();
        if (token) {
            try {
                const decoded = jwtDecode<DecodedToken>(token);

                setOperatorId(decoded.operator_id);
                setUploadedBy(decoded.user_id);
            } catch (err) {
                console.error("Invalid token", err);
            }
        }

        setShowInstructions(true);
    }, []);




    // Show instructions dialog on component mount
    useEffect(() => {
        setShowInstructions(true);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.oasis.opendocument.spreadsheet'
            ];

            if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|ods)$/i)) {
                setError('Please upload a valid Excel file (.xlsx or .xls)');
                setSelectedFile(null);
                setUploadStatus('error');
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
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

        if (operatorId === null || uploadedBy === null) {
            setError("Authentication missing. Please log in again.");
            return;
        }

        if (!selectedFile) {
            setError("Please select an Excel file to upload");
            return;
        }

        setIsSubmitting(true);
        setUploadStatus("validating");

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            setUploadStatus("processing");

            await reportsAPI.submitReport(operatorId, uploadedBy, selectedFile);

            setUploadStatus("success");

            try {
                await reportsAPI.notifyAdmins(operatorId);
            } catch (notifyErr) {
                console.error("Failed to notify admins:", notifyErr);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            onSubmitSuccess();
        } catch (err: any) {
            console.error("Submission error:", err);
            setError(err.message || "Failed to submit report");
            setUploadStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusMessage = () => {
        switch (uploadStatus) {
            case 'validating':
                return { text: 'Validating IGJ report file structure...', color: 'blue' };
            case 'processing':
                return { text: 'Processing IGJ regulatory data and metrics...', color: 'blue' };
            case 'success':
                return { text: 'IGJ report submitted successfully!', color: 'green' };
            case 'error':
                return { text: 'Upload failed. Please check the file and try again.', color: 'red' };
            default:
                return null;
        }
    };

    const statusMessage = getStatusMessage();

    return (
        <>
            <ReportInstructionsDialog
                open={showInstructions}
                onOpenChange={setShowInstructions}
            />

            <div className="min-h-screen bg-background py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Button variant="ghost" onClick={onCancel} className="mb-4">
                        <ArrowLeft className="size-4 mr-2" />
                        Back to Dashboard
                    </Button>

                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle>Submit IGJ Monthly Report</CardTitle>
                                    <CardDescription>
                                        Upload your IGJ regulatory report Excel file for compliance
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowInstructions(true)}
                                >
                                    <Info className="size-4 mr-2" />
                                    View Instructions
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* File Upload Area */}
                                <div className="space-y-2">
                                    <Label htmlFor="excel-file">IGJ Report Excel File</Label>
                                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-ring transition-colors">
                                        <input
                                            id="excel-file"
                                            type="file"
                                            accept=".xlsx,.xls,.ods"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <label htmlFor="excel-file" className="cursor-pointer">
                                            {selectedFile ? (
                                                <div className="space-y-3">
                                                    <FileSpreadsheet className="size-12 mx-auto text-green-600" />
                                                    <div>
                                                        <p className="font-medium text-green-900">{selectedFile.name}</p>
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
                                                        <p className="font-medium">Click to upload IGJ report file</p>
                                                        <p className="text-sm text-muted-foreground">or drag and drop</p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Supported formats: .xlsx, .xls (Max 10MB)
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

                                {/* Information Box */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Info className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-1">IGJ Report Processing</p>
                                            <ul className="space-y-1 text-blue-700">
                                                <li>• Your IGJ report will be validated for structure and completeness</li>
                                                <li>• IGJ regulatory data will be automatically processed and metrics calculated</li>
                                                <li>• Report will be submitted to IGJ authority for admin review and approval</li>
                                                <li>• You'll be notified once IGJ report is reviewed</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end pt-4 border-t">
                                    <Button type="button" variant="outline" onClick={onCancel}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || !selectedFile}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="size-4 mr-2" />
                                                Submit IGJ Report
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
