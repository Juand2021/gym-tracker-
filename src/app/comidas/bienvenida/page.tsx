"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { NvIcon, type IconName } from "@/components/nutriverse/NvIcon";
import { NvLeaves } from "@/components/nutriverse/NvLogo";
import { openChatWith } from "@/components/nutriverse/data";

const STEPS: { icon: IconName | null; title: string; text: string }[] = [
  { icon: null, title: "Bienvenido a NutriVerse", text: "Comida real. Vida mejor. Te digo cuánto y qué comer según tu cuerpo y tu objetivo." },
  { icon: "chat", title: "Registra hablando", text: "Escribe lo que comiste como lo dirías: “almorcé un corrientazo con jugo”. Yo calculo y te pregunto antes de guardar." },
  { icon: "shield", title: "Tus datos son tuyos", text: "Tus comidas se guardan en tu cuenta y solo se ven con tu PIN. No pedimos ubicación ni fotos." },
];

export default function NutriVerseWelcome() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const touch = useRef<number | null>(null);

  const finish = () => {
    try {
      localStorage.setItem("nv:welcomed", "1");
    } catch {
      // sin almacenamiento
    }
    openChatWith("Hola, quiero configurar mi perfil", true);
    router.push("/comidas/chat");
  };
  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish());
  const s = STEPS[step];

  return (
    <div
      className="nv-welcome"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (dx < -50) next();
        else if (dx > 50 && step > 0) setStep(step - 1);
      }}
    >
      <button type="button" className="nv-welcome-skip nv-press" onClick={finish}>
        Saltar
      </button>
      <div key={step} className="nv-welcome-step">
        <span className="nv-welcome-art nv-glass is-thick">
          {s.icon ? <NvIcon name={s.icon} size={88} /> : <NvLeaves size={104} animated />}
        </span>
        {step === 0 ? (
          <p className="nv-welcome-brand">
            Nutri<span>Verse</span>
          </p>
        ) : null}
        <h1 className="nv-title">{s.title}</h1>
        <p className="nv-welcome-text">{s.text}</p>
      </div>
      <div className="nv-welcome-foot">
        <div className="nv-dots" aria-label={`Paso ${step + 1} de ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <button key={i} type="button" className={i === step ? "is-on" : ""} onClick={() => setStep(i)} aria-label={`Ir al paso ${i + 1}`} />
          ))}
        </div>
        <button type="button" className="nv-btn nv-glass is-green nv-press nv-block is-big" onClick={next}>
          {step < STEPS.length - 1 ? "Siguiente" : "Configurar mi perfil"}
        </button>
      </div>
    </div>
  );
}
