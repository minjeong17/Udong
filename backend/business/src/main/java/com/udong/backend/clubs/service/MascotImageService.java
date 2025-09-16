package com.udong.backend.clubs.service;

import com.udong.backend.clubs.external.gms.GmsImageClient;
import com.udong.backend.clubs.s3.S3Uploader;
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

    @Value("${app.mascot.prompt-template:Create an ultra-cute baby character in a Pixar-inspired 3D style that represents a {{club category}} club.\n" +
            "Make the character charming and friendly with big expressive eyes and soft rounded shapes.\n" +
            "Full-body, centered composition, soft studio lighting, high detail, clean silhouette. Plain light (or transparent) background.\n" +
            "No extra text or watermarks anywhere in the image. Generate exactly ONE character.}")
    private String tpl;

    // 공개 URL 생성 시 보조 (CDN > S3_BASE > S3 region URL)
    @Value("${CLOUDFRONT_DOMAIN:}") private String cdn;
    @Value("${S3_PUBLIC_BASE_URL:}") private String s3Base;
    @Value("${S3_BUCKET}") private String bucket;
    @Value("${AWS_REGION}") private String region;
    @Value("${S3_KEY_PREFIX:clubs}") private String keyPrefix; // ← 너가 선택한 'clubs'

    public record Result(String imageUrl, String s3Key, String promptUsed) {}

    /** clubId가 있으면 키에 반영됨. 기존 시그니처 유지하고 싶으면 아래 오버로드 호출해도 됨. */
    public Result reroll(String clubCategory) {
        return reroll(clubCategory, null);
    }

    public Result reroll(String clubCategory, Integer clubId /* null이면 general로 저장 */) {
        String prompt = tpl.replace("{{club category}}", clubCategory == null ? "" : clubCategory);

        // 1) GMS에서 이미지 URL 생성
        String genUrl = null;
        if (gmsEnabled) {
            var urlOpt = gms.generateUrl(prompt);
            if (urlOpt.isPresent()) {
                genUrl = urlOpt.get();
            } else if (failOnError) {
                throw new IllegalStateException("GMS 이미지 생성 실패");
            } else {
                // gms disabled or failed → 아래서 prompt만 반환
            }
        }
        if (genUrl == null) {
            return new Result(null, null, prompt);
        }

        // 2) 원격 URL → 바이트 다운로드
        byte[] png = download(genUrl);

        // 3) S3 키 생성: clubs/{clubId or general}/mascots/{ULID}.png
        String ulid = com.github.f4b6a3.ulid.UlidCreator.getMonotonicUlid().toString().toLowerCase();
        String clubPart = (clubId == null) ? "general" : String.valueOf(clubId);
        String key = String.format("%s/%s/mascots/%s.png", keyPrefix, clubPart, ulid);

        // 4) 업로드 (버킷 공개/CloudFront 설정은 인프라/정책에서)
        String publicUrl = s3Uploader.putPng(png, key);

        // 5) S3(or CDN) URL + s3Key + prompt 반환
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
