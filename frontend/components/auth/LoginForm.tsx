"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common/button";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/common/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/common/tabs";

const AuthForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!username.trim() || !password) {
      setError("Username and password are required.");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const loginUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/players/login`;
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        let errorMessage = "Login failed.";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.detail || `Login failed (Status: ${response.status})`;
        } catch (parseError) {
          errorMessage = `Login failed: ${response.statusText} (Status: ${response.status})`;
        }
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const { access_token, token_type } = data;

      if (access_token && token_type === "bearer") {
        localStorage.setItem("accessToken", access_token);
        localStorage.setItem("tokenType", token_type);

        router.push("/");
      } else {
        setError("Login successful, but token was not received correctly.");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(
        `An unexpected error occurred during login: ${
          err.message || "Unknown error"
        }`
      );
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!username.trim() || !password || !confirmPassword) {
      setError("All fields are required for signup.");
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const signupUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/players/signup`;
      const response = await fetch(signupUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ username, password, description: "" }),
      });

      if (!response.ok) {
        let errorMessage = "Signup failed.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          errorMessage = `Signup failed: ${response.statusText} (Status: ${response.status})`;
        }
        setError(errorMessage);
      } else {
        setSuccess("Signup successful! Please log in.");
        setActiveTab("login");

        setUsername("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      console.error("Signup Error:", err);
      setError(
        `An unexpected error occurred: ${err.message || "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Player Login
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && activeTab === "login" && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              {success && activeTab === "login" && (
                <p className="text-sm text-success text-center">{success}</p>
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
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Create Account
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              {error && activeTab === "signup" && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="signup-username">Username</Label>
                <Input
                  id="signup-username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="text-foreground"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing up..." : "Sign Up"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AuthForm;
