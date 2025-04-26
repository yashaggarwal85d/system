"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InteractiveHoverButton } from "@/components/common/interactive-hover-button";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/common/card";
import ProfileFormSteps from "./ProfileFormSteps";
import { isValidGitHubUrl } from "@/lib/utils/commonUtils";
import {
  updatePlayer,
  fetchPlayerData,
  loginPlayer,
} from "@/lib/utils/apiUtils";
import { Player } from "@/lib/utils/interfaces";

interface ActualLoginFormProps {
  prefilledUsername: string | null;
}

const ActualLoginForm = ({ prefilledUsername }: ActualLoginFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const router = useRouter();

  const [profileFormData, setProfileFormData] = useState<Partial<Player>>({});
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { id, value } = e.target;
    setProfileFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleMentorChange = (value: string) => {
    setProfileFormData((prev: any) => ({ ...prev, mentor: value }));
  };

  useEffect(() => {
    if (currentStep === 1 && prefilledUsername) {
      setUsername(prefilledUsername);
      document.getElementById("login-password")?.focus();
    }
  }, [prefilledUsername, currentStep]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoginLoading(true);

    if (!username.trim() || !password) {
      setLoginError("Username and password are required.");
      setIsLoginLoading(false);
      return;
    }

    try {
      const loginData = await loginPlayer(username, password);
      const { access_token, token_type } = loginData;

      if (!access_token || token_type !== "bearer") {
        setLoginError(
          "Login successful, but token was not received correctly."
        );
        setIsLoginLoading(false);
        return;
      }

      localStorage.setItem("accessToken", access_token);
      localStorage.setItem("tokenType", token_type);

      try {
        const playerData = await fetchPlayerData();
        setProfileFormData({
          current_problems: playerData.current_problems || "",
          ideal_future: playerData.ideal_future || "",
          biggest_fears: playerData.biggest_fears || "",
          past_issues: playerData.past_issues || "",
          obsidian_notes: playerData.obsidian_notes || "",
          mentor: playerData.mentor || "",
        });
        setCurrentStep(2);
        setIsLoginLoading(false);
      } catch (fetchErr: any) {
        console.error("Failed to fetch player data after login:", fetchErr);
        setLoginError(
          `Login successful, but failed to load profile: ${
            fetchErr.message || "Unknown error"
          }. Redirecting to dashboard...`
        );

        setTimeout(() => router.push("/"), 3000);
        setIsLoginLoading(false);
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setLoginError(`Username or password is incorrect`);
      setIsLoginLoading(false);
    }
  };

  const handleProfileNext = () => {
    if (!profileFormData.current_problems || !profileFormData.ideal_future) {
      setProfileError("Please fill in Problems and Ideal Future.");
      return;
    }
    setProfileError("");
    setCurrentStep(3);
  };

  const handleProfileBack = () => {
    setProfileError("");
    setCurrentStep(currentStep - 1);
  };

  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setIsProfileLoading(true);

    if (
      !profileFormData.current_problems ||
      !profileFormData.ideal_future ||
      !profileFormData.biggest_fears ||
      !profileFormData.mentor
    ) {
      setProfileError(
        "Please fill in all required profile fields (including Biggest Fears)."
      );
      setIsProfileLoading(false);
      return;
    }

    if (
      profileFormData.obsidian_notes &&
      !isValidGitHubUrl(profileFormData.obsidian_notes)
    ) {
      setProfileError("Invalid GitHub URL format for Obsidian Notes.");
      setIsProfileLoading(false);
      return;
    }

    try {
      const updateData: Partial<Player> = {
        current_problems: profileFormData.current_problems,
        ideal_future: profileFormData.ideal_future,
        biggest_fears: profileFormData.biggest_fears,
        past_issues: profileFormData.past_issues,
        obsidian_notes: profileFormData.obsidian_notes,
        mentor: profileFormData.mentor,
      };

      await updatePlayer(updateData);
      router.push("/");
    } catch (err: any) {
      console.error("Profile Update Error:", err);
      setProfileError(
        err.response?.data?.detail || err.message || "Failed to update profile."
      );
      setIsProfileLoading(false);
    }
  };

  return (
    <>
      {/* Step 1: Login Form */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Player Login
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {loginError && (
                <p className="text-sm text-destructive text-center">
                  {loginError}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="text-foreground"
                  disabled={isLoginLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-foreground"
                  disabled={isLoginLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <InteractiveHoverButton
                type="submit"
                className="w-full"
                disabled={isLoginLoading}
              >
                {isLoginLoading ? "Logging in..." : "Login"}
              </InteractiveHoverButton>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Steps 2 & 3: Profile Setup using shared component */}
      {currentStep === 2 && (
        <ProfileFormSteps
          step={1}
          formData={profileFormData}
          error={profileError}
          isLoading={isProfileLoading}
          onChange={handleProfileChange}
          onMentorChange={handleMentorChange}
          onBack={handleProfileBack}
          onNext={handleProfileNext}
        />
      )}

      {currentStep === 3 && (
        <ProfileFormSteps
          step={2}
          formData={profileFormData}
          error={profileError}
          isLoading={isProfileLoading}
          onChange={handleProfileChange}
          onMentorChange={handleMentorChange}
          onBack={handleProfileBack}
          onSubmit={handleProfileUpdateSubmit}
          submitButtonText={
            isProfileLoading ? "Updating Profile..." : "Submit Profile"
          }
        />
      )}
    </>
  );
};

export default ActualLoginForm;
