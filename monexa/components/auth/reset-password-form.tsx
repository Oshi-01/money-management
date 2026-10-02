"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleCheckBig, Lock, Unlink } from "lucide-react";
import { newPasswordSchema } from "@/lib/auth-validation";
import { resetPassword } from "@/app/actions/password";
import { Button } from "@/components/ui/button";
import { AuthAlert, AuthField, AuthHeader, AuthStatus, AuthSubmit, PasswordInput } from "./auth-ui";

const resetPasswordSchema = z.object({
  password: newPasswordSchema,
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    if (!token) {
      setError("Reset token is missing from the URL.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("password", data.password);
      formData.append("token", token);

      const result = await resetPassword(null, formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.success);
      }
    });
  };

  if (!token) {
    return (
      <AuthStatus
        icon={Unlink}
        tone="error"
        title="This link doesn't work"
        action={
          <Link href="/forgot-password" className="block">
            <Button variant="outline" className="h-11 w-full rounded-xl">
              Request a new link
            </Button>
          </Link>
        }
      >
        The reset link is missing or incomplete. Request a new one and open it straight from the email.
      </AuthStatus>
    );
  }

  if (success) {
    return (
      <AuthStatus
        icon={CircleCheckBig}
        title="Password updated"
        action={
          <Link href="/login" className="block">
            <Button className="h-11 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
              Sign in
            </Button>
          </Link>
        }
      >
        {success} For your security, you&apos;ve been signed out on all other devices.
      </AuthStatus>
    );
  }

  return (
    <>
      <AuthHeader title="Choose a new password" description="Pick something strong that you don't use anywhere else." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {error && (
          <AuthAlert tone="error">
            {error}{" "}
            <Link href="/forgot-password" className="font-medium underline">
              Request a new link
            </Link>
          </AuthAlert>
        )}

        <AuthField
          id="password"
          label="New password"
          error={errors.password?.message}
          hint="At least 8 characters, including a letter and a number."
        >
          <PasswordInput
            id="password"
            icon={Lock}
            autoComplete="new-password"
            placeholder="New password"
            invalid={!!errors.password}
            {...register("password")}
          />
        </AuthField>

        <AuthField id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
          <PasswordInput
            id="confirmPassword"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Repeat new password"
            invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </AuthField>

        <AuthSubmit pending={isPending}>Update password</AuthSubmit>
      </form>
    </>
  );
}
