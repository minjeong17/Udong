export interface ClubCreateResponse {
  id: number;
  name: string;
  category: string;
  description: string;
  codeUrl: string;
  activeMascotId: number | null;
  accountMasked: string;
}