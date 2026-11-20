import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Вызывается Vercel Cron раз в день, чтобы бесплатный проект Supabase не уходил на паузу.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { error } = await getSupabaseAdmin()
      .from("children")
      .select("id", { head: true, count: "exact" });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
