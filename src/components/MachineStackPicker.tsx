"use client";

import {
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { PickerPortal } from "@/components/PickerPortal";
import {
  buildStackPlates,
  formatStackKg,
  formatStackLbs,
  nearestPlateIndex,
  type MachineStackConfig,
} from "@/lib/machine-stacks";

type Props = {
  open: boolean;
  config: MachineStackConfig;
  valueKg: number | null;
  onConfirm: (weightKg: number) => void;
  onClose: () => void;
};

export function MachineStackPicker({
  open,
  config,
  valueKg,
  onConfirm,
  onClose,
}: Props) {
  const plates = useMemo(() => buildStackPlates(config), [config]);
  const [pinIndex, setPinIndex] = useState(() =>
    nearestPlateIndex(plates, valueKg ?? 0),
  );
  const [pinPulse, setPinPulse] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  const stackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Al abrir el sheet, sincroniza el pin con el peso actual (sin useEffect).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setPinIndex(nearestPlateIndex(plates, valueKg ?? 0));
    }
  }

  const selectedKg = pinIndex < 0 ? 0 : plates[pinIndex].cumulativeKg;

  function selectPlate(index: number) {
    setPinIndex(index);
    setPinPulse(true);
    window.setTimeout(() => setPinPulse(false), 220);
  }

  function indexFromPointer(clientY: number) {
    const root = stackRef.current;
    if (!root) return pinIndex;
    const slots = root.querySelectorAll<HTMLElement>("[data-plate-index]");
    if (slots.length === 0) return pinIndex;

    let best = -1;
    let bestDist = Number.POSITIVE_INFINITY;
    slots.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dist = Math.abs(mid - clientY);
      if (dist < bestDist) {
        bestDist = dist;
        best = Number(el.dataset.plateIndex);
      }
    });

    const first = slots[0].getBoundingClientRect();
    if (clientY < first.top - 8) return -1;
    return best;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    selectPlate(indexFromPointer(e.clientY));
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    setPinIndex(indexFromPointer(e.clientY));
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    dragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  const pinTopPercent =
    pinIndex < 0 ? -2 : ((pinIndex + 0.5) / plates.length) * 100;

  return (
    <PickerPortal open={open}>
    <div
      className="stack-picker-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Seleccionar peso — ${config.exercise}`}
      onClick={onClose}
    >
      <div
        className="stack-picker-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="stack-picker-head">
          <div>
            <p className="label mb-0">Máquina</p>
            <p className="stack-picker-title">{config.exercise}</p>
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
          className={`stack-picker-weight ${pinPulse ? "is-pulse" : ""}`}
          aria-live="polite"
        >
          <span className="stack-picker-weight-value">
            {formatStackKg(selectedKg)}
          </span>
          <span className="stack-picker-weight-unit">kg</span>
          <span className="stack-picker-weight-lbs">
            · {formatStackLbs(selectedKg)} lb
          </span>
        </div>
        <p className="stack-picker-hint">
          Izquierda kg · derecha lb · se guarda en kg · {config.smallCount}×
          {formatStackKg(config.smallKg)} + {config.largeCount}×
          {formatStackKg(config.largeKg)}
        </p>

        <div className="stack-picker-stage">
          <button
            type="button"
            className={`stack-zero ${pinIndex < 0 ? "is-active" : ""}`}
            onClick={() => selectPlate(-1)}
          >
            Sin pin · 0 kg
          </button>

          <div
            ref={stackRef}
            className={`stack-frame ${pinPulse ? "is-pulse" : ""}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div className="stack-guide stack-guide-left" aria-hidden />
            <div className="stack-guide stack-guide-right" aria-hidden />
            <div className="stack-center-rod" aria-hidden />

            <div className="stack-plates">
              {plates.map((plate) => {
                const loaded = pinIndex >= 0 && plate.index <= pinIndex;
                return (
                  <button
                    key={plate.index}
                    type="button"
                    data-plate-index={plate.index}
                    className={`stack-plate stack-plate-${plate.size} ${
                      loaded ? "is-loaded" : ""
                    } ${pinIndex === plate.index ? "is-pinned" : ""}`}
                    onClick={() => selectPlate(plate.index)}
                    aria-label={`${formatStackKg(plate.cumulativeKg)} kilogramos, ${formatStackLbs(plate.cumulativeKg)} libras`}
                  >
                    <span className="stack-plate-label stack-plate-label-left">
                      <span className="stack-plate-num">
                        {formatStackKg(plate.cumulativeKg)}
                      </span>
                      <span className="stack-plate-unit">kg</span>
                    </span>
                    <span className="stack-plate-hole" aria-hidden />
                    <span className="stack-plate-label stack-plate-label-right">
                      <span className="stack-plate-num">
                        {formatStackLbs(plate.cumulativeKg)}
                      </span>
                      <span className="stack-plate-unit">lb</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className={`stack-pin ${pinPulse ? "is-pulse" : ""} ${
                pinIndex < 0 ? "is-parked" : ""
              }`}
              style={{ top: `${pinTopPercent}%` }}
              aria-hidden
            >
              <span className="stack-pin-head" />
              <span className="stack-pin-shaft" />
              <span className="stack-pin-cord" />
            </div>
          </div>
        </div>

        <div className="stack-picker-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onConfirm(selectedKg)}
          >
            Usar {formatStackKg(selectedKg)} kg
          </button>
        </div>
      </div>
    </div>
    </PickerPortal>
  );
}
