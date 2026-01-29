import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card } from '@/components/ui/card.tsx';
import { ChevronLeft, ChevronRight, FileSpreadsheet, Calendar, BarChart3, Database, CheckCircle } from 'lucide-react';

interface ReportInstructionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Animated Excel Sheet Preview Component
function ExcelSheetPreview({ data, sheetName }: { data: any[][], sheetName: string }) {
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

    return (
        <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg">
            {/* Excel-like header */}
            <div className="bg-green-600 text-white px-3 py-2 flex items-center gap-2 text-sm">
                <FileSpreadsheet className="size-4" />
                <span className="font-medium">{sheetName}</span>
            </div>

            {/* Excel-like grid */}
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

// Animated Master Sheet Preview
function MasterSheetPreview() {
    const [highlightedRow, setHighlightedRow] = useState(0);

    useState(() => {
        const interval = setInterval(() => {
            setHighlightedRow(prev => (prev + 1) % 4);
        }, 1000);

        return () => clearInterval(interval);
    });

    const data = [
        ['Game Type', 'Bet Count', 'Total Stake', 'Total Winnings', 'Levies'],
        ['Sports Betting', '15,234', '$524,890', '$445,230', '$15,932'],
        ['Casino', '23,456', '$789,450', '$645,320', '$28,826'],
        ['Crash Games', '18,932', '$634,220', '$521,840', '$22,476'],
        ['Live Casino', '12,445', '$445,670', '$368,920', '$15,350']
    ];

    return (
        <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg">
            <div className="bg-purple-600 text-white px-3 py-2 flex items-center gap-2 text-sm">
                <Database className="size-4" />
                <span className="font-medium">Master_Data_Summary</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-400">
                        <th className="px-2 py-1 text-left border-r border-gray-300 bg-gray-200 text-gray-600 w-8"></th>
                        {data[0].map((header, i) => (
                            <th key={i} className="px-3 py-2 text-left border-r border-gray-300 font-semibold text-gray-700">
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
                                rowIndex === highlightedRow ? 'bg-yellow-100' : ''
                            }`}
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

export function ReportInstructionsDialog({ open, onOpenChange }: ReportInstructionsDialogProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const dailySheetData = [
        ['Date', 'Stake', 'Winnings', 'GGR', 'DET Levy', 'Gaming Tax', 'NGR After Levy'],
        ['01/11/2025', '$45,230', '$38,450', '$6,780', '$339', '$1,356', '$5,085'],
        ['02/11/2025', '$52,890', '$44,120', '$8,770', '$439', '$1,754', '$6,578'],
        ['03/11/2025', '$48,560', '$39,890', '$8,670', '$434', '$1,734', '$6,503'],
        ['04/11/2025', '$51,230', '$42,340', '$8,890', '$445', '$1,778', '$6,668']
    ];

    const slides = [
        {
            title: 'Welcome to Report Submission',
            icon: <FileSpreadsheet className="size-16 text-indigo-600 mb-4" />,
            content: (
                <div className="space-y-4 text-center">
                    <p className="text-lg">
                        Upload your Excel file with monthly gaming reports
                    </p>
                    <div className="relative mx-auto w-64 h-48 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-pulse">
                                <FileSpreadsheet className="size-24 text-indigo-600 opacity-20" />
                            </div>
                        </div>
                        <div className="relative z-10 bg-white rounded-lg shadow-xl p-6 animate-bounce" style={{ animationDuration: '2s' }}>
                            <FileSpreadsheet className="size-12 text-green-600 mx-auto mb-2" />
                            <p className="text-sm font-medium">Monthly_Report.xlsx</p>
                        </div>
                    </div>
                    <p className="text-gray-600">
                        Follow this guide to ensure your file is formatted correctly
                    </p>
                </div>
            )
        },
        {
            title: 'Daily Report Sheets',
            icon: <Calendar className="size-16 text-blue-600 mb-4" />,
            content: (
                <div className="space-y-4">
                    <p className="text-center">
                        Create <strong>separate sheets</strong> for each gaming product
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { name: 'Sports Betting', icon: 'SB', color: 'bg-blue-500' },
                            { name: 'Casino', icon: 'CS', color: 'bg-purple-500' },
                            { name: 'Crash Games', icon: 'CG', color: 'bg-orange-500' },
                            { name: 'Live Casino', icon: 'LC', color: 'bg-red-500' },
                            { name: 'Poker', icon: 'PK', color: 'bg-green-500' },
                            { name: 'Virtual Sports', icon: 'VS', color: 'bg-indigo-500' }
                        ].map((game, index) => (
                            <div
                                key={game.name}
                                className="relative overflow-hidden"
                                style={{
                                    animation: `slideIn 0.5s ease-out ${index * 0.1}s both`
                                }}
                            >
                                <Card className="p-3 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-indigo-400">
                                    <div className="text-2xl font-bold mb-2 text-gray-600">{game.icon}</div>
                                    <p className="text-xs font-medium text-gray-700">{game.name}</p>
                                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${game.color}`}></div>
                                </Card>
                            </div>
                        ))}
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm">
                        <p className="text-yellow-800">
                            <span className="text-yellow-600 font-bold">Tip:</span> <strong>Example:</strong> "Sports_Betting_Daily", "Casino_Daily", etc.
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
            title: 'Daily Report Format',
            icon: <BarChart3 className="size-16 text-green-600 mb-4" />,
            content: (
                <div className="space-y-4">
                    <p className="text-center text-sm text-gray-600">
                        Each daily sheet should contain these columns with daily transaction data
                    </p>

                    <ExcelSheetPreview
                        data={dailySheetData}
                        sheetName="Sports_Betting_Daily"
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <span className="font-semibold text-blue-900">Date:</span>
                            <span className="text-blue-700 ml-1">DD/MM/YYYY format</span>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                            <span className="font-semibold text-green-900">GGR:</span>
                            <span className="text-green-700 ml-1">Stake - Winnings</span>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded p-2">
                            <span className="font-semibold text-purple-900">DET Levy:</span>
                            <span className="text-purple-700 ml-1">5% of GGR</span>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded p-2">
                            <span className="font-semibold text-orange-900">Gaming Tax:</span>
                            <span className="text-orange-700 ml-1">20% of GGR</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'Master Data Sheets',
            icon: <Database className="size-16 text-purple-600 mb-4" />,
            content: (
                <div className="space-y-4">
                    <p className="text-center text-sm text-gray-600">
                        Include aggregated monthly summaries
                    </p>

                    <MasterSheetPreview />

                    <div className="grid grid-cols-2 gap-3">
                        <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Database className="size-5 text-purple-600" />
                                <h4 className="font-semibold text-purple-900 text-sm">Gaming Products</h4>
                            </div>
                            <ul className="text-xs text-purple-700 space-y-1">
                                <li className="flex items-center gap-2"><span className="text-green-600 font-bold">OK</span> Monthly totals by game type</li>
                                <li className="flex items-center gap-2"><span className="text-green-600 font-bold">OK</span> Bet count, stake, winnings</li>
                                <li className="flex items-center gap-2"><span className="text-green-600 font-bold">OK</span> Calculated levies</li>
                            </ul>
                        </Card>

                        <Card className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Database className="size-5 text-indigo-600" />
                                <h4 className="font-semibold text-indigo-900 text-sm">Balances & Payouts</h4>
                            </div>
                            <ul className="text-xs text-indigo-700 space-y-1">
                                <li className="flex items-center gap-2"><span className="text-green-600 font-bold">OK</span> Opening/closing balances</li>
                                <li className="flex items-center gap-2"><span className="text-green-600 font-bold">OK</span> Total deposits/withdrawals</li>
                                <li className="flex items-center gap-2"><span className="text-green-600 font-bold">OK</span> Net position</li>
                            </ul>
                        </Card>
                    </div>
                </div>
            )
        },
        {
            title: 'Ready to Submit',
            icon: <CheckCircle className="size-16 text-green-600 mb-4" />,
            content: (
                <div className="space-y-4">
                    <p className="text-center font-medium">Verify your file before uploading</p>

                    <div className="space-y-2">
                        {[
                            { label: 'Excel file (.xlsx or .xls)', icon: 'XL', color: 'green' },
                            { label: 'Daily sheets for each game type', icon: 'DL', color: 'blue' },
                            { label: 'All required columns present', icon: 'OK', color: 'purple' },
                            { label: 'Master data sheets included', icon: 'MD', color: 'indigo' },
                            { label: 'Data complete for the month', icon: 'DC', color: 'orange' }
                        ].map((item, index) => (
                            <div
                                key={item.label}
                                className={`flex items-center gap-3 p-3 bg-${item.color}-50 border border-${item.color}-200 rounded-lg transform transition-all hover:scale-102`}
                                style={{
                                    animation: `checkIn 0.4s ease-out ${index * 0.1}s both`
                                }}
                            >
                                <div className="text-xl font-bold text-gray-600">{item.icon}</div>
                                <span className={`text-sm font-medium text-${item.color}-900`}>{item.label}</span>
                                <CheckCircle className={`size-5 text-${item.color}-600 ml-auto`} />
                            </div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-lg p-4 text-center">
                        <p className="text-sm font-medium text-indigo-900">
                            Your file will be validated and processed automatically
                        </p>
                        <p className="text-xs text-indigo-700 mt-1">
                            You'll receive confirmation once submitted for review
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
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-2xl">Excel Report Requirements</DialogTitle>
                    <DialogDescription>
                        Step {currentSlide + 1} of {slides.length}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col min-h-0 py-4">
                    {/* Progress Bar */}
                    <div className="mb-4 flex-shrink-0">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
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
                                        ? 'w-8 bg-indigo-600'
                                        : 'w-2 bg-gray-300'
                                }`}
                            />
                        ))}
                    </div>

                    {currentSlide === slides.length - 1 ? (
                        <Button onClick={handleFinish}>
                            Get Started
                            <CheckCircle className="size-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={nextSlide}>
                            Next
                            <ChevronRight className="size-4 ml-2" />
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}