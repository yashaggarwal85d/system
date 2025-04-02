"use client"

import { useState } from "react"

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
}

export const TimePicker = ({ value, onChange }: TimePickerProps) => {
  const [hours, minutes] = value.split(':').map(Number)
  const hoursList = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

  return (
    <div className="flex items-center gap-2 bg-[#0A1A2F]/60 border border-[#4ADEF6]/20 rounded-lg p-2">
      <div className="flex flex-col items-center">
        <select
          value={hours}
          onChange={(e) => {
            const newHours = e.target.value.padStart(2, '0')
            onChange(`${newHours}:${minutes.toString().padStart(2, '0')}`)
          }}
          className="bg-transparent text-[#4ADEF6] text-center appearance-none focus:outline-none"
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
          value={minutes}
          onChange={(e) => {
            const newMinutes = e.target.value.padStart(2, '0')
            onChange(`${hours.toString().padStart(2, '0')}:${newMinutes}`)
          }}
          className="bg-transparent text-[#4ADEF6] text-center appearance-none focus:outline-none"
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
  )
} 