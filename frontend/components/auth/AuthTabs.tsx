"use client";

import React, { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/common/tabs";
import ActualLoginForm from "./LoginForm";
import SignupFormContainer from "./SignupForm";

const AuthTabs = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [prefilledUsername, setPrefilledUsername] = useState<string | null>(
    null
  );

  const handleSignupSuccess = (username: string) => {
    setPrefilledUsername(username);
    setActiveTab("login");
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <ActualLoginForm prefilledUsername={prefilledUsername} />
      </TabsContent>

      <TabsContent value="signup">
        <SignupFormContainer onSignupSuccess={handleSignupSuccess} />
      </TabsContent>
    </Tabs>
  );
};

export default AuthTabs;
