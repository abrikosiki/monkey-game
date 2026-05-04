import Anthropic from "@anthropic-ai/sdk";
import type { LessonPlan, LessonRoundSpec, LessonStage, TutorFormValues } from "@/lib/types";

const systemPrompt = `You design new lesson games for Monkey Archipelago (kids age 5-9).
Critical rule: never copy legacy trial mechanics (shells/stones/chest keys/corridors/robomonkey).
Each lesson must feel like a fresh game while preserving the same visual layout style.
Return only valid JSON, no markdown, no commentary.
All user-facing text must be in English.
Pedagogy: tasks must be mathematically correct for the topic; never recycle the same numbers or same question stem across rounds within a stage.
Difficulty curve: stage 1 easiest → stage 6 hardest for the topic and chosen difficulty; within each stage, round 1 easiest → round 5 hardest ( visibly harder numbers, more steps, or deeper reasoning each round — appropriate to the topic).`;

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
- Keep text minimal: instruction <= 8 words, question <= 12 words (per round)
- EVERY stage MUST include a "rounds" array with EXACTLY 5 objects (five separate mini-tasks). Each round must have a DIFFERENT question and correct answer; do not duplicate wording or reuse the same operands (e.g. same addition pair) across rounds.
- Order rounds by difficulty: the **first** of the five rounds easiest → the **fifth** hardest (each step slightly harder than the previous — bigger numbers, extra step, or trickier comparison — fitting the topic and child's age).
- Order stages by difficulty: stage 1 = gentlest introduction to the topic; stage 6 = peak challenge for this lesson (clear progression across the six stages).
- For math topics: verify each round's correctAnswer is accurate.
- Top-level "examples" can mirror short labels for rounds but "rounds" drives the actual UI.

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
      "question": "fallback summary",
      "examples": ["ex1","ex2","ex3","ex4","ex5"],
      "rounds": [
        {
          "instruction": "optional short hint",
          "question": "round 1 task (unique)",
          "options": ["option 1", "option 2"],
          "correctAnswer": "option 1",
          "successMessage": "short praise"
        }
      ],
      "options": ["option 1", "option 2"],
      "visualItems": ["item_a","item_b","item_c","item_d","item_e"],
      "correctAnswer": "fallback",
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
- stages must have exactly 6 items (id=1..6, block=1..6); overall lesson difficulty must ramp up from stage 1 through stage 6
- examples required for every stage and must be length 5 (short phrases aligned with rounds)
- rounds must have exactly 5 items per stage; each round MUST include "question" and "correctAnswer"; list them in order round 1→5 with strictly increasing difficulty (JSON array index 0 = round 1, index 4 = round 5)
- round.options: required when stage.mechanic is choice or drag_drop (3-5 distinct labels per round if choice)
- stage-level options/correctAnswer are fallbacks only; gameplay uses rounds[]
- for mechanic=drawing each round may use correctAnswer "ok" and short question
- for mechanic=animation use exactly 1 round in "rounds" with question "Ready?" and correctAnswer "go", OR 5 ultra-short tap rounds — prefer 1 round for animation
- correctAnswer: string for input/choice/animation/drawing, array for drag_drop multi-select
- for drawing use correctAnswer = "accepted by tutor" or "ok"
- keep wording short, playful, age-appropriate`;
}

function sanitizeTextResponse(text: string) {
  return text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
}

function normalizeRounds(stage: LessonStage): LessonRoundSpec[] | undefined {
  const raw = stage.rounds;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.slice(0, 5).map((r) => ({
      instruction: r.instruction,
      question: r.question || stage.question || "?",
      options: Array.isArray(r.options) ? r.options : undefined,
      correctAnswer: r.correctAnswer ?? stage.correctAnswer,
      successMessage: r.successMessage,
    }));
  }
  return undefined;
}

function normalizeLessonPlan(raw: LessonPlan): LessonPlan {
  const fallbackLore = ["Welcome to a new adventure!", "Let's begin today's lesson!"];
  const stages = (raw.stages ?? []).slice(0, 6).map((stage, idx) => ({
    ...stage,
    id: idx + 1,
    block: (idx + 1) as 1 | 2 | 3 | 4 | 5 | 6,
    rounds: normalizeRounds(stage),
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
    max_tokens: 8192,
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
