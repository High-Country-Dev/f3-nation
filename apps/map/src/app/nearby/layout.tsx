import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "F3 Near Me | Find Workouts",
  description:
    "Discover F3 workout locations near you. Find a free, outdoor, peer-led workout group for men today.",
  openGraph: {
    title: "F3 Near Me",
    description: "Find F3 workouts near you",
    siteName: "F3 Near Me",
  },
};

export default function NearbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-dvh bg-background text-foreground">
      {children}
    </div>
  );
}
