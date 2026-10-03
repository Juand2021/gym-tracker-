"use client";

import {
  OLYMPIC_BAR_LBS,
  formatBarbellLbs,
  getBaseEquipmentLbs,
  getSleeveCapacity,
  isPlateMachineExercise,
} from "@/lib/barbell-plates";
import {
  FloatTags,
  FloorShadow,
  LoadedSleeve,
  PlateDefs,
  PlateStage,
  flexForLoad,
} from "@/components/plates/PlateKit";
import { PlateLoaderSheet, type StageProps } from "@/components/plates/PlateLoaderSheet";

type Props = {
  open: boolean;
  exercise: string;
  valueKg: number | null;
  onConfirm: (weightKg: number) => void;
  onClose: () => void;
  onSwitchToManual?: () => void;
};

/* ---------- Barra olímpica recta ---------- */

const OLY_BAR_Y = 92;
const OLY_LEFT_INNER_X = 122;
const OLY_RIGHT_INNER_X = 298;
const OLY_SLEEVE_LEN = 118;
const SHAFT_X0 = 132;
const SHAFT_X1 = 288;

function OlympicBarStage({ plates, leaving, pulse, sideLbs, floatTag, onRemoveOuter }: StageProps) {
  // Una barra olímpica "látigo": cede más que la Z con cargas grandes.
  const flex = flexForLoad(sideLbs, 3.5, 300);
  const sleeve = { barY: OLY_BAR_Y, sleeveLen: OLY_SLEEVE_LEN, plates, leaving, flexDeg: flex, onRemoveOuter };
  const shaftW = SHAFT_X1 - SHAFT_X0;
  const y = OLY_BAR_Y;

  return (
    <PlateStage pulse={pulse} viewBox="0 28 420 154">
      <PlateDefs>
        <mask id="pk-oly-mask">
          <rect x={SHAFT_X0} y={y - 4.5} width={shaftW} height={9} rx={2} fill="#fff" />
        </mask>
      </PlateDefs>

      <FloorShadow cx={210} cy={166} sideLbs={sideLbs} baseRx={140} />

      <g className="pk-rig">
        {/* Eje cromado con moleteado de agarre y centro */}
        <rect x={SHAFT_X0} y={y - 1.5} width={shaftW} height={9} rx={2} fill="#000" fillOpacity="0.45" />
        <rect x={SHAFT_X0} y={y - 4.5} width={shaftW} height={9} rx={2} fill="url(#pk-steel)" stroke="#3c3c3c" strokeWidth="0.6" />
        <rect x={142} y={y - 4.5} width={44} height={9} fill="url(#pk-knurl)" opacity="0.7" />
        <rect x={234} y={y - 4.5} width={44} height={9} fill="url(#pk-knurl)" opacity="0.7" />
        <rect x={203} y={y - 4.5} width={14} height={9} fill="url(#pk-knurl)" opacity="0.55" />
        <line x1={190} y1={y - 4.5} x2={190} y2={y + 4.5} stroke="#4a4a4a" strokeWidth="0.8" />
        <line x1={230} y1={y - 4.5} x2={230} y2={y + 4.5} stroke="#4a4a4a" strokeWidth="0.8" />
        <rect x={SHAFT_X0 + 2} y={y - 3.4} width={shaftW - 4} height={1.2} rx={0.6} fill="#fff" fillOpacity="0.75" />

        <g mask="url(#pk-oly-mask)">
          <rect className="pk-sheen" x="100" y="80" width="34" height="24" fill="url(#pk-sheen)" opacity="0.6" />
        </g>

        <text x="210" y="118" fill="#9a9a9a" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" letterSpacing="1">
          {formatBarbellLbs(OLYMPIC_BAR_LBS)} LB
        </text>

        <LoadedSleeve side="left" innerX={OLY_LEFT_INNER_X} {...sleeve} />
        <LoadedSleeve side="right" innerX={OLY_RIGHT_INNER_X} {...sleeve} />
      </g>

      <FloatTags tag={floatTag} leftX={50} rightX={370} y={42} />
    </PlateStage>
  );
}

/* ---------- Máquina de remo con soporte en pecho ---------- */

const MACHINE_SLEEVE_Y = 105;

