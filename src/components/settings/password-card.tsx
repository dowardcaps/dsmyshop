"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePasswordForm } from "@/hooks/use-password-form";

const FIELDS = [
  { name: "currentPassword", id: "settings-current-password", label: "Current password", autoComplete: "current-password" },
  { name: "newPassword", id: "settings-new-password", label: "New password", autoComplete: "new-password" },
  { name: "confirmPassword", id: "settings-confirm-password", label: "Repeat new password", autoComplete: "new-password" },
] as const;

export function PasswordCard() {
  const { form, submit } = usePasswordForm();
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Use at least 8 characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="grid gap-4 sm:max-w-md">
          {FIELDS.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input id={field.id} type="password" autoComplete={field.autoComplete} aria-invalid={!!errors[field.name]} {...register(field.name)} />
              {errors[field.name] ? <p role="alert" className="text-xs text-destructive">{errors[field.name]?.message}</p> : null}
            </div>
          ))}
          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              Change password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
