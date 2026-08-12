import { NextRequest, NextResponse } from "next/server";
import { createWorkout, listWorkouts } from "@/lib/data";
import {
  isValidReps,
  isValidWeight,
  parseDecimal,
} from "@/lib/numbers";
import type { CreateWorkoutInput } from "@/lib/types";

export async function GET() {
  try {
    const workouts = await listWorkouts();
    return NextResponse.json({ workouts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al listar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateWorkoutInput;
    if (!body.date || !Array.isArray(body.sets) || body.sets.length === 0) {
      return NextResponse.json(
        { error: "Fecha y al menos una serie son obligatorios" },
        { status: 400 },
      );
    }

    const sets = body.sets.map((set) => {
      const weightKg = parseDecimal(set.weightKg);
      const reps = parseDecimal(set.reps);
      const setNumber = parseDecimal(set.setNumber);
      if (!set.exercise?.trim()) {
        throw new Error("Cada serie necesita un ejercicio");
      }
      if (!isValidWeight(weightKg)) {
        throw new Error(`Peso inválido en ${set.exercise.trim()}`);
      }
      if (!isValidReps(reps)) {
        throw new Error(`Reps inválidas en ${set.exercise.trim()}`);
      }
      return {
        exercise: set.exercise.trim(),
        weightKg,
        reps,
        setNumber: Number.isFinite(setNumber) && setNumber > 0 ? setNumber : 1,
      };
    });

    const workout = await createWorkout({
      date: body.date,
      notes: body.notes ?? "",
      dayType: body.dayType ?? null,
      armFocus: body.armFocus ?? null,
      sets,
    });

    return NextResponse.json({ workout }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear";
    const status = message.includes("inválid") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
