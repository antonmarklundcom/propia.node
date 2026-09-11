# Imagery — Premium Editorial home (inmobiliaria.com.py + realestateinparaguay.com)

One image set serves both doors (same listing rows, same brand family). Eight
slots on the home page plus two site-wide assets. **The filenames below are
already wired into the code** (`src/components/Picture.tsx`,
`app/page.tsx`, `docs/prompts/premium-editorial.md`), so the only thing that
changes when the real images arrive is the pixels. Placeholders converted
from the old photos sit in `public/img/premium/` until then.

## 1. Style preamble — prepend to every prompt

> Editorial real-estate photography for a premium Paraguayan portal. Golden-hour
> or blue-hour light, warm but restrained colour grade (deep greens, warm
> cream, muted gold highlights), no oversaturation. Architectural, calm,
> uncluttered compositions with generous negative space on one side for text.
> Photorealistic, 35 mm full-frame look, slight wide angle, sharp, no lens
> flare, no HDR halos. No people in the foreground, no text, no logos, no
> watermarks, no cars with visible plates, no flags. Subtropical vegetation
> typical of Paraguay: lapacho, mango and palm trees, red-brown soil, lush
> lawns.

Generator settings: photorealistic mode, highest quality, **ratio exactly as
in the table, longest side ≥ 1920 px** (2K if the tool offers it) so webimg
never upscales. If you generate through the Higgsfield MCP in a Claude
session the model is `nano_banana_pro` at `2k`, per the
`higgsfield-image-pipeline` skill. On your PC any generator is fine
(Higgsfield web, Midjourney, Ideogram, Imagen); save as PNG or JPG.

## 2. The slots

`name` is the exact `--name` for webimg. Alt texts are what the site shows
(Spanish door / English door); they are already in the dictionaries, so do
not change them here without changing `src/i18n/*.ts`.

### Hero — `casa-premium-asuncion-atardecer` — 16:9 — priority slot

Alt ES: `Casa moderna con piscina iluminada al atardecer en un barrio residencial de Asunción`
Alt EN: `Modern house with a lit pool at dusk in a residential neighbourhood of Asunción`

> [preamble] Exterior of a modern two-storey luxury house in Asunción,
> Paraguay, at blue hour: flat roof, floor-to-ceiling glass glowing warm from
> inside, a rectangular infinity pool in the foreground reflecting the house,
> lapacho tree in bloom to one side, deep green lawn, subtle path lighting.
> Camera at pool level, house on the RIGHT two-thirds of the frame, the LEFT
> third is calm dark garden and sky (text will sit there). Dramatic but quiet
> sky, deep teal to warm orange horizon.

### About — `living-moderno-vista-rio-asuncion` — 3:2

Alt ES: `Sala de estar moderna con ventanales y vista al río Paraguay en un departamento de Asunción`
Alt EN: `Modern living room with floor-to-ceiling windows overlooking the Paraguay River in an Asunción apartment`

> [preamble] Interior of a high-floor apartment living room in Asunción:
> floor-to-ceiling windows on the far wall showing the Paraguay River and the
> Costanera at golden hour, oak floor, cream linen sofa, a single dark-green
> velvet armchair, brass floor lamp, indoor palm, marble side table. Late
> afternoon sun raking across the floor. Empty of people. Wide, eye-level,
> symmetrical composition.

### Zone tiles — 4:3, six images

Tiles are small (150 px tall on desktop) so the subject must read at a
glance: one recognisable motif per city, horizon in the upper third, no fine
detail.

**`zona-asuncion-skyline-costanera`**
Alt ES: `Skyline de Asunción y la Costanera vistos desde la bahía al atardecer`
Alt EN: `Asunción skyline and the Costanera seen from the bay at sunset`
> [preamble] Asunción, Paraguay skyline from the bay at golden hour: the
> Costanera promenade, modern glass towers of the Villa Morra / Paseo La
> Galería area behind, the Palacio de López's white neoclassical silhouette at
> the left edge, calm water reflecting warm light, palms along the shore.
> Wide establishing shot, horizon in the upper third.

