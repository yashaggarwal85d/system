"use client";
import React from "react";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const safeValue =
    typeof value === "string" && value.includes(":") ? value : "00:00";
  const [hoursStr, minutesStr] = safeValue.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  const hoursList = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minutesList = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  return (
    <div className="flex items-center gap-2 bg-secondary/60 border border-primary/20 rounded-lg p-2">
      {" "}
      {/* Use theme colors */}
      <div className="flex flex-col items-center">
        <select
          value={hoursStr}
          onChange={(e) => {
            const newHours = e.target.value;

            const currentMinutesStr = minutes.toString().padStart(2, "0");
            onChange(`${newHours}:${currentMinutesStr}`);
          }}
          className="bg-transparent text-primary text-center appearance-none focus:outline-none cursor-pointer" // Use primary
        >
          {hoursList.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-xs text-primary/50">Hours</span>{" "}
        {/* Use primary */}
      </div>
      <span className="text-primary text-xl">:</span> {/* Use primary */}
      <div className="flex flex-col items-center">
        <select
          value={minutesStr}
          onChange={(e) => {
            const newMinutes = e.target.value;

            const currentHoursStr = hours.toString().padStart(2, "0");
            onChange(`${currentHoursStr}:${newMinutes}`);
          }}
          className="bg-transparent text-primary text-center appearance-none focus:outline-none cursor-pointer" // Use primary
        >
          {minutesList.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="text-xs text-primary/50">Minutes</span>{" "}
        {/* Use primary */}
      </div>
    </div>
  );
};
