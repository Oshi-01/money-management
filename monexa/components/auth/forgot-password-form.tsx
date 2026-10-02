"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { emailSchema } from "@/lib/auth-validation";
import { requestPasswordReset } from "@/app/actions/password";
import { Button } from "@/components/ui/button";
import { AuthAlert, AuthField, AuthHeader, AuthStatus, AuthSubmit, IconInput } from "./auth-ui";

const requestResetSchema = z.object({
  email: emailSchema,
});

type RequestResetFormValues = z.infer<typeof requestResetSchema>;

function BackToLogin() {
  return (
    <Link
      href="/login"
      className="mt-8 flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to sign in
    </Link>
  );
}

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestResetFormValues>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: RequestResetFormValues) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", data.email);

      const result = await requestPasswordReset(null, formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.success);
      }
    });
  };

  if (success) {
    return (
      <AuthStatus
        icon={MailCheck}
        title="Check your inbox"
        action={
          <Link href="/login" className="block">
            <Button variant="outline" className="h-11 w-full rounded-xl">
              Back to sign in
            </Button>
          </Link>
        }
      >
        {success} The link expires in 1 hour. Don&apos;t forget to check your spam folder.
      </AuthStatus>
    );
  }

  return (
    <>
      <AuthHeader
        title="Forgot your password?"
        description="Enter the email you signed up with and we'll send you a link to reset it."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        <AuthField id="email" label="Email" error={errors.email?.message}>
          <IconInput
            id="email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@example.com"
            invalid={!!errors.email}
            {...register("email")}
          />
        </AuthField>

        <AuthSubmit pending={isPending}>Send reset link</AuthSubmit>
      </form>

      <BackToLogin />
    </>
  );
}
