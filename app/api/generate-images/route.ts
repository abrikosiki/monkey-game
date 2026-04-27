import { NextResponse } from "next/server";
import { generateOrReuseImages } from "@/lib/dalle";
import type { ImagePrompt } from "@/lib/types";

interface GenerateImagesPayload {
  imagePrompts: ImagePrompt[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateImagesPayload;
    const uploads = await generateOrReuseImages(body.imagePrompts || []);
    return NextResponse.json(uploads);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate images";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
