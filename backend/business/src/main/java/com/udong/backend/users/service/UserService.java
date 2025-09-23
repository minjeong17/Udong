package com.udong.backend.users.service;

import com.udong.backend.global.config.AccountCrypto;
import com.udong.backend.fin.client.FinApiClient;
import com.udong.backend.users.dto.SignUpRequest;
import com.udong.backend.users.entity.User;
import com.udong.backend.users.entity.UserAvailability;
import com.udong.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalTime;

@RequiredArgsConstructor
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountCrypto accountCrypto;
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RND = new SecureRandom();
    private final FinApiClient finApiClient;

    @Transactional
    public void signUp(SignUpRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다.");
        }

        // 1) 계좌 암호화 (기존)
        String normalized = accountCrypto.normalize(req.getAccount());
        if (normalized.length() < 8) throw new IllegalArgumentException("계좌번호 형식이 올바르지 않습니다.");
        String accountCipher = accountCrypto.encrypt(normalized);
        short keyVer = (short) accountCrypto.keyVersion();

        // 2) 외부 API로 userKey 가져오기 → 검증 → 암호화
        String plainUserKey = finApiClient.fetchUserKeyByEmail(req.getEmail());         // ★ 아래 private 메서드

        String userKeyCipher = accountCrypto.encrypt(plainUserKey);        // 계좌와 동일한 암호화기/키버전

        // 3) 엔티티 생성/저장
        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .name(req.getName())
                .university(req.getUniversity())
                .major(req.getMajor())
                .residence(req.getResidence())
                .phone(req.getPhone())
                .gender(User.Gender.valueOf(req.getGender()))
                .accountCipher(accountCipher)
                .accountKeyVer(keyVer)     // 계좌 + userKey 공용 버전
                .userKeyCipher(userKeyCipher)
                .build();

        if (req.getAvailability() != null) {
            for (var a : req.getAvailability()) {
                UserAvailability ua = UserAvailability.builder()
                        .dayOfWeek(a.getDayOfWeek())
                        .startTime(LocalTime.parse(a.getStartTime()))
                        .endTime(LocalTime.parse(a.getEndTime()))
                        .build();
                user.addAvailability(ua);
            }
        }

        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user_not_found"));

        // JPA cascade/orphanRemoval이 먹도록 '엔티티 삭제'로 처리
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public AccountInfo getDecryptedAccountInfo(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

        String decryptedAccount = accountCrypto.decrypt(user.getAccountCipher());

        return AccountInfo.builder()
                .bankName("한국은행")
                .accountNumber(decryptedAccount)
                .build();
    }

    @Transactional
    public void updateAccount(Integer userId, String newAccountNumber) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

        // 1. 현재 사용자의 userKey 복호화
        String currentUserKey = accountCrypto.decrypt(user.getUserKeyCipher());

        // 2. 이메일로 외부 API에서 userKey 가져와서 검증
        String fetchedUserKey = finApiClient.fetchUserKeyByEmail(user.getEmail());

        if (!currentUserKey.equals(fetchedUserKey)) {
            throw new IllegalArgumentException("사용자 인증에 실패했습니다. 계좌를 변경할 수 없습니다.");
        }

        // 3. 계좌번호 유효성 검증
        if (!finApiClient.validateAccount(currentUserKey, newAccountNumber)) {
            throw new IllegalArgumentException("유효하지 않은 계좌번호입니다. 존재하는 계좌번호를 입력해주세요.");
        }

        // 4. 검증 통과 후 signup과 동일한 암호화 로직
        String normalized = accountCrypto.normalize(newAccountNumber);
        if (normalized.length() < 8) throw new IllegalArgumentException("계좌번호 형식이 올바르지 않습니다.");
        String accountCipher = accountCrypto.encrypt(normalized);
        short keyVer = (short) accountCrypto.keyVersion();

        user.updateAccount(accountCipher, keyVer);
        userRepository.save(user);
    }

    public static class AccountInfo {
        private String bankName;
        private String accountNumber;

        public AccountInfo(String bankName, String accountNumber) {
            this.bankName = bankName;
            this.accountNumber = accountNumber;
        }

        public static AccountInfoBuilder builder() {
            return new AccountInfoBuilder();
        }

        public String getBankName() {
            return bankName;
        }

        public String getAccountNumber() {
            return accountNumber;
        }

        public static class AccountInfoBuilder {
            private String bankName;
            private String accountNumber;

            public AccountInfoBuilder bankName(String bankName) {
                this.bankName = bankName;
                return this;
            }

            public AccountInfoBuilder accountNumber(String accountNumber) {
                this.accountNumber = accountNumber;
                return this;
            }

            public AccountInfo build() {
                return new AccountInfo(bankName, accountNumber);
            }
        }
    }

    private String generateCode() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) sb.append(CODE_CHARS.charAt(RND.nextInt(CODE_CHARS.length())));
        return sb.toString();
    }
}
