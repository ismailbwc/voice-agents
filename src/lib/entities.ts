export type EntitySlug = "dhcc" | "c37";

export interface EntityTheme {
  primary: string;
  primaryLight: string;
  accent: string;
  glow: string;
  gradientFrom: string;
  gradientTo: string;
  orbListening: string;
  orbSpeaking: string;
  surface: string;
  text: string;
  textMuted: string;
  chip: string;
}

export interface EntityConfig {
  slug: EntitySlug;
  name: string;
  shortName: string;
  tagline: string;
  agentName: string;
  agentIdEnvKey: string;
  receptionistImage: string;
  logoText: string;
  locationLabel: string;
  theme: EntityTheme;
}

const LIGHT_BASE = {
  gradientFrom: "#F5F7FA",
  gradientTo: "#EEF2F7",
  surface: "#FFFFFF",
  text: "#0B1F3A",
  textMuted: "#64748B",
  chip: "#E8F0FE",
};

export const ENTITIES: Record<EntitySlug, EntityConfig> = {
  dhcc: {
    slug: "dhcc",
    name: "Dubai Healthcare City",
    shortName: "DHCC",
    tagline: "Your gateway to world-class healthcare in Dubai",
    agentName: "Sara",
    agentIdEnvKey: "RETELL_AGENT_ID_DHCC",
    receptionistImage: "/images/receptionist.png",
    logoText: "DHCC",
    locationLabel: "Dubai Healthcare City",
    theme: {
      ...LIGHT_BASE,
      primary: "#0B1F3A",
      primaryLight: "#2563EB",
      accent: "#0D9488",
      glow: "rgba(37, 99, 235, 0.2)",
      orbListening: "#0D9488",
      orbSpeaking: "#2563EB",
    },
  },
  c37: {
    slug: "c37",
    name: "C37 Medical Workspace",
    shortName: "C37",
    tagline: "Private medical co-working by Dubai Healthcare City",
    agentName: "Maya",
    agentIdEnvKey: "RETELL_AGENT_ID_C37",
    receptionistImage: "/images/receptionist.png",
    logoText: "C37",
    locationLabel: "C37 · DHCC Oud Metha & Al Jaddaf",
    theme: {
      ...LIGHT_BASE,
      primary: "#0B1F3A",
      primaryLight: "#2563EB",
      accent: "#0D9488",
      glow: "rgba(13, 148, 136, 0.22)",
      orbListening: "#0D9488",
      orbSpeaking: "#2563EB",
    },
  },
};

export function getEntity(slug: string): EntityConfig | null {
  if (slug in ENTITIES) return ENTITIES[slug as EntitySlug];
  return null;
}

export function getAgentId(entity: EntityConfig): string {
  return process.env[entity.agentIdEnvKey] ?? "";
}
