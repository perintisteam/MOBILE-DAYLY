export type Note = {
  id: number;
  day: string; // YYYY-MM-DD (lokal)
  title: string;
  body: string;
  imageB64: string | null;
  createdAt: number;
  updatedAt: number;
};
