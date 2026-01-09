"use client";

import { Search } from "lucide-react";

import { Input } from "@acme/ui/input";

import { useNearby } from "./nearby-provider";

export function NearbySearchBar() {
  const { searchQuery, setSearchQuery } = useNearby();

  return (
    <div className="border-b border-border bg-background px-4 py-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Find a workout"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-muted/50 pl-9"
        />
      </div>
    </div>
  );
}
