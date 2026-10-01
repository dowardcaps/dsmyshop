import { Construction } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
  stage: string;
}

export function PlaceholderPage({ title, description, stage }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Construction className="size-5" />
          </div>
          <h2 className="text-base font-semibold">Coming soon</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            This page will be built in {stage}. The layout and navigation are ready.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
