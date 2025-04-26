"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { InteractiveHoverButton } from "@/components/common/interactive-hover-button";

const InfoPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg text-foreground p-8 text-center">
      <p className="text-xs uppercase tracking-wider">Done being weak?</p>
      <p className="text-xs uppercase tracking-wider mb-4">
        Shogun Forge Club forges warriors, not cowards!
      </p>
      <div>
        <Image
          src="/poster.png"
          alt="App Logo"
          width={200}
          height={200}
          className="max-h-[53vh] w-auto object-contain"
          priority
        />
      </div>
      <br />
      <p className="text-sm uppercase tracking-wide mb-1">
        Discipline,
        <br />
        Prosperity,
        <br />
        Mastery...
      </p>
      <p className="text-xl md:text-2xl font-semibold uppercase tracking-wider mb-6">
        Our Way of Life.
      </p>
      <InteractiveHoverButton
        className="bg-foreground text-background text-3xl md:text-4xl font-bold uppercase tracking-tight mb-6"
        onClick={() => router.push("/login")}
      >
        Enlist now
      </InteractiveHoverButton>
      <p className="text-xs uppercase tracking-wider">Shogun Forge Club.</p>
    </div>
  );
};

export default InfoPage;
