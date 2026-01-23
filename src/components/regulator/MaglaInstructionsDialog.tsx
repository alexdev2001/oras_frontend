import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card } from '@/components/ui/card.tsx';
import { ChevronLeft, ChevronRight, FileSpreadsheet, BarChart3, Database, CheckCircle, Shield } from 'lucide-react';

interface MaglaInstructionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGetStarted?: () => void;
}

// Animated Document Preview Component
function DocumentPreview({ data, fileName, fileType }: { data: any[][], fileName: string, fileType: string }) {
    const [animatedRows, setAnimatedRows] = useState(1);

    useState(() => {
        const interval = setInterval(() => {
            setAnimatedRows(prev => {
                if (prev >= data.length) {
                    return 1;
                }
                return prev + 1;
            });
        }, 600);

        return () => clearInterval(interval);
    });

    const getFileColor = (type: string) => {
        switch (type) {
            case 'pdf': return 'bg-red-600';
            case 'excel': return 'bg-green-600';
            case 'word': return 'bg-blue-600';
            default: return 'bg-gray-600';
        }
    };

    return (
        <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg">
            {/* Document header */}
            <div className={`${getFileColor(fileType)} text-white px-3 py-2 flex items-center gap-2 text-sm`}>
                <FileSpreadsheet className="size-4" />
                <span className="font-medium">{fileName}</span>
            </div>

            {/* Document grid */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-400">
                        <th className="px-2 py-1 text-left border-r border-gray-300 bg-gray-200 text-gray-600 w-8">

                        </th>
                        {data[0]?.map((header, i) => (
                            <th key={i} className="px-3 py-2 text-left border-r border-gray-300 font-semibold text-gray-700 whitespace-nowrap">
                                {header}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {data.slice(1).map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            className={`border-b border-gray-200 transition-all duration-300 ${
                                rowIndex < animatedRows
                                    ? 'opacity-100 translate-y-0'
                                    : 'opacity-0 -translate-y-2'
                            }`}
                            style={{
                                transitionDelay: `${rowIndex * 100}ms`
                            }}
                        >
                            <td className="px-2 py-1 text-center border-r border-gray-300 bg-gray-50 text-gray-500 font-medium">
                                {rowIndex + 2}
                            </td>
                            {row.map((cell, cellIndex) => (
                                <td
                                    key={cellIndex}
                                    className={`px-3 py-2 border-r border-gray-200 ${
                                        cellIndex === 0 ? 'font-medium' : ''
                                    }`}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function MaglaInstructionsDialog({ open, onOpenChange, onGetStarted }: MaglaInstructionsDialogProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const documentData = [
        ['Document Type', 'Reference Number', 'Submission Date', 'Status', 'Compliance Score'],
        ['License Application', 'MAG-2025-001', '15/01/2025', 'Under Review', '95%'],
        ['Monthly Report', 'MAG-2025-002', '20/01/2025', 'Approved', '100%'],
        ['Audit Document', 'MAG-2025-003', '25/01/2025', 'Pending', '88%']
    ];

    const slides = [
        {
            title: 'Welcome to Magla Regulatory Portal',
            icon: <Shield className="size-16 text-blue-600 mb-4" />,
            content: (
                <div className="space-y-4 text-center">
                    <p className="text-lg">
                        Submit your regulatory documents to Magla Gaming Authority
                    </p>
                    <div className="relative mx-auto w-64 h-48 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-pulse">
                                <Shield className="size-24 text-blue-600 opacity-20" />
                            </div>
                        </div>
                        <div className="relative z-10 bg-white rounded-lg shadow-xl p-6 animate-bounce" style={{ animationDuration: '2s' }}>
                            <FileSpreadsheet className="size-12 text-blue-600 mx-auto mb-2" />
                            <p className="text-sm font-medium">Magla_Document.pdf</p>
                        </div>
                    </div>
                    <p className="text-gray-600">
                        Follow this guide to ensure your documents meet Magla requirements
                    </p>
                </div>
            )
        },
        {
            title: 'Accepted Document Types',
            icon: <FileSpreadsheet className="size-16 text-blue-600 mb-4" />,
            content: (
                <div className="space-y-4">
                    <p className="text-center">
                        Magla accepts <strong>multiple document formats</strong> for regulatory compliance
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { name: 'Excel Reports', icon: '📊', color: 'bg-green-500', desc: 'Monthly gaming data' },
                            { name: 'PDF Documents', icon: '📄', color: 'bg-red-500', desc: 'Official certificates' },
                            { name: 'Word Documents', icon: '📝', color: 'bg-blue-500', desc: 'License applications' },
                            { name: 'CSV Files', icon: '📋', color: 'bg-purple-500', desc: 'Raw data exports' }
                        ].map((doc, index) => (
                            <div
                                key={doc.name}
                                className="relative overflow-hidden"
                                style={{
                                    animation: `slideIn 0.5s ease-out ${index * 0.1}s both`
                                }}
                            >
                                <Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-400">
                                    <div className="text-3xl mb-2">{doc.icon}</div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">{doc.name}</p>
                                    <p className="text-xs text-gray-500">{doc.desc}</p>
                                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${doc.color}`}></div>
                                </Card>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm">
                        <p className="text-blue-800">
                            💡 <strong>Tip:</strong> PDF files are preferred for official documents, Excel for data reports
                        </p>
                    </div>

                    <style>{`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
                </div>
            )
        },
        {
            title: 'Document Requirements',
            icon: <BarChart3 className="size-16 text-blue-600 mb-4" />,
            content: (
                <div className="space-y-4">
                    <p className="text-center text-sm text-gray-600">
                        Each document must include specific regulatory information
                    </p>

                    <DocumentPreview
                        data={documentData}
                        fileName="Magla_Submission_Register.xlsx"
                        fileType="excel"
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <span className="font-semibold text-blue-900">Reference:</span>
                            <span className="text-blue-700 ml-1">Unique MAG number</span>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                            <span className="font-semibold text-green-900">Status:</span>
                            <span className="text-green-700 ml-1">Submission progress</span>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded p-2">
                            <span className="font-semibold text-purple-900">Compliance:</span>
                            <span className="text-purple-700 ml-1">Score 0-100%</span>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded p-2">
                            <span className="font-semibold text-orange-900">File Size:</span>
                            <span className="text-orange-700 ml-1">Max 15MB</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'Magla Compliance Standards',
            icon: <Database className="size-16 text-blue-600 mb-4" />,
            content: (
                <div className="space-y-4">
                    <p className="text-center text-sm text-gray-600">
                        Documents must meet Magla Gaming Authority standards
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Database className="size-5 text-blue-600" />
                                <h4 className="font-semibold text-blue-900 text-sm">Data Requirements</h4>
                            </div>
                            <ul className="text-xs text-blue-700 space-y-1">
                                <li>✓ Complete monthly coverage</li>
                                <li>✓ All gaming products included</li>
                                <li>✓ Accurate financial calculations</li>
                                <li>✓ Regulatory compliance fields</li>
                            </ul>
                        </Card>

                        <Card className="p-3 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="size-5 text-red-600" />
                                <h4 className="font-semibold text-red-900 text-sm">Security Standards</h4>
                            </div>
                            <ul className="text-xs text-red-700 space-y-1">
                                <li>✓ Encrypted submissions</li>
                                <li>✓ Digital signatures</li>
                                <li>✓ Audit trail maintained</li>
                                <li>✓ Data integrity verified</li>
                            </ul>
                        </Card>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm">
                        <p className="text-yellow-800">
                            ⚠️ <strong>Important:</strong> All submissions are automatically validated against Magla standards
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: 'Ready to Submit',
            icon: <CheckCircle className="size-16 text-blue-600 mb-4" />,
            content: (
                <div className="space-y-4">
                    <p className="text-center font-medium">Verify your document before uploading</p>

                    <div className="space-y-2">
                        {[
                            { label: 'Valid file format (PDF, Excel, Word, CSV)', icon: '📄', color: 'blue' },
                            { label: 'File size under 15MB', icon: '📏', color: 'indigo' },
                            { label: 'All required fields completed', icon: '✅', color: 'green' },
                            { label: 'Regulatory compliance standards met', icon: '🛡️', color: 'red' },
                            { label: 'Document properly signed/authorized', icon: '🖋️', color: 'purple' }
                        ].map((item, index) => (
                            <div
                                key={item.label}
                                className={`flex items-center gap-3 p-3 bg-${item.color}-50 border border-${item.color}-200 rounded-lg transform transition-all hover:scale-102`}
                                style={{
                                    animation: `checkIn 0.4s ease-out ${index * 0.1}s both`
                                }}
                            >
                                <div className="text-2xl">{item.icon}</div>
                                <span className={`text-sm font-medium text-${item.color}-900`}>{item.label}</span>
                                <CheckCircle className={`size-5 text-${item.color}-600 ml-auto`} />
                            </div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                        <p className="text-sm font-medium text-blue-900">
                            Your document will be validated and processed by Magla Gaming Authority
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                            You'll receive confirmation once submitted for regulatory review
                        </p>
                    </div>

                    <style>{`
            @keyframes checkIn {
              from {
                opacity: 0;
                transform: translateX(-20px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
                </div>
            )
        }
    ];

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const handleFinish = () => {
        onOpenChange(false);
        setCurrentSlide(0);
        onGetStarted?.();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-2xl">Magla Regulatory Requirements</DialogTitle>
                    <DialogDescription>
                        Step {currentSlide + 1} of {slides.length}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col min-h-0 py-4">
                    {/* Progress Bar */}
                    <div className="mb-4 flex-shrink-0">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Slide Content */}
                    <div className="flex-1 overflow-y-auto min-h-0 px-1">
                        <div className="flex flex-col items-center text-center mb-4">
                            {slides[currentSlide].icon}
                            <h3 className="text-xl font-medium mb-3">{slides[currentSlide].title}</h3>
                        </div>
                        <div className="text-left">
                            {slides[currentSlide].content}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
                    <Button
                        variant="outline"
                        onClick={prevSlide}
                        disabled={currentSlide === 0}
                    >
                        <ChevronLeft className="size-4 mr-2" />
                        Previous
                    </Button>

                    <div className="flex gap-1">
                        {slides.map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 rounded-full transition-all ${
                                    index === currentSlide
                                        ? 'w-8 bg-blue-600'
                                        : 'w-2 bg-gray-300'
                                }`}
                            />
                        ))}
                    </div>

                    {currentSlide === slides.length - 1 ? (
                        <Button onClick={handleFinish} className="bg-blue-600 hover:bg-blue-700">
                            Get Started
                            <CheckCircle className="size-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={nextSlide} className="bg-blue-600 hover:bg-blue-700">
                            Next
                            <ChevronRight className="size-4 ml-2" />
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
