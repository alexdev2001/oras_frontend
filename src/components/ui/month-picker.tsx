import { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';

interface MonthPickerProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    required?: boolean;
    className?: string;
}

export function MonthPicker({ value, onChange, label, required, className }: MonthPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const formatDisplayValue = (monthString: string) => {
        if (!monthString) return '';
        const [year, month] = monthString.split('-');
        const monthName = months[parseInt(month) - 1];
        return `${monthName} ${year}`;
    };
    
    const handleMonthSelect = (monthIndex: number) => {
        const monthValue = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}`;
        onChange(monthValue);
        setIsOpen(false);
    };
    
    const currentValue = value ? formatDisplayValue(value) : '';

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            
            <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full justify-between text-left font-normal h-10"
            >
                <span className={currentValue ? 'text-foreground' : 'text-muted-foreground'}>
                    {currentValue || 'Select month...'}
                </span>
                <Calendar className="h-4 w-4 opacity-50" />
            </Button>
            
            {isOpen && (
                <Card className="absolute z-50 mt-1 w-80 shadow-lg border-2">
                    <CardContent className="p-0">
                        {/* Year Selector */}
                        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentYear(currentYear - 1)}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                            
                            <span className="font-semibold text-sm">{currentYear}</span>
                            
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentYear(currentYear + 1)}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        {/* Month Grid */}
                        <div className="grid grid-cols-3 gap-1 p-3">
                            {months.map((month, index) => {
                                const monthValue = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
                                const isSelected = value === monthValue;
                                const isCurrentMonth = 
                                    new Date().getFullYear() === currentYear && 
                                    new Date().getMonth() === index;
                                
                                return (
                                    <Button
                                        key={month}
                                        type="button"
                                        variant={isSelected ? "default" : "ghost"}
                                        className={`h-10 text-sm justify-start ${
                                            isSelected 
                                                ? 'bg-primary text-primary-foreground' 
                                                : isCurrentMonth
                                                ? 'bg-muted/50 font-medium'
                                                : 'hover:bg-muted'
                                        }`}
                                        onClick={() => handleMonthSelect(index)}
                                    >
                                        {month.slice(0, 3)}
                                    </Button>
                                );
                            })}
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex gap-2 p-3 border-t bg-muted/30">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const now = new Date();
                                    const monthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                                    onChange(monthValue);
                                    setIsOpen(false);
                                }}
                                className="flex-1 text-xs"
                            >
                                Current Month
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onChange('');
                                    setIsOpen(false);
                                }}
                                className="flex-1 text-xs"
                            >
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
