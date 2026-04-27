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
      <h2 className="font-fredoka text-2xl text-brandAccent">✅ Lesson is ready!</h2>
      <div className="mt-4 space-y-2 text-sm text-white/90">
        <p>
          Child: {childName}, {age} years
        </p>
        <p>Topic: {topic}</p>
        <p>Stages: {lessonPlan.stages?.length ?? 6}</p>
        <p>Duration: ~45 minutes</p>
        <p className="font-semibold text-brandAccent">Child code: {code}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          className="rounded-full bg-brandAccent px-5 py-2 font-bold text-[#1a1a2e]"
          href={fileUrl}
          download={`lesson-${code}.html`}
        >
          Download lesson
        </a>
        <a
          className="rounded-full border border-white/20 px-5 py-2 font-semibold"
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open in browser
        </a>
      </div>
    </section>
  );
}
