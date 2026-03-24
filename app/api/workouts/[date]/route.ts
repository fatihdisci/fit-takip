import { NextResponse } from "next/server";

import { getSql } from "@/lib/db";
import type { LoggedWorkout } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: {
    date: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const sql = getSql();
    const date = params.date;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
    }

    const [workoutRow] = await sql<{
      id: number;
      date: string;
      dayKey: LoggedWorkout["dayKey"];
      dayLabel: string;
      createdAt: string;
      updatedAt: string;
    }[]>`
      select
        id,
        workout_date::text as date,
        day_key as "dayKey",
        day_label as "dayLabel",
        created_at::text as "createdAt",
        updated_at::text as "updatedAt"
      from workout_logs
      where workout_date = ${date}
      limit 1
    `;

    if (!workoutRow) {
      return NextResponse.json({ error: "Workout bulunamadı." }, { status: 404 });
    }

    const exerciseRows = await sql<{
      id: number;
      name: string;
      pairingLabel: string | null;
      exerciseKind: "strength" | "cardio";
      targetSummary: string;
      exerciseOrder: number;
    }[]>`
      select
        id,
        exercise_name as name,
        pairing_label as "pairingLabel",
        exercise_kind as "exerciseKind",
        target_summary as "targetSummary",
        exercise_order as "exerciseOrder"
      from workout_exercise_logs
      where workout_id = ${workoutRow.id}
      order by exercise_order asc
    `;

    const setRows =
      exerciseRows.length === 0
        ? []
        : await sql<{
            exerciseLogId: number;
            setNumber: number;
            targetReps: number | null;
            actualWeightKg: number | null;
            actualReps: number | null;
            targetDurationMinutes: number | null;
            actualDurationMinutes: number | null;
            targetCalories: number | null;
            actualCalories: number | null;
            completed: boolean;
          }[]>`
            select
              exercise_log_id as "exerciseLogId",
              set_number as "setNumber",
              target_reps as "targetReps",
              actual_weight_kg::float as "actualWeightKg",
              actual_reps as "actualReps",
              target_duration_minutes as "targetDurationMinutes",
              actual_duration_minutes as "actualDurationMinutes",
              target_calories as "targetCalories",
              actual_calories as "actualCalories",
              completed
            from workout_set_logs
            where exercise_log_id in ${sql(exerciseRows.map((exercise) => exercise.id))}
            order by exercise_log_id asc, set_number asc
          `;

    const workout: LoggedWorkout = {
      id: workoutRow.id,
      date: workoutRow.date,
      dayKey: workoutRow.dayKey,
      dayLabel: workoutRow.dayLabel,
      createdAt: workoutRow.createdAt,
      updatedAt: workoutRow.updatedAt,
      exercises: exerciseRows.map((exercise) => ({
        id: String(exercise.id),
        name: exercise.name,
        pairingLabel: exercise.pairingLabel,
        exerciseKind: exercise.exerciseKind,
        targetSummary: exercise.targetSummary,
        sets: setRows
          .filter((set) => set.exerciseLogId === exercise.id)
          .map((set) => ({
            setNumber: set.setNumber,
            targetReps: set.targetReps,
            actualWeightKg: set.actualWeightKg,
            actualReps: set.actualReps,
            targetDurationMinutes: set.targetDurationMinutes,
            actualDurationMinutes: set.actualDurationMinutes,
            targetCalories: set.targetCalories,
            actualCalories: set.actualCalories,
            completed: set.completed
          }))
      }))
    };

    return NextResponse.json({ workout });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Workout detayı alınamadı."
      },
      { status: 500 }
    );
  }
}