function PlateMachineStage({ plates, leaving, pulse, floatTag, onRemoveOuter }: StageProps) {
  const sleeve = { barY: MACHINE_SLEEVE_Y, sleeveLen: 95, collarW: 8, plates, leaving, onRemoveOuter };

  return (
    <PlateStage pulse={pulse} viewBox="0 0 420 210" className="pk-stage-machine">
      <PlateDefs>
        <linearGradient id="pk-pad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#181818" />
        </linearGradient>
        <linearGradient id="pk-frame" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="50%" stopColor="#444" />
          <stop offset="100%" stopColor="#1c1c1c" />
        </linearGradient>
      </PlateDefs>

      {/* Base y patas */}
      <path d="M 140 196 L 280 196 L 295 186 L 125 186 Z" fill="url(#pk-frame)" stroke="#4a4a4a" strokeWidth="1.5" />
      <rect x="120" y="193" width="22" height="6" rx="1.5" fill="#111" />
      <rect x="278" y="193" width="22" height="6" rx="1.5" fill="#111" />

      {/* Columnas en V */}
      <path d="M 135 188 L 188 95 L 202 95 L 152 188 Z" fill="#2e2e2e" stroke="#4a4a4a" strokeWidth="1.5" />
      <path d="M 285 188 L 232 95 L 218 95 L 268 188 Z" fill="#252525" stroke="#4a4a4a" strokeWidth="1.5" />

      {/* Apoyo de pies */}
      <rect x="150" y="168" width="120" height="8" rx="4" fill="url(#pk-steel)" stroke="#222" strokeWidth="1" />
      <circle cx="154" cy="172" r="3" fill="#ff6b00" />
      <circle cx="266" cy="172" r="3" fill="#ff6b00" />

      {/* Tubos de carga con discos */}
      <g className="pk-rig">
        <LoadedSleeve side="left" innerX={138} {...sleeve} />
        <LoadedSleeve side="right" innerX={282} {...sleeve} />
      </g>

      {/* Asiento */}
      <rect x="198" y="136" width="24" height="52" fill="#1f1f1f" stroke="#4a4a4a" strokeWidth="1.5" />
      <rect x="180" y="126" width="60" height="14" rx="4" fill="url(#pk-pad)" stroke="#666" strokeWidth="1.5" />
      <path d="M 184 133 L 236 133" stroke="#ff6b00" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Columna y soporte de pecho */}
      <path d="M 197 125 L 202 55 L 218 55 L 223 125 Z" fill="#282828" stroke="#4a4a4a" strokeWidth="1.5" />
      <rect x="195" y="40" width="30" height="58" rx="5" fill="url(#pk-pad)" stroke="#ff6b00" strokeWidth="2" />
      <rect x="200" y="46" width="20" height="46" rx="3" fill="none" stroke="#555" strokeWidth="1" />

      {/* Pivote y brazos */}
      <circle cx="210" cy="85" r="9" fill="#1c1c1c" stroke="#ff6b00" strokeWidth="2.5" />
      <circle cx="210" cy="85" r="4" fill="#fff" />
      <path d="M 204 82 L 174 74 L 168 46" stroke="url(#pk-steel)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 216 82 L 246 74 L 252 46" stroke="url(#pk-steel)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

      {/* Manijas */}
      <rect x="163" y="38" width="10" height="24" rx="3" fill="#111" stroke="#ff6b00" strokeWidth="1.5" />
      <rect x="247" y="38" width="10" height="24" rx="3" fill="#111" stroke="#ff6b00" strokeWidth="1.5" />
      {[44, 50, 56].map((gy) => (
        <g key={gy}>
          <line x1="165" y1={gy} x2="171" y2={gy} stroke="#fff" strokeWidth="1.5" />
          <line x1="249" y1={gy} x2="255" y2={gy} stroke="#fff" strokeWidth="1.5" />
        </g>
      ))}

      <FloatTags tag={floatTag} leftX={70} rightX={350} y={40} />
    </PlateStage>
  );
}

export function BarbellPlatePicker(props: Props) {
  const isMachine = isPlateMachineExercise(props.exercise);
  return (
    <PlateLoaderSheet
      {...props}
      equipmentLabel={isMachine ? "Máquina de discos" : "Barra olímpica"}
      hint={
        isMachine
          ? "Máquina con soporte en pecho · discos en lb por lado · se guarda en kg"
          : `Barra ${formatBarbellLbs(OLYMPIC_BAR_LBS)} lb · discos en lb por lado · se guarda en kg`
      }
      baseLbs={getBaseEquipmentLbs(props.exercise)}
      capacity={getSleeveCapacity(props.exercise)}
      manualLabel={isMachine ? "Peso manual (otra máquina)" : "Peso manual (otra barra)"}
      backLabel={isMachine ? "Volver a discos" : "Volver a barra"}
      renderStage={(stage) =>
        isMachine ? <PlateMachineStage {...stage} /> : <OlympicBarStage {...stage} />
      }
    />
  );
}
