"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NeuralVaultPopup from "@/components/providers/NeuralVaultPopup";
import Dashboard from "@/components/Dashboard";
import useDashboardStore from "@/store/dashboardStore";
import { Button } from "@/components/common/button";

export default function Home() {
  const router = useRouter();
  const fetchPlayer = useDashboardStore((state) => state.fetchPlayer);
  const [isVaultPopupOpen, setIsVaultPopupOpen] = useState(false);
  const [hasVaultPopupBeenShown, setHasVaultPopupBeenShown] = useState(false);
  const player = useDashboardStore((state) => state.player);
  const isLoadingStore = useDashboardStore((state) => state.isLoading);
  const storeError = useDashboardStore((state) => state.error);

  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setAuthStatus("authenticated");
      if (!player) {
        fetchPlayer();
      }
    } else {
      setAuthStatus("unauthenticated");
      router.replace("/login");
    }
  }, [fetchPlayer, player, router]);

  useEffect(() => {
    if (authStatus === "authenticated" && player && !hasVaultPopupBeenShown) {
      setIsVaultPopupOpen(true);
      setHasVaultPopupBeenShown(true);
    } else if (authStatus !== "authenticated" || !player) {
      setIsVaultPopupOpen(false);
      setHasVaultPopupBeenShown(false);
    }
  }, [authStatus, player, hasVaultPopupBeenShown]);

  if (
    authStatus === "loading" ||
    (authStatus === "authenticated" && isLoadingStore && !player)
  ) {
    return (
      <main className="min-h-screen">
        <p className="text-center text-muted-foreground">Initializing...</p>
      </main>
    );
  }

  if (storeError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500">Error loading player data: {storeError}</p>
        <Button
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("tokenType");
            router.replace("/login");
          }}
          className="mt-4"
        >
          Logout & Try Again
        </Button>
      </main>
    );
  }

  if (authStatus === "authenticated" && player) {
    return (
      <main className="min-h-screen">
        <Dashboard />
        <NeuralVaultPopup
          isOpen={isVaultPopupOpen}
          onOpenChange={setIsVaultPopupOpen}
        />
      </main>
    );
  }

  return <main className="min-h-screen"></main>;
}
