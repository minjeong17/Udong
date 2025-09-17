package com.udong.backend.clubs.crypto;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

@Component
@RequiredArgsConstructor
public class AccountCrypto {

    @Value("${app.crypto.aes256_key_b64}")
    private String keyB64;

    @Value("${app.crypto.key_version:1}")
    private int keyVersion;

    private byte[] key;
    private static final SecureRandom RND = new SecureRandom();

    @PostConstruct
    void init() {
        if (keyB64 == null || keyB64.isBlank()) {
            throw new IllegalStateException("APP_AES_KEY_B64 not set");
        }
        key = Base64.getDecoder().decode(keyB64.trim());
        if (key.length != 32) throw new IllegalStateException("AES-256 key must be 32 bytes");
    }

    /** 계좌번호 -> 암호문(버전 프리픽스 포함) */
    public String encrypt(String accountPlain) {
        try {
            byte[] iv = new byte[12];
            RND.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            GCMParameterSpec spec = new GCMParameterSpec(128, iv);
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), spec);
            byte[] ct = cipher.doFinal(accountPlain.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            // 저장 포맷: v{ver}:{base64(iv|ct)}
            byte[] payload = new byte[iv.length + ct.length];
            System.arraycopy(iv, 0, payload, 0, iv.length);
            System.arraycopy(ct, 0, payload, iv.length, ct.length);
            return "v" + keyVersion + ":" + Base64.getEncoder().encodeToString(payload);
        } catch (Exception e) {
            throw new IllegalStateException("Encrypt failed", e);
        }
    }

    /** 암호문 -> 평문 (마스킹/검증용) */
    public String decrypt(String cipherText) {
        try {
            String[] parts = cipherText.split(":", 2);
            String b64 = parts.length == 2 ? parts[1] : parts[0];
            byte[] payload = Base64.getDecoder().decode(b64);
            byte[] iv = java.util.Arrays.copyOfRange(payload, 0, 12);
            byte[] ct = java.util.Arrays.copyOfRange(payload, 12, payload.length);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, iv));
            byte[] pt = cipher.doFinal(ct);
            return new String(pt, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Decrypt failed", e);
        }
    }

    /** 123-456-789012 -> ****-**-9012 형식 마스킹 */
    public String mask(String plain) {
        if (plain == null) return null;
        String digits = plain.replaceAll("\\D", "");
        if (digits.length() <= 4) return "****";
        String last4 = digits.substring(digits.length() - 4);
        return "****-**-" + last4;
    }

    /** 입력 계좌 문자열 정규화(숫자만) */
    public String normalize(String input) {
        return input == null ? "" : input.replaceAll("\\D", "");
    }

    public int keyVersion() { return keyVersion; }
}

