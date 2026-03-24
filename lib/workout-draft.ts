import type { LoggedWorkout, WorkoutDraft, WorkoutPayload } from "@/lib/types";

export function parseNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function countCompletedSets(draft: WorkoutDraft | null): number {
  if (!draft) return 0;
  return draft.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
    0
  );
}

export function convertLoggedWorkoutToDraft(workout: LoggedWorkout): WorkoutDraft {
  return {
    date: workout.date,
    dayKey: workout.dayKey,
    dayLabel: workout.dayLabel,
    exercises: workout.exercises.map((exercise) => ({
      ...exercise,
      pairingLabel: exercise.pairingLabel ?? undefined,
      sets: exercise.sets.map((set) => ({
        setNumber: set.setNumber,
        targetReps: set.targetReps,
        targetDurationMinutes: set.targetDurationMinutes,
        targetCalories: set.targetCalories,
        actualWeightKg: set.actualWeightKg?.toString() ?? "",
        actualReps: set.actualReps?.toString() ?? (set.targetReps?.toString() ?? ""),
        actualDurationMinutes:
          set.actualDurationMinutes?.toString() ??
          (set.targetDurationMinutes?.toString() ?? ""),
        actualCalories:
          set.actualCalories?.toString() ?? (set.targetCalories?.toString() ?? ""),
        completed: set.completed
      }))
    }))
  };
}

export function buildPayload(draft: WorkoutDraft): WorkoutPayload {
  return {
    date: draft.date,
    dayKey: draft.dayKey,
    dayLabel: draft.dayLabel,
    exercises: draft.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      pairingLabel: exercise.pairingLabel ?? null,
      exerciseKind: exercise.exerciseKind,
      targetSummary: exercise.targetSummary,
      sets: exercise.sets.map((set) => ({
        setNumber: set.setNumber,
        targetReps: set.targetReps ?? null,
        actualWeightKg: parseNumber(set.actualWeightKg),
        actualReps: parseNumber(set.actualReps),
        targetDurationMinutes: set.targetDurationMinutes ?? null,
        actualDurationMinutes: parseNumber(set.actualDurationMinutes),
        targetCalories: set.targetCalories ?? null,
        actualCalories: parseNumber(set.actualCalories),
        completed: set.completed
      }))
    }))
  };
}
