import Anthropic from "@anthropic-ai/sdk";
import type { LessonPlan, TutorFormValues } from "@/lib/types";

const systemPrompt = `Ты создаёшь уроки для детской математической игры Monkey Archipelago.
Строго следуй структуре из logic.md.
Всегда соблюдай 6 блоков урока.
Генерируй интересные сюжеты в стиле приключений.
Отвечай только валидным JSON без markdown.`;

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is missing");
  }
  return new Anthropic({ apiKey: key });
}

export async function generateLessonPlan(
  payload: TutorFormValues,
): Promise<LessonPlan> {
  const anthropic = getClient();
  const userPrompt = `
Создай урок.

РЕБЁНОК: ${payload.childName}, ${payload.age} лет
ТЕМА: ${payload.topic}
УРОК №: ${payload.lessonNumber}
ОСТРОВ: ${payload.island}
УРОВЕНЬ: ${payload.difficulty}

НЕ ПОНИМАЕТ: ${payload.weakPoints}
УПОР НА: ${payload.focus}
УЖЕ УМЕЕТ: ${payload.knows}
ОСОБЕННОСТИ: ${payload.notes}

ФОРМАТ ОТВЕТА — строго JSON:
{
  "storyIntro": "текст истории для этапа",
  "stages": [
    {
      "id": 1,
      "type": "drag_drop",
      "title": "название этапа",
      "instruction": "что делает ребёнок",
      "elements": ["..."],
      "correctAnswer": ["..."],
      "coinsReward": 10,
      "successMessage": "текст победы"
    }
  ],
  "imagePrompts": [
    {
      "filename": "bananas.webp",
      "prompt": "промпт для DALL-E"
    }
  ]
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-1",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((chunk) => chunk.type === "text")
    .map((chunk) => chunk.text)
    .join("\n");

  return JSON.parse(text) as LessonPlan;
}
