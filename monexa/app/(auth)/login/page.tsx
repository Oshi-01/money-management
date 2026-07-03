import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Login - Monexa",
  description: "Login to your Monexa account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Monexa</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Personal Finance & Loan Management</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
