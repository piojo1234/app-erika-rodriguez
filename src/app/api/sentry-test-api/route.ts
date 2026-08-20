import { NextResponse } from "next/server";

export async function POST() {
  throw new Error("Sentry Test Error: Este es un error en el servidor (API Route).");
  
  // This code will never be reached, but is included to satisfy typescript if needed
  return NextResponse.json({ success: true });
}
