import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.toUpperCase().trim();
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("children")
    .select(
      "code, name, age, gender, level, customization, character_type, outfit, char_img, coins, inventory, shop_purchases, chest_artifacts",
    )
    .eq("code", code)
    .single();

  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const sb = getSupabaseAdmin();

  const row: Record<string, unknown> = {
    code: body.code,
    name: body.name,
    age: body.age,
    character_type: body.character_type ?? "boy",
    outfit: body.outfit ?? "brown",
    char_img: body.char_img ?? null,
    coins: body.coins ?? 0,
    inventory: body.inventory ?? [],
    updated_at: new Date().toISOString(),
  };
  if (body.gender !== undefined) row.gender = body.gender;
  if (body.level !== undefined) row.level = body.level;
  if (body.customization !== undefined) row.customization = body.customization;
  if (body.shop_purchases !== undefined) row.shop_purchases = body.shop_purchases;
  if (body.chest_artifacts !== undefined) row.chest_artifacts = body.chest_artifacts;

  const { data, error } = await sb
    .from("children")
    .upsert(row, { onConflict: "code" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400, headers: corsHeaders });
  }

  const raw = body.code;
  const code =
    typeof raw === "string" ? raw.toUpperCase().replace(/\s+/g, "").trim() : "";
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400, headers: corsHeaders });
  }

  const sb = getSupabaseAdmin();
  const { data: row, error: selErr } = await sb
    .from("children")
    .select("level")
    .eq("code", code)
    .maybeSingle();

  if (selErr || !row) {
    return NextResponse.json({ error: "not found" }, { status: 404, headers: corsHeaders });
  }

  const increment =
    Boolean(body.increment_adventure) || Boolean(body.increment_lesson);
  const prevLevel = typeof row.level === "number" ? row.level : 0;
  const nextLevel = increment ? prevLevel + 1 : prevLevel;

  const coinsRaw = body.coins;
  const coins =
    typeof coinsRaw === "number"
      ? coinsRaw
      : typeof coinsRaw === "string"
        ? Number(coinsRaw)
        : 0;

  const updatePayload: Record<string, unknown> = {
    coins: Number.isFinite(coins) ? coins : 0,
    inventory: Array.isArray(body.inventory) ? body.inventory : [],
    shop_purchases: Array.isArray(body.shop_purchases) ? body.shop_purchases : [],
    chest_artifacts: Array.isArray(body.chest_artifacts) ? body.chest_artifacts : [],
    level: nextLevel,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("children")
    .update(updatePayload)
    .eq("code", code)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
  return NextResponse.json(data, { headers: corsHeaders });
}
