import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// Extend the default Session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string; // Add the id property
    } & DefaultSession["user"]; // Keep the default properties
  }

  // Extend the default User type (returned by authorize function)
  interface User extends DefaultUser {
    // You can add other custom properties here if needed
  }
}

// Extend the default JWT type
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    // The 'sub' property already exists, but you could add others
    // Example: role?: string;
  }
}
