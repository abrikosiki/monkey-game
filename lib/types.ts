export type Difficulty = "easy" | "medium" | "hard";

export type StageType =
  | "drag_drop"
  | "input"
  | "choice"
  | "animation"
  | "drawing";

export interface LessonStage {
  id: number;
  type: StageType;
  title: string;
  instruction: string;
  elements: string[];
  correctAnswer: string[];
  coinsReward: number;
  successMessage: string;
}

export interface ImagePrompt {
  filename: string;
  prompt: string;
}

export interface LessonPlan {
  storyIntro: string;
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
