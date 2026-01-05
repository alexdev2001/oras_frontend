import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface KpiCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    color?: string;
}

export function KpiCard({ title, value, icon: Icon, color }: KpiCardProps) {
    return (
        <Card
            className={clsx(
                'border border-gray-200',
                color && `bg-gradient-to-r ${color} text-white`
            )}
        >
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className={clsx(
                            'text-sm mb-1',
                            color ? 'text-white/80' : 'text-gray-600'
                        )}>
                            {title}
                        </p>
                        <p className="text-3xl font-semibold">
                            {value}
                        </p>
                    </div>

                    <Icon
                        className={clsx(
                            'h-10 w-10',
                            color ? 'text-white/80' : 'text-gray-400'
                        )}
                    />
                </div>
            </CardContent>
        </Card>
    );
}