"use client";

import { useEffect, useMemo } from "react";
import type { LessonPlan } from "@/lib/types";

interface LessonPreviewProps {
  childName: string;
  age: number;
  topic: string;
  code: string;
  lessonPlan: LessonPlan;
  htmlContent: string;
}

export function LessonPreview({
  childName,
  age,
  topic,
  code,
  lessonPlan,
  htmlContent,
}: LessonPreviewProps) {
  const fileUrl = useMemo(() => {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    return URL.createObjectURL(blob);
  }, [htmlContent]);

  useEffect(() => {
    return () => URL.revokeObjectURL(fileUrl);
  }, [fileUrl]);

  return (
    <section className="panel p-6">
      <h2 className="font-fredoka text-2xl text-brandAccent">✅ Урок готов!</h2>
      <div className="mt-4 space-y-2 text-sm text-white/90">
        <p>
          Ребёнок: {childName}, {age} лет
        </p>
        <p>Тема: {topic}</p>
        <p>Этапов: {lessonPlan.stages?.length ?? 6}</p>
        <p>Время: ~45 минут</p>
        <p className="font-semibold text-brandAccent">Код ребёнка: {code}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          className="rounded-full bg-brandAccent px-5 py-2 font-bold text-[#1a1a2e]"
          href={fileUrl}
          download={`lesson-${code}.html`}
        >
          Скачать урок
        </a>
        <a
          className="rounded-full border border-white/20 px-5 py-2 font-semibold"
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
        >
          Открыть в браузере
        </a>
      </div>
    </section>
  );
}
