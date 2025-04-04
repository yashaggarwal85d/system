"use client";

import React, { useEffect, useState } from "react"; // Import useState
import { useRouter } from "next/navigation";
import RainingLetters from "@/components/ui/RainingLetters";
import NeuralVaultPopup from "@/components/ui/NeuralVaultPopup"; // Import the popup
import Dashboard from "@/components/Dashboard";
import useDashboardStore from "@/store/dashboardStore";
import { useSession, signIn } from "next-auth/react"; // Import useSession and signIn
import { Button } from "@/components/ui/button"; // For potential sign in button

export default function Home() {
  const { data: session, status } = useSession(); // Use next-auth session hook
  const router = useRouter();
  const fetchPlayer = useDashboardStore((state) => state.fetchPlayer);
  const [isVaultPopupOpen, setIsVaultPopupOpen] = useState(false); // State for popup
  const player = useDashboardStore((state) => state.player);
  const isLoadingStore = useDashboardStore((state) => state.isLoading); // Keep track of store loading
  const storeError = useDashboardStore((state) => state.error);
  const userId = session?.user?.id; // Extract userId, which is more stable than the whole session object

  useEffect(() => {
    // Use the extracted userId in the condition
    if (status === "authenticated" && userId && !player) {
      // If authenticated and player data is not in the store yet, trigger fetch.
      fetchPlayer(userId);
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
    // Dependencies are now more stable
  }, [status, userId, player, fetchPlayer, router]); // Use userId instead of session

  // Effect to show popup every time when authenticated and player loaded
  useEffect(() => {
    if (status === "authenticated" && player) {
      // Removed sessionStorage check
      setIsVaultPopupOpen(true);
    } else {
      // Ensure popup is closed if not authenticated or player not loaded
      setIsVaultPopupOpen(false);
    }
  }, [status, player]); // Run when status or player changes

  // Show loading if session status is loading OR if authenticated but player data is still loading from the store
  if (
    status === "loading" ||
    (status === "authenticated" && isLoadingStore && !player)
  ) {
    return (
      <main className="min-h-screen">
        <RainingLetters />
        {/* Optional: Add a subtle loading indicator */}
        <p className="text-center text-muted-foreground">Initializing...</p>
      </main>
    );
  }

  // Handle store error state
  if (storeError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <RainingLetters />
        <p className="text-red-500">Error loading player data: {storeError}</p>
        {/* Optionally add a button to retry or sign out */}
        <Button onClick={() => signIn()} className="mt-4">
          Try Again
        </Button>
      </main>
    );
  }

  // If authenticated and player data is loaded, show dashboard
  if (status === "authenticated" && player) {
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
