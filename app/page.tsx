import { TutorForm } from "@/components/TutorForm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#24244a,#121223_55%)]">
      <div className="mx-auto max-w-5xl px-4 pt-10 text-center">
        <h1 className="font-fredoka text-4xl text-brandAccent">
          Monkey Archipelago — Tutor Dashboard
        </h1>
        <p className="mt-3 text-white/75">
          Fill the form to generate a complete lesson HTML with storyline, images, and interactive stages.
        </p>
        <p className="mt-4">
          <a
            href="/game.html"
            className="inline-flex rounded-full bg-brandAccent px-5 py-2 font-semibold text-[#121223] no-underline transition hover:opacity-90"
          >
            Открыть пробную игру
          </a>
        </p>
      </div>
      <TutorForm />
    </main>
  );
}
