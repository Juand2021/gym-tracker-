"use client";

import { useEffect, useState } from "react";
import {
  OLYMPIC_BAR_LBS,
  PLATE_LBS,
  addPlate,
  buildBarbellLoad,
  emptyBarbellLoad,
  formatBarbellLbs,
  formatBarbellTriggerKg,
  nearestPlateLoad,
  plateSizeClass,
  removeOutermostPlate,
} from "@/lib/barbell-plates";

type Props = {
  open: boolean;
  exercise: string;
  valueKg: number | null;
  onConfirm: (weightKg: number) => void;
  onClose: () => void;
};

export function BarbellPlatePicker({
  open,
  exercise,
  valueKg,
  onConfirm,
  onClose,
}: Props) {
  const [platesPerSide, setPlatesPerSide] = useState<number[]>([]);
  const [pulse, setPulse] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const load =
        valueKg != null && valueKg > 0
          ? nearestPlateLoad(valueKg)
          : emptyBarbellLoad();
      setPlatesPerSide(load.platesPerSide);
    }
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const load = buildBarbellLoad(platesPerSide);

  function bump() {
    setPulse(true);
    window.setTimeout(() => setPulse(false), 220);
  }

  function onAdd(plateLbs: number) {
    setPlatesPerSide((prev) => addPlate(prev, plateLbs));
    bump();
  }

  function onRemoveOuter() {
    setPlatesPerSide((prev) => removeOutermostPlate(prev));
    bump();
  }

  // Espejo: izquierda muestra el orden invertido (exterior a la izquierda).
  const leftPlates = [...platesPerSide].reverse();
  const rightPlates = platesPerSide;

  return (
    <div
      className="bb-picker-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Cargar barra olímpica — ${exercise}`}
      onClick={onClose}
    >
      <div className="bb-picker-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bb-picker-head">
          <div>
            <p className="label mb-0">Barra olímpica</p>
            <p className="bb-picker-title">{exercise}</p>
          </div>
          <button
            type="button"
            className="stack-picker-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="bb-picker-weight" aria-live="polite">
          <span className="bb-picker-weight-value">
            {formatBarbellLbs(load.totalLbs)}
          </span>
          <span className="bb-picker-weight-unit">lb</span>
          <span className="bb-picker-weight-kg">
            · {formatBarbellTriggerKg(load.totalKg)} kg
          </span>
        </div>
        <p className="bb-picker-hint">
          Barra {formatBarbellLbs(OLYMPIC_BAR_LBS)} lb · discos por lado · se
          guarda en kg
        </p>

        <div className={`bb-bar-stage ${pulse ? "is-pulse" : ""}`}>
          <div className="bb-bar" aria-hidden>
            <div className="bb-sleeve bb-sleeve-left">
              {leftPlates.map((lbs, i) => (
                <button
                  key={`L-${i}-${lbs}`}
                  type="button"
                  className={`bb-plate ${plateSizeClass(lbs)}`}
                  onClick={i === 0 ? onRemoveOuter : undefined}
                  disabled={i !== 0}
                  title={
                    i === 0
                      ? `Quitar ${formatBarbellLbs(lbs)} lb`
                      : `${formatBarbellLbs(lbs)} lb`
                  }
                  aria-label={
                    i === 0
                      ? `Quitar disco exterior de ${formatBarbellLbs(lbs)} libras`
                      : undefined
                  }
                >
                  <span className="bb-plate-label">
                    {formatBarbellLbs(lbs)}
                  </span>
                </button>
              ))}
            </div>
            <div className="bb-shaft">
              <span className="bb-shaft-knurl" />
              <span className="bb-shaft-mid" aria-hidden />
              <span className="bb-shaft-label">
                {formatBarbellLbs(OLYMPIC_BAR_LBS)}
              </span>
              <span className="bb-shaft-mid" aria-hidden />
              <span className="bb-shaft-knurl" />
            </div>
            <div className="bb-sleeve bb-sleeve-right">
              {rightPlates.map((lbs, i) => {
                const isOuter = i === rightPlates.length - 1;
                return (
                  <button
                    key={`R-${i}-${lbs}`}
                    type="button"
                    className={`bb-plate ${plateSizeClass(lbs)}`}
                    onClick={isOuter ? onRemoveOuter : undefined}
                    disabled={!isOuter}
                    title={
                      isOuter
                        ? `Quitar ${formatBarbellLbs(lbs)} lb`
                        : `${formatBarbellLbs(lbs)} lb`
                    }
                    aria-label={
                      isOuter
                        ? `Quitar disco exterior de ${formatBarbellLbs(lbs)} libras`
                        : undefined
                    }
                  >
                    <span className="bb-plate-label">
                      {formatBarbellLbs(lbs)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bb-plate-controls">
          {PLATE_LBS.map((lbs) => (
            <button
              key={lbs}
              type="button"
              className="bb-add-plate"
              onClick={() => onAdd(lbs)}
              aria-label={`Agregar ${formatBarbellLbs(lbs)} libras a cada lado`}
            >
              +{formatBarbellLbs(lbs)}
              <span className="bb-add-plate-unit">lb</span>
            </button>
          ))}
          <button
            type="button"
            className="bb-add-plate bb-remove-plate"
            onClick={onRemoveOuter}
            disabled={platesPerSide.length === 0}
            aria-label="Quitar disco exterior de ambos lados"
          >
            − disco
          </button>
        </div>

        <div className="bb-picker-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onConfirm(load.totalKg)}
          >
            Usar {formatBarbellTriggerKg(load.totalKg)} kg
          </button>
        </div>
      </div>
    </div>
  );
}
