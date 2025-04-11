"use client";

interface NumberWheelPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
}

export const NumberWheelPicker = ({
  value,
  onChange,
  min,
  max,
  label,
}: NumberWheelPickerProps) => {
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div className="flex flex-col items-center">
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="bg-transparent text-primary text-center appearance-none focus:outline-none"
      >
        {numbers.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <span className="text-xs text-primary/50">{label}</span> {}
    </div>
  );
};
