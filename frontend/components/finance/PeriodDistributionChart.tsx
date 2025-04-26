import React, { useMemo } from "react";
import { CategorizedTransaction } from "@/lib/utils/interfaces";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { PieChart, Pie, Cell } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/common/chart";

type PeriodOption =
  | "currentMonth"
  | "previousMonth"
  | "last7Days"
  | "last30Days"
  | "allTime";

interface PeriodDistributionChartProps {
  transactions: CategorizedTransaction[];
  period: PeriodOption;
}

const generateChartConfig = (data: { name: string }[]): ChartConfig => {
  const config: ChartConfig = {};
  data.forEach((item, index) => {
    config[item.name] = {
      label: item.name,
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
  });
  return config;
};

const getChartTitle = (period: PeriodOption): string => {
  switch (period) {
    case "currentMonth":
      return "Current Month Spending Distribution";
    case "previousMonth":
      return "Previous Month Spending Distribution";
    case "last7Days":
      return "Last 7 Days Spending Distribution";
    case "last30Days":
      return "Last 30 Days Spending Distribution";
    case "allTime":
      return "All Time Spending Distribution";
    default:
      return "Spending Distribution";
  }
};

const PeriodDistributionChart: React.FC<PeriodDistributionChartProps> = ({
  transactions,
  period,
}) => {
  const distributionData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    const categoryTotals = transactions.reduce((acc, transaction) => {
      if (transaction.CrDr === "DR") {
        const category = transaction.Category || "Uncategorized";
        acc[category] = (acc[category] || 0) + transaction.Amount;
      }
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (distributionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{getChartTitle(period)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground p-4">
            No spending data available for this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = useMemo(
    () => generateChartConfig(distributionData),
    [distributionData]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getChartTitle(period)}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Use ChartContainer */}
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            {/* Use themed Tooltip */}
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={distributionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {/* Use themed Cells */}
              {distributionData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={`var(--color-${entry.name})`}
                  className="stroke-background focus:outline-none"
                />
              ))}
            </Pie>
            {/* Use themed Legend (optional, can be removed if tooltip is sufficient) */}
            {/* <ChartLegend content={<ChartLegendContent nameKey="name" />} /> */}
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default PeriodDistributionChart;
