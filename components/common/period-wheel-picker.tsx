"use client";

interface PeriodWheelPickerProps {
  value: "days" | "weeks" | "months";
  onChange: (value: "days" | "weeks" | "months") => void;
}

export const PeriodWheelPicker = ({
  value,
  onChange,
}: PeriodWheelPickerProps) => {
  const periods = ["days", "weeks", "months"] as const;

  return (
    <div className="flex flex-col items-center">
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value as "days" | "weeks" | "months")
        }
        className="bg-transparent text-primary text-center appearance-none focus:outline-none"
      >
        {periods.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <span className="text-xs text-primary/50">Period</span> {}
    </div>
  );
};
