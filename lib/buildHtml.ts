import type { LessonPlan } from "@/lib/types";

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderStage(stage: LessonPlan["stages"][number]) {
  return `
    <section class="stage">
      <h2>${escapeHtml(stage.title)}</h2>
      <p>${escapeHtml(stage.instruction)}</p>
      <p><strong>Type:</strong> ${escapeHtml(stage.type)}</p>
      <p><strong>Reward:</strong> ${stage.coinsReward} coins</p>
      <p><strong>Success:</strong> ${escapeHtml(stage.successMessage)}</p>
    </section>
  `;
}

export function buildLessonHtml(args: {
  lessonPlan: LessonPlan;
  images: Record<string, string>;
  character: string;
  island: string;
}) {
  const { lessonPlan, images, character, island } = args;
  const stagesHtml = lessonPlan.stages.map(renderStage).join("\n");
  const imagesHtml = Object.entries(images)
    .map(([filename, src]) => `<li>${escapeHtml(filename)} → ${escapeHtml(src)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Monkey Archipelago Lesson</title>
    <style>
      body { font-family: Nunito, Arial, sans-serif; background: #1a1a2e; color: #fff; margin: 0; padding: 24px; }
      .card { max-width: 960px; margin: 0 auto; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16); border-radius: 16px; padding: 20px; }
      h1, h2 { font-family: "Fredoka One", cursive; color: #f4d03f; margin: 0 0 12px; }
      .stage { background: rgba(0,0,0,0.2); border-radius: 12px; padding: 14px; margin-top: 14px; }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Monkey Archipelago: ${escapeHtml(lessonPlan.storyIntro)}</h1>
      <p><strong>Character:</strong> ${escapeHtml(character)}</p>
      <p><strong>Island:</strong> ${escapeHtml(island)}</p>
      ${stagesHtml}
      <h2>Generated Images</h2>
      <ul>${imagesHtml}</ul>
    </main>
  </body>
</html>`;
}
