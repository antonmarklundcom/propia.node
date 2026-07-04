import { headers } from "next/headers";
import { VERTICALS, type VerticalConfig } from "@/config/verticals";

/** Read the vertical the middleware resolved for this request. */
export async function currentVertical(): Promise<VerticalConfig> {
  const h = await headers();
  const key = h.get("x-vertical") ?? "propia";
  const v = Object.values(VERTICALS).find((v) => v.key === key);
  return v ?? VERTICALS["propia.com.py"];
}
