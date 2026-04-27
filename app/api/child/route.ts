import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.toUpperCase().trim();
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("children")
    .select("code, name, age, character_type, outfit, char_img, coins, inventory")
    .eq("code", code)
    .single();

  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const sb = getSupabaseAdmin();

  const { data, error } = await sb
    .from("children")
    .upsert(
      {
        code: body.code,
        name: body.name,
        age: body.age,
        character_type: body.character_type ?? "boy",
        outfit: body.outfit ?? "brown",
        char_img: body.char_img ?? null,
        coins: body.coins ?? 0,
        inventory: body.inventory ?? [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "code" },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
