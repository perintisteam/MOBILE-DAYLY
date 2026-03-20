export type Activity = {
  id: number;
  day: string; // YYYY-MM-DD (lokal)
  title: string;
  description: string;
  imageB64: string | null;
  createdAt: number;
  updatedAt: number;
};
