import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { env } from "@/lib/env";

export default function RegisterPage() {
  if (!env.AUTH_ENABLED) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-6 sm:p-6">
      <div className="grid w-full max-w-md gap-4">
        <AuthForm mode="register" />
        <p className="text-center text-sm text-slate-400">
          Already have an account? <Link href="/login" className="text-blue-400">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
