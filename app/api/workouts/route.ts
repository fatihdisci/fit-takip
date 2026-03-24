import { NextResponse } from "next/server";

import { getSql } from "@/lib/db";
import { workoutPayloadSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = workoutPayloadSchema.parse(await request.json());
    const sql = getSql();

    const result = await sql.begin(async (transaction) => {
      const tx = transaction as unknown as ReturnType<typeof getSql>;

      await tx`
        delete from workout_logs
        where workout_date = ${payload.date}
      `;

      const [workoutRow] = await tx<{
        id: number;
        created_at: string;
        updated_at: string;
      }[]>`
        insert into workout_logs (
          workout_date,
          day_key,
          day_label
        ) values (
          ${payload.date},
          ${payload.dayKey},
          ${payload.dayLabel}
        )
        returning id, created_at, updated_at
      `;

      for (const [exerciseIndex, exercise] of payload.exercises.entries()) {
        const [exerciseRow] = await tx<{ id: number }[]>`
          insert into workout_exercise_logs (
            workout_id,
            exercise_name,
            pairing_label,
            exercise_kind,
            target_summary,
            exercise_order
          ) values (
            ${workoutRow.id},
            ${exercise.name},
            ${exercise.pairingLabel ?? null},
            ${exercise.exerciseKind},
            ${exercise.targetSummary},
            ${exerciseIndex}
          )
          returning id
        `;

        for (const set of exercise.sets) {
          await tx`
            insert into workout_set_logs (
              exercise_log_id,
              set_number,
              target_reps,
              actual_weight_kg,
              actual_reps,
              target_duration_minutes,
              actual_duration_minutes,
              target_calories,
              actual_calories,
              completed
            ) values (
              ${exerciseRow.id},
              ${set.setNumber},
              ${set.targetReps},
              ${set.actualWeightKg},
              ${set.actualReps},
              ${set.targetDurationMinutes},
              ${set.actualDurationMinutes},
              ${set.targetCalories},
              ${set.actualCalories},
              ${set.completed}
            )
          `;
        }
      }

      return {
        id: workoutRow.id,
        createdAt: workoutRow.created_at,
        updatedAt: workoutRow.updated_at
      };
    });

    return NextResponse.json({
      ok: true,
      workout: result
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Workout kaydedilemedi."
      },
      { status: 400 }
    );
  }
}
