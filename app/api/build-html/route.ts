import { NextResponse } from "next/server";
import { buildLessonHtml } from "@/lib/buildHtml";
import type { LessonPlan } from "@/lib/types";

interface BuildHtmlPayload {
  lessonPlan: LessonPlan;
  images: Record<string, string>;
  character: string;
  island: string;
  /** Used by generated lesson HTML to call PATCH /api/child (avoids broken fetch from blob: origins). */
  publicAppUrl?: string;
  childProfile?: {
    code?: string | null;
    name?: string | null;
    character_type?: string | null;
    outfit?: string | null;
    char_img?: string | null;
    coins?: number | null;
    level?: number | null;
    inventory?: unknown;
    shop_purchases?: unknown;
    chest_artifacts?: unknown;
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BuildHtmlPayload;
    const html = buildLessonHtml({
      lessonPlan: body.lessonPlan,
      images: body.images ?? {},
      character: body.character,
      island: body.island,
      childProfile: body.childProfile,
      publicAppUrl: body.publicAppUrl,
    });
    return NextResponse.json({ html });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build html";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
