import "server-only";
import { VERTICALS } from "@/config/verticals";
import { currentVertical } from "./vertical-context";
import { languageAlternates, type AlternateInput } from "./alternates";

/**
 * languageAlternates() for this request: the serving door's host goes in as
 * `servingHost`, so a page whose own URL is not in its hreflang set (a
 * feeder door, a door that canonicalises this page type elsewhere) emits
 * none. The request-scoped half lives here so alternates.ts stays pure for
 * verify:seo — the same split as brand.ts / brand-server.ts.
 */
export async function pageLanguageAlternates(
  input: Omit<AlternateInput, "servingHost">,
): Promise<Record<string, string> | undefined> {
  const vertical = await currentVertical();
  const servingHost = Object.entries(VERTICALS).find(
    ([, config]) => config.key === vertical.key,
  )?.[0];
  return languageAlternates({ ...input, servingHost });
}
