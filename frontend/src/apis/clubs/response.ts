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

export interface MascotResponse {
  id: number;
  clubId: number;
  imageUrl: string;
  promptMeta: string;
  createdAt: string;
}

export interface MemberResponse {
  membershipId: number;
  userId: number;
  name: string;
  phone: string;
  email: string;
  gender: string;
  university: string;
  major: string;
  residence: string;
  role: string;
  joinedAtIso: string;
}

export interface ChangeRoleRequest {
  memberId: number;
  role: string;
}

export interface InviteCodeResponse {
  code: string;
}