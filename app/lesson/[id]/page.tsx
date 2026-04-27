interface LessonPageProps {
  params: { id: string };
}

export default function LessonPage({ params }: LessonPageProps) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl p-8">
      <h1 className="font-fredoka text-3xl text-brandAccent">Lesson Preview</h1>
      <p className="mt-3 text-white/80">
        Lesson preview page for <strong>{params.id}</strong>. In phase 2 this page can load full
        saved lesson data from Supabase.
      </p>
    </main>
  );
}
