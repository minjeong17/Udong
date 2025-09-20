export interface ClubCreateResponse {
  id: number;
  name: string;
  category: string;
  description: string;
  codeUrl: string;
  activeMascotId: number | null;
  accountMasked: string;
}

export interface ClubListResponse {
  id: number;
  name: string;
  category: string;
  description: string;
  codeUrl: string;
  activeMascotId: number | null;
  masUrl: string | null;
  joinedAt: string;
  myRole: string;
}