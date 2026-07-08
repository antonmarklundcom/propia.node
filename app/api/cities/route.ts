/**
 * Small city-list endpoint (§6.6) — lets client components (the mobile
 * bottom-bar's search sheet) load the SearchBar's `cities` prop lazily,
 * without forcing the whole route tree dynamic just to render a nav shell.
 */
import { NextResponse } from "next/server";
import { listCities } from "@/lib/queries";

export async function GET() {
  const cities = await listCities();
  return NextResponse.json(cities);
}
