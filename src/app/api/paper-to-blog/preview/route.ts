import { NextResponse } from "next/server";
import { TRPCError } from "@trpc/server";

import { paperConversionInputSchema } from "@/modules/paper-to-blog/server/schema";
import { createPaperConversionPreview } from "@/modules/paper-to-blog/server/service";

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = (await request.json()) as unknown;
  } catch {
    body = null;
  }

  const parsed = paperConversionInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid paper conversion request.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const preview = await createPaperConversionPreview(parsed.data);
    return NextResponse.json(preview);
  } catch (error) {
    if (error instanceof TRPCError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Paper conversion preview failed." },
      { status: 500 },
    );
  }
}
