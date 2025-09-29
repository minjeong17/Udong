export function parseJwt(token: string) {
  try {
    const base64 = token.split(".")[1];
    const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(normalized)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** 각 프로젝트 토큰 클레임 키에 맞춰 userId 읽기 (예: sub 또는 userId) */
export function getUserIdFromToken(token: string | null): number | null {
  if (!token) return null;
  const payload = parseJwt(token);
  if (!payload) return null;

  // 백엔드가 어떤 클레임을 쓰는지에 맞춰 두 가지 모두 지원
  const v = (payload["userId"] ?? payload["sub"]) as string | number | undefined;
  if (v == null) return null;

  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}
