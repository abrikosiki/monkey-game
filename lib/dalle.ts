import OpenAI from "openai";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ImagePrompt } from "@/lib/types";

const STYLE_SUFFIX = `
Style: 3D cartoon Pixar aesthetic, warm earthy tones,
vibrant colors, clean illustration,
isolated on pure transparent background, WEBP format.
Same style as the other game assets.
`;

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is missing");
  }
  return new OpenAI({ apiKey: key });
}

async function checkLibrary(filename: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.storage
    .from("game-assets")
    .list("library", { search: filename });
  return data?.some((item) => item.name === filename) ?? false;
}

export async function generateOrReuseImages(prompts: ImagePrompt[]) {
  const openai = getOpenAI();
  const supabase = getSupabaseAdmin();
  const uploaded: Record<string, string> = {};

  for (const item of prompts) {
    const exists = await checkLibrary(item.filename);
    if (exists) {
      uploaded[item.filename] = `library/${item.filename}`;
      continue;
    }

    const image = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `${item.prompt}\n${STYLE_SUFFIX}`,
      size: "1024x1024",
      quality: "medium",
    });

    const base64 = image.data?.[0]?.b64_json;
    if (!base64) continue;

    const buffer = Buffer.from(base64, "base64");
    const filepath = `dynamic/${Date.now()}-${item.filename}`;

    await supabase.storage
      .from("game-assets")
      .upload(filepath, buffer, { contentType: "image/webp", upsert: true });

    uploaded[item.filename] = filepath;
  }

  return uploaded;
}
