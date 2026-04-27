interface LessonPageProps {
  params: { id: string };
}

export default function LessonPage({ params }: LessonPageProps) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl p-8">
      <h1 className="font-fredoka text-3xl text-brandAccent">Lesson Preview</h1>
      <p className="mt-3 text-white/80">
        Страница превью урока <strong>{params.id}</strong>. На этапе 2 сюда можно подключить загрузку
        из Supabase и полный просмотр сохранённого урока.
      </p>
    </main>
  );
}
