"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { emailSchema } from "@/lib/auth-validation";
import { authenticate } from "@/app/actions/auth";
import { AuthAlert, AuthField, AuthFooterLink, AuthHeader, AuthSubmit, IconInput, PasswordInput } from "./auth-ui";

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("redirectTo", "/dashboard");

      const result = await authenticate(null, formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <AuthHeader title="Welcome back" description="Sign in to pick up where you left off." />

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

        <AuthField
          id="password"
          label="Password"
          error={errors.password?.message}
          action={
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            icon={Lock}
            autoComplete="current-password"
            placeholder="Your password"
            invalid={!!errors.password}
            {...register("password")}
          />
        </AuthField>

        <AuthSubmit pending={isPending}>Sign in</AuthSubmit>
      </form>

      <AuthFooterLink prompt="New to Monexa?" href="/register" label="Create an account" />
    </>
  );
}
