package com.udong.backend.clubs.service;

import com.udong.backend.clubs.crypto.AccountCrypto;
import com.udong.backend.clubs.entity.Club;
import com.udong.backend.clubs.repository.ClubRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Service @RequiredArgsConstructor
public class ClubService {
    private final ClubRepository clubs;
    private final AccountCrypto accountCrypto;        // ✅ 추가
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RND = new SecureRandom();

    @Transactional
    public Club create(String name, String category, String description, Integer leaderUserId, String accountNumber) {
        if (clubs.existsByName(name)) throw new IllegalArgumentException("동아리명이 이미 존재합니다");

        // 계좌 정규화 + 최소 길이 검증
        String normalized = accountCrypto.normalize(accountNumber);
        if (normalized.length() < 8) throw new IllegalArgumentException("계좌번호 형식이 올바르지 않습니다");

        String code = generateCode();
        String cipher = accountCrypto.encrypt(normalized);

        Club c = Club.builder()
                .name(name).category(category).description(description)
                .codeUrl(code).leaderUserId(leaderUserId)
                .accountCipher(cipher)
                .accountKeyVer((short) accountCrypto.keyVersion())
                .build();
        return clubs.save(c);
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
}