**`zona-luque-casas-modernas`**
Alt ES: `Calle arbolada con casas modernas de un barrio nuevo en Luque`
Alt EN: `Tree-lined street with modern houses in a new neighbourhood of Luque`
> [preamble] A quiet new residential street in Luque, Paraguay, late
> afternoon: a row of contemporary single-storey houses with flat roofs,
> white and warm-grey render, timber garage doors, young lapacho trees along a
> clean sidewalk, red-brown soil visible in a garden bed, wide blue sky.
> Slight diagonal perspective down the street.

**`zona-san-lorenzo-barrio-residencial`**
Alt ES: `Barrio residencial de San Lorenzo con casas familiares y árboles altos`
Alt EN: `Residential neighbourhood in San Lorenzo with family houses and tall trees`
> [preamble] Aerial-ish elevated view (drone at 30 m) of an established
> residential neighbourhood in San Lorenzo, Paraguay: tile-roofed family
> houses with walled gardens, mature mango trees, a paved street, a small
> plaza with a church tower in the middle distance, warm morning light,
> soft haze on the horizon.

**`zona-san-bernardino-lago-ypacarai`**
Alt ES: `Casa de fin de semana frente al lago Ypacaraí en San Bernardino`
Alt EN: `Weekend house on the shore of Lake Ypacaraí in San Bernardino`
> [preamble] Lakefront weekend house in San Bernardino, Paraguay, on Lake
> Ypacaraí: white modern villa with a wide timber deck and a small private
> pier, sailboats far out on the water, tall pines and palms, late golden
> light, gentle ripples. Camera from the shore looking along the deck toward
> the lake, horizon in the upper third.

**`zona-encarnacion-costanera-parana`**
Alt ES: `Costanera y playa de Encarnación sobre el río Paraná al atardecer`
Alt EN: `Encarnación's riverfront promenade and beach on the Paraná River at sunset`
> [preamble] Encarnación, Paraguay: the Costanera with its sandy river beach
> on the Paraná, palm-lined promenade, mid-rise white apartment buildings
> behind, the San Roque González bridge faint on the horizon, sunset colours on
> the water, a few parasols folded, no crowds. Wide, calm, horizontal.

**`zona-ciudad-del-este-vista-aerea`**
Alt ES: `Vista aérea de Ciudad del Este con edificios modernos y el río Paraná`
Alt EN: `Aerial view of Ciudad del Este with modern buildings and the Paraná River`
> [preamble] Elevated aerial view of Ciudad del Este, Paraguay, at golden
> hour: a cluster of modern mid-rise office and apartment towers, dense green
> canopy between them, the wide Paraná River and the Friendship Bridge in the
> background, warm haze. Clean, ordered, no visible signage.

### Site-wide assets (single files, not the responsive set)

**Listing fallback — `propiedad-sin-foto-fachada-paraguay` — 4:3** → becomes `public/img/listing-fallback.webp`
Alt: not needed (the card supplies the listing title as alt).
> [preamble] Neutral, slightly abstract exterior of an unremarkable modern
> house in Paraguay seen through soft morning haze, desaturated toward warm
> grey-green, low contrast, no distinctive features, suitable as a quiet
> placeholder behind white text.

**Share card — `inmobiliaria-paraguay-og`** — 16:9 → becomes `public/img/og-share.webp`
> [preamble] Same scene family as the hero (modern house, pool, blue hour)
> but composed CENTRED with the house filling the middle, no empty side, so
> it survives a square crop in WhatsApp previews.

## 3. Converting with webimg (this does naming, sizes, AVIF/WebP, alt)

webimg runs from GitHub with nothing installed (Node ≥ 20). Never rename or
resize by hand; never write a sharp script.

### Option A — batch, the normal path

1. Put your generated files in one folder (any filenames), e.g. `~/premium-src/`.
2. Save this as `jobs.csv` in the **repo root** and fill in the `file` column
   with your paths (or Higgsfield result URLs — webimg downloads them):

