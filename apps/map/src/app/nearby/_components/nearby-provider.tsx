"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

import type { DayOfWeek } from "@acme/shared/app/enums";

import { orpc, useQuery } from "~/orpc/react";

export interface NearbyWorkout {
  id: number;
  locationId: number;
  name: string;
  aoName: string | null;
  logo: string | null;
  dayOfWeek: DayOfWeek | null;
  startTime: string | null;
  endTime?: string | null;
  eventTypes: { id: number; name: string }[];
  lat: number | null;
  lon: number | null;
  fullAddress: string | null;
  distance: number | null;
  regionName: string | null;
  description?: string | null;
}

export interface NearbyLocation {
  lat: number;
  lng: number;
  name: string | null;
}

interface NearbyContextType {
  // Location state
  selectedLocation: NearbyLocation | null;
  setSelectedLocation: (location: NearbyLocation | null) => void;

  // Distance filter
  maxDistance: number;
  setMaxDistance: (distance: number) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Data
  workouts: NearbyWorkout[];
  isLoading: boolean;

  // Grouped workouts by date
  groupedWorkouts: {
    label: string;
    dayOfWeek: DayOfWeek;
    workouts: NearbyWorkout[];
  }[];
}

const NearbyContext = createContext<NearbyContextType | null>(null);

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100] as const;

const DAY_OF_WEEK_ORDER: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const getDayLabel = (dayOfWeek: DayOfWeek): string => {
  const today = new Date();
  const todayDayIndex = today.getDay(); // 0 = Sunday
  const dayIndex = DAY_OF_WEEK_ORDER.indexOf(dayOfWeek);

  if (dayIndex === todayDayIndex) {
    return "Today";
  }

  if (dayIndex === (todayDayIndex + 1) % 7) {
    return "Tomorrow";
  }

  // Return the capitalized day name
  return dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
};

const latLngToDistance = (
  lat1: number | null,
  lon1: number | null,
  lat2: number | null,
  lon2: number | null,
): number | null => {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
    return null;
  }

  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return (R * c) / 1609.34; // Convert to miles
};

export function NearbyProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] =
    useState<NearbyLocation | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Get user's geolocation on mount
  useState(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "Current Location",
          });
        },
        () => {
          // Default to a location if geolocation fails
          // This could be improved with IP-based geolocation
        },
      );
    }
  });

  const { data: mapEventAndLocationData, isLoading: isLoadingEvents } =
    useQuery(
      orpc.map.location.eventsAndLocations.queryOptions({
        input: undefined,
      }),
    );

  const { data: regionLookupData, isLoading: isLoadingRegions } = useQuery(
    orpc.map.location.locationIdToRegionNameLookup.queryOptions({
      input: undefined,
    }),
  );

  const isLoading = isLoadingEvents || isLoadingRegions;

  // Transform and filter workouts
  const workouts = useMemo<NearbyWorkout[]>(() => {
    if (!mapEventAndLocationData || !selectedLocation) {
      return [];
    }

    const allWorkouts: NearbyWorkout[] = [];

    for (const location of mapEventAndLocationData) {
      const [locationId, aoName, logo, lat, lon, fullAddress, events] =
        location;

      const distance = latLngToDistance(
        lat,
        lon,
        selectedLocation.lat,
        selectedLocation.lng,
      );

      // Filter by distance
      if (distance === null || distance > maxDistance) {
        continue;
      }

      const regionName = regionLookupData?.lookup?.[locationId] ?? null;

      for (const event of events) {
        const [eventId, eventName, dayOfWeek, startTime, eventTypes] = event;

        const workout: NearbyWorkout = {
          id: eventId,
          locationId,
          name: eventName,
          aoName,
          logo,
          dayOfWeek,
          startTime,
          eventTypes,
          lat,
          lon,
          fullAddress,
          distance,
          regionName,
        };

        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesSearch =
            eventName.toLowerCase().includes(query) ||
            (aoName?.toLowerCase().includes(query) ?? false) ||
            (regionName?.toLowerCase().includes(query) ?? false) ||
            (fullAddress?.toLowerCase().includes(query) ?? false);

          if (!matchesSearch) {
            continue;
          }
        }

        allWorkouts.push(workout);
      }
    }

    // Sort by distance
    return allWorkouts.sort((a, b) => {
      if (a.distance === null || b.distance === null) return 0;
      return a.distance - b.distance;
    });
  }, [
    mapEventAndLocationData,
    selectedLocation,
    maxDistance,
    searchQuery,
    regionLookupData,
  ]);

  // Group workouts by day, starting from today
  const groupedWorkouts = useMemo(() => {
    const today = new Date();
    const todayDayIndex = today.getDay(); // 0 = Sunday

    // Create ordered days starting from today
    const orderedDays: DayOfWeek[] = [];
    for (let i = 0; i < 7; i++) {
      const dayIndex = (todayDayIndex + i) % 7;
      const day = DAY_OF_WEEK_ORDER[dayIndex];
      if (day) {
        orderedDays.push(day);
      }
    }

    // Group workouts by day
    const groups: {
      label: string;
      dayOfWeek: DayOfWeek;
      workouts: NearbyWorkout[];
    }[] = [];

    for (const day of orderedDays) {
      const dayWorkouts = workouts.filter((w) => w.dayOfWeek === day);
      if (dayWorkouts.length > 0) {
        groups.push({
          label: getDayLabel(day),
          dayOfWeek: day,
          workouts: dayWorkouts.sort((a, b) => {
            // Sort by start time within each day
            const timeA = a.startTime ?? "9999";
            const timeB = b.startTime ?? "9999";
            return timeA.localeCompare(timeB);
          }),
        });
      }
    }

    return groups;
  }, [workouts]);

  const value: NearbyContextType = {
    selectedLocation,
    setSelectedLocation,
    maxDistance,
    setMaxDistance,
    searchQuery,
    setSearchQuery,
    workouts,
    isLoading,
    groupedWorkouts,
  };

  return (
    <NearbyContext.Provider value={value}>{children}</NearbyContext.Provider>
  );
}

export function useNearby() {
  const context = useContext(NearbyContext);
  if (!context) {
    throw new Error("useNearby must be used within a NearbyProvider");
  }
  return context;
}

export { DISTANCE_OPTIONS };
