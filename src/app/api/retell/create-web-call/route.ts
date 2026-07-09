import { NextRequest, NextResponse } from "next/server";
import { ENTITIES, getAgentId, type EntitySlug } from "@/lib/entities";
import { getRetellClient } from "@/lib/retell";

const CALL_RULES =
  "Never say thank you for checking or thank you for calling mid-conversation. " +
  "Never end the call unless the caller explicitly says goodbye. " +
  "When asked about availability, give specific times immediately — do not say you will check later.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entity = body.entity as EntitySlug;

    if (!entity || !(entity in ENTITIES)) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    const config = ENTITIES[entity];
    const agentId = getAgentId(config);

    if (!agentId) {
      return NextResponse.json(
        { error: `Agent ID not configured. Set ${config.agentIdEnvKey} in .env.local` },
        { status: 500 }
      );
    }

    const client = getRetellClient();
    const webCall = await client.call.createWebCall({
      agent_id: agentId,
      metadata: { entity },
      retell_llm_dynamic_variables: {
        call_rules: CALL_RULES,
      },
      agent_override: {
        agent: {
          end_call_after_silence_ms: 600000,
        },
      },
    });

    return NextResponse.json({
      access_token: webCall.access_token,
      call_id: webCall.call_id,
      agent_id: webCall.agent_id,
    });
  } catch (error) {
    console.error("create-web-call error:", error);
    const message = error instanceof Error ? error.message : "Failed to create web call";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
