"use client";

import { useCallback, useEffect, useState } from "react";
import { Locate, Search } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";

import type { NearbyLocation } from "./nearby-provider";
import { orpc, useQuery } from "~/orpc/react";

interface LocationSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectLocation: (location: NearbyLocation) => void;
}

export function LocationSearchModal({
  open,
  onOpenChange,
  onSelectLocation,
}: LocationSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: regionsData } = useQuery(
    orpc.map.location.regionsWithLocation.queryOptions({
      input: undefined,
    }),
  );

  const filteredRegions = regionsData?.regionsWithLocation?.filter((region) => {
    if (!searchQuery) return true;
    return region.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleUseCurrentLocation = useCallback(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onSelectLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "Current Location",
          });
        },
        (error) => {
          console.error("LocationSearchModal error getting location", {
            error,
          });
        },
      );
    }
  }, [onSelectLocation]);

  // Reset search when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for a city or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Use current location button */}
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleUseCurrentLocation}
          >
            <Locate className="size-4" />
            Use my current location
          </Button>

          {/* Region list */}
          <div className="max-h-[40vh] overflow-y-auto">
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              F3 Regions
            </div>
            <div className="mt-2 flex flex-col gap-1">
              {filteredRegions?.slice(0, 20).map((region) => (
                <Button
                  key={region.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onSelectLocation({
                      lat: region.lat,
                      lng: region.lon,
                      name: region.name,
                    });
                  }}
                >
                  {region.name}
                </Button>
              ))}
              {filteredRegions && filteredRegions.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No regions found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
