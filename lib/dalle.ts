import OpenAI from "openai";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ImagePrompt } from "@/lib/types";

const STYLE_LOCK = `
You generate game assets for Monkey Archipelago.
Your output must match the exact visual language of the trial lesson.

STYLE LOCK (MANDATORY)
- 3D cartoon cinematic look
- warm tropical lighting, soft bloom
- rich but clean color palette (teal, sand, jungle green, gold accents)
- kid-friendly premium educational game style
- rounded silhouettes, readable at small size
- no photorealism, no flat vector, no anime
- high contrast edges for UI readability
- consistent material style across all assets

COMPOSITION RULES
- For ITEMS/ICONS:
  - single object centered
  - transparent background
  - no text, no labels, no watermark
  - object fully visible with safe margins
- For BACKGROUNDS:
  - produce coordinated island-style scenic backgrounds
  - keep cleaner areas where puzzle UI can sit
  - no text overlays
- For UI DECOR:
  - subtle glow and magical adventure mood

TECH SPECS
- output suitable for WEBP conversion
- no embedded typography
- no logos, signatures, or watermarks

CONSISTENCY TAG
MonkeyArchipelago_TrialStyle_v1
`;

function classifyAsset(filename: string): "background" | "item" {
  return /bg|background|island|left|right/i.test(filename) ? "background" : "item";
}

function buildLockedPrompt(item: ImagePrompt) {
  const kind = classifyAsset(item.filename);
  const kindRules =
    kind === "background"
      ? "Asset type: island background. Keep composition readable behind gameplay UI."
      : "Asset type: item icon. Centered object, transparent background, no text.";
  return `${STYLE_LOCK}\n\n${kindRules}\n\nTask:\n${item.prompt}`;
}

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

function toPublicUrl(path: string) {
  const supabase = getSupabaseAdmin();
  const { data } = supabase.storage.from("game-assets").getPublicUrl(path);
  return data.publicUrl || path;
}

export async function generateOrReuseImages(prompts: ImagePrompt[]) {
  const openai = getOpenAI();
  const supabase = getSupabaseAdmin();
  const uploaded: Record<string, string> = {};

  for (const item of prompts) {
    const exists = await checkLibrary(item.filename);
    if (exists) {
      uploaded[item.filename] = toPublicUrl(`library/${item.filename}`);
      continue;
    }

    const image = await openai.images.generate({
      model: "gpt-image-1",
      prompt: buildLockedPrompt(item),
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

    uploaded[item.filename] = toPublicUrl(filepath);
  }

  return uploaded;
}
