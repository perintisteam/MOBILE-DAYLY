export type MoneyTransaction = {
  id: number;
  day: string; // YYYY-MM-DD (lokal)
  type: 'income' | 'expense';
  amount: number; // simpan sebagai angka (IDR)
  currency: string;
  category: string;
  note: string;
  imageB64: string | null;
  createdAt: number;
  updatedAt: number;
};
