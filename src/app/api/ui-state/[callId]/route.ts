import { NextRequest, NextResponse } from "next/server";
import { clearUiState, getUiState } from "@/lib/ui-session-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  const { callId } = await params;
  return NextResponse.json(getUiState(callId));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  const { callId } = await params;
  clearUiState(callId);
  return NextResponse.json({ cleared: true });
}
