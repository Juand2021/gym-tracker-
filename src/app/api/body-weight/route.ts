import { NextRequest, NextResponse } from "next/server";
import {
  createBodyWeight,
  deleteBodyWeight,
  listBodyWeight,
} from "@/lib/data";
import { isValidWeight, parseDecimal } from "@/lib/numbers";

export async function GET() {
  try {
    const entries = await listBodyWeight();
    return NextResponse.json({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al listar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      date?: string;
      weightKg?: unknown;
    };
    if (!body.date || body.weightKg == null || body.weightKg === "") {
      return NextResponse.json(
        { error: "Fecha y peso son obligatorios" },
        { status: 400 },
      );
    }

    const weightKg = parseDecimal(body.weightKg);
    if (!isValidWeight(weightKg) || weightKg <= 0) {
      return NextResponse.json(
        { error: "Peso inválido. Usa decimales con punto o coma (ej. 72,5)." },
        { status: 400 },
      );
    }

    const entry = await createBodyWeight({
      date: body.date,
      weightKg,
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id requerido" }, { status: 400 });
    }
    await deleteBodyWeight(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al borrar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
