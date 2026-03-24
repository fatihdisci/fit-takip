import type {
  WorkoutDayKey,
  WorkoutDraft,
  WorkoutExerciseTemplate,
  WorkoutSetTemplate,
  WorkoutTemplate
} from "@/lib/types";

const WORKOUT_DAY_ORDER: WorkoutDayKey[] = ["monday", "wednesday", "friday"];

function strengthSets(count: number, reps: number): WorkoutSetTemplate[] {
  return Array.from({ length: count }, (_, index) => ({
    setNumber: index + 1,
    targetReps: reps
  }));
}

function cardioSet(): WorkoutSetTemplate[] {
  return [
    {
      setNumber: 1,
      targetDurationMinutes: 20,
      targetCalories: 50
    }
  ];
}

function exercise(
  id: string,
  name: string,
  sets: WorkoutSetTemplate[],
  pairingLabel?: string
): WorkoutExerciseTemplate {
  const baseReps = sets[0]?.targetReps;
  return {
    id,
    name,
    pairingLabel,
    exerciseKind: "strength",
    targetSummary: baseReps ? `${sets.length} x ${baseReps}` : `${sets.length} sets`,
    sets
  };
}

function cardioExercise(id: string, name: string): WorkoutExerciseTemplate {
  return {
    id,
    name,
    exerciseKind: "cardio",
    targetSummary: "20 min incline + 50 calories",
    sets: cardioSet()
  };
}

export const workoutTemplates: Record<WorkoutDayKey, WorkoutTemplate> = {
  monday: {
    dayKey: "monday",
    dayLabel: "Pazartesi",
    shortLabel: "Pzt",
    title: "Push Day",
    subtitle: "Chest, shoulders, triceps, and incline cardio",
    exercises: [
      exercise("decline-bench", "Decline bench press", strengthSets(4, 12)),
      exercise(
        "incline-bench",
        "Incline bench press",
        strengthSets(4, 12),
        "Paired with Cable Crossover"
      ),
      exercise(
        "cable-crossover",
        "Cable Crossover",
        strengthSets(3, 12),
        "Paired with Incline Bench Press"
      ),
      exercise(
        "shoulder-press",
        "Shoulder press",
        strengthSets(3, 12),
        "Paired with Lateral raise"
      ),
      exercise(
        "lateral-raise-mon",
        "Lateral raise",
        strengthSets(3, 12),
        "Paired with Shoulder press"
      ),
      exercise(
        "power-shrug-mon",
        "Power shrug",
        strengthSets(3, 12),
        "Paired with Facepull"
      ),
      exercise(
        "facepull",
        "Facepull",
        strengthSets(3, 12),
        "Paired with Power shrug"
      ),
      exercise("skull-crusher", "Skull crusher", strengthSets(3, 12)),
      exercise("rope-down", "Rope down", strengthSets(3, 10)),
      cardioExercise("cardio-mon", "Incline Cardio")
    ]
  },
  wednesday: {
    dayKey: "wednesday",
    dayLabel: "Çarşamba",
    shortLabel: "Çrş",
    title: "Pull Day",
    subtitle: "Back, rear delts, biceps, and incline cardio",
    exercises: [
      exercise("lat-pulldown-wed", "Lat pull down", strengthSets(4, 12)),
      exercise("close-grip-pulldown", "Close grip pull down", strengthSets(3, 12)),
      exercise("barbell-row", "Barbell row", strengthSets(4, 10)),
      exercise(
        "bench-supporting-row",
        "Bench supporting row",
        strengthSets(3, 12),
        "Paired with Biceps curl"
      ),
      exercise(
        "biceps-curl",
        "Biceps curl",
        strengthSets(3, 12),
        "Paired with Bench supporting row"
      ),
      exercise(
        "y-raise",
        "Y raise",
        strengthSets(3, 12),
        "Paired with Hammer curl"
      ),
      exercise(
        "hammer-curl",
        "Hammer curl",
        strengthSets(3, 12),
        "Paired with Y raise"
      ),
      cardioExercise("cardio-wed", "Incline Cardio")
    ]
  },
  friday: {
    dayKey: "friday",
    dayLabel: "Cuma",
    shortLabel: "Cum",
    title: "Legs + Upper Mix",
    subtitle: "Leg focus with chest, traps, and back finishers",
    exercises: [
      exercise("squat", "Squat", strengthSets(4, 12)),
      exercise("leg-extensions", "Leg extensions", strengthSets(3, 12)),
      exercise("leg-curl", "Leg curl", strengthSets(3, 12)),
      exercise("incline-bench-fri", "Incline bench press", strengthSets(3, 10)),
      exercise("decline-bench-fri", "Decline bench press", strengthSets(3, 10)),
      exercise(
        "power-shrug-fri",
        "Power shrug",
        strengthSets(3, 12),
        "Paired with Lateral raise"
      ),
      exercise(
        "lateral-raise-fri",
        "Lateral raise",
        strengthSets(3, 12),
        "Paired with Power shrug"
      ),
      exercise("lat-pulldown-fri", "Lat pull down", strengthSets(4, 10)),
      cardioExercise("cardio-fri", "Incline Cardio")
    ]
  }
};

export function getLocalIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDateString(dateString: string): Date {
  return new Date(`${dateString}T12:00:00`);
}

export function getWorkoutDayKeyFromDate(date: Date): WorkoutDayKey | null {
  const weekday = date.getDay();

  if (weekday === 1) return "monday";
  if (weekday === 3) return "wednesday";
  if (weekday === 5) return "friday";
  return null;
}

export function getWorkoutDayKeyFromDateString(dateString: string): WorkoutDayKey | null {
  return getWorkoutDayKeyFromDate(parseLocalDateString(dateString));
}

export function shiftToWorkoutDate(
  dateString: string,
  direction: 1 | -1
): string {
  const date = parseLocalDateString(dateString);

  for (let step = 0; step < 8; step += 1) {
    date.setDate(date.getDate() + direction);

    if (getWorkoutDayKeyFromDate(date)) {
      return getLocalIsoDateString(date);
    }
  }

  return dateString;
}

export function createWorkoutDraft(dateString: string, dayKey: WorkoutDayKey): WorkoutDraft {
  const template = workoutTemplates[dayKey];

  return {
    date: dateString,
    dayKey,
    dayLabel: template.dayLabel,
    exercises: template.exercises.map((exerciseTemplate) => ({
      ...exerciseTemplate,
      sets: exerciseTemplate.sets.map((setTemplate) => ({
        ...setTemplate,
        actualWeightKg: "",
        actualReps: setTemplate.targetReps ? String(setTemplate.targetReps) : "",
        actualDurationMinutes: setTemplate.targetDurationMinutes
          ? String(setTemplate.targetDurationMinutes)
          : "",
        actualCalories: setTemplate.targetCalories ? String(setTemplate.targetCalories) : "",
        completed: false
      }))
    }))
  };
}

export function getWorkoutTemplateByDay(dayKey: WorkoutDayKey): WorkoutTemplate {
  return workoutTemplates[dayKey];
}

export function getWorkoutTemplatesInOrder(): WorkoutTemplate[] {
  return WORKOUT_DAY_ORDER.map((dayKey) => workoutTemplates[dayKey]);
}

