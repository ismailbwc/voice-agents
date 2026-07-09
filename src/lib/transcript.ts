export interface TranscriptMessage {
  role: "user" | "agent";
  content: string;
}

function normalizeRole(role: string): "user" | "agent" | null {
  const r = role.toLowerCase().trim();
  if (r === "user") return "user";
  if (r === "agent" || r === "assistant") return "agent";
  return null;
}

/** Parse Retell update.transcript into structured messages. */
export function parseTranscriptMessages(raw: unknown): TranscriptMessage[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    const messages: TranscriptMessage[] = [];
    for (const item of raw) {
      if (typeof item === "string") {
        const parsed = parseTranscriptString(item);
        messages.push(...parsed);
        continue;
      }
      if (item && typeof item === "object" && "role" in item) {
        const role = normalizeRole(String((item as { role: string }).role));
        const content = extractUtteranceContent(item as { content?: string; words?: Array<{ word?: string }> });
        if (role && content) messages.push({ role, content });
      }
    }
    return messages;
  }

  if (typeof raw === "string") {
    return parseTranscriptString(raw);
  }

  return [];
}

function extractUtteranceContent(item: { content?: string; words?: Array<{ word?: string }> }): string {
  if (typeof item.content === "string" && item.content.trim()) {
    return item.content.trim();
  }
  if (Array.isArray(item.words) && item.words.length > 0) {
    return item.words
      .map((w) => w.word ?? "")
      .join(" ")
      .trim();
  }
  return "";
}

function parseTranscriptString(text: string): TranscriptMessage[] {
  const messages: TranscriptMessage[] = [];
  const lineRe = /(?:^|\n)\s*(User|Agent|Assistant):\s*(.+)/gi;
  let match: RegExpExecArray | null;
  while ((match = lineRe.exec(text)) !== null) {
    const role = normalizeRole(match[1]);
    const content = match[2].trim();
    if (role && content) messages.push({ role, content });
  }
  return messages;
}

/** Plain-text form for debugging / fallback. */
export function normalizeTranscript(raw: unknown): string {
  return parseTranscriptMessages(raw)
    .map((m) => `${m.role === "user" ? "User" : "Agent"}: ${m.content}`)
    .join("\n");
}

export function getUserMessages(messages: TranscriptMessage[]): string[] {
  return messages.filter((m) => m.role === "user").map((m) => m.content);
}

export function getAgentMessages(messages: TranscriptMessage[]): string[] {
  return messages.filter((m) => m.role === "agent").map((m) => m.content);
}
