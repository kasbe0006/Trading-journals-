import { redirect } from "next/navigation";
import { env } from "@/lib/env";

export default function RegisterPage() {
  if (!env.AUTH_ENABLED) {
    redirect("/dashboard");
  }

  redirect("/login");
}
