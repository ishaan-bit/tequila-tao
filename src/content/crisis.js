// src/content/crisis.js — India crisis & support lines, the single source of
// truth for the interactive "Get help now" surface (CrisisHelp.jsx). Numbers
// verified 2026 against government sources (Tele-MANAS / MoHFW; KIRAN / Ministry
// of Social Justice & Empowerment) and established NGOs (Vandrevala, AASRA).
// `tel` is the dial string (no spaces) used for tel: links; `number` is shown.

export const CRISIS_LINES = [
  {
    name: "Emergency",
    number: "112",
    tel: "112",
    note: "Police · fire · medical — 24/7",
    kind: "emergency",
  },
  {
    name: "Ambulance",
    number: "108",
    tel: "108",
    note: "Medical emergency — 24/7",
    kind: "emergency",
  },
  {
    name: "Tele-MANAS",
    number: "14416",
    tel: "14416",
    note: "Govt mental-health helpline · 24/7 · 20+ languages",
    kind: "support",
  },
  {
    name: "KIRAN",
    number: "1800-599-0019",
    tel: "18005990019",
    note: "Mental health & substance use · free · 24/7",
    kind: "support",
  },
  {
    name: "Vandrevala Foundation",
    number: "1860-266-2345",
    tel: "18602662345",
    note: "Free counselling · 24/7",
    kind: "support",
  },
  {
    name: "AASRA",
    number: "+91 98204 66726",
    tel: "+919820466726",
    note: "Suicide prevention · 24/7",
    kind: "support",
  },
];

// For users outside India (or who want more options).
export const HELPLINE_DIRECTORY = {
  label: "Find a helpline near you",
  href: "https://findahelpline.com",
};
