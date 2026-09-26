/**
 * English peer of `es-a4.ts` (plan-build A4). The manifest is the one piece a
 * visitor on the English door actually receives; the panel strings are here
 * so both dictionaries keep the same shape.
 */
export const enA4 = {
  manifest: {
    name: (brand: string) => `${brand} — Dashboard`,
    shortName: "Dashboard",
    description:
      "Your listings, your enquiries and your profile, one tap away on your phone.",
  },

  profile: {
    teamPickerLabel: "Profile to edit",
    teamPickerOwn: (name: string) => `${name} (you)`,
    teamPickerGo: "Open",
    editingColleague: (name: string) =>
      `You are editing ${name}'s public profile.`,
    bioLabel: "About",
    bioHint: (max: number) =>
      `Say who you help and how you work. Up to ${max} characters.`,
    zonesLabel: "Areas you cover",
    zonesHint: (max: number) =>
      `Pick up to ${max} cities. It helps us pass you seller enquiries from those areas.`,
    licenseLabel: "Licence or professional registration",
    yearsLabel: "Years of experience",
    savedColleague: "Agent profile updated.",
    photoRejected: "The photo must be an https link to a public image.",
    yearsRejected: "Years of experience must be a number from 0 to 70.",
    notFound: "That profile does not exist or is not part of your agency.",
  },

  quality: {
    title: "Before you submit for review",
    intro:
      "A complete listing gets more enquiries. Items marked required are always checked in review; the rest are recommendations.",
    required: "Required",
    recommended: "Recommended",
    ok: "Done",
    photos: (n: number, min: number) => `At least ${min} photos (now: ${n}).`,
    mapExact: "Exact position on the map.",
    mapApprox:
      "Exact position on the map: the listing currently shows at the centre of its neighbourhood or city.",
    mapNone: "The listing has no position on the map.",
    price: "Price and currency.",
    area: "Size in m².",
    titleRequired: (min: number) => `A title of at least ${min} characters.`,
    titleLength: (min: number, max: number) =>
      `A clear title, ${min} to ${max} characters.`,
    description: (min: number, n: number) =>
      `A description of at least ${min} characters (now: ${n}).`,
    summaryBlocked:
      "A required item is missing: the listing cannot be saved like this.",
    summary: (warnings: number) =>
      warnings === 0
        ? "All good."
        : warnings === 1
          ? "1 recommendation left. You can still submit."
          : `${warnings} recommendations left. You can still submit.`,
  },
};
