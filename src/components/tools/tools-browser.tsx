"use client";

import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToolFilter } from "@/hooks/use-tool-filter";
import { TOOL_CATEGORIES } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function ToolsBrowser() {
  const { query, setQuery, category, setCategory, tools } = useToolFilter();

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools…"
            aria-label="Search tools"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {(["All", ...TOOL_CATEGORIES] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                category === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {tools.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">No tools match your search.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-accent/40">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-3">
                    <span>{tool.title}</span>
                    <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{tool.category}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
