"use client";

import { formatBarbellLbs } from "@/lib/barbell-plates";
import { EZ_BAR_LBS, EZ_SLEEVE_CAPACITY } from "@/lib/ez-bar-rack";
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

// Geometría del SVG (viewBox recortado a y 28–182).
const BAR_Y = 92;
const LEFT_INNER_X = 106;
const RIGHT_INNER_X = 314;
const SLEEVE_LEN = EZ_SLEEVE_CAPACITY + 8;

/** Eje de la barra Z: rectas junto a los collares y doble curva en "W" al centro. */
const EZ_SHAFT =
  "M116 92 L132 92 C140 92 144 78 152 78 C160 78 168 104 176 104 " +
  "C184 104 188 92 196 92 L224 92 C232 92 236 104 244 104 " +
  "C252 104 260 78 268 78 C276 78 280 92 288 92 L304 92";
const EZ_GRIP_LEFT = "M152 78 C160 78 168 104 176 104";
const EZ_GRIP_RIGHT = "M244 104 C252 104 260 78 268 78";

function EzBarStage({ plates, leaving, pulse, sideLbs, floatTag, onRemoveOuter }: StageProps) {
  const flex = flexForLoad(sideLbs, 3, 180);
  const sleeve = { barY: BAR_Y, sleeveLen: SLEEVE_LEN, plates, leaving, flexDeg: flex, onRemoveOuter };

  return (
    <PlateStage pulse={pulse} viewBox="0 28 420 154">
      <PlateDefs>
        <mask id="pk-ez-mask">
          <path d={EZ_SHAFT} stroke="#fff" strokeWidth="8" strokeLinecap="round" />
        </mask>
      </PlateDefs>

      <FloorShadow cx={210} cy={166} sideLbs={sideLbs} baseRx={120} />

      <g className="pk-rig">
        {/* Eje en W: sombra, borde, cromo, brillo y moleteado */}
        <path d={EZ_SHAFT} stroke="#000" strokeOpacity="0.5" strokeWidth="10" strokeLinecap="round" transform="translate(0 3)" />
        <path d={EZ_SHAFT} stroke="#4a4a4a" strokeWidth="9" strokeLinecap="round" />
        <path d={EZ_SHAFT} stroke="#cfcfcf" strokeWidth="7" strokeLinecap="round" />
        <path d={EZ_SHAFT} stroke="#8d8d8d" strokeWidth="2.2" strokeLinecap="round" transform="translate(0 2.2)" />
        <path d={EZ_SHAFT} stroke="#fff" strokeOpacity="0.95" strokeWidth="1.6" strokeLinecap="round" transform="translate(0 -1.8)" />
        <path d={EZ_GRIP_LEFT} stroke="#2a2a2a" strokeOpacity="0.4" strokeWidth="5" strokeDasharray="0.7 1.7" />
        <path d={EZ_GRIP_RIGHT} stroke="#2a2a2a" strokeOpacity="0.4" strokeWidth="5" strokeDasharray="0.7 1.7" />

        <g mask="url(#pk-ez-mask)">
          <rect className="pk-sheen" x="90" y="70" width="34" height="44" fill="url(#pk-sheen)" opacity="0.55" />
        </g>

        <rect x="202" y="87" width="16" height="10" rx="2.5" fill="url(#pk-collar)" stroke="#fff" strokeWidth="0.8" />
        <text x="210" y="94.6" fill="#fff" fontSize="6.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
          EZ
        </text>
        <text x="210" y="122" fill="#9a9a9a" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" letterSpacing="1">
          {formatBarbellLbs(EZ_BAR_LBS)} LB
        </text>

        <LoadedSleeve side="left" innerX={LEFT_INNER_X} {...sleeve} />
        <LoadedSleeve side="right" innerX={RIGHT_INNER_X} {...sleeve} />
      </g>

      <FloatTags tag={floatTag} leftX={60} rightX={360} y={42} />
    </PlateStage>
  );
}

export function EzBarPlatePicker(props: Props) {
  return (
    <PlateLoaderSheet
      {...props}
      equipmentLabel="Barra Z"
      hint={`Barra Z ${formatBarbellLbs(EZ_BAR_LBS)} lb · discos en lb por lado · se guarda en kg`}
      baseLbs={EZ_BAR_LBS}
      capacity={EZ_SLEEVE_CAPACITY}
      manualLabel="Peso manual (otra barra)"
      backLabel="Volver a barra Z"
      renderStage={(stage) => <EzBarStage {...stage} />}
    />
  );
}
