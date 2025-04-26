"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common/button";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import {
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Card,
} from "@/components/common/card";
import ProfileFormSteps from "./ProfileFormSteps";
import { isValidGitHubUrl } from "@/lib/utils/commonUtils";
import { loginPlayer, signupPlayer } from "@/lib/utils/apiUtils";
import { Player } from "@/lib/utils/interfaces";

interface SignupFormContainerProps {
  onSignupSuccess: (username: string) => void;
}

const isStrongPassword = (password: string): boolean => {
  const strongRegex = new RegExp(
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
  );
  return strongRegex.test(password);
};

const SignupFormContainer = ({ onSignupSuccess }: SignupFormContainerProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    current_problems: "",
    ideal_future: "",
    biggest_fears: "",
    past_issues: "",
    obsidian_notes: "",
    mentor: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleNext = () => {
    setError("");

    if (currentStep === 1) {
      if (
        !formData.username.trim() ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        setError("Username and passwords are required.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!isStrongPassword(formData.password)) {
        setError(
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
        );
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.current_problems || !formData.ideal_future) {
        setError("Please fill in Problems and Ideal Future.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setError("");
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.obsidian_notes && !isValidGitHubUrl(formData.obsidian_notes)) {
      setError("Invalid GitHub URL format for Obsidian Notes.");
      return;
    }

    if (
      !formData.username ||
      !formData.password ||
      !formData.current_problems ||
      !formData.ideal_future ||
      !formData.biggest_fears ||
      !formData.mentor
    ) {
      setError(
        "A required field is missing. Please ensure all steps are completed."
      );
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...signupData } = formData;
      await signupPlayer(
        signupData as Omit<Player, "level" | "aura" | "description"> & {
          password: string;
        }
      );
      try {
        const loginData = await loginPlayer(
          formData.username,
          formData.password
        );
        const { access_token, token_type } = loginData;
        localStorage.setItem("accessToken", access_token);
        localStorage.setItem("tokenType", token_type);
        router.push("/");
      } catch (err: any) {
        console.error("Login Error:", err);
        setError("Auto Login Failed, try manually");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Signup or Auto-login Error:", err);
      setError("Username already registered, use another username");
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleMentorChange = (value: string) => {
    setFormData((prev) => ({ ...prev, mentor: value }));
  };

  return (
    <>
      {/* Step 1: Credentials */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Sign Up - Step 1 of 3
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-destructive text-center mb-4">
                {error}
              </p>
            )}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Create your account credentials.
              </p>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="text-foreground"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="text-foreground"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="text-foreground"
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            {" "}
            {/* Only Next button for step 1 */}
            <Button type="button" onClick={handleNext} disabled={isLoading}>
              Next
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Profile Setup using shared component */}
      {currentStep === 2 && (
        <ProfileFormSteps
          step={1}
          formData={formData}
          error={error}
          isLoading={isLoading}
          onChange={handleChange}
          onMentorChange={handleMentorChange}
          onBack={handleBack}
          onNext={handleNext}
        />
      )}

      {/* Step 3: Profile Setup using shared component */}
      {currentStep === 3 && (
        <ProfileFormSteps
          step={2}
          formData={formData}
          error={error}
          isLoading={isLoading}
          onChange={handleChange}
          onMentorChange={handleMentorChange}
          onBack={handleBack}
          onSubmit={handleSignupSubmit}
          submitButtonText={isLoading ? "Signing Up..." : "Sign Up"}
        />
      )}
    </>
  );
};

export default SignupFormContainer;
