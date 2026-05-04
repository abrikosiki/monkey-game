import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function genderFromArchetype(characterType: string): string {
  if (characterType === "boy") return "male";
  if (characterType === "girl") return "female";
  return "neutral";
}

function generateChildCode(): string {
  const n = randomBytes(2).readUInt16BE(0) % 10000;
  const digits = String(n).padStart(4, "0");
  return `MONKEY-${digits}`;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const name =
    typeof body.name === "string" ? body.name.trim().slice(0, 80) || "Hero" : "Hero";
  const character_type =
    typeof body.character_type === "string" ? body.character_type : "boy";
  const outfit = typeof body.outfit === "string" ? body.outfit : "brown";
  const char_img =
    typeof body.char_img === "string" && body.char_img.length > 0 ? body.char_img : null;
  const gender =
    typeof body.gender === "string" && body.gender.length > 0
      ? String(body.gender).slice(0, 32)
      : genderFromArchetype(character_type);
  const customization =
    body.customization !== undefined && body.customization !== null && typeof body.customization === "object"
      ? body.customization
      : {
          character_archetype: character_type,
          outfit_color: outfit,
          char_img,
        };

  const sb = getSupabaseAdmin();
  const maxAttempts = 12;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateChildCode();
    const { data, error } = await sb
      .from("children")
      .insert({
        code,
        name,
        age: typeof body.age === "number" ? body.age : null,
        character_type,
        outfit,
        char_img,
        gender,
        level: 0,
        customization,
        coins: 0,
        inventory: [],
        shop_purchases: [],
        chest_artifacts: [],
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!error && data) {
      const headers = {
        "Access-Control-Allow-Origin": "*",
      };
      return NextResponse.json(data, { headers });
    }

    const pgCode =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    const msg = error?.message ?? "";
    const isDup = pgCode === "23505" || /duplicate key|unique constraint/i.test(msg);
    if (!isDup) {
      return NextResponse.json({ error: msg || "database error" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "could not allocate unique code" }, { status: 500 });
}
