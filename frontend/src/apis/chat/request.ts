export type VoteCreateApiRequest = {
  title: string;
  description?: string;
  endsAt: string;              // LocalDateTime 문자열 (마지막 Z 제거)
  multiSelect: boolean;
  options: { text: string }[]; // 백엔드 요구 형태
};

/** UI -> API payload 매퍼 */
export function toVoteCreateApiRequest(ui: {
  title: string;
  description?: string;
  allowMultiple: boolean;
  deadline: string;   // ISO8601 (보통 Z 포함)
  options: string[];
}): VoteCreateApiRequest {
  return {
    title: ui.title,
    description: ui.description || undefined,
    endsAt: ui.deadline.replace(/Z$/,''),
    multiSelect: ui.allowMultiple,
    options: ui.options.map(text => ({ text })),
  };
}