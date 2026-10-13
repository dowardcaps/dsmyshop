"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const subscribe = () => () => {};

export function PreferencesCard() {
  const { theme, setTheme } = useTheme();
  // The theme is only known in the browser; avoid highlighting a wrong button during hydration.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Display and regional settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium">Theme</p>
          <div role="group" aria-label="Theme" className="flex flex-wrap gap-2">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={mounted && theme === value ? "default" : "outline"}
                aria-pressed={mounted && theme === value}
                onClick={() => setTheme(value)}
              >
                <Icon /> {label}
              </Button>
            ))}
          </div>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Business</dt>
            <dd className="font-medium">DS Prints and Supplies</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Currency</dt>
            <dd className="font-medium">Philippine peso (₱)</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Time zone</dt>
            <dd className="font-medium">Asia/Manila</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
