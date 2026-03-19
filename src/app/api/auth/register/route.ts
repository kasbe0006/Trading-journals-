import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Account creation is disabled. Please sign in with the default account." },
    { status: 403 }
  );
}
