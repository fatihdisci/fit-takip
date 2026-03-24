import { NextResponse } from "next/server";

import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const sql = getSql();

    const items = await sql<{
      date: string;
      dayLabel: string;
      completedSets: number;
      totalExercises: number;
      volumeKg: number;
      createdAt: string;
    }[]>`
      select
        wl.workout_date::text as date,
        wl.day_label as "dayLabel",
        coalesce(count(ws.id) filter (where ws.completed = true), 0)::int as "completedSets",
        count(distinct we.id)::int as "totalExercises",
        coalesce(
          sum(
            case
              when ws.completed = true then coalesce(ws.actual_weight_kg, 0) * coalesce(ws.actual_reps, 0)
              else 0
            end
          ),
          0
        )::float as "volumeKg",
        wl.created_at::text as "createdAt"
      from workout_logs wl
      left join workout_exercise_logs we on we.workout_id = wl.id
      left join workout_set_logs ws on ws.exercise_log_id = we.id
      group by wl.id
      order by wl.workout_date desc
    `;

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Workout geçmişi alınamadı."
      },
      { status: 500 }
    );
  }
}

