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

type Props = {
  open: boolean;
  exercise: string;
  valueKg: number | null;
  onConfirm: (weightKg: number) => void;
  onClose: () => void;
};

export function DumbbellRackPicker({
  open,
  exercise,
  valueKg,
  onConfirm,
  onClose,
}: Props) {
  const rack = useMemo(() => buildDumbbellRack(), []);
  const [selectedLbs, setSelectedLbs] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelectedLbs(nearestDumbbellLbs(valueKg ?? 0));
    }
  }

  const selectedKg = selectedLbs == null ? 0 : lbsToKg(selectedLbs);

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

          <div className="db-picker-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
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
