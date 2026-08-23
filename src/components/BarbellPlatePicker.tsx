"use client";

import { useState } from "react";
import { PickerPortal } from "@/components/PickerPortal";
import {
  OLYMPIC_BAR_LBS,
  PLATE_LBS,
  addPlate,
  buildBarbellLoad,
  emptyBarbellLoad,
  formatBarbellLbs,
  formatBarbellTriggerKg,
  getBaseEquipmentLbs,
  isPlateMachineExercise,
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

/** Boceto 3D interactivo para la máquina de remo con soporte en pecho y carga de discos */
function PlateMachineStage({
  platesPerSide,
  onRemoveOuter,
  pulse,
}: {
  platesPerSide: number[];
  onRemoveOuter: () => void;
  pulse: boolean;
}) {
  const getPlateSpecs = (lbs: number) => {
    switch (lbs) {
      case 45:
        return {
          w: 14,
          h: 96,
          fill: "url(#plateGrad45)",
          stroke: "#555",
          bevel: "#777",
          text: "#ffffff",
        };
      case 25:
        return {
          w: 12,
          h: 78,
          fill: "url(#plateGrad25)",
          stroke: "#3d6494",
          bevel: "#6d9dd6",
          text: "#ffffff",
        };
      case 10:
        return {
          w: 10,
          h: 60,
          fill: "url(#plateGrad10)",
          stroke: "#437e53",
          bevel: "#74b887",
          text: "#ffffff",
        };
      case 5:
        return {
          w: 8,
          h: 46,
          fill: "url(#plateGrad5)",
          stroke: "#9c5d26",
          bevel: "#e0944e",
          text: "#ffffff",
        };
      default: // 2.5
        return {
          w: 7,
          h: 36,
          fill: "url(#plateGrad2)",
          stroke: "#727d91",
          bevel: "#b7c1d1",
          text: "#ffffff",
        };
    }
  };

  const sleeveLength = 95;
  const leftOriginX = 142;
  const rightOriginX = 278;
  const sleeveY = 105;

  let leftOffset = 0;
  const renderedLeftPlates = platesPerSide.map((lbs, i) => {
    const spec = getPlateSpecs(lbs);
    leftOffset += spec.w + 2;
    const x = leftOriginX - leftOffset;
    const isOuter = i === platesPerSide.length - 1;
    return { lbs, i, x, isOuter, ...spec };
  });

  let rightOffset = 0;
  const renderedRightPlates = platesPerSide.map((lbs, i) => {
    const spec = getPlateSpecs(lbs);
    const x = rightOriginX + rightOffset + 2;
    rightOffset += spec.w + 2;
    const isOuter = i === platesPerSide.length - 1;
    return { lbs, i, x, isOuter, ...spec };
  });

  return (
    <div className={`bb-machine-stage ${pulse ? "is-pulse" : ""}`}>
      <svg
        viewBox="0 0 420 210"
        className="w-full max-h-[190px] select-none"
        fill="none"
      >
        <defs>
          {/* Gradientes idénticos a los discos de press de banca */}
          <linearGradient id="plateGrad45" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a4a4a" />
            <stop offset="100%" stopColor="#161616" />
          </linearGradient>
          <linearGradient id="plateGrad25" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f79a8" />
            <stop offset="100%" stopColor="#1a2f4a" />
          </linearGradient>
          <linearGradient id="plateGrad10" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a9a6c" />
            <stop offset="100%" stopColor="#1f3d2a" />
          </linearGradient>
          <linearGradient id="plateGrad5" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c07a3a" />
            <stop offset="100%" stopColor="#5a3414" />
          </linearGradient>
          <linearGradient id="plateGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9aa3b2" />
            <stop offset="100%" stopColor="#3f4654" />
          </linearGradient>

          <linearGradient id="steelTube" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#888" />
            <stop offset="35%" stopColor="#dcdcdc" />
            <stop offset="65%" stopColor="#666" />
            <stop offset="100%" stopColor="#333" />
          </linearGradient>
          <linearGradient id="padGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#333" />
            <stop offset="100%" stopColor="#181818" />
          </linearGradient>
          <linearGradient id="frameGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#252525" />
            <stop offset="50%" stopColor="#3d3d3d" />
            <stop offset="100%" stopColor="#1a1a1a" />
          </linearGradient>
        </defs>

        {/* 1. Base del piso y patas estabilizadoras de la máquina */}
        <path
          d="M 140 196 L 280 196 L 295 186 L 125 186 Z"
          fill="url(#frameGrad)"
          stroke="#444"
          strokeWidth="1.5"
        />
        <rect x="120" y="193" width="22" height="6" rx="1.5" fill="#111" />
        <rect x="278" y="193" width="22" height="6" rx="1.5" fill="#111" />

        {/* 2. Columnas de soporte estructural en V */}
        <path
          d="M 135 188 L 188 95 L 202 95 L 152 188 Z"
          fill="#2b2b2b"
          stroke="#444"
          strokeWidth="1.5"
        />
        <path
          d="M 285 188 L 232 95 L 218 95 L 268 188 Z"
          fill="#222"
          stroke="#444"
          strokeWidth="1.5"
        />

        {/* 3. Barra de apoyo para los pies */}
        <rect
          x="150"
          y="168"
          width="120"
          height="8"
          rx="4"
          fill="url(#steelTube)"
          stroke="#222"
          strokeWidth="1"
        />
        <circle cx="154" cy="172" r="3" fill="#ff6b00" />
        <circle cx="266" cy="172" r="3" fill="#ff6b00" />

        {/* 4. Tubo de carga izquierdo (manga donde van los discos) */}
        <rect
          x={leftOriginX - sleeveLength}
          y={sleeveY - 7}
          width={sleeveLength}
          height={14}
          rx={3}
          fill="url(#steelTube)"
          stroke="#444"
          strokeWidth="1"
        />
        <circle
          cx={leftOriginX - sleeveLength + 3}
          cy={sleeveY}
          r="6"
          fill="#1c1c1c"
          stroke="#777"
        />
        {/* Collarín interior izquierdo */}
        <rect
          x={leftOriginX - 4}
          y={sleeveY - 20}
          width={8}
          height={40}
          rx={2}
          fill="#ff6b00"
          stroke="#fff"
          strokeWidth="1"
        />

        {/* 5. Tubo de carga derecho (manga donde van los discos) */}
        <rect
          x={rightOriginX}
          y={sleeveY - 7}
          width={sleeveLength}
          height={14}
          rx={3}
          fill="url(#steelTube)"
          stroke="#444"
          strokeWidth="1"
        />
        <circle
          cx={rightOriginX + sleeveLength - 3}
          cy={sleeveY}
          r="6"
          fill="#1c1c1c"
          stroke="#777"
        />
        {/* Collarín interior derecho */}
        <rect
          x={rightOriginX - 4}
          y={sleeveY - 20}
          width={8}
          height={40}
          rx={2}
          fill="#ff6b00"
          stroke="#fff"
          strokeWidth="1"
        />

        {/* 6. Discos montados en el tubo izquierdo */}
        {renderedLeftPlates.map((p) => (
          <g
            key={`LP-${p.i}-${p.lbs}`}
            onClick={p.isOuter ? onRemoveOuter : undefined}
            className={p.isOuter ? "cursor-pointer hover:opacity-80 active:scale-95 transition-all" : ""}
          >
            <rect
              x={p.x}
              y={sleeveY - p.h / 2}
              width={p.w}
              height={p.h}
              rx={3}
              fill={p.fill}
              stroke={p.isOuter ? "#ff6b00" : p.stroke}
              strokeWidth={p.isOuter ? "2" : "1.5"}
            />
            {/* Bisel del disco */}
            <rect
              x={p.x + 2}
              y={sleeveY - p.h / 2 + 4}
              width={p.w - 4}
              height={p.h - 8}
              rx={1.5}
              fill="none"
              stroke={p.bevel}
              strokeWidth="0.8"
            />
            {/* Texto de libras */}
            <text
              x={p.x + p.w / 2}
              y={sleeveY + 3}
              transform={`rotate(-90 ${p.x + p.w / 2} ${sleeveY + 3})`}
              fill={p.text}
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {p.lbs}
            </text>
          </g>
        ))}

        {/* 7. Discos montados en el tubo derecho */}
        {renderedRightPlates.map((p) => (
          <g
            key={`RP-${p.i}-${p.lbs}`}
            onClick={p.isOuter ? onRemoveOuter : undefined}
            className={p.isOuter ? "cursor-pointer hover:opacity-80 active:scale-95 transition-all" : ""}
          >
            <rect
              x={p.x}
              y={sleeveY - p.h / 2}
              width={p.w}
              height={p.h}
              rx={3}
              fill={p.fill}
              stroke={p.isOuter ? "#ff6b00" : p.stroke}
              strokeWidth={p.isOuter ? "2" : "1.5"}
            />
            {/* Bisel del disco */}
            <rect
              x={p.x + 2}
              y={sleeveY - p.h / 2 + 4}
              width={p.w - 4}
              height={p.h - 8}
              rx={1.5}
              fill="none"
              stroke={p.bevel}
              strokeWidth="0.8"
            />
            {/* Texto de libras */}
            <text
              x={p.x + p.w / 2}
              y={sleeveY + 3}
              transform={`rotate(90 ${p.x + p.w / 2} ${sleeveY + 3})`}
              fill={p.text}
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {p.lbs}
            </text>
          </g>
        ))}

        {/* 8. Cuerpo central de la máquina: Asiento, Soporte y Manijas */}
        {/* Poste del asiento */}
        <rect
          x="198"
          y="136"
          width="24"
          height="52"
          fill="#1f1f1f"
          stroke="#444"
          strokeWidth="1.5"
        />
        {/* Cojín del asiento */}
        <rect
          x="180"
          y="126"
          width="60"
          height="14"
          rx="4"
          fill="url(#padGrad)"
          stroke="#666"
          strokeWidth="1.5"
        />
        <path d="M 184 133 L 236 133" stroke="#ff6b00" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Columna inclinada del soporte de pecho */}
        <path
          d="M 197 125 L 202 55 L 218 55 L 223 125 Z"
          fill="#252525"
          stroke="#444"
          strokeWidth="1.5"
        />

        {/* Almohadilla frontal de apoyo al pecho (Chest Support Pad) */}
        <rect
          x="195"
          y="40"
          width="30"
          height="58"
          rx="5"
          fill="url(#padGrad)"
          stroke="#ff6b00"
          strokeWidth="2"
        />
        <rect
          x="200"
          y="46"
          width="20"
          height="46"
          rx="3"
          fill="none"
          stroke="#555"
          strokeWidth="1"
        />

        {/* Eje de pivote central de los brazos de tracción */}
        <circle cx="210" cy="85" r="9" fill="#1c1c1c" stroke="#ff6b00" strokeWidth="2.5" />
        <circle cx="210" cy="85" r="4" fill="#fff" />

        {/* Brazos de palanca hacia las manijas */}
        <path
          d="M 204 82 L 174 74 L 168 46"
          stroke="#555"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 216 82 L 246 74 L 252 46"
          stroke="#555"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Manijas ergonómicas de agarre (Grips) */}
        <rect x="163" y="38" width="10" height="24" rx="3" fill="#111" stroke="#ff6b00" strokeWidth="1.5" />
        <rect x="247" y="38" width="10" height="24" rx="3" fill="#111" stroke="#ff6b00" strokeWidth="1.5" />
        <line x1="165" y1="44" x2="171" y2="44" stroke="#fff" strokeWidth="1.5" />
        <line x1="165" y1="50" x2="171" y2="50" stroke="#fff" strokeWidth="1.5" />
        <line x1="165" y1="56" x2="171" y2="56" stroke="#fff" strokeWidth="1.5" />
        <line x1="249" y1="44" x2="255" y2="44" stroke="#fff" strokeWidth="1.5" />
        <line x1="249" y1="50" x2="255" y2="50" stroke="#fff" strokeWidth="1.5" />
        <line x1="249" y1="56" x2="255" y2="56" stroke="#fff" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

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

  const isMachine = isPlateMachineExercise(exercise);
  const baseLbs = getBaseEquipmentLbs(exercise);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const load =
        valueKg != null && valueKg > 0
          ? nearestPlateLoad(valueKg, baseLbs)
          : emptyBarbellLoad(baseLbs);
      setPlatesPerSide(load.platesPerSide);
    }
  }

  const load = buildBarbellLoad(platesPerSide, baseLbs);
  const leftPlates = [...platesPerSide].reverse();
  const rightPlates = platesPerSide;

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

  return (
    <PickerPortal open={open}>
      <div
        className="bb-picker-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={`${isMachine ? "Cargar máquina de discos" : "Cargar barra olímpica"} — ${exercise}`}
        onClick={onClose}
      >
        <div className="bb-picker-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="bb-picker-scroll">
            <div className="bb-picker-head">
              <div>
                <p className="label mb-0">
                  {isMachine ? "Máquina de discos" : "Barra olímpica"}
                </p>
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

            <div
              className={`bb-picker-weight ${pulse ? "is-pulse" : ""}`}
              aria-live="polite"
            >
              <span className="bb-picker-weight-value">
                {formatBarbellLbs(load.totalLbs)}
              </span>
              <span className="bb-picker-weight-unit">lb</span>
              <span className="bb-picker-weight-kg">
                · {formatBarbellTriggerKg(load.totalKg)} kg
              </span>
            </div>
            <p className="bb-picker-hint">
              {isMachine
                ? "Máquina con soporte en pecho · discos por lado · se guarda en kg"
                : `Barra ${formatBarbellLbs(OLYMPIC_BAR_LBS)} lb · discos por lado · se guarda en kg`}
            </p>

            {isMachine ? (
              /* Boceto 3D de la máquina de remo con discos montados en sus tubos de carga laterales */
              <PlateMachineStage
                platesPerSide={platesPerSide}
                onRemoveOuter={onRemoveOuter}
                pulse={pulse}
              />
            ) : (
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
            )}

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
    </PickerPortal>
  );
}
