import { NextResponse } from "next/server";
import { buildLessonHtml } from "@/lib/buildHtml";
import type { LessonPlan } from "@/lib/types";

interface BuildHtmlPayload {
  lessonPlan: LessonPlan;
  images: Record<string, string>;
  character: string;
  island: string;
  childProfile?: {
    name?: string | null;
    character_type?: string | null;
    outfit?: string | null;
    char_img?: string | null;
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
    });
    return NextResponse.json({ html });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build html";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