```csv
file,prompt,name,alt,ar,position
~/premium-src/hero.png,hero blue hour pool house,casa-premium-asuncion-atardecer,Casa moderna con piscina iluminada al atardecer en un barrio residencial de Asunción,16:9,attention
~/premium-src/about.png,living room river view,living-moderno-vista-rio-asuncion,Sala de estar moderna con ventanales y vista al río Paraguay en un departamento de Asunción,3:2,attention
~/premium-src/asuncion.png,asuncion skyline,zona-asuncion-skyline-costanera,Skyline de Asunción y la Costanera vistos desde la bahía al atardecer,4:3,attention
~/premium-src/luque.png,luque street,zona-luque-casas-modernas,Calle arbolada con casas modernas de un barrio nuevo en Luque,4:3,attention
~/premium-src/san-lorenzo.png,san lorenzo aerial,zona-san-lorenzo-barrio-residencial,Barrio residencial de San Lorenzo con casas familiares y árboles altos,4:3,attention
~/premium-src/san-bernardino.png,lake house,zona-san-bernardino-lago-ypacarai,Casa de fin de semana frente al lago Ypacaraí en San Bernardino,4:3,attention
~/premium-src/encarnacion.png,encarnacion costanera,zona-encarnacion-costanera-parana,Costanera y playa de Encarnación sobre el río Paraná al atardecer,4:3,attention
~/premium-src/cde.png,ciudad del este aerial,zona-ciudad-del-este-vista-aerea,Vista aérea de Ciudad del Este con edificios modernos y el río Paraná,4:3,attention
```

3. From the repo root:

```bash
npx --yes github:antonmarklundcom/webimg batch . --manifest jobs.csv --out public/img/premium
```

   First run takes 30–60 s (clones, installs sharp). Output: for each name,
   `<name>-640/1280/1920.avif` and `.webp` in `public/img/premium/` — the
   placeholders with the same names are overwritten in place, and no code
   changes. It also writes `public/img/premium/manifest.json`; that file and
   `jobs.csv` are **not** committed (delete or `.gitignore` them).

   If webimg prints `⚠ upscaling` for a file, the source was under 1920 px on
   the long side; regenerate that one larger rather than accepting a soft hero.

4. The two single-file assets:

```bash
npx --yes github:antonmarklundcom/webimg convert ~/premium-src/fallback.png --name propiedad-sin-foto-fachada-paraguay --alt "placeholder" --prompt "fallback" --ar 4:3 --widths 1280 --out /tmp/webimg-single
cp /tmp/webimg-single/propiedad-sin-foto-fachada-paraguay-1280.webp public/img/listing-fallback.webp

npx --yes github:antonmarklundcom/webimg convert ~/premium-src/og.png --name inmobiliaria-paraguay-og --alt "share card" --prompt "og" --ar 16:9 --widths 1280 --out /tmp/webimg-single
cp /tmp/webimg-single/inmobiliaria-paraguay-og-1280.webp public/img/og-share.webp
```

   (`app/layout.tsx` and `app/page.tsx` declare the OG image as 1200×630; a
   1280×720 file is fine for WhatsApp and Facebook. If you want the metadata
   exact, change both `width`/`height` pairs to 1280/720 in the same commit.)

5. Verify, commit, push:

```bash
ls public/img/premium | wc -l          # expect 48 (8 slugs × 6 files)
git add public/img/premium public/img/listing-fallback.webp public/img/og-share.webp
git commit -m "Premium Editorial imagery — replace placeholders with generated set"
git push
```

   Hostinger rebuilds from `main` on merge; nothing else to do.

### Option B — you are on your PC and prefer a UI

```bash
npx --yes github:antonmarklundcom/webimg serve --out C:\path\to\propia.node\public\img\premium --open
```

Drag each file in, type the `name` and `alt` from §2 exactly, pick the
ratio, convert. Files land straight in the repo folder. Then step 5 above.

### Option C — images made elsewhere, sent to a Claude session

Zip the source PNGs, attach them to a cloud Claude Code session on this
repo, and say: *"convert with webimg per docs/imagery-prompts.md"*. The
session runs Option A itself (webimg is verified to work in the sandbox).

## 4. Rules

- The slug in `--name` is load-bearing: the code references
  `/img/premium/<name>-<width>.<ext>`. A different slug is a broken image.
- Keep the alt texts as written; they are in `src/i18n/es.ts` /
  `en.ts` and only change together with those files.
- No people as the subject, no text in the image, no invented landmarks
  presented as real ones (the prompts name real places loosely on purpose).
- Do not commit source PNGs, `jobs.csv` or `manifest.json`.
