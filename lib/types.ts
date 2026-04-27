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
