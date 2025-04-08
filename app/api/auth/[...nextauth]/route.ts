import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { API_BASE } from "@/lib/utils/authUtils"; // Import API base URL

export const authOptions: NextAuthOptions = {
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
        // Add logic here to look up the user from the credentials supplied
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Call your backend API to exchange credentials for a token
          const loginRes = await fetch(`${API_BASE}/token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded", // Backend expects form data for /token
            },
            // Encode credentials as form data
            body: new URLSearchParams({
              username: credentials.username,
              password: credentials.password,
              // grant_type: 'password', // Often required by OAuth token endpoints
              // client_id: 'your_client_id', // If required
              // client_secret: 'your_client_secret', // If required
            }),
          });

          if (!loginRes.ok) {
            // Log the error status and potentially the body
            const errorBody = await loginRes.text(); // Read body as text first
            console.error(
              `Login failed: ${loginRes.status} ${loginRes.statusText}`,
              errorBody
            );
            // Try to parse as JSON for specific error messages if possible
            try {
              const errorJson = JSON.parse(errorBody);
              throw new Error(
                errorJson.detail || "Invalid username or password"
              );
            } catch {
              throw new Error("Invalid username or password");
            }
          }

          const tokenData = await loginRes.json();

          if (tokenData.access_token) {
            // Return an object that will be stored in the JWT.
            // Include the access token and basic user info.
            // You might need another API call here to get full user details if needed.
            return {
              id: credentials.username, // Use username as ID if no user ID is returned
              name: credentials.username,
              // email: user.email, // Add if available/needed
              accessToken: tokenData.access_token,
              // refreshToken: tokenData.refresh_token, // Include if available/needed
              // accessTokenExpires: Date.now() + tokenData.expires_in * 1000, // Calculate expiry if available
            };
          } else {
            // If no token, return null - authentication failed
            return null;
          }
        } catch (error: any) {
          console.error("Authorize error:", error);
          // Throwing the error message might expose details, consider logging and returning null
          // throw new Error(error.message || "Authentication failed");
          return null; // Return null on error to indicate failure
        }
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use JSON Web Tokens for session management
  },
  callbacks: {
    // The jwt callback is called whenever a JWT is created or updated.
    // `token` is the JWT payload, `user` is the object returned from `authorize`.
    async jwt({ token, user, account }) {
      // Persist the access token and user id to the token right after signin
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id; // Or user.sub if your backend provides it
        // token.refreshToken = user.refreshToken;
        // token.accessTokenExpires = user.accessTokenExpires;
      }
      // TODO: Add logic here to refresh the access token if it's expired
      return token;
    },
    // The session callback is called whenever a session is checked.
    // `session` is the session object, `token` is the JWT payload from the `jwt` callback.
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from the token.
      session.accessToken = token.accessToken as string;
      if (session.user) {
        session.user.id = token.id as string; // Add id to session user object
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Redirect users to your custom login page
    // error: '/auth/error', // Error code passed in query string as ?error=
    // signOut: '/auth/signout',
    // verifyRequest: '/auth/verify-request', // (used for email/passwordless login)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
  },
  // Add secret for production
  secret: process.env.NEXTAUTH_SECRET, // Ensure this is set in your .env file
  // Enable debug messages in development
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
