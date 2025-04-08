import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// Extend the default Session type
declare module "next-auth" {
  interface Session {
    accessToken?: string; // Add accessToken property
    user: {
      id: string; // Add the id property
      username?: string; // Add the username property (make optional if not always present)
    } & DefaultSession["user"]; // Keep the default properties
  }

  // Extend the default User type (returned by authorize function)
  interface User extends DefaultUser {
    accessToken?: string; // Add accessToken property
    // You can add other custom properties here if needed
  }
}

// Extend the default JWT type
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string; // Add accessToken property
    id?: string; // Add id property (added in jwt callback)
    // The 'sub' property already exists, but you could add others
    // Example: role?: string;
  }
}
