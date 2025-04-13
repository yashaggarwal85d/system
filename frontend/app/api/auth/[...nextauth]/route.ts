import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { API_BASE } from "@/lib/utils/authUtils"; 

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      
      name: "Credentials",
      
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          
          const loginRes = await fetch(`${API_BASE}/token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded", 
            },
            
            body: new URLSearchParams({
              username: credentials.username,
              password: credentials.password,
              
              
              
            }),
          });

          if (!loginRes.ok) {
            
            const errorBody = await loginRes.text(); 
            console.error(
              `Login failed: ${loginRes.status} ${loginRes.statusText}`,
              errorBody
            );
            
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
            
            
            
            return {
              id: credentials.username, 
              name: credentials.username,
              
              accessToken: tokenData.access_token,
              
              
            };
          } else {
            
            return null;
          }
        } catch (error: any) {
          console.error("Authorize error:", error);
          
          
          return null; 
        }
      },
    }),
  ],
  session: {
    strategy: "jwt", 
  },
  callbacks: {
    
    
    async jwt({ token, user, account }) {
      
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id; 
        
        
      }
      
      return token;
    },
    
    
    async session({ session, token }) {
      
      session.accessToken = token.accessToken as string;
      if (session.user) {
        session.user.id = token.id as string; 
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", 
    
    
    
    
  },
  
  secret: process.env.NEXTAUTH_SECRET, 
  
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
