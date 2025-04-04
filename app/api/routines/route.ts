import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import prisma from "@/lib/prisma";
import { Routine, ChecklistItem } from "@prisma/client"; // Import generated types
import { HabitConfig } from "@/lib/interfaces/habit"; // Frequency uses similar structure
import { ChecklistItemData } from "@/components/ui/checklist-item"; // For input type validation
import { calculateNextDueDate, calculateBaseAuraValue } from "@/lib/utils"; // Import utils

// GET /api/routines - Fetch user's routines (including checklist items)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const routines = await prisma.routine.findMany({
      where: { userId: userId },
      include: {
        checklist: {
          // Include checklist items
          orderBy: {
            order: "asc", // Ensure checklist items are ordered correctly
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Or order as needed
      },
    });

    const now = new Date();
    // Process routines to reset completion status if nextDue has passed
    const processedRoutines = routines.map((routine) => {
      if (
        routine.completed &&
        routine.nextDue &&
        new Date(routine.nextDue) < now
      ) {
        // If completed and the due date is in the past, reset completion
        // Note: We don't update the DB here, just return the adjusted state
        return { ...routine, completed: false };
      }
      return routine; // Return unchanged if not completed or not past due
    });

    return NextResponse.json(processedRoutines);
  } catch (error) {
    console.error("Error fetching routines:", error);
    return NextResponse.json(
      { error: "Failed to fetch routines" },
      { status: 500 }
    );
  }
}

// POST /api/routines - Add a new routine
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { name, frequency, checklist } = body;
    const config = frequency as HabitConfig; // Assume frequency uses HabitConfig structure

    // --- Validation ---
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Routine name is required" },
        { status: 400 }
      );
    }
    // --- Validation ---
    // ... (name validation) ...
    // Add full frequency validation
    if (
      !config ||
      typeof config !== "object" ||
      typeof config.count !== "number" ||
      config.count < 1 ||
      typeof config.period !== "string" ||
      !["days", "weeks", "months"].includes(config.period) ||
      typeof config.value !== "number" ||
      config.value < 1 ||
      typeof config.time !== "string" ||
      !/^\d{2}:\d{2}$/.test(config.time)
      // Note: Routines don't have isGoodHabit in their frequency config
    ) {
      return NextResponse.json(
        { error: "Invalid routine frequency configuration" },
        { status: 400 }
      );
    }
    if (!Array.isArray(checklist)) {
      return NextResponse.json(
        { error: "Checklist must be an array" },
        { status: 400 }
      );
    }
    // Basic validation for checklist items
    for (const item of checklist as Partial<ChecklistItemData>[]) {
      if (typeof item.text !== "string" || typeof item.level !== "number") {
        return NextResponse.json(
          { error: "Invalid checklist item format" },
          { status: 400 }
        );
      }
    }
    // --- End Validation ---

    const initialNextDue = calculateNextDueDate(new Date(), config);

    // Use Prisma transaction to create routine and its checklist items together
    const newRoutineWithChecklist = await prisma.$transaction(async (tx) => {
      const newRoutine = await tx.routine.create({
        data: {
          userId: userId,
          name: name,
          frequency: config, // Store frequency config
          completed: false,
          nextDue: initialNextDue ?? null,
          auraValue: calculateBaseAuraValue("routine", config), // Calculate and set aura value
          // lastCompleted is null by default
        },
      });

      if (checklist.length > 0) {
        await tx.checklistItem.createMany({
          data: checklist.map((item: ChecklistItemData, index: number) => ({
            routineId: newRoutine.id,
            text: item.text,
            completed: false, // Start unchecked
            level: item.level ?? 0,
            order: index, // Use array index for initial order
          })),
        });
      }

      // Re-fetch the routine with the newly created checklist items
      return tx.routine.findUnique({
        where: { id: newRoutine.id },
        include: {
          checklist: { orderBy: { order: "asc" } },
        },
      });
    });

    return NextResponse.json(newRoutineWithChecklist, { status: 201 });
  } catch (error) {
    console.error("Error creating routine:", error);
    return NextResponse.json(
      { error: "Failed to create routine" },
      { status: 500 }
    );
  }
}
