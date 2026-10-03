/** Reviews (plan-admin-next O7) — English peer of `es-review.ts`. */
import type { esReview } from "./es-review";

export const enReview = {
  metaTitle: "Leave a review",
  title: (name: string) => `How was your experience with ${name}?`,
  intro:
    "Your opinion helps other people choose. We read it before it goes live, and we never show your phone number or email.",
  ratingLabel: "Your rating",
  starLabel: (n: number) => (n === 1 ? "1 star" : `${n} stars`),
  nameLabel: "Your name, as you want it shown",
  namePlaceholder: "Maria G.",
  bodyLabel: "Tell us more (optional)",
  bodyPlaceholder: "How were the service, the response times, the viewing…?",
  submit: "Send review",
  thanks: "Thank you! We will read your review and publish it within a few days.",
  used: (name: string) => `You have already reviewed ${name}. Thank you!`,
  expired: "This link has expired. Ask whoever sent it for a new one.",
  invalid: "This link is not valid.",
  invalidForm: "Choose a rating and write your name.",
  rateLimited: "Too many attempts. Please try again in a few minutes.",

  sectionTitle: "Reviews",
  summary: (avg: string, n: number) => `${avg} out of 5 · ${n === 1 ? "1 review" : `${n} reviews`}`,
  starsAria: (avg: string) => `${avg} out of 5 stars`,
  verifiedNote:
    "Only people who made a real enquiry through the portal can review. We read every review before it goes live.",
} satisfies Record<keyof typeof esReview, unknown>;
