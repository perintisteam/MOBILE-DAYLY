export type UserProfile = {
  id: 1; // single-profile app
  name: string;
  bio: string;
  imageB64: string | null;
  birthday: string | null; // YYYY-MM-DD (YYYY local, but compare only month/day)
  updatedAt: number;
};
