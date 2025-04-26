import React, { useMemo } from "react";
import { CategorizedTransaction } from "@/lib/utils/interfaces";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/common/chart";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  subWeeks,
  parseISO,
  isWithinInterval,
} from "date-fns";

type PeriodOption =
  | "currentMonth"
  | "previousMonth"
  | "last7Days"
  | "last30Days"
  | "allTime";

interface ExpenseComparisonChartProps {
  transactions: CategorizedTransaction[];
  period: PeriodOption;
}

const chartConfig = {
  previousPeriod: {
    label: "Previous Period",
    color: "hsl(var(--chart-1))",
  },
  currentPeriod: {
    label: "Selected Period",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const getComparisonRanges = (
  period: PeriodOption
): {
  current: { start: Date; end: Date } | null;
  previous: { start: Date; end: Date } | null;
} => {
  const now = new Date();
  let currentRange: { start: Date; end: Date } | null = null;
  let previousRange: { start: Date; end: Date } | null = null;

  switch (period) {
    case "currentMonth":
      currentRange = { start: startOfMonth(now), end: endOfMonth(now) };
      const prevMonth = subMonths(now, 1);
      previousRange = {
        start: startOfMonth(prevMonth),
        end: endOfMonth(prevMonth),
      };
      break;
    case "previousMonth":
      const currentPrevMonth = subMonths(now, 1);
      currentRange = {
        start: startOfMonth(currentPrevMonth),
        end: endOfMonth(currentPrevMonth),
      };
      const prevPrevMonth = subMonths(now, 2);
      previousRange = {
        start: startOfMonth(prevPrevMonth),
        end: endOfMonth(prevPrevMonth),
      };
      break;
    case "last7Days":
      currentRange = { start: subWeeks(now, 1), end: now };
      previousRange = { start: subWeeks(now, 2), end: subWeeks(now, 1) };
      break;
    case "last30Days":
      currentRange = { start: subMonths(now, 1), end: now };
      previousRange = { start: subMonths(now, 2), end: subMonths(now, 1) };
      break;
    case "allTime":
    default:
      break;
  }
  return { current: currentRange, previous: previousRange };
};

const getChartTitle = (period: PeriodOption): string => {
  switch (period) {
    case "currentMonth":
      return "Current vs Previous Month Expense";
    case "previousMonth":
      return "Previous Month vs Month Before Expense";
    case "last7Days":
      return "Last 7 Days vs Previous 7 Days Expense";
    case "last30Days":
      return "Last 30 Days vs Previous 30 Days Expense";
    case "allTime":
      return "Chart not valid for All time expenses";
    default:
      return "Expense Comparison";
  }
};

const calculateCategoryTotals = (
  transactions: CategorizedTransaction[],
  range: { start: Date; end: Date } | null
): { [key: string]: number } => {
  if (!range) return {};
  return transactions.reduce((acc, t) => {
    if (t.CrDr === "DR") {
      try {
        const transactionDate = parseISO(t.Timestamp);
        if (isWithinInterval(transactionDate, range)) {
          const category = t.Category || "Uncategorized";
          acc[category] = (acc[category] || 0) + t.Amount;
        }
      } catch (e) {
        console.error("Error parsing date for comparison:", t.Timestamp, e);
      }
    }
    return acc;
  }, {} as { [key: string]: number });
};

const ExpenseComparisonChart: React.FC<ExpenseComparisonChartProps> = ({
  transactions,
  period,
}) => {
  const comparisonData = useMemo(() => {
    if (period === "allTime" || !transactions) return [];

    const { current: currentRange, previous: previousRange } =
      getComparisonRanges(period);

    if (!currentRange || !previousRange) return [];

    const currentTotals = calculateCategoryTotals(transactions, currentRange);
    const previousTotals = calculateCategoryTotals(transactions, previousRange);

    const allCategories = new Set([
      ...Object.keys(currentTotals),
      ...Object.keys(previousTotals),
    ]);
    const data = Array.from(allCategories)
      .map((category) => ({
        category,
        currentPeriod: parseFloat((currentTotals[category] || 0).toFixed(2)),
        previousPeriod: parseFloat((previousTotals[category] || 0).toFixed(2)),
      }))
      .sort(
        (a, b) =>
          b.currentPeriod +
          b.previousPeriod -
          (a.currentPeriod + a.previousPeriod)
      );

    return data;
  }, [transactions, period]);

  if (period === "allTime" || comparisonData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{getChartTitle(period)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground p-4">
            {period === "allTime"
              ? "Select a specific period for comparison."
              : "No comparison data available for this period."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getChartTitle(period)}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Use ChartContainer and pass the config */}
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart accessibilityLayer data={comparisonData}>
            {" "}
            {/* Added accessibilityLayer */}
            <CartesianGrid vertical={false} /> {/* Use themed grid */}
            <XAxis
              dataKey="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis tickLine={false} axisLine={false} />
            {/* Use themed Tooltip */}
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    typeof value === "number" ? value.toFixed(2) : value
                  }
                />
              }
            />
            {/* Use themed Legend */}
            <ChartLegend content={<ChartLegendContent />} />
            {/* Use themed Bar */}
            <Bar
              dataKey="previousPeriod"
              fill="var(--color-previousPeriod)"
              radius={4}
            />
            <Bar
              dataKey="currentPeriod"
              fill="var(--color-currentPeriod)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ExpenseComparisonChart;
