"use client";

import { useEffect, useState } from "react";

import {
  createWorkoutDraft,
  getLocalIsoDateString,
  getWorkoutDayKeyFromDateString,
  getWorkoutTemplateByDay,
  getWorkoutTemplatesInOrder,
  parseLocalDateString,
  shiftToWorkoutDate
} from "@/lib/workout-plan";
import {
  buildPayload,
  convertLoggedWorkoutToDraft,
  countCompletedSets,
  parseNumber
} from "@/lib/workout-draft";
import type { LoggedWorkout, WorkoutDraft } from "@/lib/types";

const longDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long"
});

const shortDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short"
});

function getDraftStorageKey(date: string) {
  return `gymflow:draft:${date}`;
}

function formatDisplayDate(dateString: string) {
  return longDateFormatter.format(parseLocalDateString(dateString));
}

export function TodayWorkout() {
  const [selectedDate, setSelectedDate] = useState(() => getLocalIsoDateString(new Date()));
  const [draft, setDraft] = useState<WorkoutDraft | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const dayKey = getWorkoutDayKeyFromDateString(selectedDate);
  const template = dayKey ? getWorkoutTemplateByDay(dayKey) : null;
  const completedSets = countCompletedSets(draft);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!dayKey) {
      setDraft(null);
      setStatus("Bugün planlı salon günü değil. İstersen bir sonraki split gününe geçebilirsin.");
      setError("");
      setIsLoading(false);
      return;
    }

    const workoutDayKey = dayKey;
    let ignore = false;

    async function loadDraft() {
      setIsLoading(true);
      setError("");

      const localDraft = window.localStorage.getItem(getDraftStorageKey(selectedDate));

      if (localDraft) {
        try {
          const parsedDraft = JSON.parse(localDraft) as WorkoutDraft;

          if (!ignore) {
            setDraft(parsedDraft);
            setStatus("Kaydedilmemiş taslak geri yüklendi.");
            setIsLoading(false);
          }
          return;
        } catch {
          window.localStorage.removeItem(getDraftStorageKey(selectedDate));
        }
      }

      try {
        const response = await fetch(`/api/workouts/${selectedDate}`, {
          cache: "no-store"
        });

        if (response.ok) {
          const data = (await response.json()) as { workout: LoggedWorkout };

          if (!ignore) {
            setDraft(convertLoggedWorkoutToDraft(data.workout));
            setStatus("Bu tarihe ait antrenman yüklendi.");
            setIsLoading(false);
          }
          return;
        }
      } catch {
        if (!ignore) {
          setError("Kayıtlı antrenman yüklenemedi, yeni taslak oluşturuldu.");
        }
      }

      if (!ignore) {
        setDraft(createWorkoutDraft(selectedDate, workoutDayKey));
        setStatus("Setleri doldurup antrenmanı kaydedebilirsin.");
        setIsLoading(false);
      }
    }

    void loadDraft();

    return () => {
      ignore = true;
    };
  }, [dayKey, isHydrated, selectedDate]);

  useEffect(() => {
    if (!isHydrated || !draft || draft.date !== selectedDate) {
      return;
    }

    window.localStorage.setItem(getDraftStorageKey(selectedDate), JSON.stringify(draft));
  }, [draft, isHydrated, selectedDate]);

  function updateSetValue(
    exerciseIndex: number,
    setIndex: number,
    field:
      | "actualWeightKg"
      | "actualReps"
      | "actualDurationMinutes"
      | "actualCalories"
      | "completed",
    value: string | boolean
  ) {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        exercises: currentDraft.exercises.map((exercise, currentExerciseIndex) => {
          if (exerciseIndex !== currentExerciseIndex) {
            return exercise;
          }

          return {
            ...exercise,
            sets: exercise.sets.map((set, currentSetIndex) => {
              if (setIndex !== currentSetIndex) {
                return set;
              }

              return {
                ...set,
                [field]: value
              };
            })
          };
        })
      };
    });
  }

  async function saveWorkout() {
    if (!draft) {
      return;
    }

    if (completedSets === 0) {
      setError("Kaydetmeden önce en az bir seti tamamlanmış olarak işaretle.");
      setStatus("");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildPayload(draft))
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Workout kaydedilemedi.");
      }

      window.localStorage.removeItem(getDraftStorageKey(selectedDate));
      setStatus("Antrenman kaydedildi.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Workout kaydedilirken bir hata oluştu."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page-stack">
      <div className="hero-panel">
        <div className="hero-copy">
          <h1>Antrenman Takibi</h1>
          <p>Ağırlık, tekrar ve tamamlanma durumunu set bazında kaydet.</p>
        </div>

        <div className="hero-controls">
          <label className="date-field">
            <span>Tarih</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>

          <div className="date-caption">{formatDisplayDate(selectedDate)}</div>
        </div>
      </div>

      <div className="chip-row">
        <div className="chip">
          <strong>{completedSets}</strong>
          <span>Tamamlanan set</span>
        </div>
        <div className="chip">
          <strong>{template?.exercises.length ?? 0}</strong>
          <span>Egzersiz</span>
        </div>
        <div className="chip">
          <strong>{template ? template.shortLabel : "--"}</strong>
          <span>Gün</span>
        </div>
      </div>

      {status ? <div className="status-note">{status}</div> : null}
      {error ? <div className="status-note status-note-error">{error}</div> : null}

      {!template ? (
        <>
          <div className="panel">
            <div className="section-heading">
              <div>
                <span className="section-label">Dinlenme</span>
                <h2>Bugün salon günü değil</h2>
              </div>
            </div>
            <div className="inline-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedDate(shiftToWorkoutDate(selectedDate, -1))}
              >
                Önceki antrenman
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => setSelectedDate(shiftToWorkoutDate(selectedDate, 1))}
              >
                Sonraki antrenman
              </button>
            </div>
          </div>

          <div className="panel schedule-panel">
            <div className="section-heading">
              <div>
                <span className="section-label">3 Günlük Program</span>
                <h2>Haftalık program</h2>
              </div>
            </div>

            {getWorkoutTemplatesInOrder().map((workoutTemplate) => (
              <div key={workoutTemplate.dayKey} className="schedule-row">
                <div>
                  <strong>{workoutTemplate.dayLabel}</strong>
                  <p>{workoutTemplate.title}</p>
                </div>
                <span>{workoutTemplate.exercises.length} egzersiz</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="panel">
            <div className="section-heading">
              <div>
                <span className="section-label">{template.dayLabel}</span>
                <h2>{template.title}</h2>
              </div>
              <span className="panel-tag">{template.subtitle}</span>
            </div>
          </div>

          {isLoading || !draft ? (
            <div className="panel">
              <div className="loading-block" />
              <div className="loading-block loading-block-short" />
            </div>
          ) : (
            draft.exercises.map((exercise, exerciseIndex) => (
              <article key={exercise.id} className="exercise-card">
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

                  {exercise.sets.map((set, setIndex) => (
                    <div key={`${exercise.id}-${set.setNumber}`} className="set-row">
                      <span className="set-index">#{set.setNumber}</span>

                      <input
                        className="metric-input"
                        type="number"
                        inputMode="decimal"
                        placeholder={exercise.exerciseKind === "cardio" ? "20" : "55"}
                        value={
                          exercise.exerciseKind === "cardio"
                            ? set.actualDurationMinutes
                            : set.actualWeightKg
                        }
                        onChange={(event) =>
                          updateSetValue(
                            exerciseIndex,
                            setIndex,
                            exercise.exerciseKind === "cardio"
                              ? "actualDurationMinutes"
                              : "actualWeightKg",
                            event.target.value
                          )
                        }
                      />

                      <input
                        className="metric-input"
                        type="number"
                        inputMode="numeric"
                        placeholder={
                          exercise.exerciseKind === "cardio"
                            ? String(set.targetCalories ?? "")
                            : String(set.targetReps ?? "")
                        }
                        value={
                          exercise.exerciseKind === "cardio"
                            ? set.actualCalories
                            : set.actualReps
                        }
                        onChange={(event) =>
                          updateSetValue(
                            exerciseIndex,
                            setIndex,
                            exercise.exerciseKind === "cardio"
                              ? "actualCalories"
                              : "actualReps",
                            event.target.value
                          )
                        }
                      />

                      <label className="check-wrap">
                        <input
                          type="checkbox"
                          checked={set.completed}
                          onChange={(event) =>
                            updateSetValue(
                              exerciseIndex,
                              setIndex,
                              "completed",
                              event.target.checked
                            )
                          }
                        />
                        <span className="check-indicator" />
                      </label>
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}

          <div className="save-bar">
            <div>
              <strong>{shortDateFormatter.format(parseLocalDateString(selectedDate))}</strong>
              <p>{completedSets} set tamamlandı</p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => void saveWorkout()}
              disabled={isSaving || isLoading}
            >
              {isSaving ? "Kaydediliyor..." : "Antrenmanı Kaydet"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
