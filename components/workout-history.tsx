"use client";

import { useEffect, useState } from "react";

import { parseLocalDateString } from "@/lib/workout-plan";
import type { LoggedWorkout, WorkoutHistoryItem } from "@/lib/types";

const longDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long"
});

function formatDate(dateString: string) {
  return longDateFormatter.format(parseLocalDateString(dateString));
}

export function WorkoutHistory() {
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedWorkout, setSelectedWorkout] = useState<LoggedWorkout | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadWorkout(date: string) {
      try {
        setSelectedDate(date);
        setIsLoadingWorkout(true);
        setError("");

        const response = await fetch(`/api/workouts/${date}`, {
          cache: "no-store"
        });

        const data = (await response.json()) as {
          workout?: LoggedWorkout;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Workout detayı alınamadı.");
        }

        if (!ignore) {
          setSelectedWorkout(data.workout ?? null);
        }
      } catch (workoutError) {
        if (!ignore) {
          setError(
            workoutError instanceof Error
              ? workoutError.message
              : "Workout detayı yüklenemedi."
          );
        }
      } finally {
        if (!ignore) {
          setIsLoadingWorkout(false);
        }
      }
    }

    async function loadHistory() {
      try {
        const response = await fetch("/api/workouts/history", {
          cache: "no-store"
        });

        const data = (await response.json()) as {
          items?: WorkoutHistoryItem[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Workout geçmişi alınamadı.");
        }

        if (!ignore) {
          setHistory(data.items ?? []);

          if (data.items?.[0]) {
            void loadWorkout(data.items[0].date);
          }
        }
      } catch (historyError) {
        if (!ignore) {
          setError(
            historyError instanceof Error
              ? historyError.message
              : "Workout geçmişi yüklenemedi."
          );
        }
      } finally {
        if (!ignore) {
          setIsLoadingList(false);
        }
      }
    }

    void loadHistory();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleSelectDate(date: string) {
    setSelectedDate(date);
    setError("");
    setIsLoadingWorkout(true);

    try {
      const response = await fetch(`/api/workouts/${date}`, {
        cache: "no-store"
      });

      const data = (await response.json()) as {
        workout?: LoggedWorkout;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Workout detayı alınamadı.");
      }

      setSelectedWorkout(data.workout ?? null);
    } catch (workoutError) {
      setError(
        workoutError instanceof Error ? workoutError.message : "Workout detayı yüklenemedi."
      );
    } finally {
      setIsLoadingWorkout(false);
    }
  }

  return (
    <section className="page-stack">
      <div className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Geçmiş</span>
          <h1>Antrenman Geçmişi</h1>
          <p>
            Geçmiş log’lara dokunarak o gün yaptığın ağırlıkları ve tekrar sayılarını birebir
            görebilirsin.
          </p>
        </div>
      </div>

      {error ? <div className="status-note status-note-error">{error}</div> : null}

      <div className="history-layout">
        <div className="panel">
          <div className="section-heading">
            <div>
              <span className="section-label">Oturumlar</span>
              <h2>Geçmiş antrenmanlar</h2>
            </div>
          </div>

          {isLoadingList ? (
            <div className="loading-block" />
          ) : history.length === 0 ? (
            <p className="muted-copy">
              Henüz kayıtlı workout yok. İlk antrenmanı kaydettiğinde burada görünecek.
            </p>
          ) : (
            <div className="history-list">
              {history.map((item) => {
                const active = item.date === selectedDate;

                return (
                  <button
                    key={item.date}
                    type="button"
                    className={active ? "history-item history-item-active" : "history-item"}
                    onClick={() => void handleSelectDate(item.date)}
                  >
                    <div>
                      <strong>{formatDate(item.date)}</strong>
                      <p>{item.dayLabel}</p>
                    </div>
                    <div className="history-metrics">
                      <span>{item.completedSets} set</span>
                      <span>{Math.round(item.volumeKg)} kg</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <span className="section-label">Seçili antrenman</span>
              <h2>{selectedWorkout ? formatDate(selectedWorkout.date) : "Antrenman seç"}</h2>
            </div>
          </div>

          {isLoadingWorkout ? (
            <>
              <div className="loading-block" />
              <div className="loading-block loading-block-short" />
            </>
          ) : !selectedWorkout ? (
            <p className="muted-copy">Detayları görmek için soldan bir tarih seç.</p>
          ) : (
            <div className="detail-stack">
              {selectedWorkout.exercises.map((exercise) => (
                <article key={exercise.id} className="history-card">
                  <div className="exercise-header">
                    <div>
                      <h3>{exercise.name}</h3>
                      <p>{exercise.targetSummary}</p>
                    </div>
                    {exercise.pairingLabel ? (
                      <span className="pair-badge">{exercise.pairingLabel}</span>
                    ) : null}
                  </div>

                  <div className="sets-table">
                    <div className="sets-head">
                      <span>Set</span>
                      <span>{exercise.exerciseKind === "cardio" ? "Dk" : "KG"}</span>
                      <span>{exercise.exerciseKind === "cardio" ? "Kal" : "Tekrar"}</span>
                      <span>Tamam</span>
                    </div>

                    {exercise.sets.map((set) => (
                      <div key={`${exercise.id}-${set.setNumber}`} className="set-row set-row-static">
                        <span className="set-index">#{set.setNumber}</span>
                        <span className="static-metric">
                          {exercise.exerciseKind === "cardio"
                            ? set.actualDurationMinutes ?? "-"
                            : set.actualWeightKg ?? "-"}
                        </span>
                        <span className="static-metric">
                          {exercise.exerciseKind === "cardio"
                            ? set.actualCalories ?? "-"
                            : set.actualReps ?? set.targetReps ?? "-"}
                        </span>
                        <span className={set.completed ? "done-pill done-pill-active" : "done-pill"}>
                          {set.completed ? "✓" : "–"}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
