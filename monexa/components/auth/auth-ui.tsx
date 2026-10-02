"use client";

import { forwardRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AuthHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8 space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

export function AuthAlert({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border p-3 text-sm",
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function AuthField({ id, label, error, hint, action, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-gray-700 dark:text-gray-300">
          {label}
        </Label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}

const inputClass =
  "h-11 rounded-xl border-gray-200 bg-white pl-10 shadow-xs focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5";

type IconInputProps = React.ComponentProps<"input"> & { icon: LucideIcon; invalid?: boolean };

export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(function IconInput(
  { icon: Icon, invalid, className, id, ...props },
  ref,
) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        ref={ref}
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={cn(inputClass, className)}
        {...props}
      />
    </div>
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, Omit<IconInputProps, "type">>(function PasswordInput(
  { className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <IconInput ref={ref} type={visible ? "text" : "password"} className={cn("pr-11", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});

export function AuthSubmit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700"
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

export function AuthFooterLink({ prompt, href, label }: { prompt: string; href: string; label: string }) {
  return (
    <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
      {prompt}{" "}
      <Link href={href} className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
        {label}
      </Link>
    </p>
  );
}

/** Full-panel message (e.g. "check your email"), used in place of a form once it has done its job. */
export function AuthStatus({
  icon: Icon,
  tone = "success",
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  tone?: "success" | "error";
  title: string;
  children: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <div className="space-y-6 text-center">
      <span
        className={cn(
          "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl",
          tone === "success"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
            : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
        )}
      >
        <Icon className="h-7 w-7" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h1>
        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{children}</p>
      </div>
      {action}
    </div>
  );
}
