import { loadDoctors } from "./csv-loader";
import type { EntitySlug } from "./entities";
import type { DoctorRow } from "./types";

function normalize(text: string): string {
  return text.toLowerCase().replace(/['']/g, "'");
}

/** Score how well a CSV doctor row matches text from the agent's spoken response. */
function scoreDoctor(doc: DoctorRow, agentText: string): number {
  const lower = normalize(agentText);
  let score = 0;

  const bareName = doc.name.replace(/^Dr\.?\s*/i, "").trim();
  const bareLower = normalize(bareName);
  const parts = bareLower.split(/\s+/).filter(Boolean);
  const lastName = parts[parts.length - 1] ?? "";

  if (bareLower.length > 3 && lower.includes(bareLower)) score += 100;
  if (lastName.length > 3 && lower.includes(lastName)) score += 75;
  if (parts[0] && parts[0].length > 2 && lower.includes(parts[0])) score += 45;

  const specLower = normalize(doc.specialty);
  if (specLower.length > 3 && lower.includes(specLower)) score += 60;

  for (const word of specLower.split(/[^a-z0-9]+/).filter((w) => w.length > 3)) {
    if (lower.includes(word)) score += 12;
  }

  const titleLower = normalize(doc.title);
  for (const word of titleLower.split(/[^a-z0-9]+/).filter((w) => w.length > 4)) {
    if (lower.includes(word)) score += 8;
  }

  return score;
}

/**
 * Match doctors from the agent's transcript against the entity CSV.
 * Prefers explicit name mentions, then specialty/title overlap from the CSV fields.
 * For C37, also searches DHCC partner doctors when local matches are weak/empty.
 */
export function matchDoctorsFromAgentText(
  entity: EntitySlug,
  agentText: string,
  limit = 4
): DoctorRow[] {
  const trimmed = agentText.trim();
  if (!trimmed) return [];

  const scorePool = (doctors: DoctorRow[]) =>
    doctors
      .map((doc) => ({ doc, score: scoreDoctor(doc, trimmed) }))
      .filter(({ score }) => score >= 20)
      .sort((a, b) => b.score - a.score);

  const local = scorePool(loadDoctors(entity));
  if (entity !== "c37") {
    return local.slice(0, limit).map(({ doc }) => doc);
  }

  // C37: prefer local hits, but fill/replace with DHCC partners when the agent
  // is clearly naming a DHCC doctor or specialty C37 does not have.
  const dhcc = scorePool(loadDoctors("dhcc"));
  const strongLocal = local.filter(({ score }) => score >= 45);
  if (strongLocal.length > 0) {
    return strongLocal.slice(0, limit).map(({ doc }) => doc);
  }

  const merged = [...dhcc, ...local];
  const seen = new Set<string>();
  const out: DoctorRow[] = [];
  for (const { doc } of merged) {
    if (seen.has(doc.id)) continue;
    seen.add(doc.id);
    out.push(doc);
    if (out.length >= limit) break;
  }
  return out;
}

/** Combine recent agent lines into one string for matching. */
export function collectAgentDoctorText(agentLines: string[]): string {
  const relevant = agentLines.filter((line) => {
    const t = line.toLowerCase();
    return (
      /\bdr\.?\s/i.test(line) ||
      t.includes("specialist") ||
      t.includes("consultant") ||
      t.includes("surgeon") ||
      t.includes("physician") ||
      t.includes("recommend")
    );
  });

  const source = relevant.length > 0 ? relevant : agentLines;
  return source.slice(-2).join(" ");
}
