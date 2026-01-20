import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsAPI } from "@/utils/API";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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
        return <p className="text-center">Generating predictions…</p>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {predictions.map((operator: any) => (
                <Card
                    key={operator.operator}
                    className="border-indigo-200 bg-gradient-to-br from-white to-indigo-50"
                >
                    <CardHeader>
                        <CardTitle>{operator.operator}</CardTitle>
                        <p className="text-xs text-indigo-600 uppercase">
                            Predicted values
                        </p>
                    </CardHeader>

                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={operator.forecast}>
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="ggr"
                                    stroke="#6366f1"
                                    strokeDasharray="5 5"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}