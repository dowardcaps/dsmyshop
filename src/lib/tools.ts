export interface ToolItem {
  slug: string;
  title: string;
  href: string;
  description: string;
  category: "Uploads" | "Calculators" | "Design" | "ID" | "Documents";
}

export const TOOL_CATEGORIES: readonly ToolItem["category"][] = [
  "Uploads",
  "Calculators",
  "Design",
  "ID",
  "Documents",
] as const;

export const TOOL_ITEMS: readonly ToolItem[] = [
  {
    slug: "uploads",
    title: "Admin Uploads",
    href: "https://dsuploads.vercel.app/api/admin",
    description: "Upload and manage files, assets, and admin data.",
    category: "Uploads",
  },
  {
    slug: "transcalc",
    title: "Transaction Calculator",
    href: "https://dstranscalc.vercel.app/",
    description: "Quick transaction math and fee calculations.",
    category: "Calculators",
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
    href: "http://localhost:3000/",
    description: "Remove image backgrounds locally. (Dev only — runs on port 3001.)",
    category: "Design",
  },
];

export function getToolBySlug(slug: string): ToolItem | undefined {
  return TOOL_ITEMS.find((t) => t.slug === slug);
}