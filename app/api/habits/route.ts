import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { HabitConfig } from "@/lib/interfaces/habit";
import { calculateNextDueDate, calculateBaseAuraValue } from "@/lib/utils";

// GET /api/habits - Fetch user's habits
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const habits = await prisma.task.findMany({
      where: {
        userId: userId,
        category: "habit",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const now = new Date();
    // Process habits to reset completion status if nextDue has passed
    const processedHabits = habits.map((habit) => {
      if (habit.completed && habit.nextDue && new Date(habit.nextDue) < now) {
        // If completed and the due date is in the past, reset completion
        // Note: We don't update the DB here, just return the adjusted state
        return { ...habit, completed: false };
      }
      return habit; // Return unchanged if not completed or not past due
    });
    return NextResponse.json(processedHabits);
  } catch (error) {
    console.error("Error fetching habits:", error);
    return NextResponse.json(
      { error: "Failed to fetch habits" },
      { status: 500 }
    );
  }
}

// POST /api/habits - Add a new habit
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    // Destructure expected habit fields
    const { title, frequency } = body;
    const config = frequency as HabitConfig; // Assume frequency is the HabitConfig object

    // --- Validation ---
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
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
      !/^\d{2}:\d{2}$/.test(config.time) ||
      typeof config.isGoodHabit !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid habit frequency configuration" },
        { status: 400 }
      );
    }
    // --- End Validation ---

    const initialNextDue = calculateNextDueDate(new Date(), config);
    if (!initialNextDue) {
      // This should ideally not happen with validated config, but handle defensively
      return NextResponse.json(
        { error: "Could not calculate initial due date" },
        { status: 400 }
      );
    }

    const newHabit = await prisma.task.create({
      data: {
        userId: userId,
        title: title,
        category: "habit",
        completed: false, // Habits start incomplete for the period
        isHabit: true,
        frequency: config, // Store the config object directly as JSON
        isGoodHabit: config.isGoodHabit,
        originalTime: config.time,
        nextDue: initialNextDue,
        auraValue: calculateBaseAuraValue("habit", config), // Calculate and set aura value
        // deadline, lastCompleted are null by default
      },
    });

    return NextResponse.json(newHabit, { status: 201 });
  } catch (error) {
    console.error("Error creating habit:", error);
    return NextResponse.json(
      { error: "Failed to create habit" },
      { status: 500 }
    );
  }
}
