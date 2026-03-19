import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { env } from "@/lib/env";

export default function LoginPage() {
  if (!env.AUTH_ENABLED) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-6 sm:p-6">
      <div className="grid w-full max-w-md gap-4">
        <AuthForm mode="login" />
        <p className="text-center text-sm text-slate-400">
          New here? <Link href="/register" className="text-blue-400">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
