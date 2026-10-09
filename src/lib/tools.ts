export const TOOL_CATEGORIES = ["Uploads", "Calculators", "Design", "ID", "Documents"] as const;
export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export interface ToolItem {
  slug: string;
  title: string;
  /** Address embedded in the iframe and used by "Open in new tab". */
  href: string;
  description: string;
  category: ToolCategory;
  /** Local-only tool: hidden in production, because "localhost" there is the visitor's own computer. */
  devOnly?: boolean;
}

const ALL_TOOLS: readonly ToolItem[] = [
  {
    slug: "uploads",
    title: "Admin Uploads",
    href: "https://dsuploads.vercel.app/api/admin",
    description: "Upload and manage files, assets, and admin data.",
    category: "Uploads",
  },
  {
    slug: "photocollage",
    title: "Photo Collage",
    href: "https://dsphotocollage.vercel.app",
    description: "Combine multiple photos into a single collage.",
    category: "Design",
  },
  {
    slug: "rushidpacks",
    title: "Rush ID Packs",
    href: "https://dsrushidpacks.vercel.app/",
    description: "Generate and print ID card packs in bulk.",
    category: "ID",
  },
  {
    slug: "resumetemp",
    title: "Resume Templates",
    href: "https://dsresumetemp.vercel.app/",
    description: "Browse and fill professional resume templates.",
    category: "Documents",
  },
  {
    slug: "bgremover",
    title: "Background Remover",
    // Port 3001: DS Finance itself runs on 3000, so this must not point at 3000.
    href: "http://localhost:3001/",
    description: "Remove image backgrounds locally. (Dev only: run it on port 3001.)",
    category: "Design",
    devOnly: true,
  },
];

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Tools shown in the app. Dev-only tools are left out of production builds. */
export const TOOL_ITEMS: readonly ToolItem[] = ALL_TOOLS.filter((tool) => !(tool.devOnly && IS_PRODUCTION));

export function getToolBySlug(slug: string): ToolItem | undefined {
  return TOOL_ITEMS.find((tool) => tool.slug === slug);
}

/** Filter used by the Tools page: free-text search plus an optional category. */
export function filterTools(tools: readonly ToolItem[], query: string, category: ToolCategory | "All"): ToolItem[] {
  const q = query.trim().toLowerCase();
  return tools.filter((tool) => {
    const matchesCategory = category === "All" || tool.category === category;
    const matchesQuery = !q || tool.title.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}
