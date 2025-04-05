"use client";

import React, { useRef, useEffect, KeyboardEvent } from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import { Checkbox } from "@/components/common/checkbox";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import {
  Trash2,
  Plus,
  ChevronRight,
  ChevronDown,
  Sparkles,
} from "lucide-react"; // Added Sparkles
import { useState } from "react";
import { cn } from "@/lib/utils/commonUtils";

export interface ChecklistItemData {
  id: string;
  text: string;
  completed: boolean;
  level: number;
  children: ChecklistItemData[];
}

interface ChecklistItemProps {
  item: ChecklistItemData;
  onUpdate: (id: string, updates: Partial<ChecklistItemData>) => void;
  onDelete: (id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onEnter: (id: string, level: number) => void;
  onFocus: (id: string) => void;
  isEditing?: boolean;
  dragControls?: any;
  lastCompletedAura?: number; // Add optional prop for aura change
}

export const ChecklistItem = ({
  item,
  onUpdate,
  onDelete,
  onIndent,
  onOutdent,
  onEnter,
  onFocus,
  isEditing,
  dragControls,
  lastCompletedAura, // Destructure the new prop
}: ChecklistItemProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  if (!item) return null;

  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(contentRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        onOutdent(item.id);
      } else {
        onIndent(item.id);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const currentText = contentRef.current?.textContent || "";
      if (currentText !== item.text) {
        onUpdate(item.id, { text: currentText });
      }
      onEnter(item.id, item.level);
    } else if (
      e.key === "Backspace" &&
      contentRef.current?.textContent === ""
    ) {
      e.preventDefault();
      if (item.level > 0) {
        onOutdent(item.id);
      } else {
        onDelete(item.id);
      }
    }
  };

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      ref={dragRef}
    >
      <motion.div
        className={cn("group flex items-start gap-2 py-1", {
          "ml-6": item.level > 0,
        })}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        style={{ marginLeft: `${(item.level || 0) * 1.5}rem` }}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            checked={item.completed}
            onCheckedChange={(checked) =>
              onUpdate(item.id, { completed: !!checked })
            }
            className="mt-1 border-[#4ADEF6]/50 data-[state=checked]:bg-[#4ADEF6] data-[state=checked]:border-[#4ADEF6]"
          />
          {/* Display Aura Change Temporarily */}
          {lastCompletedAura !== undefined && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className={`text-xs font-bold ml-1 ${
                lastCompletedAura >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {lastCompletedAura >= 0 ? "+" : ""}
              {lastCompletedAura} Aura
            </motion.span>
          )}
        </div>

        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => onFocus(item.id)}
          onInput={(e) =>
            onUpdate(item.id, { text: e.currentTarget.textContent || "" })
          }
          onBlur={(e) =>
            onUpdate(item.id, { text: e.currentTarget.textContent || "" })
          }
          onKeyDown={handleKeyDown}
          className={cn(
            "flex-1 outline-none break-words min-h-[1.5em] text-[#4ADEF6]",
            "focus:ring-1 focus:ring-[#4ADEF6]/30 rounded px-1",
            { "line-through opacity-50": item.completed }
          )}
        >
          {item.text}
        </div>

        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
          onPointerDown={(e) => dragControls?.start(e)}
        >
          ⋮
        </div>
      </motion.div>
    </Reorder.Item>
  );
};
