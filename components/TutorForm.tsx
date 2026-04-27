"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { LessonPreview } from "@/components/LessonPreview";
import { ProgressBar } from "@/components/ProgressBar";
import type { LessonPlan, TutorFormValues } from "@/lib/types";

const TOPICS = [
  "Числа 1-5",
  "Числа 6-10",
  "Сложение до 10",
  "Вычитание до 10",
  "Числа до 20",
  "Сложение до 20",
  "Вычитание до 20",
  "Состав числа",
  "Сравнение чисел",
  "Числа до 100",
  "Умножение",
  "Деление",
  "Геометрия",
  "Дроби",
];

const TOPIC_TO_ISLAND: Record<string, string> = {
  "Числа 1-5":        "Остров 1: Числа и счёт",
  "Числа 6-10":       "Остров 1: Числа и счёт",
  "Сложение до 10":   "Остров 2: Сложение до 10",
  "Вычитание до 10":  "Остров 3: Вычитание до 10",
  "Числа до 20":      "Остров 4: Числа до 20",
  "Сложение до 20":   "Остров 5: Сложение до 20",
  "Вычитание до 20":  "Остров 6: Вычитание до 20",
  "Состав числа":     "Остров 7: Состав числа",
  "Сравнение чисел":  "Остров 8: Сравнение чисел",
  "Числа до 100":     "Остров 9: Числа до 100",
  "Умножение":        "Остров 10: Умножение",
  "Деление":          "Остров 11: Деление",
  "Геометрия":        "Остров 12: Геометрия и дроби",
  "Дроби":            "Остров 12: Геометрия и дроби",
};

const CHARACTERS = ["boy", "girl", "elf", "wizard", "pirate", "fairy"];

const CHARACTER_IMAGES: Record<string, string> = {
  boy:    "/assets/characters/boy_brown.webp",
  girl:   "/assets/characters/girl_brown.webp",
  elf:    "/assets/characters/elf_green.webp",
  wizard: "/assets/characters/wizard_blue.webp",
  pirate: "/assets/characters/pirate_brown.webp",
  fairy:  "/assets/characters/fairy_green.webp",
};

const OUTFIT_IMAGES: Record<string, Record<string, string>> = {
  boy:    { brown: "/assets/characters/boy_brown.webp",    blue: "/assets/characters/boy_blue.webp",    green: "/assets/characters/boy_green.webp" },
  girl:   { brown: "/assets/characters/girl_brown.webp",   blue: "/assets/characters/girl_blue.webp",   green: "/assets/characters/girl_green.webp" },
  elf:    { red:   "/assets/characters/elf_red.webp",      blue: "/assets/characters/elf_blue.webp",    green: "/assets/characters/elf_green.webp" },
  wizard: { red:   "/assets/characters/wizard_red.webp",   blue: "/assets/characters/wizard_blue.webp", green: "/assets/characters/wizard_green.webp" },
  pirate: { brown: "/assets/characters/pirate_brown.webp", blue: "/assets/characters/pirate_blue.webp", green: "/assets/characters/pirate_green.webp" },
  fairy:  { red:   "/assets/characters/fairy_red.webp",    purple: "/assets/characters/fairy_purple.webp", green: "/assets/characters/fairy_green.webp" },
};

const STEPS = ["Генерируем план урока...", "Создаём картинки...", "Собираем игру...", "Готово!"];

interface ChildData {
  code: string;
  name: string | null;
  age: number | null;
  character_type: string;
  outfit: string;
  coins: number;
  inventory: string[];
}

interface BuildResponse { html: string }

interface ResultState {
  lessonPlan: LessonPlan;
  html: string;
  childCode: string;
}

const defaultValues: TutorFormValues = {
  childName: "",
  age: 7,
  difficulty: "easy",
  topic: TOPICS[0],
  lessonNumber: 1,
  island: TOPIC_TO_ISLAND[TOPICS[0]],
  weakPoints: "",
  focus: "",
  knows: "",
  notes: "",
  character: "boy",
  characterName: "",
};

