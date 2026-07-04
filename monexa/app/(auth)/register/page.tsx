import { RegisterForm } from "@/components/auth/register-form";
import { Wallet } from "lucide-react";

export const metadata = {
  title: "Register - Monexa",
  description: "Create your Monexa account",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-linear-to-br from-indigo-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 mb-4">
            <Wallet className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">Monexa</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Personal Finance & Loan Management</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
