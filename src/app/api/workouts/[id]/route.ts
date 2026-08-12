import { NextRequest, NextResponse } from "next/server";
import { deleteWorkout, getWorkout, updateWorkout } from "@/lib/data";
import {
  isValidReps,
  isValidWeight,
  parseDecimal,
} from "@/lib/numbers";
import type { UpdateWorkoutInput } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const workout = await getWorkout(id);
    if (!workout) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ workout });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateWorkoutInput;

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

    const workout = await updateWorkout(id, {
      date: body.date,
      notes: body.notes ?? "",
      dayType: body.dayType ?? null,
      armFocus: body.armFocus ?? null,
      sets,
    });

    return NextResponse.json({ workout });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar";
    const status =
      message === "No encontrado"
        ? 404
        : message.includes("demostración") || message.includes("inválid")
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await deleteWorkout(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    const status = message.includes("demostración") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
