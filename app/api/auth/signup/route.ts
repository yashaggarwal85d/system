import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Import shared Prisma client instance
import bcrypt from "bcryptjs";

// Remove local Prisma client instantiation: const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username already taken" },
        { status: 409 }
      ); // 409 Conflict
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10

    // Create the user and their associated player profile
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        player: {
          create: {}, // Create a default player profile
        },
      },
      include: {
        player: true, // Include the created player in the response if needed
      },
    });

    // Don't send the password back in the response
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({ user: userWithoutPassword }, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      { message: "An internal server error occurred" },
      { status: 500 }
    );
  } // Remove finally block with disconnect for shared instance
}
