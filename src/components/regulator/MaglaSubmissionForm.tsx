import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { reportsAPI, managementAPI } from '@/utils/API.ts';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Info, FileText } from 'lucide-react';
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
    const [operators, setOperators] = useState<any[]>([]);
    const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
    const [showInstructions, setShowInstructions] = useState(false);

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
                console.log('Loading operators...');
                const operatorsData = await managementAPI.getOperators();
                console.log('Operators loaded:', operatorsData);
                setOperators(operatorsData);
            } catch (error) {
                console.error('Failed to load operators:', error);
            }
        };

        loadOperators();
    }, []);

    // Debug operators state
    useEffect(() => {
        console.log('Operators state updated:', operators);
    }, [operators]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type for Magla regulator (Excel files only for parsing)
            const validTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];

            if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|xls)$/i)) {
                setError('Please upload a valid Excel file (.xlsx, .xls) - required for data parsing');
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

        if (!month || !selectedFile || !selectedOperatorId) {
            setError("Please select a reporting month, operator, and upload a file.");
            return;
        }

        setIsSubmitting(true);
        setUploadStatus("validating");

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setUploadStatus("processing");

            // Use the new submitReport function with the updated backend structure
            const response = await reportsAPI.submitReport(parseInt(selectedOperatorId), uploadedBy, selectedFile, month);
            
            if (response !== null) {
                setUploadStatus("success");
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Reset form and close dialog
                setMonth('');
                setSubmissionType('online');
                setSelectedOperatorId('');
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
            setSelectedOperatorId('');
            setSelectedFile(null);
            setUploadStatus('idle');
            setError('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background text-foreground border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Upload className="w-4 h-4 text-blue-600" />
                        </div>
                        Submit Document
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
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

                    {/* Operator Selection */}
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

                    {/* Submission Type */}
                    <div className="space-y-2">
                        <Label>Submission Type *</Label>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 text-foreground">
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

                            <label className="flex items-center gap-2 text-foreground">
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
                                accept=".xlsx,.xls"
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
                                            Excel files only (.xlsx, .xls) - Required for data parsing (Max 15MB)
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

                    {/* Instructions Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">File Requirements & Instructions</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowInstructions(!showInstructions)}
                                className="flex items-center gap-2"
                            >
                                <Info className="size-4" />
                                {showInstructions ? 'Hide' : 'Show'} Instructions
                            </Button>
                        </div>
                        
                        {showInstructions && (
                            <div className="bg-muted/50 rounded-lg p-4 space-y-4 text-sm">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-2">
                                        <FileText className="size-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-blue-900">Required File Type</p>
                                            <p className="text-muted-foreground">Excel files (.xlsx, .xls) only. The system will automatically parse the data from specific sheets.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-2">
                                        <FileSpreadsheet className="size-4 mt-0.5 text-green-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-green-900">Required Sheets</p>
                                            <p className="text-muted-foreground mb-2">Your Excel file must contain exactly these two sheets:</p>
                                            <div className="bg-background rounded p-3 space-y-1">
                                                <p><strong>1. "Master Data - Balances"</strong> - Contains player balance information</p>
                                                <p><strong>2. "Master Data - Online"</strong> - Contains betting metrics and game breakdown</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-2">
                                        <Info className="size-4 mt-0.5 text-orange-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-orange-900">Master Data - Online Sheet Structure</p>
                                            <p className="text-muted-foreground mb-2">This sheet should follow this structure with exact column names:</p>
                                            <div className="bg-background rounded p-3">
                                                <p className="font-medium mb-2">Required Columns (in order):</p>
                                                <ul className="space-y-1 text-xs">
                                                    <li>• <strong>Game Type</strong></li>
                                                    <li>• <strong>First Ticket #</strong></li>
                                                    <li>• <strong>Last Ticket #</strong></li>
                                                    <li>• <strong>Bet Count #</strong></li>
                                                    <li>• <strong>Pending/Unsettled Bets #</strong></li>
                                                    <li>• <strong>Cancelled Bets #</strong></li>
                                                    <li>• <strong>Sales/Stake</strong></li>
                                                    <li>• <strong>Total Winnings</strong></li>
                                                    <li>• <strong>Total Payouts</strong></li>
                                                    <li>• <strong>Stake of Winnings</strong></li>
                                                    <li>• <strong>Winnings count</strong></li>
                                                    <li>• <strong>GGR</strong></li>
                                                    <li>• <strong>GGR%</strong></li>
                                                    <li>• <strong>D.E.T.</strong></li>
                                                    <li>• <strong>Gaming Tax</strong></li>
                                                    <li>• <strong>NGR after DET & Levy</strong></li>
                                                    <li>• <strong>Total winnings {'>'}100k</strong></li>
                                                    <li>• <strong>Stake of Winnings {'>'}100k</strong></li>
                                                    <li>• <strong>Total winnings {'>'}100k Count</strong></li>
                                                    <li>• <strong>WHT on Winnings (winnings {'>'}100k)</strong></li>
                                                    <li>• <strong>Commission paid</strong></li>
                                                    <li>• <strong>Net Gaming Revenue (after WHT & commission)</strong></li>
                                                </ul>
                                                <p className="mt-3 text-xs text-muted-foreground">The last row should contain totals/summary data.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-2">
                                        <Info className="size-4 mt-0.5 text-purple-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-purple-900">Master Data - Balances Sheet Structure</p>
                                            <p className="text-muted-foreground mb-2">This sheet should have:</p>
                                            <div className="bg-background rounded p-3 space-y-1">
                                                <p>• A row where column "Unnamed: 2" contains "MWK"</p>
                                                <p>• <strong>Opening Balances Players (from Previous month)</strong> column</p>
                                                <p>• <strong>Closing Balances Players</strong> column</p>
                                                <p className="text-xs text-muted-foreground mt-2">Header should start at row 6 (as per Excel standard)</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-2">
                                        <Upload className="size-4 mt-0.5 text-indigo-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-indigo-900">How to Complete This Form</p>
                                            <div className="bg-background rounded p-3 space-y-2">
                                                <p><strong>1. Select Reporting Month:</strong> Choose the month this report covers using the month picker in this form.</p>
                                                <p><strong>2. Select Operator:</strong> Choose the operator this report belongs to from the dropdown list in this form.</p>
                                                <p><strong>3. Choose Submission Type:</strong> Select "Online" or "Offline" based on the betting channel.</p>
                                                <p><strong>4. Upload File:</strong> Upload your Excel file with the required sheets and columns as specified above. <strong>Only Excel documents (.xlsx, .xls) are allowed.</strong></p>
                                                <p><strong>5. Submit:</strong> Review and submit the report for processing.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

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
                            disabled={isSubmitting || !selectedFile || !month || !selectedOperatorId}
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
