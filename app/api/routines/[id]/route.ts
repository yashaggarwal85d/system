import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import prisma from "@/lib/prisma";
import { Routine, ChecklistItem } from "@prisma/client";
import { HabitConfig } from "@/lib/interfaces/habit"; // Frequency structure
import { ChecklistItemData } from "@/components/ui/checklist-item";
import { calculateNextDueDate } from "@/lib/utils";

interface Params {
  id: string;
}

// PUT /api/routines/[id] - Update a specific routine (name, frequency, checklist)
export async function PUT(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  const routineId = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    // Include 'completed' status from the frontend store's calculation
    const { name, frequency, checklist, completed } = body;
    const config = frequency as HabitConfig | undefined;
    const isNowCompleted = completed === true; // Explicit check for true

    // --- Validation ---
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Routine name is required" },
        { status: 400 }
      );
    }
    if (config) {
      // Validate frequency if provided
      // Add full frequency validation...
      if (typeof config !== "object" /* ... */) {
        return NextResponse.json(
          { error: "Invalid routine frequency configuration" },
          { status: 400 }
        );
      }
    }
    if (!Array.isArray(checklist)) {
      // Checklist is required for update
      return NextResponse.json(
        { error: "Checklist must be provided as an array" },
        { status: 400 }
      );
    }
    // Basic validation for checklist items
    for (const item of checklist as Partial<ChecklistItemData>[]) {
      if (
        typeof item.text !== "string" ||
        typeof item.level !== "number" ||
        typeof item.id !== "string"
      ) {
        // ID is needed for updates
        return NextResponse.json(
          { error: "Invalid checklist item format for update" },
          { status: 400 }
        );
      }
    }
    // --- End Validation ---

    // Check ownership and get existing data
    const existingRoutine = await prisma.routine.findUnique({
      where: { id: routineId },
    });
    if (!existingRoutine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }
    if (existingRoutine.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use transaction to update routine and manage checklist items
    const updatedRoutineWithChecklist = await prisma.$transaction(
      async (tx) => {
        // 1. Update Routine details (name, frequency, nextDue)
        // Define precise type for update data, including completion fields
        const routineUpdateData: {
          name: string;
          frequency?: HabitConfig; // Assuming HabitConfig is JSON compatible
          nextDue?: Date | null;
          completed?: boolean; // Add completed field
          lastCompleted?: Date | null; // Add lastCompleted field
        } = { name };
        if (config) {
          routineUpdateData.frequency = config; // Store as JSON
          // Recalculate nextDue only if frequency changes OR if completing now
          // Use existing frequency if config is not provided but completing now
          const freqToUse =
            config ?? (existingRoutine.frequency as HabitConfig | null);
          if (freqToUse) {
            routineUpdateData.nextDue =
              calculateNextDueDate(new Date(), freqToUse) ?? null;
          }
        }

        // Handle completion status change
        routineUpdateData.completed = isNowCompleted; // Update completed status
        if (
          isNowCompleted &&
          !existingRoutine.completed &&
          existingRoutine.frequency
        ) {
          // If completing now and wasn't completed before, set lastCompleted and ensure nextDue is calculated
          routineUpdateData.lastCompleted = new Date();
          // Ensure nextDue is calculated based on the *current* frequency if not already set by config change
          if (!routineUpdateData.nextDue) {
            const currentFreq = existingRoutine.frequency as HabitConfig;
            routineUpdateData.nextDue =
              calculateNextDueDate(new Date(), currentFreq) ?? null;
          }
        } else if (
          !isNowCompleted &&
          existingRoutine.completed &&
          existingRoutine.frequency
        ) {
          // If un-completing, clear lastCompleted and recalculate nextDue from now
          routineUpdateData.lastCompleted = null;
          const currentFreq = existingRoutine.frequency as HabitConfig;
          routineUpdateData.nextDue =
            calculateNextDueDate(new Date(), currentFreq) ?? null;
        }

        const updatedRoutine = await tx.routine.update({
          where: { id: routineId },
          data: routineUpdateData, // Use the extended update data
        });

        // 2. Manage Checklist Items (find existing, update, delete, create)
        const existingChecklistItems = await tx.checklistItem.findMany({
          where: { routineId: routineId },
        });
        const existingItemIds = new Set(
          existingChecklistItems.map((item) => item.id)
        );
        const incomingItemIds = new Set(
          checklist.map((item: ChecklistItemData) => item.id)
        );

        // Items to delete: exist in DB but not in incoming checklist
        const itemsToDelete = existingChecklistItems.filter(
          (item) => !incomingItemIds.has(item.id)
        );
        if (itemsToDelete.length > 0) {
          await tx.checklistItem.deleteMany({
            where: { id: { in: itemsToDelete.map((item) => item.id) } },
          });
        }

        // Items to update or create
        const upsertPromises = checklist.map(
          (item: ChecklistItemData, index: number) => {
            const data = {
              routineId: routineId,
              text: item.text,
              completed: item.completed ?? false, // Use provided completion or default
              level: item.level ?? 0,
              order: index, // Update order based on new array position
            };
            return tx.checklistItem.upsert({
              where: { id: item.id }, // Use ID to find existing
              update: data,
              // Ensure completed status from incoming checklist is used
              create: {
                ...data,
                id: item.id,
                completed: item.completed ?? false,
              },
            });
          }
        );
        await Promise.all(upsertPromises);

        // 3. Re-fetch the updated routine with the final checklist to return
        return tx.routine.findUnique({
          where: { id: routineId },
          include: {
            checklist: { orderBy: { order: "asc" } },
          },
        });
      }
    );

    return NextResponse.json(updatedRoutineWithChecklist);
  } catch (error) {
    console.error(`Error updating routine ${routineId}:`, error);
    return NextResponse.json(
      { error: "Failed to update routine" },
      { status: 500 }
    );
  }
}

// DELETE /api/routines/[id] - Delete a specific routine
export async function DELETE(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  const routineId = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // Check ownership
    const existingRoutine = await prisma.routine.findUnique({
      where: { id: routineId },
    });
    if (!existingRoutine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }
    if (existingRoutine.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Deleting the routine will cascade delete checklist items due to schema relation
    await prisma.routine.delete({
      where: { id: routineId },
    });

    return NextResponse.json(
      { message: "Routine deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting routine ${routineId}:`, error);
    return NextResponse.json(
      { error: "Failed to delete routine" },
      { status: 500 }
    );
  }
}

// Note: PATCH for toggling individual checklist items might be better handled
// in a separate route like /api/routines/[id]/checklist/[itemId]/toggle
// For simplicity now, toggling might be handled via PUT by sending the whole updated checklist.
