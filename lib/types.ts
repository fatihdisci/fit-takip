export type WorkoutDayKey = "monday" | "wednesday" | "friday";
export type ExerciseKind = "strength" | "cardio";

export type WorkoutSetTemplate = {
  setNumber: number;
  targetReps?: number | null;
  targetDurationMinutes?: number | null;
  targetCalories?: number | null;
};

export type WorkoutExerciseTemplate = {
  id: string;
  name: string;
  pairingLabel?: string;
  exerciseKind: ExerciseKind;
  targetSummary: string;
  sets: WorkoutSetTemplate[];
};

export type WorkoutTemplate = {
  dayKey: WorkoutDayKey;
  dayLabel: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  exercises: WorkoutExerciseTemplate[];
};

export type WorkoutSetDraft = WorkoutSetTemplate & {
  actualWeightKg: string;
  actualReps: string;
  actualDurationMinutes: string;
  actualCalories: string;
  completed: boolean;
};

export type WorkoutExerciseDraft = Omit<WorkoutExerciseTemplate, "sets"> & {
  sets: WorkoutSetDraft[];
};

export type WorkoutDraft = {
  date: string;
  dayKey: WorkoutDayKey;
  dayLabel: string;
  exercises: WorkoutExerciseDraft[];
};

export type WorkoutSetPayload = {
  setNumber: number;
  targetReps: number | null;
  actualWeightKg: number | null;
  actualReps: number | null;
  targetDurationMinutes: number | null;
  actualDurationMinutes: number | null;
  targetCalories: number | null;
  actualCalories: number | null;
  completed: boolean;
};

export type WorkoutExercisePayload = {
  id: string;
  name: string;
  pairingLabel?: string | null;
  exerciseKind: ExerciseKind;
  targetSummary: string;
  sets: WorkoutSetPayload[];
};

export type WorkoutPayload = {
  date: string;
  dayKey: WorkoutDayKey;
  dayLabel: string;
  exercises: WorkoutExercisePayload[];
};

export type WorkoutHistoryItem = {
  date: string;
  dayLabel: string;
  completedSets: number;
  totalExercises: number;
  volumeKg: number;
  createdAt: string;
};

export type LoggedWorkout = WorkoutPayload & {
  id: number;
  createdAt: string;
  updatedAt: string;
};
