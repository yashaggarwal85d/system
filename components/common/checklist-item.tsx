"use client";

import React, {
  useRef,
  useEffect,
  KeyboardEvent,
  forwardRef,
  useImperativeHandle,
} from "react";
import { motion, Reorder } from "framer-motion"; // Added Reorder back
import { Checkbox } from "@/components/common/checkbox";
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
  onFocus?: (id: string) => void;
  dragControls?: any;
  lastCompletedAura?: number;
  renderChildren?: (items: ChecklistItemData[]) => React.ReactNode;
  isReadOnly?: boolean;
}

export interface ChecklistItemHandle {
  focusItem: () => void;
}

export const ChecklistItem = forwardRef<
  ChecklistItemHandle,
  ChecklistItemProps
>(
  (
    {
      item,
      onUpdate,
      onDelete,
      onIndent,
      onOutdent,
      onEnter,
      onFocus,
      dragControls,
      lastCompletedAura,
      renderChildren,
      isReadOnly = false,
    },
    ref
  ) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (contentRef.current && contentRef.current.textContent !== item.text) {
        contentRef.current.textContent = item.text;
      }
    }, [item.id, item.text]);

    useImperativeHandle(ref, () => ({
      focusItem: () => {
        contentRef.current?.focus();
      },
    }));

    if (!item) return null;

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (isReadOnly) {
        e.preventDefault();
        return;
      }

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

    return isReadOnly ? (
      <motion.div
        layout={true}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        {/* Inner content remains the same */}
        <motion.div
          className={cn("group flex items-start gap-2 py-1", {
            "ml-6": item.level > 0,
          })}
          style={{ marginLeft: `${(item.level || 0) * 1.5}rem` }}
        >
          {/* Checkbox and Aura */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={item.completed}
              onCheckedChange={(checked) =>
                onUpdate(item.id, { completed: !!checked })
              }
              className="mt-1 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary" // Use primary
            />
            {lastCompletedAura !== undefined && (
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className={`text-xs font-bold ml-1 ${
                  lastCompletedAura >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {lastCompletedAura >= 0 ? "+" : ""}
                {lastCompletedAura} Aura
              </motion.span>
            )}
          </div>
          <div
            ref={contentRef}
            contentEditable={!isReadOnly}
            suppressContentEditableWarning
            onFocus={() => !isReadOnly && onFocus?.(item.id)}
            onInput={
              !isReadOnly
                ? (e) =>
                    onUpdate(item.id, {
                      text: e.currentTarget.textContent || "",
                    })
                : undefined
            }
            onBlur={
              !isReadOnly
                ? (e) =>
                    onUpdate(item.id, {
                      text: e.currentTarget.textContent || "",
                    })
                : undefined
            }
            onKeyDown={handleKeyDown}
            className={cn(
              "flex-1 outline-none break-words min-h-[1.5em] text-primary", // Use primary
              !isReadOnly && "focus:ring-1 focus:ring-primary/30 rounded px-1", // Use primary
              { "line-through opacity-50": item.completed },
              isReadOnly && "cursor-default"
            )}
            style={isReadOnly ? { userSelect: "none" } : {}}
          ></div>
          {/* Drag Handle (Hidden in read-only) */}
          {!isReadOnly && (
            <div
              className="opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
              onPointerDown={(e) => dragControls?.start(e)}
            >
              ⋮
            </div>
          )}
        </motion.div>
      </motion.div>
    ) : (
      <Reorder.Item
        value={item}
        dragListener={false}
        dragControls={dragControls}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        {/* Inner content remains the same */}
        <motion.div
          className={cn("group flex items-start gap-2 py-1", {
            "ml-6": item.level > 0,
          })}
          style={{ marginLeft: `${(item.level || 0) * 1.5}rem` }}
        >
          {/* Checkbox and Aura */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={item.completed}
              onCheckedChange={(checked) =>
                onUpdate(item.id, { completed: !!checked })
              }
              className="mt-1 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary" // Use primary
            />
            {lastCompletedAura !== undefined && (
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className={`text-xs font-bold ml-1 ${
                  lastCompletedAura >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {lastCompletedAura >= 0 ? "+" : ""}
                {lastCompletedAura} Aura
              </motion.span>
            )}
          </div>
          <div
            ref={contentRef}
            contentEditable={!isReadOnly}
            suppressContentEditableWarning
            onFocus={() => !isReadOnly && onFocus?.(item.id)}
            onInput={
              !isReadOnly
                ? (e) =>
                    onUpdate(item.id, {
                      text: e.currentTarget.textContent || "",
                    })
                : undefined
            }
            onBlur={
              !isReadOnly
                ? (e) =>
                    onUpdate(item.id, {
                      text: e.currentTarget.textContent || "",
                    })
                : undefined
            }
            onKeyDown={handleKeyDown}
            className={cn(
              "flex-1 outline-none break-words min-h-[1.5em] text-primary", // Use primary
              !isReadOnly && "focus:ring-1 focus:ring-primary/30 rounded px-1", // Use primary
              { "line-through opacity-50": item.completed },
              isReadOnly && "cursor-default"
            )}
            style={isReadOnly ? { userSelect: "none" } : {}}
          ></div>
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-move touch-none" // Added touch-none
            onPointerDown={(e) => dragControls?.start(e)}
            style={{ touchAction: "none" }}
          >
            ⋮
          </div>
        </motion.div>
      </Reorder.Item>
    );
  }
);

ChecklistItem.displayName = "ChecklistItem";
