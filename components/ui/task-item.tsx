"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Trash2, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { Task } from "@/lib/interfaces/task"; // Import the main Task interface

// Remove local Task interface definition

// Extend TaskItemProps from the imported Task interface
interface TaskItemProps extends Task {
  onToggle: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void; // Use imported Task type
  // Adjust prop types to handle potential undefined dates from store/interface
  getDaysRemaining: (deadline?: Date) => number | null;
  getDeadlineColor: (days: number | null) => string;
  getDeadlineText: (deadline?: Date) => string;
  getRemainingTime: (nextDue?: Date) => string;
}

export const TaskItem = ({
  id,
  title,
  completed,
  deadline,
  category,
  isHabit,
  isGoodHabit,
  frequency, // Part of Task spread
  nextDue, // Part of Task spread
  // auraValue removed from Task interface
  createdAt, // Added from Task spread
  updatedAt, // Added from Task spread
  userId, // Added from Task spread
  onToggle,
  onUpdate,
  onDelete,
  onEdit,
  getDaysRemaining,
  getDeadlineColor,
  getDeadlineText,
  getRemainingTime,
}: TaskItemProps) => {
  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 100,
            damping: 15,
          },
        },
        exit: {
          opacity: 0,
          y: -20,
          transition: {
            type: "spring",
            stiffness: 100,
            damping: 15,
          },
        },
      }}
    >
      <Card className="bg-[#0A1A2F]/60 border-[#4ADEF6]/20 hover:border-[#4ADEF6]/40 transition-colors group">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Checkbox
              checked={completed}
              onCheckedChange={() => onToggle(id)}
              className="border-[#4ADEF6]/50 data-[state=checked]:bg-[#4ADEF6] data-[state=checked]:border-[#4ADEF6]"
            />
            <div className="flex flex-col flex-1 min-w-0">
              <span
                className={`text-[#4ADEF6] ${
                  completed ? "line-through opacity-50" : ""
                }`}
              >
                {title}
              </span>
              {deadline && (
                <span
                  className={`text-xs ${getDeadlineColor(
                    getDaysRemaining(deadline)
                  )}`}
                >
                  {getDeadlineText(deadline)}
                </span>
              )}
              {isHabit && frequency && (
                <span className="text-xs text-[#4ADEF6]/70">
                  {frequency.count} times per {frequency.value}{" "}
                  {frequency.period}
                  {nextDue && (
                    <span
                      className={`ml-2 ${
                        getRemainingTime(nextDue) === "Overdue"
                          ? "text-red-500"
                          : ""
                      }`}
                    >
                      {getRemainingTime(nextDue)}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(category === "todo" || category === "habit") && (
              <Button
                onClick={() =>
                  onEdit?.({
                    id,
                    title,
                    completed,
                    deadline,
                    category,
                    createdAt, // Pass existing createdAt
                    updatedAt, // Pass existing updatedAt
                    userId, // Pass existing userId
                    // auraValue removed
                    isHabit,
                    isGoodHabit,
                    frequency,
                    nextDue,
                    // Ensure all Task properties are included if needed by onEdit consumer
                  })
                }
                className="h-8 w-8 p-0 bg-[#4ADEF6]/20 hover:bg-[#4ADEF6]/30 border-[#4ADEF6]/50 text-[#4ADEF6]"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {completed && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Badge
                  variant="outline"
                  className={`${
                    isHabit
                      ? isGoodHabit
                        ? "bg-[#4ADEF6]/10 border-[#4ADEF6]/30 text-[#4ADEF6]"
                        : "bg-red-500/10 border-red-500/30 text-red-500"
                      : "bg-[#4ADEF6]/10 border-[#4ADEF6]/30 text-[#4ADEF6]"
                  }`}
                >
                  {isHabit && isGoodHabit
                    ? "+"
                    : isHabit && !isGoodHabit
                    ? "-"
                    : "+"}
                  {/* Display calculated aura? Needs prop */} Aura
                </Badge>
                <Sparkles className="h-4 w-4 text-[#4ADEF6] animate-pulse" />
              </motion.div>
            )}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={() => onDelete(id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
