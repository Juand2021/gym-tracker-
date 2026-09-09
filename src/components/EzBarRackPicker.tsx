"use client";

import { useMemo, useState } from "react";
import { PickerPortal } from "@/components/PickerPortal";
import {
  buildEzBarRack,
  formatEzBarKg,
  nearestEzBarKg,
} from "@/lib/ez-bar-rack";
import { isValidWeight, parseDecimal } from "@/lib/numbers";

type Props = {
  open: boolean;
  exercise: string;
  valueKg: number | null;
  onConfirm: (weightKg: number) => void;
  onClose: () => void;
  onSwitchToManual?: () => void;
};

export function EzBarRackPicker({
  open,
  exercise,
  valueKg,
  onConfirm,
  onClose,
  onSwitchToManual,
}: Props) {
  const rack = useMemo(() => buildEzBarRack(), []);
  const [selectedKg, setSelectedKg] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  const [manualMode, setManualMode] = useState(false);
  const [manualKgInput, setManualKgInput] = useState("");

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelectedKg(nearestEzBarKg(valueKg ?? 0));
      setManualMode(false);
      setManualKgInput(valueKg ? formatEzBarKg(valueKg) : "");
    }
  }

  function handleManualConfirm() {
    const val = parseDecimal(manualKgInput);
    if (!isValidWeight(val)) return;
    onConfirm(val);
    onSwitchToManual?.();
    onClose();
  }

  function pick(kg: number) {
    setSelectedKg(kg);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 220);
  }

  return (
    <PickerPortal open={open}>
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

          {manualMode ? (
            <div className="stack-picker-manual-panel">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Peso manual (otra barra)
                </span>
                <button
                  type="button"
                  className="text-xs text-[var(--accent)] hover:underline font-medium cursor-pointer"
                  onClick={() => setManualMode(false)}
                >
                  Volver al rack
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    placeholder="Ej. 27.5"
                    value={manualKgInput}
                    onChange={(e) => setManualKgInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleManualConfirm();
                      }
                    }}
                    className="field text-center text-lg font-bold w-full pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--muted)]">
                    kg
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary px-4 shrink-0 font-semibold text-xs sm:text-sm"
                  disabled={!isValidWeight(parseDecimal(manualKgInput))}
                  onClick={handleManualConfirm}
                >
                  Usar {isValidWeight(parseDecimal(manualKgInput)) && parseDecimal(manualKgInput) > 0 ? `${parseDecimal(manualKgInput)} kg` : "peso"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="db-picker-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className={`btn btn-ghost border-white/15 hover:border-[var(--accent)] hover:text-white ${manualMode ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/15" : "text-[var(--ink)]"}`}
              onClick={() => {
                if (!manualMode) {
                  setManualKgInput(selectedKg != null && selectedKg > 0 ? formatEzBarKg(selectedKg) : "");
                  setManualMode(true);
                } else {
                  setManualMode(false);
                }
              }}
            >
              Peso manual
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
    </PickerPortal>
  );
}
