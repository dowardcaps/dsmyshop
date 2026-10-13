"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfileForm } from "@/hooks/use-profile-form";

export function ProfileCard({ name, email }: { name: string; email: string }) {
  const { form, submit } = useProfileForm(name);
  const {
    register,
    formState: { errors, isSubmitting, isDirty },
  } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>The name shown in the sidebar. Your email is used to sign in.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="grid gap-4 sm:max-w-md">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Name</Label>
            <Input id="settings-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
            {errors.name ? <p role="alert" className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input id="settings-email" value={email} readOnly disabled />
          </div>
          <div>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              Save name
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
