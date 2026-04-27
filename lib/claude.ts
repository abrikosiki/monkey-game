import Anthropic from "@anthropic-ai/sdk";
import type { LessonPlan, TutorFormValues } from "@/lib/types";

const systemPrompt = `Ты проектируешь новые уроки-игры для Monkey Archipelago (дети 5-9 лет).
Критично: нельзя копировать старые trial-механики (ракушки/камни/сундук с ключами/коридоры/robomonkey).
Каждый урок должен быть новой игрой в том же визуальном стиле острова.
Отвечай только валидным JSON без markdown и комментариев.`;

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is missing");
  return new Anthropic({ apiKey: key });
}

function buildPrompt(payload: TutorFormValues & { characterName: string }): string {
  const diffMap = { easy: "легкий", medium: "средний", hard: "сложный" };

  return `Создай НОВЫЙ урок-игру на 6 блоков.

РЕБЕНОК: ${payload.childName}, ${payload.age} лет, уровень: ${diffMap[payload.difficulty]}
ТЕМА УРОКА: ${payload.topic}
УРОК №: ${payload.lessonNumber}
ОСТРОВ: ${payload.island}
ГЕРОЙ: ${payload.characterName}
НЕ ПОНИМАЕТ: ${payload.weakPoints || "нет"}
НА ЧТО УПОР: ${payload.focus || "нет"}
УЖЕ УМЕЕТ: ${payload.knows || "нет"}
ОСОБЕННОСТИ: ${payload.notes || "нет"}

Жесткие требования:
- сохранить структуру 6 блоков: сюжет -> конкретика -> действие -> смысл числа -> абстракция -> миссия
- минимум 4 разные механики среди: drag_drop, input, choice, drawing, animation
- задания через действие, не лекции
- НЕ использовать старый сюжет и старые сцены trial-игры
- не добавлять этап создания персонажа
- каждый этап должен быть самостоятельной новой мини-игрой в рамках темы

Верни JSON СТРОГО по схеме:
{
  "storyIntro": "краткий заголовок урока",
  "lore": ["строка 1","строка 2","строка 3","строка 4","строка 5"],
  "stages": [
    {
      "id": 1,
      "block": 1,
      "mechanic": "animation",
      "title": "название этапа",
      "instruction": "короткая инструкция ребенку",
      "question": "текст задания",
      "options": ["опция 1", "опция 2"],
      "correctAnswer": "опция 1",
      "successMessage": "текст успеха",
      "coinsReward": 10
    }
  ],
  "imagePrompts": [
    {
      "filename": "lesson_island_bg.webp",
      "prompt": "описание фона острова под тему '${payload.topic}'"
    }
  ]
}

Дополнительные правила заполнения JSON:
- stages всегда ровно 6 элементов (id=1..6, block=1..6)
- options обязателен для mechanic=choice и drag_drop
- correctAnswer: строка для input/choice/animation/drawing, массив строк для drag_drop
- для drawing проверка делается тьютором, correctAnswer = "принято тьютором"
- формулировки короткие, игровые, для возраста ${payload.age}`;
}

function sanitizeTextResponse(text: string) {
  return text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
}

function normalizeLessonPlan(raw: LessonPlan): LessonPlan {
  const fallbackLore = ["Добро пожаловать!", "Начинаем урок-приключение!"];
  const stages = (raw.stages ?? []).slice(0, 6).map((stage, idx) => ({
    ...stage,
    id: idx + 1,
    block: (idx + 1) as 1 | 2 | 3 | 4 | 5 | 6,
    coinsReward: stage.coinsReward ?? 10,
    successMessage: stage.successMessage || "Отлично! Продолжаем! ✨",
    question: stage.question || stage.instruction || "Выполни задание",
    instruction: stage.instruction || "Сделай шаг и получи награду",
  }));

  if (stages.length === 0) {
    return {
      storyIntro: raw.storyIntro || "Новый остров приключений",
      lore: raw.lore?.length ? raw.lore.slice(0, 5) : fallbackLore,
      stages: [
        {
          id: 1,
          block: 1,
          mechanic: "choice",
          title: "Разминка",
          instruction: "Выбери верный ответ",
          question: "Сколько будет 2 + 2?",
          options: ["3", "4", "5"],
          correctAnswer: "4",
          successMessage: "Верно! Идем дальше!",
          coinsReward: 10,
        },
      ],
      imagePrompts: raw.imagePrompts ?? [],
    };
  }

  return {
    storyIntro: raw.storyIntro || "Новый остров приключений",
    lore: raw.lore?.length ? raw.lore.slice(0, 5) : fallbackLore,
    stages,
    imagePrompts: raw.imagePrompts ?? [],
  };
}

export async function generateLessonPlan(
  payload: TutorFormValues & { characterName?: string },
): Promise<LessonPlan> {
  const anthropic = getClient();
  const charName = payload.characterName || payload.childName || "Герой";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: buildPrompt({ ...payload, characterName: charName }) }],
  });

  const text = response.content
    .filter((chunk) => chunk.type === "text")
    .map((chunk) => chunk.text)
    .join("\n")
    .trim();

  const jsonText = sanitizeTextResponse(text);
  return normalizeLessonPlan(JSON.parse(jsonText) as LessonPlan);
}
