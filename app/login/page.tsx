import React from "react";
import AuthForm from "@/components/auth/LoginForm"; 

const LoginPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <AuthForm />
    </div>
  );
};

export default LoginPage;
