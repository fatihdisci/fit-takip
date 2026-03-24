"use client";

import { useEffect, useState } from "react";

import { buildPayload, convertLoggedWorkoutToDraft } from "@/lib/workout-draft";
import { parseLocalDateString } from "@/lib/workout-plan";
import type { LoggedWorkout, WorkoutDraft, WorkoutHistoryItem } from "@/lib/types";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<WorkoutDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let ignore = false;

    async function init() {
      try {
        const response = await fetch("/api/workouts/history", { cache: "no-store" });
        const data = (await response.json()) as {
          items?: WorkoutHistoryItem[];
          error?: string;
        };

        if (!response.ok) throw new Error(data.error ?? "Geçmiş alınamadı.");

        if (!ignore) {
          const items = data.items ?? [];
          setHistory(items);

          if (items[0]) {
            await fetchWorkout(items[0].date, () => ignore);
          }
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Antrenman geçmişi yüklenemedi.");
        }
      } finally {
        if (!ignore) setIsLoadingList(false);
      }
    }

    void init();

    return () => {
      ignore = true;
    };
  }, []);

  async function fetchWorkout(date: string, getIgnore?: () => boolean) {
    setSelectedDate(date);
    setIsLoadingWorkout(true);
    setError("");

    try {
      const response = await fetch(`/api/workouts/${date}`, { cache: "no-store" });
      const data = (await response.json()) as {
        workout?: LoggedWorkout;
        error?: string;
      };

      if (!response.ok) throw new Error(data.error ?? "Antrenman detayı alınamadı.");

      if (!getIgnore?.()) {
        setSelectedWorkout(data.workout ?? null);
      }
    } catch (e) {
      if (!getIgnore?.()) {
        setError(e instanceof Error ? e.message : "Antrenman detayı yüklenemedi.");
      }
    } finally {
      if (!getIgnore?.()) setIsLoadingWorkout(false);
    }
  }

  async function refreshHistory() {
    try {
      const response = await fetch("/api/workouts/history", { cache: "no-store" });
      const data = (await response.json()) as { items?: WorkoutHistoryItem[] };
      if (response.ok) setHistory(data.items ?? []);
    } catch {
      // sessizce geç
    }
  }

  async function handleSelectDate(date: string) {
    setIsEditing(false);
    setEditDraft(null);
    setConfirmDelete(false);
    setStatus("");
    await fetchWorkout(date);
  }

  function handleStartEdit() {
    if (!selectedWorkout) return;
    setEditDraft(convertLoggedWorkoutToDraft(selectedWorkout));
    setIsEditing(true);
    setConfirmDelete(false);
    setStatus("");
    setError("");
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditDraft(null);
  }

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
    setEditDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise, i) => {
          if (i !== exerciseIndex) return exercise;
          return {
            ...exercise,
            sets: exercise.sets.map((set, j) => {
              if (j !== setIndex) return set;
              return { ...set, [field]: value };
            })
          };
        })
      };
    });
  }

  async function handleSave() {
    if (!editDraft) return;

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(editDraft))
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Antrenman kaydedilemedi.");

      const savedDate = editDraft.date;
      setIsEditing(false);
      setEditDraft(null);
      setStatus("Antrenman güncellendi.");

      await Promise.all([refreshHistory(), fetchWorkout(savedDate)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Antrenman kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedWorkout) return;

    try {
      setIsDeleting(true);
      setError("");

      const response = await fetch(`/api/workouts/${selectedWorkout.date}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Antrenman silinemedi.");
      }

      setSelectedWorkout(null);
      setSelectedDate("");
      setIsEditing(false);
      setEditDraft(null);
      setConfirmDelete(false);
      setStatus("Antrenman silindi.");

      await refreshHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Antrenman silinemedi.");
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  }

  const detailTitle = isEditing && editDraft
    ? formatDate(editDraft.date)
    : selectedWorkout
    ? formatDate(selectedWorkout.date)
    : "Antrenman seç";

  return (
    <section className="page-stack">
      <div className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Geçmiş</span>
          <h1>Antrenman Geçmişi</h1>
          <p>
            Geçmiş kayıtlara dokunarak o gün yaptığın ağırlıkları ve tekrar sayılarını
            görebilirsin.
          </p>
        </div>
      </div>

      {error ? <div className="status-note status-note-error">{error}</div> : null}
      {status ? <div className="status-note">{status}</div> : null}

      <div className="history-layout">
        {/* Sol panel — geçmiş listesi */}
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
              Henüz kayıtlı antrenman yok. İlk antrenmanı kaydettiğinde burada görünecek.
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

        {/* Sağ panel — detay / düzenleme */}
        <div className="panel">
          <div className="section-heading section-heading-row">
            <div>
              <span className="section-label">Seçili antrenman</span>
              <h2>{detailTitle}</h2>
            </div>

            {/* Görüntüleme modu — düzenle / sil butonları */}
            {selectedWorkout && !isEditing ? (
              <div className="detail-actions">
                <button
                  type="button"
                  className="secondary-button action-btn"
                  onClick={handleStartEdit}
                >
                  Düzenle
                </button>

                {confirmDelete ? (
                  <>
                    <button
                      type="button"
                      className="secondary-button action-btn"
                      onClick={() => setConfirmDelete(false)}
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      className="danger-button action-btn"
                      onClick={() => void handleDelete()}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Siliniyor..." : "Evet, sil"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="danger-button action-btn"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Sil
                  </button>
                )}
              </div>
            ) : null}

            {/* Düzenleme modu — kaydet / iptal */}
            {isEditing ? (
              <div className="detail-actions">
                <button
                  type="button"
                  className="secondary-button action-btn"
                  onClick={handleCancelEdit}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="primary-button action-btn"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                >
                  {isSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            ) : null}
          </div>

          {isLoadingWorkout ? (
            <>
              <div className="loading-block" />
              <div className="loading-block loading-block-short" />
            </>
          ) : isEditing && editDraft ? (
            /* Düzenleme formu */
            <div className="detail-stack">
              {editDraft.exercises.map((exercise, exerciseIndex) => (
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
                          onChange={(e) =>
                            updateSetValue(
                              exerciseIndex,
                              setIndex,
                              exercise.exerciseKind === "cardio"
                                ? "actualDurationMinutes"
                                : "actualWeightKg",
                              e.target.value
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
                          onChange={(e) =>
                            updateSetValue(
                              exerciseIndex,
                              setIndex,
                              exercise.exerciseKind === "cardio"
                                ? "actualCalories"
                                : "actualReps",
                              e.target.value
                            )
                          }
                        />

                        <label className="check-wrap">
                          <input
                            type="checkbox"
                            checked={set.completed}
                            onChange={(e) =>
                              updateSetValue(
                                exerciseIndex,
                                setIndex,
                                "completed",
                                e.target.checked
                              )
                            }
                          />
                          <span className="check-indicator" />
                        </label>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : selectedWorkout ? (
            /* Görüntüleme modu */
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
                      <div
                        key={`${exercise.id}-${set.setNumber}`}
                        className="set-row set-row-static"
                      >
                        <span className="set-index">#{set.setNumber}</span>
                        <span className="static-metric">
                          {exercise.exerciseKind === "cardio"
                            ? (set.actualDurationMinutes ?? "-")
                            : (set.actualWeightKg ?? "-")}
                        </span>
                        <span className="static-metric">
                          {exercise.exerciseKind === "cardio"
                            ? (set.actualCalories ?? "-")
                            : (set.actualReps ?? set.targetReps ?? "-")}
                        </span>
                        <span
                          className={set.completed ? "done-pill done-pill-active" : "done-pill"}
                        >
                          {set.completed ? "✓" : "–"}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted-copy">Detayları görmek için soldan bir tarih seç.</p>
          )}
        </div>
      </div>
    </section>
  );
}
