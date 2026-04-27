"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { LessonPreview } from "@/components/LessonPreview";
import { ProgressBar } from "@/components/ProgressBar";
import type { LessonPlan, TutorFormValues } from "@/lib/types";

type FocusField = "weakPoints" | "focus" | "knows" | "notes";

const TOPICS = [
  "Numbers 1-5",
  "Numbers 6-10",
  "Addition up to 10",
  "Subtraction up to 10",
  "Numbers up to 20",
  "Addition up to 20",
  "Subtraction up to 20",
  "Number composition",
  "Comparing numbers",
  "Numbers up to 100",
  "Multiplication",
  "Division",
  "Geometry",
  "Fractions",
];

const TOPIC_TO_ISLAND: Record<string, string> = {
  "Numbers 1-5": "Island 1: Counting Basics",
  "Numbers 6-10": "Island 1: Counting Basics",
  "Addition up to 10": "Island 2: Addition up to 10",
  "Subtraction up to 10": "Island 3: Subtraction up to 10",
  "Numbers up to 20": "Island 4: Numbers up to 20",
  "Addition up to 20": "Island 5: Addition up to 20",
  "Subtraction up to 20": "Island 6: Subtraction up to 20",
  "Number composition": "Island 7: Number Composition",
  "Comparing numbers": "Island 8: Comparing Numbers",
  "Numbers up to 100": "Island 9: Numbers up to 100",
  Multiplication: "Island 10: Multiplication",
  Division: "Island 11: Division",
  Geometry: "Island 12: Geometry and Fractions",
  Fractions: "Island 12: Geometry and Fractions",
};

const CHARACTERS = ["boy", "girl", "elf", "wizard", "pirate", "fairy"];

const CHARACTER_IMAGES: Record<string, string> = {
  boy: "/assets/characters/boy_brown.webp",
  girl: "/assets/characters/girl_brown.webp",
  elf: "/assets/characters/elf_green.webp",
  wizard: "/assets/characters/wizard_blue.webp",
  pirate: "/assets/characters/pirate_brown.webp",
  fairy: "/assets/characters/fairy_green.webp",
};

const OUTFIT_IMAGES: Record<string, Record<string, string>> = {
  boy: {
    brown: "/assets/characters/boy_brown.webp",
    blue: "/assets/characters/boy_blue.webp",
    green: "/assets/characters/boy_green.webp",
  },
  girl: {
    brown: "/assets/characters/girl_brown.webp",
    blue: "/assets/characters/girl_blue.webp",
    green: "/assets/characters/girl_green.webp",
  },
  elf: {
    red: "/assets/characters/elf_red.webp",
    blue: "/assets/characters/elf_blue.webp",
    green: "/assets/characters/elf_green.webp",
  },
  wizard: {
    red: "/assets/characters/wizard_red.webp",
    blue: "/assets/characters/wizard_blue.webp",
    green: "/assets/characters/wizard_green.webp",
  },
  pirate: {
    brown: "/assets/characters/pirate_brown.webp",
    blue: "/assets/characters/pirate_blue.webp",
    green: "/assets/characters/pirate_green.webp",
  },
  fairy: {
    red: "/assets/characters/fairy_red.webp",
    purple: "/assets/characters/fairy_purple.webp",
    green: "/assets/characters/fairy_green.webp",
  },
};

const STEPS = [
  "Generating lesson plan...",
  "Generating images...",
  "Building game HTML...",
  "Done!",
];

interface ChildData {
  code: string;
  name: string | null;
  age: number | null;
  character_type: string;
  outfit: string;
  char_img?: string | null;
  coins: number;
  inventory: string[];
}

