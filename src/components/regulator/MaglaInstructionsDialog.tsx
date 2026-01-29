import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card } from '@/components/ui/card.tsx';
import { ChevronLeft, ChevronRight, FileSpreadsheet, BarChart3, Database, CheckCircle, Shield, Calendar, Building, TrendingUp } from 'lucide-react';

interface MaglaInstructionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGetStarted?: () => void;
}

export function MaglaInstructionsDialog({ open, onOpenChange, onGetStarted }: MaglaInstructionsDialogProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            title: 'Welcome to Magla Regulatory Portal',
            icon: <Shield className="size-16 text-blue-600 mb-4" />,
            content: (
                <div className="space-y-4 text-center">
                    <p className="text-lg">
                        Submit your regulatory documents to the system
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
                        Magla accepts <strong>Excel files only</strong> for regulatory compliance
                    </p>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="relative overflow-hidden">
                            <Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-400">
                                <div className="text-3xl mb-2 font-bold text-blue-600">XL</div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Excel Files Only</p>
                                <p className="text-xs text-gray-500">(.xlsx, .xls) - Required for data parsing</p>
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500"></div>
                            </Card>
                        </div>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm">
                        <p className="text-blue-800">
                            <span className="text-blue-600 font-bold">Tip:</span> <strong>Important:</strong> Only Excel files are accepted because the system automatically parses data from specific sheets and columns
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: 'Excel Sheet Requirements',
            icon: <BarChart3 className="size-16 text-blue-600 mb-4" />,
            content: (
                <div className="space-y-4">
                    <p className="text-center text-sm text-gray-600">
                        Your Excel file must contain at least these three sheets
                    </p>

                    <div className="grid grid-cols-1 gap-6">
                        <Card className="p-4 border-2 border-purple-200">
                            <div className="flex items-center gap-2 mb-3">
                                <FileSpreadsheet className="size-5 text-purple-600" />
                                <h4 className="font-semibold text-purple-900">Master Data - Sports Betting</h4>
                            </div>
                            
                            <div className="bg-white rounded border border-gray-300 overflow-hidden">
                                <div className="bg-green-700 text-white px-3 py-2 text-xs font-bold text-center">
                                    FINANCIAL MONTHLY REPORT
                                </div>
                                <div className="bg-green-600 text-white px-3 py-1 text-xs font-semibold text-center">
                                    SPORT BETTING - MONTHLY SUMMARY
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs min-w-max">
                                        <thead>
                                            <tr className="bg-green-600 text-white">
                                                <th className="border border-green-700 px-1 py-1 text-left font-medium text-xs">Game Type</th>
                                                <th className="border border-green-700 px-1 py-1 text-center font-medium text-xs">First Ticket #</th>
                                                <th className="border border-green-700 px-1 py-1 text-center font-medium text-xs">Last Ticket #</th>
                                                <th className="border border-green-700 px-1 py-1 text-center font-medium text-xs">Bet Count #</th>
                                                <th className="border border-green-700 px-1 py-1 text-center font-medium text-xs">Pending / Unsettled Bets #</th>
                                                <th className="border border-green-700 px-1 py-1 text-center font-medium text-xs">Cancelled Bets #</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Total Sales</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Total Winnings</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Total Payouts</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Stake of Winnings</th>
                                                <th className="border border-green-700 px-1 py-1 text-center font-medium text-xs">Winnings count #</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">GGR</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">GGR%</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">D.E.T.</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Gaming Tax</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">NGR after DET & Levy</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Total winnings {'>'}100k</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Stake of Winnings {'>'}100k</th>
                                                <th className="border border-green-700 px-1 py-1 text-center font-medium text-xs">Total winnings {'>'}100k Count</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">WHT on Winnings ({'>'}100k)</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Commission paid</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Net Gaming Revenue (after WHT & commission)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="bg-white">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">Sports Betting</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">30,464,106.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">106,919,169.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">1,377,411.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">152,332.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">1,021.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">1,914,193,332.75</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">1,539,399,435.50</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">1,539,399,435.50</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">996,520,443.66</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">510,336.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">374,793,897.25</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">19%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">56,219,084.59</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">46,849,237.16</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">271,725,575.50</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">418,213,981.36</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">115,999,999.99</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">2,456.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">41,821,398.14</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">12,345,678.90</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">217,558,498.46</td>
                                            </tr>
                                            <tr className="bg-green-50">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">SOLIDOON (VIRTUAL & RAPID)</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-white">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">COLOR & FIND</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-green-50">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">LUSSO</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-white">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">INSTANT Games</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-green-50">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">ZONGO</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-white">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">Crash Games</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-green-50">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">Play and Pay</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-blue-900 text-white font-bold">
                                                <td className="border border-green-700 px-1 py-1 text-left">Total</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">30,464,106.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">106,919,169.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">1,377,411.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">152,332.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">1,021.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">1,914,193,332.75</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">1,539,399,435.50</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">1,539,399,435.50</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">996,520,443.66</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">510,336.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">374,793,897.25</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">19%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">56,219,084.59</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">46,849,237.16</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">271,725,575.50</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">418,213,981.36</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">115,999,999.99</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">2,456.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">41,821,398.14</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">12,345,678.90</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">217,558,498.46</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="mt-3 space-y-1">
                                <p className="text-xs text-purple-700"><span className="text-green-600 font-bold">OK</span> Sport betting sheet with green header format</p>
                                <p className="text-xs text-purple-700"><span className="text-green-600 font-bold">OK</span> All 22 columns required exactly as shown</p>
                                <p className="text-xs text-purple-700"><span className="text-green-600 font-bold">OK</span> Game types: Sports Betting, SOLIDOON, COLOR & FIND, LUSSO, INSTANT Games, ZONGO, Crash Games, Play and Pay</p>
                                <p className="text-xs text-purple-700"><span className="text-green-600 font-bold">OK</span> Total row with dark blue background</p>
                            </div>
                        </Card>

                        <Card className="p-4 border-2 border-green-200">
                            <div className="flex items-center gap-2 mb-3">
                                <FileSpreadsheet className="size-5 text-green-600" />
                                <h4 className="font-semibold text-green-900">Master Data - Online</h4>
                            </div>
                            
                            <div className="bg-white rounded border border-gray-300 overflow-hidden">
                                <div className="bg-green-700 text-white px-3 py-2 text-xs font-bold text-center">
                                    FINANCIAL MONTHLY REPORT - ONLINE BETTING
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs min-w-max">
                                        <thead>
                                            <tr className="bg-green-600 text-white">
                                                <th className="border border-green-700 px-1 py-1 text-left font-medium text-xs">Game Type</th>
                                                <th className="border border-green-700 px-1 py-1 text-center font-medium text-xs">First Ticket #</th>
                                                <th className="border border-green-700 px-1 py-1 text-center font-medium text-xs">Last Ticket #</th>
                                                <th className="border border-green-700 px-1 py-1 text-center font-medium text-xs">Bet Count #</th>
                                                <th className="border border-green-700 px-1 py-1 text-center font-medium text-xs">Pending/Unsettled Bets #</th>
                                                <th className="border border-green-700 px-1 py-1 text-center font-medium text-xs">Cancelled Bets #</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Sales/Stake</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Total Winnings</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Total Payouts</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Stake of Winnings</th>
                                                <th className="border border-green-700 px-1 py-1 text-center font-medium text-xs">Winnings count</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">GR</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">GGR%</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">D.E.T.</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Gaming Tax</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">MGR after DET & Levy</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Total winnings {'>'}100k</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Stake of Winnings {'>'}100k</th>
                                                <th className="border border-green-700 px-1 py-1 text-center font-medium text-xs">Total winnings {'>'}100k Count</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">WHT on Winnings (winnings {'>'}100k)</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Commission paid</th>
                                                <th className="border border-green-700 px-1 py-1 text-right font-medium text-xs">Net Gaming Revenue (after WHT & commission)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="bg-white">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">Online Sportsbook</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">30,464,106.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">106,919,169.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">45,678.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">152,332.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">1,021.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">2,345,678.90</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">1,987,654.32</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">1,987,654.32</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">996,520.44</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">510,336.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">358,024.58</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">15.27%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">35,802.46</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">71,604.92</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">250,617.20</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">418,213.98</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">115,999.99</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">2,456.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">41,821.39</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">12,345.67</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">196,450.14</td>
                                            </tr>
                                            <tr className="bg-gray-50">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">Online Casino</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">123,456.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">5,678,901.23</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">5,123,456.78</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">5,123,456.78</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">2,561,728.39</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">256,789.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">555,444.45</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">9.78%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">55,544.44</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">111,088.89</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">388,811.12</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">8,765.43</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">380,045.69</td>
                                            </tr>
                                            <tr className="bg-white">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">Online Affiliates</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-blue-900 text-white font-bold">
                                                <td className="border border-green-700 px-1 py-1 text-left">Total</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">30,464,106.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">106,919,169.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">169,134.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">152,332.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">1,021.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">8,024,580.13</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">7,111,111.10</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">7,111,111.10</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">3,558,248.83</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">767,125.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">913,469.03</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">11.38%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">91,346.90</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">182,693.81</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">639,428.32</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">418,213.98</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">115,999.99</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">2,456.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">41,821.39</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">21,111.10</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">576,495.83</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="mt-3 space-y-1">
                                <p className="text-xs text-green-700"><span className="text-green-600 font-bold">OK</span> All 22 columns required, green header format</p>
                                <p className="text-xs text-green-700"><span className="text-green-600 font-bold">OK</span> Game types with totals row (dark blue)</p>
                            </div>
                        </Card>

                        <Card className="p-4 border-2 border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                                <FileSpreadsheet className="size-5 text-blue-600" />
                                <h4 className="font-semibold text-blue-900">Master Data - Balances</h4>
                            </div>
                            
                            <div className="bg-white rounded border border-gray-300 overflow-hidden">
                                <div className="bg-green-700 text-white px-3 py-2 text-xs font-bold text-center">
                                    TOTAL BALANCE - MONTHLY SUMMARY
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs min-w-max">
                                        <thead>
                                            <tr className="bg-green-600 text-white">
                                                <th className="border border-green-700 px-2 py-1 text-left font-medium text-xs">Opening Balances Players (from Previous month)</th>
                                                <th className="border border-green-700 px-2 py-1 text-right font-medium text-xs">Deposit for the month</th>
                                                <th className="border border-green-700 px-2 py-1 text-right font-medium text-xs">Withdrawals for the month</th>
                                                <th className="border border-green-700 px-2 py-1 text-right font-medium text-xs">Closing Balances Players</th>
                                                <th className="border border-green-700 px-2 py-1 text-right font-medium text-xs">Total Bank balances End of the period</th>
                                                <th className="border border-green-700 px-2 py-1 text-right font-medium text-xs">Total Cash balances End of the period</th>
                                                <th className="border border-green-700 px-2 py-1 text-right font-medium text-xs">Total MoMo (collection) balances End of the period</th>
                                                <th className="border border-green-700 px-2 py-1 text-right font-medium text-xs">Total MoMo (disbursement) balances End of the period</th>
                                                <th className="border border-green-700 px-2 py-1 text-right font-medium text-xs">Total MoMo (agents collection) balances End of the period</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="bg-yellow-50">
                                                <td className="border border-green-700 px-2 py-1 font-bold text-orange-700">MWK</td>
                                                <td className="border border-green-700 px-2 py-1 text-right">1,234,567,890.12</td>
                                                <td className="border border-green-700 px-2 py-1 text-right">987,654,321.09</td>
                                                <td className="border border-green-700 px-2 py-1 text-right">876,543,210.98</td>
                                                <td className="border border-green-700 px-2 py-1 text-right">1,345,678,901.23</td>
                                                <td className="border border-green-700 px-2 py-1 text-right">123,456,789.01</td>
                                                <td className="border border-green-700 px-2 py-1 text-right">234,567,890.12</td>
                                                <td className="border border-green-700 px-2 py-1 text-right">345,678,901.23</td>
                                                <td className="border border-green-700 px-2 py-1 text-right">456,789,012.34</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">374,793,897.25</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">19%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">56,219,084.59</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">46,849,237.16</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">271,725,575.50</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">418,213,981.36</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">115,999,999.99</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">2,456.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">41,821,398.14</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">12,345,678.90</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">217,558,498.46</td>
                                            </tr>
                                            <tr className="bg-green-50">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">SOLIDOON (VIRTUAL & RAPID)</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-white">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">COLOR & FIND</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-green-50">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">LUSSO</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-white">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">INSTANT Games</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-green-50">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">ZONGO</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-white">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">Crash Games</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-green-50">
                                                <td className="border border-green-700 px-1 py-1 text-left font-medium">Play and Pay</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">0.00</td>
                                            </tr>
                                            <tr className="bg-blue-900 text-white font-bold">
                                                <td className="border border-green-700 px-1 py-1 text-left">Total</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">30,464,106.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">106,919,169.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">1,377,411.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">152,332.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">1,021.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">1,914,193,332.75</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">1,539,399,435.50</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">1,539,399,435.50</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">996,520,443.66</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">510,336.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">374,793,897.25</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">19%</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">56,219,084.59</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">46,849,237.16</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">271,725,575.50</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">418,213,981.36</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">115,999,999.99</td>
                                                <td className="border border-green-700 px-1 py-1 text-center">2,456.00</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">41,821,398.14</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">12,345,678.90</td>
                                                <td className="border border-green-700 px-1 py-1 text-right">217,558,498.46</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="mt-3 space-y-1">
                                <p className="text-xs text-purple-700"><span className="text-green-600 font-bold">OK</span> Sport betting sheet with green header format</p>
                                <p className="text-xs text-purple-700"><span className="text-green-600 font-bold">OK</span> All 22 columns required exactly as shown</p>
                                <p className="text-xs text-purple-700"><span className="text-green-600 font-bold">OK</span> Game types: Sports Betting, SOLIDOON, COLOR & FIND, LUSSO, INSTANT Games, ZONGO, Crash Games, Play and Pay</p>
                                <p className="text-xs text-purple-700"><span className="text-green-600 font-bold">OK</span> Total row with dark blue background</p>
                            </div>
                        </Card>
                    </div>

                    <div className="bg-orange-50 border-l-4 border-orange-400 p-3 text-sm">
                        <p className="text-orange-800">
                            <span className="text-orange-600 font-bold">!</span> <strong>Important:</strong> Column names must match exactly. The system parses data automatically.
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: 'Taxation Update',
            icon: <TrendingUp className="size-16 text-blue-600 mb-4" />,
            content: (
                <div className="space-y-6">
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Taxation on Winnings Updated
                        </h3>
                        <p className="text-lg text-blue-600 font-semibold">
                            Now 15% on all winnings
                        </p>
                    </div>

                    <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
                        <div className="mb-4">
                            <p className="text-sm font-medium text-gray-600 mb-4 text-center">Excel Column Header Animation</p>
                            
                            {/* Excel Table Simulation */}
                            <div className="bg-gray-50 border border-gray-300 rounded overflow-hidden">
                                <div className="bg-green-700 text-white px-3 py-2">
                                    <div className="text-xs font-bold text-center">SPORT BETTING - MONTHLY SUMMARY</div>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-green-600 text-white">
                                                <th className="border border-green-700 px-2 py-1 text-left">Game Type</th>
                                                <th className="border border-green-700 px-2 py-1 text-right">Total Sales</th>
                                                <th className="border border-green-700 px-2 py-1 text-right">Total Winnings</th>
                                                <th className="border border-green-700 px-2 py-1 text-right">
                                                    <span 
                                                        className="inline-block transition-all duration-500"
                                                        style={{
                                                            animation: 'headerChange 4s infinite'
                                                        }}
                                                    >
                                                        WHT on Winnings ({'>'}100k)
                                                    </span>
                                                </th>
                                                <th className="border border-green-700 px-2 py-1 text-right">Net Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="bg-white">
                                                <td className="border border-green-700 px-2 py-1">Sports Betting</td>
                                                <td className="border border-green-700 px-2 py-1 text-right">1,914,193,332.75</td>
                                                <td className="border border-green-700 px-2 py-1 text-right">1,539,399,435.50</td>
                                                <td className="border border-green-700 px-2 py-1 text-right">
                                                    <span 
                                                        className="inline-block font-bold text-red-600 transition-all duration-500"
                                                        style={{
                                                            animation: 'taxRateChange 4s infinite'
                                                        }}
                                                    >
                                                        41,821,398.14
                                                    </span>
                                                </td>
                                                <td className="border border-green-700 px-2 py-1 text-right">217,558,498.46</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                            <h4 className="font-semibold text-blue-900 mb-2">Key Changes:</h4>
                            <ul className="space-y-2 text-sm text-blue-800">
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    <span>Tax rate on winnings increased to 15%</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    <span>Column header shows the change during animation</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    <span>Update your Excel calculations accordingly</span>
                                </li>
                            </ul>
                        </div>

                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Important:</strong> Ensure your Excel files reflect the new 15% tax rate for accurate reporting.
                            </p>
                        </div>
                    </div>

                    <style>{`
            @keyframes headerChange {
              0%, 20% { 
                opacity: 1; 
                color: white;
              }
              30% {
                opacity: 0.5;
                color: #fbbf24;
              }
              40%, 60% { 
                opacity: 1; 
                color: #10b981;
                font-weight: bold;
              }
              70% {
                opacity: 0.8;
                color: white;
              }
              80%, 100% { 
                opacity: 1; 
                color: white;
              }
            }
            
            @keyframes taxRateChange {
              0%, 20% { 
                opacity: 1; 
                color: #dc2626;
              }
              30% {
                opacity: 0.5;
                transform: scale(0.95);
              }
              40%, 60% { 
                opacity: 1; 
                color: #10b981;
                font-weight: bold;
                transform: scale(1.1);
              }
              70% {
                opacity: 0.8;
                color: #dc2626;
                transform: scale(1);
              }
              80%, 100% { 
                opacity: 1; 
                color: #dc2626;
              }
            }
          `}</style>
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

                    <div className="flex justify-center">
                        <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 max-w-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Database className="size-5 text-blue-600" />
                                <h4 className="font-semibold text-blue-900 text-sm">Data Requirements</h4>
                            </div>
                            <ul className="text-xs text-blue-700 space-y-1">
                                <li className="flex items-center gap-2"><span className="text-green-600 font-bold">OK</span> Complete monthly coverage</li>
                                <li className="flex items-center gap-2"><span className="text-green-600 font-bold">OK</span> All gaming products included</li>
                                <li className="flex items-center gap-2"><span className="text-green-600 font-bold">OK</span> Accurate financial calculations</li>
                                <li className="flex items-center gap-2"><span className="text-green-600 font-bold">OK</span> Regulatory compliance fields</li>
                            </ul>
                        </Card>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm">
                        <p className="text-yellow-800">
                            <span className="text-orange-600 font-bold">!</span> <strong>Important:</strong> All submissions are automatically validated against Magla standards
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: '1. Select Reporting Month',
            icon: <Calendar className="size-16 text-blue-600 mb-4" />,
            content: (
                <div className="space-y-4">
                    <p className="text-center text-sm text-gray-600">
                        Choose the month your report covers
                    </p>

                    <div className="flex justify-center">
                        <div className="relative">
                            {/* Form Field Animation */}
                            <div className="bg-white rounded-lg shadow-lg border-2 border-gray-300 p-6 w-80">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Month</label>
                                <div className="relative">
                                    <div 
                                        className="w-full p-3 border-2 border-blue-300 rounded-lg bg-blue-50 cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-100 animate-pulse"
                                        style={{ animationDuration: '3s' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-700 font-medium">January 2026</span>
                                            <Calendar className="size-5 text-blue-600" />
                                        </div>
                                    </div>
                                    
                                    {/* Animated Click Indicator */}
                                    <div 
                                        className="absolute top-1/2 right-4 transform -translate-y-1/2 pointer-events-none"
                                        style={{
                                            animation: 'clickAnimation 3s infinite'
                                        }}
                                    >
                                        <div className="bg-blue-600 rounded-full p-1 shadow-lg">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Calendar Popup Animation */}
                                <div 
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border-2 border-blue-200 p-4 z-10"
                                    style={{
                                        animation: 'calendarPopup 3s infinite'
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <ChevronLeft className="size-4 text-gray-400" />
                                        <h5 className="font-semibold text-gray-800 text-sm">January 2026</h5>
                                        <ChevronRight className="size-4 text-gray-400" />
                                    </div>
                                    
                                    <div className="grid grid-cols-7 gap-1 text-xs text-center mb-1">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                            <div key={i} className="font-semibold text-gray-600 p-1">{day}</div>
                                        ))}
                                    </div>
                                    
                                    <div className="grid grid-cols-7 gap-1 text-xs text-center">
                                        {Array.from({ length: 31 }, (_, i) => (
                                            <div
                                                key={i}
                                                className={`p-1 rounded cursor-pointer transition-all ${
                                                    i === 14 ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                                                }`}
                                            >
                                                {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm">
                        <p className="text-blue-800">
                            <span className="text-blue-600 font-bold">CAL</span> <strong>How to select:</strong> Click the month field in the form to open the calendar picker, then choose your reporting period
                        </p>
                    </div>

                    <style>{`
            @keyframes clickAnimation {
              0%, 70%, 100% { 
                opacity: 0; 
                transform: translate(-10px, -50%) scale(0.8);
              }
              80% { 
                opacity: 1; 
                transform: translate(0, -50%) scale(1);
              }
            }
            
            @keyframes calendarPopup {
              0%, 70% { 
                opacity: 0; 
                transform: translateY(-10px) scale(0.9);
              }
              80%, 100% { 
                opacity: 1; 
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
                </div>
            )
        },
        {
            title: '2. Select Operator',
            icon: <Building className="size-16 text-blue-600 mb-4" />,
            content: (
                <div className="space-y-4">
                    <p className="text-center text-sm text-gray-600">
                        Choose the operator for this report
                    </p>

                    <div className="flex justify-center">
                        <div className="relative">
                            {/* Animated Dropdown */}
                            <div className="bg-white rounded-lg shadow-lg border-2 border-green-200 w-80">
                                <div className="p-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Operator</label>
                                    <div className="relative">
                                        <select className="w-full p-3 border-2 border-gray-300 rounded-lg appearance-none bg-white text-gray-700 cursor-pointer hover:border-green-400 transition-colors">
                                            <option>Choose an operator...</option>
                                            <option>BetMall Malawi Ltd</option>
                                            <option>Premier Bet Malawi</option>
                                            <option>SportPesa Malawi</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                            <ChevronRight className="size-5 text-gray-400 transform rotate-90" />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Animated Operator Cards */}
                                <div className="border-t border-gray-200 p-4 space-y-2">
                                    {[
                                        { name: 'BetMall Malawi Ltd', status: 'Active', color: 'green' },
                                        { name: 'Premier Bet Malawi', status: 'Active', color: 'blue' },
                                        { name: 'SportPesa Malawi', status: 'Active', color: 'purple' }
                                    ].map((operator, index) => (
                                        <div
                                            key={operator.name}
                                            className={`flex items-center justify-between p-3 bg-${operator.color}-50 border border-${operator.color}-200 rounded-lg cursor-pointer hover:shadow-md transition-all`}
                                            style={{
                                                animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Building className={`size-4 text-${operator.color}-600`} />
                                                <span className={`text-sm font-medium text-${operator.color}-900`}>{operator.name}</span>
                                            </div>
                                            <span className={`text-xs px-2 py-1 bg-${operator.color}-600 text-white rounded-full`}>
                                                {operator.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Animated Pointer */}
                            <div className="absolute -top-2 -right-2 animate-bounce" style={{ animationDuration: '2.5s' }}>
                                <div className="bg-green-600 text-white rounded-full p-2 shadow-lg">
                                    <Building className="size-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 border-l-4 border-green-400 p-3 text-sm">
                        <p className="text-green-800">
                            🏢 <strong>How to select:</strong> Use the dropdown list in the form to choose the operator this report belongs to
                        </p>
                    </div>

                    <style>{`
            @keyframes slideIn {
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
        },
        {
            title: 'How to Complete the Form',
            icon: <CheckCircle className="size-16 text-blue-600 mb-4" />,
            content: (
                <div className="space-y-4">
                    <p className="text-center font-medium">Follow these steps to submit your report</p>

                    <div className="space-y-3">
                        {[
                            { label: '1. Select Reporting Month: Choose the month using the month picker in the form', icon: '', color: 'blue' },
                            { label: '2. Select Operator: Choose the operator from the dropdown list in the form', icon: '', color: 'green' },
                            { label: '3. Upload File: Upload your Excel file (.xlsx, .xls) with required sheets and columns', icon: '', color: 'orange' },
                            { label: '4. Submit: Review and submit for processing', icon: '', color: 'indigo' }
                        ].map((item, index) => (
                            <div
                                key={item.label}
                                className={`flex items-start gap-3 p-3 bg-${item.color}-50 border border-${item.color}-200 rounded-lg transform transition-all hover:scale-102`}
                                style={{
                                    animation: `checkIn 0.4s ease-out ${index * 0.1}s both`
                                }}
                            >
                                <div className="text-2xl mt-1">{item.icon}</div>
                                <span className={`text-sm font-medium text-${item.color}-900 flex-1`}>{item.label}</span>
                                <CheckCircle className={`size-5 text-${item.color}-600 ml-auto mt-1`} />
                            </div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4 text-center">
                        <p className="text-sm font-medium text-green-900">
                            Your Excel file will be automatically validated and parsed
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                            Only Excel files (.xlsx, .xls) are accepted for data processing
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
