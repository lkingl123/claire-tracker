export type SleepKind = "nap" | "night";

export interface Sleep {
  id: string;
  kind: SleepKind;
  started_at: string;
  ended_at: string | null; // null = still asleep
  notes: string | null;
  created_at: string;
}
