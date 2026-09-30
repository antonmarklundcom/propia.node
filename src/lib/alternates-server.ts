import "server-only";
import { CANONICAL_HOST, MARKETPLACE_PRIMARY_HOST, VERTICALS } from "@/config/verticals";
import { EVERGREEN_PAGES } from "@/content/evergreen";
import { evergreenOwnersByLocale } from "./category-owner";
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
  input: Omit<AlternateInput, "servingHost" | "ownerHostByLocale">,
): Promise<Record<string, string> | undefined> {
  const vertical = await currentVertical();
  const servingHost = Object.entries(VERTICALS).find(
    ([, config]) => config.key === vertical.key,
  )?.[0];
  // A category page's evergreen owner speaks for its locale (see
  // AlternateInput.ownerHostByLocale), so hreflang names the URL that the
  // other doors canonicalise to.
  const ownerHostByLocale =
    input.scope === "category"
      ? evergreenOwnersByLocale(VERTICALS, input.path, EVERGREEN_PAGES, [
          MARKETPLACE_PRIMARY_HOST,
          CANONICAL_HOST,
        ])
      : undefined;
  return languageAlternates({ ...input, servingHost, ownerHostByLocale });
}
