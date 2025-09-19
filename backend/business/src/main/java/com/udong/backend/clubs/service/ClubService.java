package com.udong.backend.clubs.service;

import com.udong.backend.chat.dto.CreateRoomRequest;
import com.udong.backend.chat.service.ChatRoomService;
import com.udong.backend.clubs.dto.MascotCreateReq;
import com.udong.backend.clubs.entity.Club;
import com.udong.backend.clubs.entity.Membership;
import com.udong.backend.clubs.repository.ClubRepository;
import com.udong.backend.clubs.repository.MembershipRepository;
import com.udong.backend.codes.entity.CodeDetail;
import com.udong.backend.codes.repository.CodeDetailRepository;
import com.udong.backend.global.config.AccountCrypto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service @RequiredArgsConstructor
public class ClubService {
    private final ClubRepository clubs;
    private final AccountCrypto accountCrypto;        // ✅ 추가
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RND = new SecureRandom();

    private final CodeDetailRepository codeDetails;
    private final MembershipRepository membershipRepository;
    private final MascotService mascotService;
    private final ChatRoomService chatRoomService;

    private final String GLOBAL_CODE = "GLOBAL";
    private final String GLOBAL_CHATROOM_NAME = "전체 채팅방";

    @Transactional
    public Club create(String name, String category, String description,
                       Integer leaderUserId, String accountNumber) {

        if (clubs.existsByName(name)) throw new IllegalArgumentException("동아리명이 이미 존재합니다");

        String normalized = accountCrypto.normalize(accountNumber);
        if (normalized.length() < 8) throw new IllegalArgumentException("계좌번호 형식이 올바르지 않습니다");

        String code = generateCode();
        String cipher = accountCrypto.encrypt(normalized);

        Club saved = clubs.save(
                Club.builder()
                        .name(name).category(category).description(description)
                        .codeUrl(code).leaderUserId(leaderUserId)
                        .accountCipher(cipher)
                        .accountKeyVer((short) accountCrypto.keyVersion())
                        .build()
        );

        // ✅ LEADER 코드 존재 검증 (group_name = 'memberships')
        codeDetails.findByCodeGroup_GroupNameAndCodeName("memberships", "LEADER")
                .orElseThrow(() -> new IllegalStateException("공통코드(memberships/LEADER)가 없습니다"));

        // 리더 멤버십 자동 등록
        memberships.save(
                Membership.builder()
                        .club(saved)
                        .userId(leaderUserId)
                        .roleCode("LEADER")   // 문자열 코드 저장
                        .build()
        );

        mascotService.reroll(saved.getId(),new MascotCreateReq(saved.getCategory(), null));

        chatRoomService.create(saved.getLeaderUserId(),new CreateRoomRequest(GLOBAL_CODE,saved.getId(),GLOBAL_CHATROOM_NAME));

        return saved;
    }



    @Transactional(readOnly = true)
    public Club get(Integer id) { return clubs.findById(id).orElseThrow(() -> new IllegalArgumentException("동아리를 찾을 수 없습니다")); }

    @Transactional
    public Club update(Integer id, String name, String category, String description) {
        Club c = get(id);
        if (name != null) c.setName(name);
        if (category != null) c.setCategory(category);
        if (description != null) c.setDescription(description);
        return c;
    }

    @Transactional
    public void delete(Integer id) { clubs.delete(get(id)); }

    @Transactional
    public String reissueInviteCode(Integer id) {
        Club c = get(id);
        c.setCodeUrl(generateCode());
        return c.getCodeUrl();
    }

    private String generateCode() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) sb.append(CODE_CHARS.charAt(RND.nextInt(CODE_CHARS.length())));
        return sb.toString();
    }

    // ✅ 조회용: 마스킹된 계좌 반환
    @Transactional(readOnly = true)
    public String getMaskedAccount(Integer clubId) {
        Club c = get(clubId);
        if (c.getAccountCipher() == null || c.getAccountCipher().isBlank()) return null;
        String plain = accountCrypto.decrypt(c.getAccountCipher());
        return accountCrypto.mask(plain);
    }

    private final MembershipRepository memberships;

    @Transactional
    public Membership joinByCode(String rawCode, Integer userId) {
        String code = rawCode.trim().toUpperCase(Locale.ROOT);

        Club club = clubs.findByCodeUrl(code)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 초대코드입니다."));

        if (memberships.existsByUserIdAndClub_Id(userId, club.getId())) {
            throw new IllegalStateException("이미 가입된 동아리입니다.");
        }

        // ✅ 공통코드에서 MEMBERSHIPS::MEMBER 검증
        CodeDetail memberCode = codeDetails.findById("MEMBER")
                .filter(cd -> cd.getCodeGroup().getGroupName().equals("memberships"))
                .orElseThrow(() -> new IllegalStateException("회원 역할 코드가 유효하지 않습니다."));

        Membership m = Membership.builder()
                .userId(userId)
                .club(club)
                .roleCode(memberCode.getCodeName())   // "MEMBER"
                .build();
        return memberships.save(m);
    }

    /** ISO8601(Z) 포맷 문자열로 */
    public static String toIsoZ(java.time.OffsetDateTime odt) {
        return odt.toInstant().toString(); // 예: 2025-09-10T09:00:00Z
    }

    @Transactional(readOnly = true)
    public List<Club> getClubsByUserId(Integer userId) {
        List<Membership> memberships = membershipRepository.findByUserIdFetchClub(userId);
        return memberships.stream()
                .map(Membership::getClub)
                .toList();
    }

    public static String toIsoKST(java.time.LocalDateTime dt) {
        return dt.atZone(java.time.ZoneId.of("Asia/Seoul"))
                .format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }
}
