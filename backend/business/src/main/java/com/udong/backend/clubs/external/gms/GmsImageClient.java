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
    private String gmsKey;                  // ★ Bearer 포함

    @Value("${DALLE_ENDPOINT}")
    private String dalleEndpoint;           // ★ 완전 URL (…/api.openai.com/v1/images/generations)

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
}
