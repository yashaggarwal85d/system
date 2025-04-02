import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma"; // Use the shared instance
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: "Credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing username or password");
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user || !user.password) {
          // User not found or password not set (shouldn't happen with signup)
          throw new Error("Invalid username or password");
        }

        // Check password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Invalid username or password");
        }

        // Return user object (without password) if credentials are valid
        // next-auth will handle session creation
        return {
          id: user.id,
          name: user.username, // Use username for next-auth's 'name' field
          // email: user.email, // Add email if you have it
          // image: user.image, // Add image if you have it
        };
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use JSON Web Tokens for session management
  },
  secret: process.env.NEXTAUTH_SECRET, // Secret for signing JWTs - MUST be set in .env
  pages: {
    signIn: "/login", // Redirect users to custom login page
    // error: '/auth/error', // Optional: Custom error page
    // signOut: '/auth/signout', // Optional: Custom signout page
  },
  callbacks: {
    // Include user ID in the session
    async session({ session, token }) {
      if (token?.sub) {
        // token.sub is the user ID from the JWT
        session.user.id = token.sub;
      }
      return session;
    },
    // Include user ID in the JWT
    async jwt({ token, user }) {
      if (user?.id) {
        // user object is available on initial sign in
        token.sub = user.id;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
