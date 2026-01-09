"use client";

import { Suspense } from "react";

import { NearbyHeader } from "./_components/nearby-header";
import { NearbyPageContent } from "./_components/nearby-page-content";
import { NearbyProvider } from "./_components/nearby-provider";
import { NearbySearchBar } from "./_components/nearby-search-bar";

export default function NearbyPage() {
  return (
    <NearbyProvider>
      <div className="flex min-h-dvh flex-col bg-background">
        <NearbyHeader />
        <NearbySearchBar />
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <div className="text-muted-foreground">Loading workouts...</div>
            </div>
          }
        >
          <NearbyPageContent />
        </Suspense>
      </div>
    </NearbyProvider>
  );
}
