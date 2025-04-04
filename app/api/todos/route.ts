import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed
import prisma from "@/lib/prisma";
import { Task } from "@prisma/client"; // Import generated Task type
import { calculateBaseAuraValue } from "@/lib/utils"; // Import aura calculation

// GET /api/todos - Fetch user's todos
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const todos = await prisma.task.findMany({
      where: {
        userId: userId,
        category: "todo", // Filter for todos
      },
      orderBy: {
        createdAt: "desc", // Or order by deadline, etc.
      },
    });
    return NextResponse.json(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    return NextResponse.json(
      { error: "Failed to fetch todos" },
      { status: 500 }
    );
  }
}

// POST /api/todos - Add a new todo
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const { title, deadline } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Basic validation/parsing for deadline if provided
    let deadlineDate: Date | null = null;
    if (deadline) {
      deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid deadline format" },
          { status: 400 }
        );
      }
    }

    const newTodo = await prisma.task.create({
      data: {
        userId: userId,
        title: title,
        category: "todo",
        completed: false,
        deadline: deadlineDate,
        auraValue: calculateBaseAuraValue("todo"), // Calculate and set aura value
        // Explicitly set other Task fields to defaults/null for clarity
        isHabit: false,
        // frequency: null, // Omit optional JSON field instead of setting to null
        isGoodHabit: null,
        lastCompleted: null,
        nextDue: null,
        originalTime: null,
      },
    });

    return NextResponse.json(newTodo, { status: 201 });
  } catch (error) {
    console.error("Error creating todo:", error);
    // Check for specific Prisma errors if needed
    return NextResponse.json(
      { error: "Failed to create todo" },
      { status: 500 }
    );
  }
}
