import Anthropic from "@anthropic-ai/sdk";
import type { LessonPlan, TutorFormValues } from "@/lib/types";

const systemPrompt = `You design new lesson games for Monkey Archipelago (kids age 5-9).
Critical rule: never copy legacy trial mechanics (shells/stones/chest keys/corridors/robomonkey).
Each lesson must feel like a fresh game while preserving the same visual layout style.
Return only valid JSON, no markdown, no commentary.
All user-facing text must be in English.`;

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is missing");
  return new Anthropic({ apiKey: key });
}

function buildPrompt(payload: TutorFormValues & { characterName: string }): string {
  const diffMap = { easy: "easy", medium: "medium", hard: "hard" };

  return `Create a NEW 6-block lesson game.

CHILD: ${payload.childName}, age ${payload.age}, level: ${diffMap[payload.difficulty]}
TOPIC: ${payload.topic}
LESSON NUMBER: ${payload.lessonNumber}
ISLAND: ${payload.island}
HERO NAME: ${payload.characterName}
STRUGGLES: ${payload.weakPoints || "none"}
FOCUS: ${payload.focus || "none"}
ALREADY KNOWS: ${payload.knows || "none"}
NOTES: ${payload.notes || "none"}

Hard requirements:
- Keep 6 blocks in this order: story -> concreteness -> action -> number meaning -> abstraction -> mission
- Use at least 4 different mechanics from: drag_drop, input, choice, drawing, animation
- Teach through interaction, not lecture text
- Do NOT reuse old trial scenes or old NPC storyline
- Do NOT add any character-creation stage
- All titles, instructions, questions, and success messages must be in English
- Keep text minimal: instruction <= 8 words, question <= 12 words
- Every stage must include exactly 5 short practice examples

Return JSON strictly in this schema:
{
  "storyIntro": "short lesson title",
  "lore": ["line 1","line 2","line 3","line 4","line 5"],
  "stages": [
    {
      "id": 1,
      "block": 1,
      "mechanic": "animation",
      "title": "stage title",
      "instruction": "short instruction for child",
      "question": "task question",
      "examples": ["ex1","ex2","ex3","ex4","ex5"],
      "options": ["option 1", "option 2"],
      "visualItems": ["item_a","item_b","item_c","item_d","item_e"],
      "correctAnswer": "option 1",
      "successMessage": "success text",
      "coinsReward": 10
    }
  ],
  "imagePrompts": [
    {
      "filename": "lesson_bg_left.webp",
      "prompt": "left scenic background, no text"
    },
    {
      "filename": "lesson_bg_right.webp",
      "prompt": "right interactive background zone, no text"
    },
    {
      "filename": "lesson_island_bg.webp",
      "prompt": "background prompt for topic '${payload.topic}'"
    },
    {
      "filename": "lesson_item_1.webp",
      "prompt": "interactive item icon 1, transparent background"
    },
    {
      "filename": "lesson_item_2.webp",
      "prompt": "interactive item icon 2, transparent background"
    },
    {
      "filename": "lesson_item_3.webp",
      "prompt": "interactive item icon 3, transparent background"
    },
    {
      "filename": "lesson_item_4.webp",
      "prompt": "interactive item icon 4, transparent background"
    },
    {
      "filename": "lesson_item_5.webp",
      "prompt": "interactive item icon 5, transparent background"
    }
  ]
}

Additional JSON rules:
- stages must have exactly 6 items (id=1..6, block=1..6)
- examples required for every stage and must be length 5
- options required for mechanic=choice and drag_drop
- correctAnswer: string for input/choice/animation/drawing, array for drag_drop
- for drawing use correctAnswer = "accepted by tutor"
- keep wording short, playful, age-appropriate`;
}

function sanitizeTextResponse(text: string) {
  return text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
}

function normalizeLessonPlan(raw: LessonPlan): LessonPlan {
  const fallbackLore = ["Welcome to a new adventure!", "Let's begin today's lesson!"];
  const stages = (raw.stages ?? []).slice(0, 6).map((stage, idx) => ({
    ...stage,
    id: idx + 1,
    block: (idx + 1) as 1 | 2 | 3 | 4 | 5 | 6,
    coinsReward: stage.coinsReward ?? 10,
    successMessage: stage.successMessage || "Great job! Keep going! ✨",
    question: stage.question || stage.instruction || "Complete the task",
    instruction: stage.instruction || "Do the task to move forward",
    examples:
      Array.isArray(stage.examples) && stage.examples.length >= 5
        ? stage.examples.slice(0, 5)
        : ["Example 1", "Example 2", "Example 3", "Example 4", "Example 5"],
    visualItems:
      Array.isArray(stage.visualItems) && stage.visualItems.length
        ? stage.visualItems.slice(0, 5)
        : undefined,
  }));

  if (stages.length === 0) {
    return {
      storyIntro: raw.storyIntro || "New Island Adventure",
      lore: raw.lore?.length ? raw.lore.slice(0, 5) : fallbackLore,
      stages: [
        {
          id: 1,
          block: 1,
          mechanic: "choice",
          title: "Warm-up",
          instruction: "Pick the correct answer",
          question: "What is 2 + 2?",
          options: ["3", "4", "5"],
          correctAnswer: "4",
          successMessage: "Correct! Let's continue!",
          coinsReward: 10,
        },
      ],
      imagePrompts: raw.imagePrompts ?? [],
    };
  }

  return {
    storyIntro: raw.storyIntro || "New Island Adventure",
    lore: raw.lore?.length ? raw.lore.slice(0, 5) : fallbackLore,
    stages,
    imagePrompts: raw.imagePrompts ?? [],
  };
}

export async function generateLessonPlan(
  payload: TutorFormValues & { characterName?: string },
): Promise<LessonPlan> {
  const anthropic = getClient();
  const charName = payload.characterName || payload.childName || "Hero";

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
