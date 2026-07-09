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
}

export interface EntityConfig {
  slug: EntitySlug;
  name: string;
  shortName: string;
  tagline: string;
  agentIdEnvKey: string;
  receptionistImage: string;
  logoText: string;
  theme: EntityTheme;
}

export const ENTITIES: Record<EntitySlug, EntityConfig> = {
  dhcc: {
    slug: "dhcc",
    name: "Dubai Healthcare City",
    shortName: "DHCC",
    tagline: "Your gateway to world-class healthcare in Dubai",
    agentIdEnvKey: "RETELL_AGENT_ID_DHCC",
    receptionistImage: "/images/dhcc-receptionist.svg",
    logoText: "DHCC",
    theme: {
      primary: "#0d9488",
      primaryLight: "#14b8a6",
      accent: "#06b6d4",
      glow: "rgba(20, 184, 166, 0.45)",
      gradientFrom: "#0a1628",
      gradientTo: "#0d3d38",
      orbListening: "#22d3ee",
      orbSpeaking: "#2dd4bf",
    },
  },
  c37: {
    slug: "c37",
    name: "C37 Medical Workspace",
    shortName: "C37",
    tagline: "Private medical co-working by Dubai Healthcare City",
    agentIdEnvKey: "RETELL_AGENT_ID_C37",
    receptionistImage: "/images/c37-receptionist.svg",
    logoText: "C37",
    theme: {
      primary: "#b45309",
      primaryLight: "#d97706",
      accent: "#f59e0b",
      glow: "rgba(217, 119, 6, 0.4)",
      gradientFrom: "#1a1208",
      gradientTo: "#3d2a0a",
      orbListening: "#fbbf24",
      orbSpeaking: "#f97316",
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
