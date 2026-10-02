/** Pure checks for the /publicar wizard's per-step validation. No DB, no network. */
import { parsePriceInput, validatePublishStep, type PublishStepFields } from "../src/lib/publish-steps";

let failed = 0;
function eq(name: string, got: unknown, want: unknown) {
  if (got !== want) {
    failed++;
    console.error(`FAIL ${name}: got ${String(got)}, want ${String(want)}`);
  }
}

const detallesOnly: PublishStepFields = {
  operation: "venta",
  propertyType: "casa",
  title: "Casa luminosa en Luque",
  locationId: null, // location and price are collected on later steps
  priceAmount: "",
};

// The regression: Detalles must pass with no location and no price.
eq("step 0 ignores location + price", validatePublishStep(0, detallesOnly), null);
eq("step 1 asks for location only", validatePublishStep(1, detallesOnly), "location");
eq("step 1 ignores price", validatePublishStep(1, { ...detallesOnly, locationId: 5 }), null);
eq("step 2 asks for price", validatePublishStep(2, { ...detallesOnly, locationId: 5 }), "price");
eq("step 2 ok", validatePublishStep(2, { ...detallesOnly, locationId: 5, priceAmount: "90000" }), null);
eq("step 2 rejects zero", validatePublishStep(2, { ...detallesOnly, priceAmount: "0" }), "price");
eq("step 2 ok with es-PY thousands", validatePublishStep(2, { ...detallesOnly, priceAmount: "150.000.000" }), null);
// Paraguayan price spellings: "150.000.000" was NaN (saved as 0, then refused
// as "No encontramos tu borrador"), "85.000" was 85.
eq("price dots", parsePriceInput("150.000.000"), 150000000);
eq("price one dot group", parsePriceInput("85.000"), 85000);
eq("price commas", parsePriceInput("150,000"), 150000);
eq("price spaces", parsePriceInput("1 500 000"), 1500000);
eq("price cents dropped", parsePriceInput("85.000,50"), 85000);
eq("price plain", parsePriceInput("90000"), 90000);
eq("price empty", parsePriceInput(""), 0);
eq("price separators only", parsePriceInput(".,"), 0);
eq("price number passthrough", parsePriceInput(120000), 120000);

eq("step 0 operation", validatePublishStep(0, { ...detallesOnly, operation: "" }), "operation");
eq("step 0 type", validatePublishStep(0, { ...detallesOnly, propertyType: "" }), "propertyType");
eq("step 0 short title", validatePublishStep(0, { ...detallesOnly, title: "Casa" }), "title");
eq("step 0 blank title", validatePublishStep(0, { ...detallesOnly, title: "        " }), "title");

if (failed) {
  console.error(`verify:publish — ${failed} failure(s)`);
  process.exit(1);
}
console.log("verify:publish — OK");
