import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    pageTransition,
    staggerContainer,
    staggerItem
} from "@/lib/animations";
import {
    Users,
    FileCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { managementAPI, reportsAPI } from "@/utils/API";
import {
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

export function RegulatorMain() {
    const [metrics, setMetrics] = useState<any[]>([]);
    const [regulators, setRegulators] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const [m, r] = await Promise.all([
                reportsAPI.getRegulatorMetrics(),
                managementAPI.getRegulators()
            ]);
            setMetrics(m || []);
            setRegulators(r || []);
        };
        load();
    }, []);

    /* ------------------ Aggregations ------------------ */
    const totalIQ = metrics.reduce((s, m) => s + (m.iq_fee || 0), 0);
    const totalFurgugo = metrics.reduce((s, m) => s + (m.furgugo_fee || 0), 0);
    const uniqueOperators = new Set(metrics.map(m => m.operator_name)).size;

    const chartData = [
        {
            name: "Stake",
            value: metrics.reduce((s, m) => s + (m.revenue_stake || 0), 0),
            color: "#6366f1" // indigo
        },
        {
            name: "GGR",
            value: metrics.reduce((s, m) => s + (m.ggr_net_cash || 0), 0),
            color: "#22c55e" // green
        }
    ];

    const topOperators = [...metrics]
        .sort((a, b) => (b.ggr_net_cash || 0) - (a.ggr_net_cash || 0))
        .slice(0, 5);

    /* ------------------ KPI CARDS ------------------ */
    const kpis = [
        {
            label: "Reports Submitted",
            value: metrics.length,
            icon: FileCheck
        },
        {
            label: "Regulators",
            value: regulators.length,
            icon: Users
        },
        {
            label: "Operators Covered",
            value: uniqueOperators,
            icon: Users
        }
    ];

    return (
        <motion.div
            className="space-y-8"
            variants={pageTransition}
            initial="hidden"
            animate="show"
        >
            {/* KPI GRID */}
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-3 gap-6"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
            >
                {kpis.map((kpi, i) => (
                    <motion.div
                        key={kpi.label}
                        variants={staggerItem}
                    >
                        <Card className="hover:shadow-md transition">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm text-muted-foreground">
                                    {kpi.label}
                                </CardTitle>
                                <kpi.icon className="size-5 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl text-gray-900">
                                    {kpi.value}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {/* CHART + OPERATORS */}
            <motion.div
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
            >
                {/* BAR CHART */}
                <motion.div variants={staggerItem} className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">
                                Stake vs GGR (Latest Period)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" />
                                    <Tooltip />
                                    <Bar dataKey="value">
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* TOP OPERATORS */}
                <motion.div variants={staggerItem}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">
                                Top Operators by GGR
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {topOperators.map(op => (
                                <motion.div
                                    key={op.operator_name}
                                    variants={staggerItem}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-800">
                                            {op.operator_name}
                                        </span>
                                        <Badge variant="secondary">
                                            {op.ggr_net_cash?.toLocaleString()}
                                        </Badge>
                                    </div>
                                    <Separator className="my-2" />
                                </motion.div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            {/* FEES SUMMARY */}
            <motion.div variants={staggerItem}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">
                            Regulatory Fees Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground">IQ Fees</p>
                            <p className="text-lg text-gray-900">
                                {totalIQ.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Furgugo Fees
                            </p>
                            <p className="text-lg text-gray-900">
                                {totalFurgugo.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Operators Covered
                            </p>
                            <p className="text-lg text-gray-900">
                                {uniqueOperators}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}