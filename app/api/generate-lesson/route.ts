import { NextResponse } from "next/server";
import { generateLessonPlan } from "@/lib/claude";
import type { TutorFormValues } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TutorFormValues;
    const lessonPlan = await generateLessonPlan(body);
    return NextResponse.json(lessonPlan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate lesson";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