interface BuildResponse {
  html: string;
}

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
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "new">(
    "idle",
  );
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
    if (normalized.length < 6) {
      setChildData(null);
      setLookupStatus("idle");
      return;
    }
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
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [childCode, lookupChild]);

  const charImg =
    OUTFIT_IMAGES[childData?.character_type ?? form.character]?.[childData?.outfit ?? "brown"] ??
    CHARACTER_IMAGES[form.character];

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!childCode.trim()) {
      setError("Please enter child code digits.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setStep(0);
      const lessonRes = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, characterName }),
      });
      if (!lessonRes.ok) throw new Error("Failed to generate lesson plan.");
      const lesson = (await lessonRes.json()) as LessonPlan;

      setStep(1);
      const imgRes = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePrompts: lesson.imagePrompts }),
      });
      if (!imgRes.ok) throw new Error("Failed to generate images.");
      const images = (await imgRes.json()) as Record<string, string>;

      setStep(2);
      const buildRes = await fetch("/api/build-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonPlan: lesson,
          images,
          character: form.character,
          island: form.island,
          childProfile: {
            name: childData?.name ?? form.childName,
            character_type: childData?.character_type ?? form.character,
            outfit: childData?.outfit ?? "brown",
            char_img: childData?.char_img ?? null,
          },
        }),
      });
      if (!buildRes.ok) throw new Error("Failed to build HTML.");
      const built = (await buildRes.json()) as BuildResponse;

      setStep(3);
      setResult({
        lessonPlan: lesson,
        html: built.html,
        childCode: `MONKEY-${childCode.trim()}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[1.2fr,0.8fr]">
      <form className="space-y-4" onSubmit={onSubmit}>
        <section className="panel p-5">
          <h3 className="font-fredoka text-xl text-brandAccent">Child Code</h3>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex flex-1 items-center rounded-lg bg-white/5 focus-within:ring-2 focus-within:ring-brandAccent">
              <span className="pl-4 font-mono font-bold text-white/50 tracking-widest uppercase">
                MONKEY-
              </span>
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
            {lookupStatus === "loading" && (
              <span className="text-sm text-white/40">Searching...</span>
            )}
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
                <p className="font-bold text-brandAccent">
                  {childData.name ?? "Unnamed"}, {childData.age ?? "?"} years
                </p>
                <p className="text-white/60 capitalize">
                  {childData.character_type} · {childData.outfit}
                </p>
                <p className="text-white/60">
                  🪙 {childData.coins} coins · 🎒 {childData.inventory.length} items
                </p>
              </div>
            </div>
          )}

          {lookupStatus === "new" && childCode.length >= 6 && (
            <p className="mt-2 text-sm text-yellow-400">
              ⚠️ Child not found — a new profile will be created.
            </p>
          )}
        </section>

        <section className="panel p-5">
          <h3 className="font-fredoka text-xl text-brandAccent">Child</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              className="rounded-lg bg-white/5 p-3"
              required
              placeholder="Child name"
              value={form.childName}
              onChange={(e) => update("childName", e.target.value)}
            />
            <select
              className="rounded-lg bg-white/5 p-3"
              value={form.age}
              onChange={(e) => update("age", Number(e.target.value))}
            >
              {[5, 6, 7, 8, 9].map((age) => (
                <option key={age} value={age}>
                  {age}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex gap-3 text-sm">
            {[
              { key: "easy", label: "🟢 Easy" },
              { key: "medium", label: "🟡 Medium" },
              { key: "hard", label: "🔴 Hard" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => update("difficulty", item.key as TutorFormValues["difficulty"])}
                className={`rounded-full border px-3 py-1 ${form.difficulty === item.key ? "border-brandAccent text-brandAccent" : "border-white/20"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="panel p-5">
          <h3 className="font-fredoka text-xl text-brandAccent">Lesson</h3>
          <div className="mt-4 grid gap-3">
            <select
              className="rounded-lg bg-white/5 p-3"
              value={form.topic}
              onChange={(e) => updateTopic(e.target.value)}
            >
              {TOPICS.map((topic) => (
                <option key={topic}>{topic}</option>
              ))}
            </select>
            <select
              className="rounded-lg bg-white/5 p-3"
              value={form.lessonNumber}
              onChange={(e) => update("lessonNumber", Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  Lesson {n}
                </option>
              ))}
            </select>
            <p className="text-xs text-white/40">🏝 {form.island}</p>
          </div>
        </section>

        <section className="panel p-5">
          <h3 className="font-fredoka text-xl text-brandAccent">Focus</h3>
          <div className="mt-4 grid gap-3">
            {([
              ["weakPoints", "What the child struggles with"],
              ["focus", "What to emphasize in this lesson"],
              ["knows", "What the child already knows"],
              ["notes", "Child-specific notes and behavior"],
            ] as [FocusField, string][]).map(([key, label]) => (
              <textarea
                key={key}
                rows={2}
                className="rounded-lg bg-white/5 p-3"
                placeholder={label}
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
              />
            ))}
          </div>
        </section>

        {lookupStatus !== "found" && (
          <section className="panel p-5">
            <h3 className="font-fredoka text-xl text-brandAccent">Character</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {CHARACTERS.map((character) => (
                <button
                  key={character}
                  type="button"
                  onClick={() => update("character", character)}
                  className={`rounded-xl border p-3 text-sm ${form.character === character ? "border-brandAccent text-brandAccent" : "border-white/20"}`}
                >
                  <Image
                    className="mx-auto mb-2 h-14 w-14 rounded-lg object-contain"
                    src={CHARACTER_IMAGES[character]}
                    alt={character}
                    width={56}
                    height={56}
                  />
                  {character}
                </button>
              ))}
            </div>
            <input
              className="mt-3 w-full rounded-lg bg-white/5 p-3"
              placeholder="Character name"
              value={form.characterName}
              onChange={(e) => update("characterName", e.target.value)}
            />
          </section>
        )}

        <button
          disabled={loading}
          className="w-full rounded-full bg-brandAccent px-6 py-4 font-fredoka text-xl text-[#1a1a2e] disabled:opacity-70"
          type="submit"
        >
          ✨ Create Lesson
        </button>
      </form>

      <div className="space-y-4">
        {loading && <ProgressBar steps={STEPS} currentStep={step} />}
        {error && <div className="panel border border-red-400/40 p-4 text-red-200">{error}</div>}
        {result && (
          <LessonPreview
            childName={form.childName}
            age={form.age}
            topic={form.topic}
            code={result.childCode}
            lessonPlan={result.lessonPlan}
            htmlContent={result.html}
          />
        )}
      </div>
    </div>
  );
}
