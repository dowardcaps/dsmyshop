import { CATEGORY_COLORS, FALLBACK_CATEGORY_COLOR } from "@/lib/transactions/constants";

export function categoryColor(name: string): string {
  return CATEGORY_COLORS[name] ?? FALLBACK_CATEGORY_COLOR;
}

export function CategoryBadge({ name }: { name: string }) {
  return (
    <span className="inline-block rounded-md px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: categoryColor(name) }}>
      {name}
    </span>
  );
}
