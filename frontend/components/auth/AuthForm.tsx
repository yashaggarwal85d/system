"use client";

import React from "react";
import { Card } from "@/components/common/card";
import AuthTabs from "./AuthTabs";

const AuthCard = () => {
  return (
    <Card className="w-full max-w-sm">
      <AuthTabs />
    </Card>
  );
};

export default AuthCard;
