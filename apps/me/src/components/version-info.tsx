"use client";

import Link from "next/link";

import { VersionInfo as VersionInfoBase } from "@acme/ui/version-info";

import packageJson from "../../package.json";

export const VersionInfo = ({ channel }: { channel: string }) => {
  return (
    <VersionInfoBase
      versionLabel={
        <Link
          href="/changelog"
          className="underline underline-offset-2 hover:text-[#f8f4ea]"
        >
          v{packageJson.version}
        </Link>
      }
      channel={channel}
      className="text-xs text-[#f8f4ea]/60"
    />
  );
};
