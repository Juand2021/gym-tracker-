"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildEzBarRack,
  formatEzBarKg,
  nearestEzBarKg,
} from "@/lib/ez-bar-rack";

type Props = {
  open: boolean;
  exercise: string;
  valueKg: number | null;
  onConfirm: (weightKg: number) => void;
  onClose: () => void;
};

export function EzBarRackPicker({
  open,
  exercise,
  valueKg,
  onConfirm,
  onClose,
}: Props) {
  const rack = useMemo(() => buildEzBarRack(), []);
  const [selectedKg, setSelectedKg] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelectedKg(nearestEzBarKg(valueKg ?? 0));
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

  function pick(kg: number) {
    setSelectedKg(kg);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 220);
  }

  return (
    <div
      className="db-picker-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Seleccionar barra Z — ${exercise}`}
      onClick={onClose}
    >
      <div className="db-picker-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="db-picker-head">
          <div>
            <p className="label mb-0">Barra Z</p>
            <p className="db-picker-title">{exercise}</p>
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

        <div className="db-picker-weight" aria-live="polite">
          <span className="db-picker-weight-value">
            {selectedKg == null ? "—" : formatEzBarKg(selectedKg)}
          </span>
          <span className="db-picker-weight-unit">kg</span>
        </div>
        <p className="db-picker-hint">
          Elige la barra Z del rack · peso total en kg
        </p>

        <div className="ez-rack">
          {rack.map((item) => {
            const active = selectedKg === item.kg;
            return (
              <button
                key={item.kg}
                type="button"
                className={`ez-bar-card ${active ? "is-active" : ""} ${
                  active && pulse ? "is-pulse" : ""
                }`}
                onClick={() => pick(item.kg)}
                aria-label={`${formatEzBarKg(item.kg)} kilogramos`}
                aria-pressed={active}
              >
                <span className="ez-bar-glyph" aria-hidden>
                  <span className="ez-bar-end" />
                  <span className="ez-bar-zig" />
                  <span className="ez-bar-end" />
                </span>
                <span className="ez-bar-kg">
                  {formatEzBarKg(item.kg)}
                  <span className="ez-bar-unit">kg</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="db-picker-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={selectedKg == null}
            onClick={() => {
              if (selectedKg == null) return;
              onConfirm(selectedKg);
            }}
          >
            {selectedKg == null
              ? "Elige barra Z"
              : `Usar ${formatEzBarKg(selectedKg)} kg`}
          </button>
        </div>
      </div>
    </div>
  );
}
