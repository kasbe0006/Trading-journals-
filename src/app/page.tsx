import { redirect } from "next/navigation";
import { env } from "@/lib/env";

export default function Home() {
  redirect(env.AUTH_ENABLED ? "/login" : "/dashboard");
}
