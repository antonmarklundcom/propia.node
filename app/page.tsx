import { currentVertical } from "@/lib/vertical-context";
import { es } from "@/i18n/es";

export default async function Home() {
  const vertical = await currentVertical();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1rem" }}>
      <h1 style={{ color: "#1A5D3A" }}>Propia</h1>
      <p>{es.rentalsHero}</p>
      <p style={{ color: "#5B6470", fontSize: 14 }}>
        vertical: <code>{vertical.key}</code> · locale:{" "}
        <code>{vertical.locale}</code>
      </p>
    </main>
  );
}
