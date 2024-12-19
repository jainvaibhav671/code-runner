import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET() {
  const length = parseInt(process.env.SESSION_ID_LENGTH as string);
  const sessionId = nanoid(length);

  return NextResponse.json({
    sessionId,
  });
}
