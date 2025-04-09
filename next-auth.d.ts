import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";


declare module "next-auth" {
  interface Session {
    accessToken?: string; 
    user: {
      id: string; 
      username?: string; 
    } & DefaultSession["user"]; 
  }

  
  interface User extends DefaultUser {
    accessToken?: string; 
    
  }
}


declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string; 
    id?: string; 
    
    
  }
}
