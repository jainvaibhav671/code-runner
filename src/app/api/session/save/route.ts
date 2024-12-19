import { checkFileExists, createSession, updateSession } from "@/lib/actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const data = (await request.json()) as {
    code: string;
    input: string;
    lang: string;
    sessionId: string;
  };

  const { exist } = await checkFileExists(
    `code-${data.sessionId}.${data.lang}`
  );

  let error2;
  if (exist) {
    const { error } = await updateSession(data, data.sessionId);
    error2 = error;
  } else {
    const { error } = await createSession(data, data.sessionId);
    error2 = error;
  }

  if (error2) {
    return NextResponse.json({ success: false, error: error2 });
  }

  return NextResponse.json({ success: true });
}
