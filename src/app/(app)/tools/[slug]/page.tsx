import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getToolBySlug, TOOL_ITEMS } from "@/lib/tools";

export function generateStaticParams() {
  return TOOL_ITEMS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  return { title: tool ? `${tool.title} | DS Finance` : "Tool | DS Finance" };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) notFound();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">

      {/* ── Slim toolbar ─────────────────────────────────────── */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b bg-background px-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tools">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">All tools</span>
          </Link>
        </Button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{tool.title}</p>
        </div>

        <Button variant="outline" size="sm" asChild>
          <a href={tool.href} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            <span className="hidden sm:inline">Open in new tab</span>
          </a>
        </Button>
      </div>

      {/* ── 👇 THIS is the part you asked about 👇 ───────────── */}
      <div className="relative min-h-0 flex-1">
        <iframe
          src={tool.href}
          title={tool.title}
          className="absolute inset-0 h-full w-full border-0 bg-white"
          allow="clipboard-read; clipboard-write; fullscreen; camera; microphone"
          referrerPolicy="no-referrer"
        />
      </div>
      {/* ─────────────────────────────────────────────────────── */}

    </div>
  );
}