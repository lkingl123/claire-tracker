// A nap. Stored in the `sleeps` table (kind is always "nap").
// She logs minutes; we save it as ended_at = when she woke, started_at = ended_at - minutes.
export interface Nap {
  id: string;
  started_at: string;
  ended_at: string;
  notes: string | null;
  created_at: string;
}
