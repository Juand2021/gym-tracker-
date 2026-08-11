import { NextRequest, NextResponse } from "next/server";
import { createWorkout, listWorkouts } from "@/lib/data";
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

    const workout = await createWorkout({
      date: body.date,
      notes: body.notes ?? "",
      dayType: body.dayType ?? null,
      armFocus: body.armFocus ?? null,
      sets: body.sets.map((set) => ({
        exercise: set.exercise.trim(),
        weightKg: Number(set.weightKg),
        reps: Number(set.reps),
        setNumber: Number(set.setNumber),
      })),
    });

    return NextResponse.json({ workout }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
