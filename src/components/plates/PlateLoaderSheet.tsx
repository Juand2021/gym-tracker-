"use client";

import { useState, type ReactNode } from "react";
import { PickerPortal } from "@/components/PickerPortal";
import {
  buildBarbellLoad,
  formatBarbellTriggerKg,
  nearestPlateLoad,
} from "@/lib/barbell-plates";
import { isValidWeight, parseDecimal } from "@/lib/numbers";
import {
  PlateButtons,
  SleeveMeter,
  WeightReadout,
  usePlateLoader,
} from "./PlateKit";

export type StageProps = {
  plates: number[];
  leaving: boolean;
  pulse: boolean;
  sideLbs: number;
  floatTag: ReturnType<typeof usePlateLoader>["floatTag"];
  onRemoveOuter: () => void;
};

type Props = {
  open: boolean;
  exercise: string;
  valueKg: number | null;
  onConfirm: (weightKg: number) => void;
  onClose: () => void;
  onSwitchToManual?: () => void;
  /** Etiqueta del equipo, p. ej. "Barra olímpica". */
  equipmentLabel: string;
  hint: string;
  baseLbs: number;
  capacity: number;
  manualLabel: string;
  backLabel: string;
  renderStage: (stage: StageProps) => ReactNode;
};

export function PlateLoaderSheet({
  open,
  exercise,
  valueKg,
  onConfirm,
  onClose,
  onSwitchToManual,
  equipmentLabel,
  hint,
  baseLbs,
  capacity,
  manualLabel,
  backLabel,
  renderStage,
}: Props) {
  const loader = usePlateLoader(capacity);
  const [wasOpen, setWasOpen] = useState(open);
  const [manualMode, setManualMode] = useState(false);
  const [manualKgInput, setManualKgInput] = useState("");

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const initial =
        valueKg != null && valueKg > 0
          ? nearestPlateLoad(valueKg, baseLbs, capacity).platesPerSide
          : [];
      loader.reset(initial);
      setManualMode(false);
      setManualKgInput(valueKg ? formatBarbellTriggerKg(valueKg) : "");
    }
  }

  const load = buildBarbellLoad(loader.plates, baseLbs);
  const manualValue = parseDecimal(manualKgInput);
  const manualValid = isValidWeight(manualValue);

  function handleManualConfirm() {
    if (!manualValid) return;
    onConfirm(manualValue);
    onSwitchToManual?.();
    onClose();
  }

  return (
    <PickerPortal open={open}>
      <div
        className="bb-picker-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={`${equipmentLabel} — ${exercise}`}
        onClick={onClose}
      >
        <div className="bb-picker-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="bb-picker-scroll">
            <div className="bb-picker-head">
              <div>
                <p className="label mb-0">{equipmentLabel}</p>
                <p className="bb-picker-title">{exercise}</p>
              </div>
              <button type="button" className="stack-picker-close" onClick={onClose} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <WeightReadout kg={load.totalKg} lbs={load.totalLbs} pulse={loader.pulse} />
            <p className="bb-picker-hint">{hint}</p>

            {renderStage({
              plates: loader.plates,
              leaving: loader.leaving,
              pulse: loader.pulse,
              sideLbs: loader.sideLbs,
              floatTag: loader.floatTag,
              onRemoveOuter: loader.removeOuter,
            })}

            <SleeveMeter fillPct={loader.fillPct} full={loader.full} />

            <PlateButtons
              canAdd={loader.canAdd}
              onAdd={loader.add}
              onRemove={loader.removeOuter}
              canRemove={loader.plates.length > 0 && !loader.leaving}
            />
          </div>

          {manualMode ? (
            <div className="stack-picker-manual-panel">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {manualLabel}
                </span>
                <button
                  type="button"
                  className="text-xs text-[var(--accent)] hover:underline font-medium cursor-pointer"
                  onClick={() => setManualMode(false)}
                >
                  {backLabel}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    placeholder="Ej. 40"
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
                  disabled={!manualValid}
                  onClick={handleManualConfirm}
                >
                  Usar {manualValid && manualValue > 0 ? `${manualValue} kg` : "peso"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="bb-picker-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className={`btn btn-ghost border-white/15 hover:border-[var(--accent)] hover:text-white ${manualMode ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/15" : "text-[var(--ink)]"}`}
              onClick={() => {
                if (!manualMode) {
                  setManualKgInput(load.totalKg > 0 ? formatBarbellTriggerKg(load.totalKg) : "");
                  setManualMode(true);
                } else {
                  setManualMode(false);
                }
              }}
            >
              Peso manual
            </button>
            <button type="button" className="btn btn-primary" onClick={() => onConfirm(load.totalKg)}>
              Usar {formatBarbellTriggerKg(load.totalKg)} kg
            </button>
          </div>
        </div>
      </div>
    </PickerPortal>
  );
}
