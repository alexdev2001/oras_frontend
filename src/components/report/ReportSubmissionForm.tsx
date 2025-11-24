import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { reportsAPI } from '@/utils/API.ts';
import { ArrowLeft, Upload, FileSpreadsheet, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { ReportInstructionsDialog } from './ReportInstructionsDialog';
import { Alert, AlertDescription } from '@/components/ui/alert.tsx';
import type {DecodedToken} from "@/types/token.ts";
import {jwtDecode} from "jwt-decode";

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
    const currentDate = new Date();
    const [operatorId, setOperatorId] = useState<number | null>(null);
    const [uploadedBy, setUploadedBy] = useState<number | null>(null);


    useEffect(() => {
        const token = localStorage.getItem("authToken");
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



    const [formData, setFormData] = useState({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
    });

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
        setUploadStatus('validating');

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setUploadStatus('processing');

            await reportsAPI.submitReport(operatorId, uploadedBy, selectedFile);

            setUploadStatus('success');

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
                return { text: 'Validating file structure...', color: 'blue' };
            case 'processing':
                return { text: 'Processing data and calculating metrics...', color: 'blue' };
            case 'success':
                return { text: 'Report submitted successfully!', color: 'green' };
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

            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Button variant="ghost" onClick={onCancel} className="mb-4">
                        <ArrowLeft className="size-4 mr-2" />
                        Back to Dashboard
                    </Button>

                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle>Submit Monthly Report</CardTitle>
                                    <CardDescription>
                                        Upload your unified operator report Excel file
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
                                {/* Period Selection */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="month">Reporting Month</Label>
                                        <Select
                                            value={String(formData.month)}
                                            onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                                    <SelectItem key={month} value={String(month)}>
                                                        {new Date(2000, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="year">Reporting Year</Label>
                                        <Select
                                            value={String(formData.year)}
                                            onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i).map((year) => (
                                                    <SelectItem key={year} value={String(year)}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* File Upload Area */}
                                <div className="space-y-2">
                                    <Label htmlFor="excel-file">Excel Report File</Label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
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
                                                        <p className="text-sm text-gray-500">
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
                                                    <Upload className="size-12 mx-auto text-gray-400" />
                                                    <div>
                                                        <p className="font-medium">Click to upload Excel file</p>
                                                        <p className="text-sm text-gray-500">or drag and drop</p>
                                                    </div>
                                                    <p className="text-xs text-gray-400">
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
                                            <p className="font-medium mb-1">What happens next?</p>
                                            <ul className="space-y-1 text-blue-700">
                                                <li>• Your file will be validated for structure and completeness</li>
                                                <li>• Data will be automatically processed and metrics calculated</li>
                                                <li>• Report will be submitted for admin review and approval</li>
                                                <li>• You'll be notified once the report is reviewed</li>
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
                                                Submit Report
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
