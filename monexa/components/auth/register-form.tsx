"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { emailSchema, nameSchema, newPasswordSchema } from "@/lib/auth-validation";
import { registerUser } from "@/app/actions/auth";
import { AuthAlert, AuthField, AuthFooterLink, AuthHeader, AuthSubmit, IconInput, PasswordInput } from "./auth-ui";

const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: newPasswordSchema,
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (data: RegisterFormValues) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);

      const result = await registerUser(null, formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(result.success);
        router.push("/login");
      }
    });
  };

  return (
    <>
      <AuthHeader title="Create your account" description="Start tracking your money in under a minute." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        <AuthField id="name" label="Full name" error={errors.name?.message}>
          <IconInput
            id="name"
            icon={User}
            autoComplete="name"
            placeholder="Jane Doe"
            invalid={!!errors.name}
            {...register("name")}
          />
        </AuthField>

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
          hint="At least 8 characters, including a letter and a number."
        >
          <PasswordInput
            id="password"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Create a password"
            invalid={!!errors.password}
            {...register("password")}
          />
        </AuthField>

        <AuthSubmit pending={isPending}>Create account</AuthSubmit>
      </form>

      <AuthFooterLink prompt="Already have an account?" href="/login" label="Sign in" />
    </>
  );
}
