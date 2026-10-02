/**
 * host-router — one Cloudflare Worker in front of every door of the portal.
 * The rule is `route.ts`; deploy and migration steps are in README.md and
 * docs/hosting-process-cap.md.
 */
import { planRoute } from "./route";

interface Env {
  ORIGIN_HOST: string;
  ORIGIN_PROXY_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const plan = planRoute(request.url, request.headers, request.headers.get("cf-connecting-ip"), {
      originHost: env.ORIGIN_HOST,
      secret: env.ORIGIN_PROXY_SECRET ?? "",
    });

    if (plan.kind === "redirect") {
      return new Response(null, { status: plan.status, headers: { location: plan.location } });
    }
    if (plan.kind === "refuse") {
      return new Response(plan.body, { status: plan.status, headers: { "content-type": "text/plain" } });
    }

    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    return fetch(plan.url, {
      method: request.method,
      headers: plan.headers,
      body: hasBody ? request.body : undefined,
      // The app's own 3xx (door → marketplace 308s, rental redirects) go back
      // to the browser untouched; following them here would serve the target
      // page under the wrong address.
      redirect: "manual",
      ...(plan.cacheable ? {} : { cache: "no-store" as const }),
    });
  },
} satisfies ExportedHandler<Env>;
