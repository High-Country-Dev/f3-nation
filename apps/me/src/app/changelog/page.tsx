import Link from "next/link";

import { parseInlineLinks, readChangelog } from "@/lib/changelog";

export const metadata = {
  title: "Changelog — F3 Me",
};

function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInlineLinks(text).map((part, i) => {
        if (part.href) {
          return (
            <a
              key={i}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline underline-offset-2 hover:text-blue-800"
            >
              {part.text}
            </a>
          );
        }
        if (part.bold) {
          return (
            <strong key={i} className="font-semibold">
              {part.text}
            </strong>
          );
        }
        return <span key={i}>{part.text}</span>;
      })}
    </>
  );
}

export default function ChangelogPage() {
  const entries = readChangelog();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        ← Back
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold text-foreground">
        Changelog
      </h1>
      <div className="space-y-8">
        {entries.map((entry) => (
          <article key={entry.version}>
            <h2 className="text-lg font-semibold text-foreground">
              v{entry.version}
            </h2>
            {entry.date && (
              <time className="text-xs text-muted-foreground">
                {entry.date}
              </time>
            )}
            {entry.sections.map((section) => (
              <div key={section.title} className="mt-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {section.title}
                </h3>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-foreground">
                  {section.items.map((item, i) => (
                    <li key={i}>
                      <InlineText text={item} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </article>
        ))}
      </div>
    </main>
  );
}
