import React from "react";
import AuthForm from "@/components/auth/LoginForm";

const LoginPage = () => {
  return (
    // Removed bg-background to allow swirl canvas from layout to show through
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <AuthForm />
    </div>
  );
};

export default LoginPage;
