"use client";

import { Card, CardContent } from "@/components/common/card";
import { Checkbox } from "@/components/common/checkbox";
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import { Sparkles, Trash2, Pencil, TimerReset } from "lucide-react";
import { motion } from "framer-motion";
import { Task } from "@/lib/utils/interfaces";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/common/alert-dialog";

interface TaskItemProps extends Task {
  onToggle: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  getDeadlineColor: () => string;
  getDeadlineText: () => string;
}

export const TaskItem = ({
  id,
  name,
  description,
  completed,
  due_date,
  aura,
  onToggle,
  onDelete,
  onEdit,
  getDeadlineColor,
  getDeadlineText,
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
      <Card className="bg-secondary border-primary/20 hover:border-primary/40 transition-colors group">
        {" "}
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Checkbox
              checked={completed}
              onCheckedChange={handleToggle}
              className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div className="flex flex-col flex-1 min-w-0">
              <span
                className={`text-primary ${
                  completed ? "line-through opacity-50" : ""
                }`}
              >
                {name}
              </span>
              {description && (
                <span className="text-xs text-muted-foreground mt-1 truncate">
                  {description}
                </span>
              )}
              {!completed && due_date && (
                <span className={`text-xs ${getDeadlineColor()}`}>
                  {getDeadlineText()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && !completed && id && (
              <Button
                onClick={() => onEdit()}
                className="h-8 w-8 p-0 bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary"
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
                  className="bg-primary/10 border-primary/30 text-primary"
                >
                  +{aura} Aura
                </Badge>
                <Sparkles className="h-4 w-4 text-primary animate-pulse" /> {}
              </motion.div>
            )}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      this task.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Task
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
