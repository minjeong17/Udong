package com.udong.backend.clubs.external.gms;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.jetbrains.annotations.Nullable;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class GmsImageClient {

    private final OkHttpClient http = new OkHttpClient.Builder()
            .callTimeout(java.time.Duration.ofSeconds(30))
            .connectTimeout(java.time.Duration.ofSeconds(10))
            .readTimeout(java.time.Duration.ofSeconds(30))
            .build();

    @Value("${GMS_KEY}")
    private String gmsKey;                  // ★ Bearer 포함 (DALL·E 전용)

    @Value("${DALLE_ENDPOINT}")
    private String dalleEndpoint;           // ★ 완전 URL (…/api.openai.com/v1/images/generations)

    // ====== [추가] Imagen 전용 ENV ======
    @Value("${IMAGEN_ENDPOINT:}")           // 예) https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=XXXX
    private String imagenEndpoint;          // ★ 완전 URL (?key=...까지 포함)

    @Value("${app.gms.sample-count:1}")     // Imagen 동시 샘플 수
    private int sampleCount;
    // ====================================

    @Value("${app.gms.model:dall-e-3}")
    private String model;

    @Value("${app.gms.size:1024x1024}")
    private String size;

    public Optional<String> generateUrl(String prompt) {
        String payload = """
                {
                  "model": %s,
                  "prompt": %s,
                  "size": %s,
                  "response_format": "url"
                }
                """.formatted(
                json(model),
                json(prompt),
                json(size)
        );

        okhttp3.MediaType json = okhttp3.MediaType.get("application/json");

        RequestBody body = RequestBody.create(payload, json);

        Request req = new Request.Builder()
                .url(dalleEndpoint)                       // ★ 완전 URL 그대로
                .header("Authorization", gmsKey)          // ★ Bearer 포함 그대로
                .post(body)
                .build();

        try (Response res = http.newCall(req).execute()) {
            String resBody = res.body() != null ? res.body().string() : null;

            log.info("[GMS] POST {}  --> status={}", dalleEndpoint, res.code());
            if (!res.isSuccessful()) {
                log.error("[GMS->OpenAI] status={} body={}", res.code(), resBody);
                return Optional.empty();
            }

            String url = extractUrl(resBody);
            if (url == null || url.isBlank()) {
                log.error("[GMS->OpenAI] success but url not found. body={}", resBody);
                return Optional.empty();
            }
            return Optional.ofNullable(url);
        } catch (IOException e) {
            log.error("GMS image request failed", e);
            return Optional.empty();
        }
    }

    // ====== [추가] Imagen용: Base64 -> byte[] 반환 ======
    public Optional<byte[]> generateBytes(String prompt) {
        if (imagenEndpoint == null || imagenEndpoint.isBlank()) {
            log.error("[GMS->Imagen] IMAGEN_ENDPOINT is empty");
            return Optional.empty();
        }

        String payload = """
                {
                  "instances": [ { "prompt": %s } ],
                  "parameters": { "sampleCount": %d }
                }
                """.formatted(json(prompt), Math.max(1, sampleCount));

        okhttp3.MediaType json = okhttp3.MediaType.get("application/json");
        RequestBody body = RequestBody.create(payload, json);

        Request req = new Request.Builder()
                .url(imagenEndpoint)  // ★ 통짜 URL (이미 ?key=... 포함). 헤더 불필요
                .post(body)
                .build();

        try (Response res = http.newCall(req).execute()) {
            String resBody = res.body() != null ? res.body().string() : null;
            log.info("[GMS] POST {}  --> status={}", imagenEndpoint, res.code());

            if (!res.isSuccessful()) {
                log.error("[GMS->Imagen] status={} body={}", res.code(), resBody);
                return Optional.empty();
            }

            String b64 = extractImagenBase64(resBody);
            if (b64 == null || b64.isBlank()) {
                log.error("[GMS->Imagen] success but base64 not found. body={}", resBody);
                return Optional.empty();
            }

            try {
                byte[] bytes = Base64.getDecoder().decode(b64.getBytes(StandardCharsets.UTF_8));
                return Optional.of(bytes);
            } catch (IllegalArgumentException e) {
                log.error("[GMS->Imagen] base64 decode failed", e);
                return Optional.empty();
            }
        } catch (IOException e) {
            log.error("GMS imagen request failed", e);
            return Optional.empty();
        }
    }
    // ====================================

    private static String json(@Nullable String s) {
        if (s == null) return "null";
        return "\"" + s
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t") + "\"";
    }

    private static @Nullable String extractUrl(@Nullable String body) {
        if (body == null) return null;
        // 최소한의 파서(빠르게): "url":"..."" 패턴 잡기
        int i = body.indexOf("\"url\"");
        if (i < 0) return null;
        int q1 = body.indexOf('"', body.indexOf(':', i) + 1);
        if (q1 < 0) return null;
        int q2 = body.indexOf('"', q1 + 1);
        if (q2 < 0) return null;
        return body.substring(q1 + 1, q2);
    }

    // ====== [추가] Imagen 응답에서 base64 꺼내기 (두 케이스 커버)
    private static @Nullable String extractImagenBase64(@Nullable String body) {
        if (body == null) return null;

        // 1) "bytesBase64Encoded":"..."
        String k1 = "\"bytesBase64Encoded\"";
        int i1 = body.indexOf(k1);
        if (i1 >= 0) {
            int q1 = body.indexOf('"', i1 + k1.length());
            int q2 = body.indexOf('"', q1 + 1);
            if (q1 > 0 && q2 > q1) return body.substring(q1 + 1, q2);
        }

        // 2) "image": { "bytesBase64Encoded":"..." }
        String k2 = "\"image\"";
        int i2 = body.indexOf(k2);
        if (i2 >= 0) {
            String k3 = "\"bytesBase64Encoded\"";
            int i3 = body.indexOf(k3, i2);
            if (i3 >= 0) {
                int q1 = body.indexOf('"', i3 + k3.length());
                int q2 = body.indexOf('"', q1 + 1);
                if (q1 > 0 && q2 > q1) return body.substring(q1 + 1, q2);
            }
        }
        return null;
    }
    // ====================================
}
