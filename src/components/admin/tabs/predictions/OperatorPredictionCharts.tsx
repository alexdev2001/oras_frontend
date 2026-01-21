import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsAPI } from "@/utils/API";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

// Short MWK (axis)
const formatMWKShort = (value: number) => {
    const sign = value < 0 ? "-" : "";
    const abs = Math.abs(value);

    if (abs >= 1_000_000_000)
        return `${sign}MWK ${(abs / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000)
        return `${sign}MWK ${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000)
        return `${sign}MWK ${(abs / 1_000).toFixed(1)}K`;

    return `${sign}MWK ${abs.toFixed(0)}`;
};

// Full MWK (tooltip)
const formatMWK = (value: number) =>
    new Intl.NumberFormat("en-MW", {
        style: "currency",
        currency: "MWK",
        maximumFractionDigits: 2,
    }).format(value);

export function OperatorPredictionCharts({
                                             regulatorAnalytics,
                                             selectedRegulator,
                                             period,
                                             predictions,
                                             setPredictions,
                                             loading,
                                             setLoading,
                                         }: any) {
    useEffect(() => {
        const loadPredictions = async () => {
            setLoading(true);
            const data = await analyticsAPI.getRegulatorPredictions({
                regulator: selectedRegulator,
                months: period,
            });
            setPredictions(data);
            setLoading(false);
        };

        loadPredictions();
    }, [selectedRegulator, period]);

    if (loading) {
        return (
            <p className="text-center text-sm text-muted-foreground">
                Generating predictions…
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {predictions.map((operator: any) => {
                const values = operator.forecast.map((f: any) => f.ggr);
                const minY = Math.min(...values);
                const maxY = Math.max(...values);

                const padding = Math.max(Math.abs(minY), Math.abs(maxY)) * 0.15;

                return (
                    <Card
                        key={operator.operator}
                        className="border-indigo-200 dark:border-indigo-600 bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-indigo-900/20"
                    >
                        <CardHeader>
                            <CardTitle>{operator.operator}</CardTitle>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase">
                                Predicted values
                            </p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase">
                                Regulator: {selectedRegulator}
                            </p>
                        </CardHeader>

                        <CardContent className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={operator.forecast.sort((a: any, b: any) => a.month.localeCompare(b.month))}>
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 12, fill: 'currentColor' }}
                                    />

                                    <YAxis
                                        tickFormatter={formatMWKShort}
                                        width={90}
                                        domain={[minY - padding, maxY + padding]}
                                        tick={{ fill: 'currentColor' }}
                                    />

                                    <Tooltip
                                        formatter={(value: number) => formatMWK(value)}
                                        labelFormatter={(label) =>
                                            `Month: ${label}`
                                        }
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="ggr"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        strokeDasharray="6 4"
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}