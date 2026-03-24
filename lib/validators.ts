import { z } from "zod";

export const workoutPayloadSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayKey: z.enum(["monday", "wednesday", "friday"]),
  dayLabel: z.string().min(1),
  exercises: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        pairingLabel: z.string().optional().nullable(),
        exerciseKind: z.enum(["strength", "cardio"]),
        targetSummary: z.string().min(1),
        sets: z
          .array(
            z.object({
              setNumber: z.number().int().positive(),
              targetReps: z.number().int().positive().nullable(),
              actualWeightKg: z.number().nonnegative().nullable(),
              actualReps: z.number().int().nonnegative().nullable(),
              targetDurationMinutes: z.number().int().positive().nullable(),
              actualDurationMinutes: z.number().int().nonnegative().nullable(),
              targetCalories: z.number().int().positive().nullable(),
              actualCalories: z.number().int().nonnegative().nullable(),
              completed: z.boolean()
            })
          )
          .min(1)
      })
    )
    .min(1)
});
