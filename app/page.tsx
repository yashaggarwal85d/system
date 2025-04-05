"use client";

import React, { useEffect, useState } from "react"; // Import useState
import { useRouter } from "next/navigation";
import RainingLetters from "@/components/common/RainingLetters";
import NeuralVaultPopup from "@/components/common/NeuralVaultPopup";
import Dashboard from "@/components/Dashboard";
import useDashboardStore from "@/store/dashboardStore";
// import { useSession, signIn } from "next-auth/react"; // Remove useSession and signIn
import { Button } from "@/components/common/button"; // Keep Button if needed for other purposes

export default function Home() {
  // const { data: session, status } = useSession(); // Remove useSession
  const router = useRouter();
  const fetchPlayer = useDashboardStore((state) => state.fetchPlayer); // Keep fetchPlayer, but its usage might change
  const [isVaultPopupOpen, setIsVaultPopupOpen] = useState(false);
  const [hasVaultPopupBeenShown, setHasVaultPopupBeenShown] = useState(false);
  const player = useDashboardStore((state) => state.player);
  const isLoadingStore = useDashboardStore((state) => state.isLoading);
  const storeError = useDashboardStore((state) => state.error);
  // const userId = session?.user?.id; // Remove userId derived from session

  // State to track authentication based on token presence
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  useEffect(() => {
    // Check for token in localStorage on mount
    const token = localStorage.getItem("accessToken");
    if (token) {
      setAuthStatus("authenticated");
      // If authenticated and player data isn't loaded, fetch it
      // Assumes fetchPlayer now fetches '/players/me' using the token
      if (!player) {
        fetchPlayer(); // Call fetchPlayer without userId
      }
    } else {
      setAuthStatus("unauthenticated");
      router.replace("/login"); // Redirect if no token
    }
  }, [fetchPlayer, player, router]); // Add dependencies

  // Effect to show popup once when authenticated and player loaded
  useEffect(() => {
    if (authStatus === "authenticated" && player && !hasVaultPopupBeenShown) {
      setIsVaultPopupOpen(true);
      setHasVaultPopupBeenShown(true);
    } else if (authStatus !== "authenticated" || !player) {
      setIsVaultPopupOpen(false);
      setHasVaultPopupBeenShown(false);
    }
  }, [authStatus, player, hasVaultPopupBeenShown]);

  // Show loading based on auth check OR store loading state
  if (
    authStatus === "loading" ||
    (authStatus === "authenticated" && isLoadingStore && !player)
  ) {
    return (
      <main className="min-h-screen">
        <RainingLetters />
        <p className="text-center text-muted-foreground">Initializing...</p>
      </main>
    );
  }

  // Handle store error state (keep this logic)
  if (storeError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <RainingLetters />
        <p className="text-red-500">Error loading player data: {storeError}</p>
        {/* Button might need different action now, e.g., clear token and reload? */}
        <Button
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("tokenType");
            router.replace("/login"); // Or window.location.reload();
          }}
          className="mt-4"
        >
          Logout & Try Again
        </Button>
      </main>
    );
  }

  // If authenticated and player data is loaded, show dashboard
  if (authStatus === "authenticated" && player) {
    return (
      <main className="min-h-screen">
        <RainingLetters />
        <Dashboard />
        <NeuralVaultPopup
          isOpen={isVaultPopupOpen}
          onOpenChange={setIsVaultPopupOpen}
        />
      </main>
    );
  }

  // Fallback or state during redirect
  return (
    <main className="min-h-screen">
      <RainingLetters />
    </main>
  );
}
