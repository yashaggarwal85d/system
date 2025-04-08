"use client";

import { Card, CardContent } from "@/components/common/card";
import { Checkbox } from "@/components/common/checkbox"; // Import Checkbox
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import { useState, useEffect } from "react";
import { Sparkles, Trash2, Pencil } from "lucide-react"; // Remove CheckCircle
import { motion } from "framer-motion";
import { Habit } from "@/lib/utils/interfaces";
import {
  calculateNextDueDate,
  formatDateToDDMMYY,
  getDeadlineColor,
  getDeadlineText,
  getRefreshColor,
  getRefreshText,
  getRemainingTime,
  parseDate,
} from "@/lib/utils/commonUtils";

interface HabitItemProps extends Habit {
  id: string;
  onToggle: (currentlyCompleted: boolean) => void;
  onDelete: () => void;
  onEdit?: () => void;
  refreshHabit: () => void;
}

export const HabitItem = ({
  name,
  aura,
  start_date,
  last_completed,
  occurence,
  x_occurence,
  onToggle,
  onDelete,
  onEdit,
  refreshHabit,
}: HabitItemProps) => {
  const [isCompleted, setIsCompleted] = useState(false);

  const handleToggle = () => {
    onToggle(!isCompleted);
    setIsCompleted(!isCompleted);
  };
  const handleDelete = () => onDelete();

  useEffect(() => {
    var lc = parseDate(last_completed);
    var sd = parseDate(start_date);
    lc.setHours(0, 0, 0, 0);
    sd.setHours(0, 0, 0, 0);
    if (lc.getTime() <= sd.getTime()) {
      setIsCompleted(false);
    } else {
      setIsCompleted(true);
    }
  }, [last_completed]);

  useEffect(() => {
    var now = new Date();
    var nc = parseDate(
      calculateNextDueDate(start_date, occurence, x_occurence)
    );
    now.setHours(0, 0, 0, 0);
    nc.setHours(0, 0, 0, 0);
    if (now >= nc) {
      refreshHabit();
    }
  }, [isCompleted]);

  const is_good = aura >= 0; // Determine if habit is good based on aura
  const due_date = calculateNextDueDate(start_date, occurence, x_occurence);
  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 100, damping: 15 },
        },
        exit: {
          opacity: 0,
          y: -20,
          transition: { type: "spring", stiffness: 100, damping: 15 },
        },
      }}
    >
      <Card
        className={`bg-[#0A1A2F]/60 border transition-colors group ${
          !is_good
            ? "border-red-500/20 hover:border-red-500/40"
            : "border-[#4ADEF6]/20 hover:border-[#4ADEF6]/40"
        }`}
      >
        {/* Replicate TaskItem structure */}
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Checkbox for toggling */}
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleToggle}
              // Apply conditional styling based on is_good
              className={`${
                !is_good
                  ? "border-red-500/50 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  : "border-[#4ADEF6]/50 data-[state=checked]:bg-[#4ADEF6] data-[state=checked]:border-[#4ADEF6]"
              }`}
            />
            {/* Text content */}
            <div className="flex flex-col flex-1 min-w-0">
              <span
                className={`font-medium ${
                  !is_good ? "text-red-400" : "text-[#4ADEF6]"
                } ${isCompleted ? "line-through opacity-50" : ""}`} // Apply line-through if completed
              >
                {name}
              </span>
              {/* Show frequency and next due only if not completed */}
              {!isCompleted && (
                <>
                  <span className="text-xs text-orange-500">
                    Every {x_occurence} {occurence}
                  </span>
                  <span className={`text-xs ${getDeadlineColor(due_date)}`}>
                    Next due: {getDeadlineText(due_date)}
                  </span>
                </>
              )}
              {isCompleted && (
                <span
                  className={`text-xs ${getRefreshColor(
                    start_date,
                    occurence,
                    x_occurence
                  )}`}
                >
                  Refresh{getRefreshText(start_date, occurence, x_occurence)}
                </span>
              )}
            </div>
          </div>
          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Show Aura badge only when completed */}
            {isCompleted && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Badge
                  variant="outline"
                  className={`${
                    !is_good
                      ? "bg-red-900/30 border-red-500/30 text-red-400"
                      : "bg-[#4ADEF6]/10 border-[#4ADEF6]/30 text-[#4ADEF6]"
                  }`}
                >
                  {is_good ? "+" : "-"}
                  {Math.abs(aura)} Aura {/* Ensure aura is positive */}
                </Badge>
                {is_good && <Sparkles className="h-4 w-4 text-[#4ADEF6]/50" />}
              </motion.div>
            )}

            {/* Edit Button */}
            {onEdit && !isCompleted && (
              <Button
                onClick={onEdit}
                variant="ghost"
                size="icon"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" // Show on hover
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" // Show on hover
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
