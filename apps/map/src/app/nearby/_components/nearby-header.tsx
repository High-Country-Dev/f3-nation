"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, MapPin, X } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";

import { DISTANCE_OPTIONS, useNearby } from "./nearby-provider";
import { LocationSearchModal } from "./location-search-modal";

export function NearbyHeader() {
  const { selectedLocation, setSelectedLocation, maxDistance, setMaxDistance } =
    useNearby();

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        {/* Top bar with logo and close */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </Link>
            <ChevronDown className="size-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-base font-semibold">F3 Near Me</h1>
            <p className="text-xs text-muted-foreground">f3near.me</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground"
            >
              <MapPin className="size-5" />
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-center gap-2 border-t border-border px-4 py-2 text-sm">
          <span className="text-muted-foreground">WITHIN</span>

          {/* Distance dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto gap-1 px-2 py-1 font-semibold text-primary"
              >
                {maxDistance} MILES
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {DISTANCE_OPTIONS.map((distance) => (
                <DropdownMenuItem
                  key={distance}
                  onClick={() => setMaxDistance(distance)}
                  className={distance === maxDistance ? "bg-accent" : ""}
                >
                  {distance} miles
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-muted-foreground">OF</span>

          {/* Location selector */}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-1 px-2 py-1 font-semibold text-primary"
            onClick={() => setIsLocationModalOpen(true)}
          >
            {selectedLocation?.name ?? "Select Location"}
            <ChevronDown className="size-3" />
          </Button>
        </div>
      </header>

      <LocationSearchModal
        open={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
        onSelectLocation={(location) => {
          setSelectedLocation(location);
          setIsLocationModalOpen(false);
        }}
      />
    </>
  );
}
