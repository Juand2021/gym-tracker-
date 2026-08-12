import type { ArmFocus, DayType } from "@/lib/routines";

export type WorkoutSet = {
  id: string;
  exercise: string;
  weightKg: number;
  reps: number;
  setNumber: number;
  /** Posición global en la sesión (0 = primer set del día). */
  orderIndex?: number;
};

export type Workout = {
  id: string;
  date: string;
  notes: string;
  createdAt: string;
  dayType?: DayType | null;
  armFocus?: ArmFocus | null;
  sets: WorkoutSet[];
};

export type BodyWeightEntry = {
  id: string;
  date: string;
  weightKg: number;
};

export type WorkoutSetInput = {
  exercise: string;
  weightKg: number;
  reps: number;
  setNumber: number;
  orderIndex?: number;
};

export type CreateWorkoutInput = {
  date: string;
  notes?: string;
  dayType?: DayType | null;
  armFocus?: ArmFocus | null;
  sets: WorkoutSetInput[];
};

export type UpdateWorkoutInput = {
  date: string;
  notes?: string;
  dayType?: DayType | null;
  armFocus?: ArmFocus | null;
  sets: WorkoutSetInput[];
};

export type CreateBodyWeightInput = {
  date: string;
  weightKg: number;
};
