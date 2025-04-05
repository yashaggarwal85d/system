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
  CardDescription, // Import CardDescription
} from "@/components/common/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/common/tabs";
// import { signIn } from "next-auth/react"; // Remove next-auth signIn

// Combined Login/Signup Form Component
const AuthForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // For signup
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // For signup success message
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login"); // Control active tab
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
      // Prepare form data for the backend
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch("http://localhost:8000/players/login", {
        // TODO: Use env variable
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        // Handle login failure (e.g., 401 Unauthorized)
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
        return; // Stop execution on failure
      }

      // Handle login success
      const data = await response.json();
      const { access_token, token_type } = data;

      if (access_token && token_type === "bearer") {
        // Store the token (e.g., in localStorage - consider security implications)
        localStorage.setItem("accessToken", access_token);
        localStorage.setItem("tokenType", token_type);

        // Redirect to the main page or dashboard
        router.push("/");
        // router.refresh(); // May not be needed if redirect handles state update
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
      setIsLoading(false); // Ensure loading state is reset on error
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
    // Add password strength validation if desired

    try {
      // Call the FastAPI backend signup endpoint
      const response = await fetch("http://localhost:8000/players/signup", {
        // TODO: Use env variable for base URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Include all required fields from the backend Player model
        body: JSON.stringify({ username, password, description: "" }), // Added default description
      });

      // Check if the request was successful (status code 2xx)
      if (!response.ok) {
        // Try to parse error message from backend response
        let errorMessage = "Signup failed.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage; // FastAPI often uses 'detail' for errors
        } catch (parseError) {
          // If parsing fails, use the status text
          errorMessage = `Signup failed: ${response.statusText} (Status: ${response.status})`;
        }
        setError(errorMessage);
      } else {
        setSuccess("Signup successful! Please log in.");
        setActiveTab("login"); // Switch to login tab
        // Clear only signup-related fields if needed, or all
        setUsername("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      // Catch specific error types if needed
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

        {/* Login Tab */}
        <TabsContent value="login">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Player Login
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && activeTab === "login" && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
              {success && activeTab === "login" && (
                <p className="text-sm text-green-500 text-center">{success}</p>
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

        {/* Signup Tab */}
        <TabsContent value="signup">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Create Account
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              {error && activeTab === "signup" && (
                <p className="text-sm text-red-500 text-center">{error}</p>
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

export default AuthForm; // Rename export
