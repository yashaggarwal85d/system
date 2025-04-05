"use client";

import { Card, CardContent } from "@/components/common/card";
import { Checkbox } from "@/components/common/checkbox";
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import { Sparkles, Trash2, Pencil, TimerReset } from "lucide-react"; // Added TimerReset
import { motion } from "framer-motion";
import { Task } from "@/lib/utils/interfaces";

interface TaskItemProps extends Task {
  onToggle: () => void;
  onDelete: () => void;
  onEdit?: () => void; // Incompatible usage removed below
  getDaysRemaining: () => number;
  getDeadlineColor: () => string;
  getDeadlineText: () => string;
  getRemainingTime: () => string;
}

export const TaskItem = ({
  id,
  name,
  completed,
  due_date,
  aura,
  onToggle,
  onDelete,
  onEdit,
  getDaysRemaining,
  getDeadlineColor,
  getDeadlineText,
  getRemainingTime,
}: TaskItemProps) => {
  const handleToggle = () => id && onToggle();
  const handleDelete = () => id && onDelete();

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
              onCheckedChange={handleToggle}
              className="border-[#4ADEF6]/50 data-[state=checked]:bg-[#4ADEF6] data-[state=checked]:border-[#4ADEF6]"
            />
            <div className="flex flex-col flex-1 min-w-0">
              <span
                className={`text-[#4ADEF6] ${
                  completed ? "line-through opacity-50" : ""
                }`}
              >
                {name}
              </span>
              {due_date && ( // Use due_date
                <span className={`text-xs ${getDeadlineColor()}`}>
                  {getDeadlineText()} {/* Use due_date */}
                </span>
              )}
              {/* Display Remaining Time using due_date */}
              {due_date && getRemainingTime && (
                <span
                  className={`text-xs ml-2 ${
                    getRemainingTime() === "Overdue"
                      ? "text-red-500"
                      : "text-[#4ADEF6]/70"
                  }`}
                >
                  ({getRemainingTime()})
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit &&
              id && ( // Check if onEdit is provided and id is not null
                <Button
                  onClick={() => onEdit()}
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
                  className="bg-[#4ADEF6]/10 border-[#4ADEF6]/30 text-[#4ADEF6]" // Simplified class, removed habit logic
                >
                  +{aura} Aura
                </Badge>
                <Sparkles className="h-4 w-4 text-[#4ADEF6] animate-pulse" />
              </motion.div>
            )}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={handleDelete}
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
