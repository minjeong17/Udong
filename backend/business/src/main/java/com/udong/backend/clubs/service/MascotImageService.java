package com.udong.backend.clubs.service;

import com.udong.backend.clubs.external.gms.GmsImageClient;
import com.udong.backend.global.s3.S3Uploader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class MascotImageService {

    private final GmsImageClient gms;
    private final S3Uploader s3Uploader;

    // HTTP 다운로드용 (GMS가 url을 줄 때)
    private final OkHttpClient http = new OkHttpClient();

    @Value("${app.gms.fail-on-error:false}")
    private boolean failOnError;

    @Value("${app.gms.enabled:true}")
    private boolean gmsEnabled;

    @Value("${app.mascot.prompt-template:Create an ultra-cute baby animal mascot in a Pixar-inspired 3D style that represents a {{club category}} club.\n" +
            "Make the character friendly and expressive with big sparkling eyes, soft rounded body, and playful details.\n" +
            "The animal should be designed as a charming companion, not realistic but stylized, emphasizing warmth and approachability. \n" +
            "Full-body, centered composition, soft studio lighting, high detail, clean silhouette. Plain light (or transparent) background.\n" +
            "No extra text or watermarks anywhere in the image. Generate exactly ONE character.}")
    private String tpl;

    // 공개 URL 생성 시 보조 (CDN > S3_BASE > S3 region URL)
    @Value("${CLOUDFRONT_DOMAIN:}") private String cdn;
    @Value("${S3_PUBLIC_BASE_URL:}") private String s3Base;
    @Value("${S3_BUCKET}") private String bucket;
    @Value("${AWS_REGION}") private String region;
    @Value("${S3_PREFIX_CLUBS:clubs}") private String keyPrefix; // ← 너가 선택한 'clubs'

    public record Result(String imageUrl, String s3Key, String promptUsed) {}

    /** clubId가 있으면 키에 반영됨. 기존 시그니처 유지하고 싶으면 아래 오버로드 호출해도 됨. */
    public Result reroll(String clubCategory) {
        return reroll(clubCategory, null);
    }

    public Result reroll(String clubCategory, Integer clubId /* null이면 general로 저장 */) {
        String prompt = tpl.replace("{{club category}}", clubCategory == null ? "" : clubCategory);

        if (!gmsEnabled) {
            return new Result(null, null, prompt);
        }

        byte[] png = null;

        // 1) Imagen 경로: Base64 → bytes (IMAGEN_ENDPOINT 설정되어 있고 generateBytes가 동작하면 여기서 끝)
        try {
            var bytesOpt = gms.generateBytes(prompt);
            if (bytesOpt.isPresent()) {
                png = bytesOpt.get();
            }
        } catch (Exception e) {
            log.warn("[MascotImageService] Imagen generateBytes failed: {}", e.toString());
        }

        // 2) 폴백: DALL·E 경로 (URL 받아서 다운로드 → bytes)
        if (png == null) {
            try {
                var urlOpt = gms.generateUrl(prompt);
                if (urlOpt.isPresent()) {
                    String genUrl = urlOpt.get();
                    png = download(genUrl);
                }
            } catch (Exception e) {
                log.warn("[MascotImageService] DALL·E generateUrl failed: {}", e.toString());
            }
        }

        // 3) 최종 실패 처리
        if (png == null) {
            if (failOnError) throw new IllegalStateException("GMS 이미지 생성 실패");
            return new Result(null, null, prompt);
        }

        // 4) S3 키 생성: clubs/{clubId or general}/mascots/{ULID}.png
        String ulid = com.github.f4b6a3.ulid.UlidCreator.getMonotonicUlid().toString().toLowerCase();
        String clubPart = (clubId == null) ? "general" : String.valueOf(clubId);
        String key = String.format("%s/%s/mascots/%s.png", keyPrefix, clubPart, ulid);

        // 5) 업로드 (putPng는 bytes만 받으면 됨)
        String publicUrl = s3Uploader.putPng(png, key);

        // 6) 리턴
        return new Result(publicUrl, key, prompt);
    }


    private byte[] download(String url) {
        try (var res = http.newCall(new Request.Builder().url(url).build()).execute()) {
            if (!res.isSuccessful()) throw new IllegalStateException("image download failed: " + res.code());
            return Objects.requireNonNull(res.body()).bytes();
        } catch (Exception e) {
            throw new IllegalStateException("image download io error", e);
        }
    }
}
