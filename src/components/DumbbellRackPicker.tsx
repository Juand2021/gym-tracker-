"use client";

import { useMemo, useState } from "react";
import { PickerPortal } from "@/components/PickerPortal";
import {
  buildDumbbellRack,
  formatDumbbellLbs,
  formatDumbbellTriggerKg,
  lbsToKg,
  nearestDumbbellLbs,
} from "@/lib/dumbbell-rack";
import { isValidWeight, parseDecimal } from "@/lib/numbers";

type Props = {
  open: boolean;
  exercise: string;
  valueKg: number | null;
  onConfirm: (weightKg: number) => void;
  onClose: () => void;
  onSwitchToManual?: () => void;
};

export function DumbbellRackPicker({
  open,
  exercise,
  valueKg,
  onConfirm,
  onClose,
  onSwitchToManual,
}: Props) {
  const rack = useMemo(() => buildDumbbellRack(), []);
  const [selectedLbs, setSelectedLbs] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  const [manualMode, setManualMode] = useState(false);
  const [manualKgInput, setManualKgInput] = useState("");

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelectedLbs(nearestDumbbellLbs(valueKg ?? 0));
      setManualMode(false);
      setManualKgInput(valueKg ? formatDumbbellTriggerKg(valueKg) : "");
    }
  }

  const selectedKg = selectedLbs == null ? 0 : lbsToKg(selectedLbs);

  function handleManualConfirm() {
    const val = parseDecimal(manualKgInput);
    if (!isValidWeight(val)) return;
    onConfirm(val);
    onSwitchToManual?.();
    onClose();
  }

  function pick(lbs: number) {
    setSelectedLbs(lbs);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 220);
  }

  return (
    <PickerPortal open={open}>
      <div
        className="db-picker-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={`Seleccionar mancuerna — ${exercise}`}
        onClick={onClose}
      >
        <div className="db-picker-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="db-picker-head">
            <div>
              <p className="label mb-0">Mancuernas</p>
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

          <div
            className={`db-picker-weight ${pulse ? "is-pulse" : ""}`}
            aria-live="polite"
          >
            <span className="db-picker-weight-value">
              {selectedLbs == null ? "—" : formatDumbbellLbs(selectedLbs)}
            </span>
            <span className="db-picker-weight-unit">lb</span>
            <span className="db-picker-weight-kg">
              {selectedLbs == null
                ? ""
                : `· ${formatDumbbellTriggerKg(selectedKg)} kg`}
            </span>
          </div>
          <p className="db-picker-hint">
            Elige por libras del rack · se guarda y usa en kg
          </p>

          <div className="db-rack">
            {rack.map((item) => {
              const active = selectedLbs === item.lbs;
              return (
                <button
                  key={item.lbs}
                  type="button"
                  className={`db-bell ${active ? "is-active" : ""} ${
                    active && pulse ? "is-pulse" : ""
                  }`}
                  onClick={() => pick(item.lbs)}
                  aria-label={`${item.lbs} libras, ${formatDumbbellTriggerKg(item.kg)} kilogramos`}
                  aria-pressed={active}
                >
                  <span className="db-bell-body" aria-hidden>
                    <span className="db-bell-head db-bell-head-left" />
                    <span className="db-bell-bar" />
                    <span className="db-bell-head db-bell-head-right" />
                  </span>
                  <span className="db-bell-lbs">
                    {formatDumbbellLbs(item.lbs)}
                    <span className="db-bell-unit">lb</span>
                  </span>
                  <span className="db-bell-kg">
                    {formatDumbbellTriggerKg(item.kg)} kg
                  </span>
                </button>
              );
            })}
          </div>

          {manualMode ? (
            <div className="stack-picker-manual-panel">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Peso manual (otras mancuernas)
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
                    placeholder="Ej. 17.5"
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
                  setManualKgInput(selectedKg > 0 ? formatDumbbellTriggerKg(selectedKg) : "");
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
              disabled={selectedLbs == null}
              onClick={() => {
                if (selectedLbs == null) return;
                onConfirm(lbsToKg(selectedLbs));
              }}
            >
              {selectedLbs == null
                ? "Elige mancuerna"
                : `Usar ${formatDumbbellLbs(selectedLbs)} lb (${formatDumbbellTriggerKg(selectedKg)} kg)`}
            </button>
          </div>
        </div>
      </div>
    </PickerPortal>
  );
}
