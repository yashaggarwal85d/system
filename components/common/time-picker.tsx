"use client";
import React from "react"; // Import React

interface TimePickerProps {
  value: string; // Expect "HH:MM" format
  onChange: (time: string) => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  // Ensure value is always a valid "HH:MM" string before splitting
  const safeValue =
    typeof value === "string" && value.includes(":") ? value : "00:00";
  const [hoursStr, minutesStr] = safeValue.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  // Generate lists for dropdowns
  const hoursList = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minutesList = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  return (
    <div className="flex items-center gap-2 bg-[#0A1A2F]/60 border border-[#4ADEF6]/20 rounded-lg p-2">
      <div className="flex flex-col items-center">
        <select
          value={hoursStr} // Use the string part for value binding
          onChange={(e) => {
            const newHours = e.target.value; // Already a string "HH"
            // Ensure minutes part is also correctly formatted string "MM"
            const currentMinutesStr = minutes.toString().padStart(2, "0");
            onChange(`${newHours}:${currentMinutesStr}`);
          }}
          className="bg-transparent text-[#4ADEF6] text-center appearance-none focus:outline-none cursor-pointer" // Added cursor-pointer
        >
          {hoursList.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-xs text-[#4ADEF6]/50">Hours</span>
      </div>
      <span className="text-[#4ADEF6] text-xl">:</span>
      <div className="flex flex-col items-center">
        <select
          value={minutesStr} // Use the string part for value binding
          onChange={(e) => {
            const newMinutes = e.target.value; // Already a string "MM"
            // Ensure hours part is also correctly formatted string "HH"
            const currentHoursStr = hours.toString().padStart(2, "0");
            onChange(`${currentHoursStr}:${newMinutes}`);
          }}
          className="bg-transparent text-[#4ADEF6] text-center appearance-none focus:outline-none cursor-pointer" // Added cursor-pointer
        >
          {minutesList.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="text-xs text-[#4ADEF6]/50">Minutes</span>
      </div>
    </div>
  );
};
