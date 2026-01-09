"use client";

import { Skeleton } from "@acme/ui/skeleton";

import { useNearby } from "./nearby-provider";
import { WorkoutListItem } from "./workout-list-item";

export function NearbyPageContent() {
  const { groupedWorkouts, isLoading, selectedLocation, workouts } =
    useNearby();

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!selectedLocation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <div className="text-lg font-semibold text-foreground">
          Select a location to find workouts
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the location selector above to choose your area
        </p>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <div className="text-lg font-semibold text-foreground">
          No workouts found
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Try expanding your search radius or selecting a different location
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {groupedWorkouts.map((group) => (
        <div key={group.dayOfWeek}>
          {/* Day header */}
          <div className="sticky top-0 z-10 border-b border-border bg-muted/80 px-4 py-2 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-foreground">{group.label}</h2>
          </div>

          {/* Workouts for this day */}
          {group.workouts.map((workout) => (
            <WorkoutListItem
              key={`${workout.id}-${workout.locationId}`}
              workout={workout}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {/* Day header skeleton */}
      <div className="border-b border-border bg-muted/80 px-4 py-2">
        <Skeleton className="h-7 w-24" />
      </div>

      {/* Workout item skeletons */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="border-b border-border px-4 py-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      ))}
    </>
  );
}