export function TutorForm() {
  const [form, setForm] = useState<TutorFormValues>(defaultValues);
  const [childCode, setChildCode] = useState("");
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "new">("idle");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const characterName = useMemo(
    () => form.characterName || form.childName || "Hero",
    [form.characterName, form.childName],
  );

  const update = <K extends keyof TutorFormValues>(key: K, value: TutorFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateTopic = (topic: string) =>
    setForm((prev) => ({ ...prev, topic, island: TOPIC_TO_ISLAND[topic] ?? prev.island }));

  const lookupChild = useCallback(async (code: string) => {
    const normalized = code.toUpperCase().trim();
    if (normalized.length < 6) { setChildData(null); setLookupStatus("idle"); return; }
    setLookupStatus("loading");
    try {
      const res = await fetch(`/api/child?code=${encodeURIComponent(normalized)}`);
      if (res.ok) {
        const data = (await res.json()) as ChildData;
        setChildData(data);
        setLookupStatus("found");
        if (data.name) update("childName", data.name);
        if (data.age) update("age", data.age);
        update("character", data.character_type);
      } else {
        setChildData(null);
        setLookupStatus("new");
      }
    } catch {
      setChildData(null);
      setLookupStatus("new");
    }
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const fullCode = childCode.trim() ? `MONKEY-${childCode.trim()}` : "";
    timer.current = setTimeout(() => lookupChild(fullCode), 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [childCode, lookupChild]);

  const charImg =
    OUTFIT_IMAGES[childData?.character_type ?? form.character]?.[childData?.outfit ?? "brown"]
    ?? CHARACTER_IMAGES[form.character];

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!childCode.trim()) { setError("Введи цифры кода ребёнка"); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      setStep(0);
      const lessonRes = await fetch("/api/generate-lesson", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, characterName }),
      });
      if (!lessonRes.ok) throw new Error("Не удалось сгенерировать план урока");
      const lesson = (await lessonRes.json()) as LessonPlan;

      setStep(1);
      const imgRes = await fetch("/api/generate-images", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePrompts: lesson.imagePrompts }),
      });
      if (!imgRes.ok) throw new Error("Не удалось сгенерировать картинки");
      const images = (await imgRes.json()) as Record<string, string>;

      setStep(2);
      const buildRes = await fetch("/api/build-html", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonPlan: lesson, images, character: form.character, island: form.island }),
      });
      if (!buildRes.ok) throw new Error("Не удалось собрать HTML");
      const built = (await buildRes.json()) as BuildResponse;

      setStep(3);
      setResult({ lessonPlan: lesson, html: built.html, childCode: `MONKEY-${childCode.trim()}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[1.2fr,0.8fr]">
      <form className="space-y-4" onSubmit={onSubmit}>

        {/* Код ребёнка */}
        <section className="panel p-5">
          <h3 className="font-fredoka text-xl text-brandAccent">Код ребёнка</h3>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex flex-1 items-center rounded-lg bg-white/5 focus-within:ring-2 focus-within:ring-brandAccent">
              <span className="pl-4 font-mono font-bold text-white/50 tracking-widest uppercase">MONKEY-</span>
              <input
                className="w-full bg-transparent p-3 font-mono tracking-widest outline-none"
                placeholder="1234"
                value={childCode}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                onChange={(e) => setChildCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            {lookupStatus === "loading" && <span className="text-sm text-white/40">Ищем...</span>}
          </div>

          {lookupStatus === "found" && childData && (
            <div className="mt-3 flex items-center gap-4 rounded-xl bg-white/5 p-3">
              <Image
                src={charImg}
                alt={childData.character_type}
                width={64}
                height={64}
                className="rounded-lg object-contain"
              />
              <div className="text-sm">
                <p className="font-bold text-brandAccent">{childData.name ?? "Без имени"}, {childData.age ?? "?"} лет</p>
                <p className="text-white/60 capitalize">{childData.character_type} · {childData.outfit}</p>
                <p className="text-white/60">🪙 {childData.coins} монет · 🎒 {childData.inventory.length} предм.</p>
              </div>
            </div>
          )}

          {lookupStatus === "new" && childCode.length >= 6 && (
            <p className="mt-2 text-sm text-yellow-400">⚠️ Ребёнок не найден — создастся новый профиль</p>
          )}
        </section>

        {/* Ребёнок */}
        <section className="panel p-5">
          <h3 className="font-fredoka text-xl text-brandAccent">Ребёнок</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              className="rounded-lg bg-white/5 p-3"
              required
              placeholder="Имя ребёнка"
              value={form.childName}
              onChange={(e) => update("childName", e.target.value)}
            />
            <select className="rounded-lg bg-white/5 p-3" value={form.age} onChange={(e) => update("age", Number(e.target.value))}>
              {[5, 6, 7, 8, 9].map((age) => <option key={age} value={age}>{age}</option>)}
            </select>
          </div>
          <div className="mt-3 flex gap-3 text-sm">
            {([
              { key: "easy", label: "🟢 Лёгкий" },
              { key: "medium", label: "🟡 Средний" },
              { key: "hard", label: "🔴 Сложный" },
            ] as const).map((item) => (
              <button key={item.key} type="button" onClick={() => update("difficulty", item.key)}
                className={`rounded-full border px-3 py-1 ${form.difficulty === item.key ? "border-brandAccent text-brandAccent" : "border-white/20"}`}>
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* Урок */}
        <section className="panel p-5">
          <h3 className="font-fredoka text-xl text-brandAccent">Урок</h3>
          <div className="mt-4 grid gap-3">
            <select className="rounded-lg bg-white/5 p-3" value={form.topic} onChange={(e) => updateTopic(e.target.value)}>
              {TOPICS.map((topic) => <option key={topic}>{topic}</option>)}
            </select>
            <select className="rounded-lg bg-white/5 p-3" value={form.lessonNumber} onChange={(e) => update("lessonNumber", Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Урок {n}</option>)}
            </select>
            <p className="text-xs text-white/40">🏝 {form.island}</p>
          </div>
        </section>

        {/* Фокус */}
        <section className="panel p-5">
          <h3 className="font-fredoka text-xl text-brandAccent">Фокус</h3>
          <div className="mt-4 grid gap-3">
            {([
              ["weakPoints", "Что ребёнок не понимает / путает"],
              ["focus", "На что сделать упор"],
              ["knows", "Что уже хорошо умеет"],
              ["notes", "Особенности ребёнка"],
            ] as const).map(([key, label]) => (
              <textarea key={key} rows={2} className="rounded-lg bg-white/5 p-3"
                placeholder={label} value={form[key]}
                onChange={(e) => update(key, e.target.value)} />
            ))}
          </div>
        </section>

        {/* Персонаж — только если код не найден */}
        {lookupStatus !== "found" && (
          <section className="panel p-5">
            <h3 className="font-fredoka text-xl text-brandAccent">Персонаж</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {CHARACTERS.map((character) => (
                <button key={character} type="button" onClick={() => update("character", character)}
                  className={`rounded-xl border p-3 text-sm ${form.character === character ? "border-brandAccent text-brandAccent" : "border-white/20"}`}>
                  <Image className="mx-auto mb-2 h-14 w-14 rounded-lg object-contain"
                    src={CHARACTER_IMAGES[character]} alt={character} width={56} height={56} />
                  {character}
                </button>
              ))}
            </div>
            <input className="mt-3 w-full rounded-lg bg-white/5 p-3" placeholder="Имя персонажа"
              value={form.characterName} onChange={(e) => update("characterName", e.target.value)} />
          </section>
        )}

        <button disabled={loading}
          className="w-full rounded-full bg-brandAccent px-6 py-4 font-fredoka text-xl text-[#1a1a2e] disabled:opacity-70"
          type="submit">
          ✨ Создать урок
        </button>
      </form>

      <div className="space-y-4">
        {loading && <ProgressBar steps={STEPS} currentStep={step} />}
        {error && <div className="panel border border-red-400/40 p-4 text-red-200">{error}</div>}
        {result && (
          <LessonPreview
            childName={form.childName} age={form.age} topic={form.topic}
            code={result.childCode} lessonPlan={result.lessonPlan} htmlContent={result.html}
          />
        )}
      </div>
    </div>
  );
}
