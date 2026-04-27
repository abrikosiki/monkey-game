import { TutorForm } from "@/components/TutorForm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#24244a,#121223_55%)]">
      <div className="mx-auto max-w-5xl px-4 pt-10 text-center">
        <h1 className="font-fredoka text-4xl text-brandAccent">Monkey Archipelago — Форма тьютора</h1>
        <p className="mt-3 text-white/75">
          Заполни форму и получи готовый HTML-урок с сюжетом, картинками и игровыми этапами.
        </p>
      </div>
      <TutorForm />
    </main>
  );
}
