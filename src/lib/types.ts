export interface Feeding {
  id: string;
  type: "bottle" | "breast_snack";
  amount_ml: number | null;
  duration_minutes: number | null;
  notes: string | null;
  fed_at: string;
  created_at: string;
}

export interface Diaper {
  id: string;
  type: "wet" | "dirty" | "both";
  notes: string | null;
  changed_at: string;
  created_at: string;
}
