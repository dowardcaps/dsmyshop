import { PageHeader } from "@/components/layout/page-header";
import { ToolsBrowser } from "@/components/tools/tools-browser";

export const metadata = { title: "Tools | DS Finance" };

export default function ToolsIndexPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tools" description="Embedded DS utilities and mini-apps. Pick a tool to open it inside DS Finance." />
      <ToolsBrowser />
    </div>
  );
}
