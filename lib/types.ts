export type Difficulty = "easy" | "medium" | "hard";

export type LessonMechanic =
  | "drag_drop"
  | "input"
  | "choice"
  | "drawing"
  | "animation";

export interface ImagePrompt {
  filename: string;
  prompt: string;
}

/** One interactive beat inside a stage (typically 5 per stage). */
export interface LessonRoundSpec {
  instruction?: string;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  successMessage?: string;
}

export interface LessonStage {
  id: number;
  block: 1 | 2 | 3 | 4 | 5 | 6;
  mechanic: LessonMechanic;
  title: string;
  instruction: string;
  question: string;
  examples?: string[];
  options?: string[];
  visualItems?: string[];
  correctAnswer: string | string[];
  successMessage: string;
  coinsReward: number;
  /** If set (ideally length 5), each entry is a separate in-stage round with its own task and answer. */
  rounds?: LessonRoundSpec[];
}

export interface LessonPlan {
  storyIntro: string;
  lore: string[];
  stages: LessonStage[];
  imagePrompts: ImagePrompt[];
}

export interface TutorFormValues {
  childName: string;
  age: number;
  difficulty: Difficulty;
  topic: string;
  lessonNumber: number;
  island: string;
  weakPoints: string;
  focus: string;
  knows: string;
  notes: string;
  character: string;
  characterName: string;
}
