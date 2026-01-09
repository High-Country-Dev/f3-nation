"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import {
  START_END_TIME_DB_FORMAT,
  START_END_TIME_DISPLAY_FORMAT,
} from "@acme/shared/app/constants";

import type { NearbyWorkout } from "./nearby-provider";
import { dayjs } from "~/utils/frontendDayjs";

interface WorkoutListItemProps {
  workout: NearbyWorkout;
}

function formatTime(time: string | null): string {
  if (!time) return "";
  return dayjs(time, START_END_TIME_DB_FORMAT)
    .format(START_END_TIME_DISPLAY_FORMAT)
    .toLowerCase();
}

export function WorkoutListItem({ workout }: WorkoutListItemProps) {
  const startTime = formatTime(workout.startTime);
  const endTime = workout.endTime ? formatTime(workout.endTime) : null;
  const timeRange = endTime ? `${startTime} - ${endTime}` : startTime;

  const primaryEventType = workout.eventTypes[0]?.name ?? "Workout";

  // Build Google Maps URL
  const mapsUrl =
    workout.lat && workout.lon
      ? `https://www.google.com/maps/search/?api=1&query=${workout.lat},${workout.lon}`
      : null;

  return (
    <div className="border-b border-border bg-background px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          {/* Distance and time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {workout.distance !== null && (
              <span className="font-medium">
                {workout.distance.toFixed(1)} mi
              </span>
            )}
            {workout.distance !== null && timeRange && <span>•</span>}
            {timeRange && <span>{timeRange}</span>}
          </div>

          {/* Workout name */}
          <h3 className="text-lg font-bold text-foreground">{workout.name}</h3>

          {/* Region */}
          {workout.regionName && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Region:</span>{" "}
              {workout.regionName}
            </div>
          )}

          {/* Type */}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Type:</span>{" "}
            {primaryEventType}
          </div>

          {/* Address */}
          {workout.fullAddress && mapsUrl && (
            <Link
              href={mapsUrl}
              target="_blank"
              className="block text-sm text-primary underline hover:text-primary/80"
            >
              {workout.fullAddress}
            </Link>
          )}

          {/* Description */}
          {workout.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
              {workout.description}
            </p>
          )}
        </div>

        {/* External link icon */}
        <Link
          href={mapsUrl ?? "#"}
          target="_blank"
          className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-5" />
        </Link>
      </div>
    </div>
  );
}
