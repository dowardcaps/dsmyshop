"use client";

import { useMemo, useState } from "react";

import { filterTools, TOOL_ITEMS, type ToolCategory } from "@/lib/tools";

/** Search text and category state for the Tools page. */
export function useToolFilter() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategory | "All">("All");
  const tools = useMemo(() => filterTools(TOOL_ITEMS, query, category), [query, category]);
  return { query, setQuery, category, setCategory, tools };
}
