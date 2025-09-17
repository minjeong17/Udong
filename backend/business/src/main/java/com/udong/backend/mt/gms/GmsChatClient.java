package com.udong.backend.mt.gms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.jetbrains.annotations.Nullable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class GmsChatClient {

    private final OkHttpClient http = new OkHttpClient.Builder()
            .connectTimeout(Duration.ofSeconds(15))
            .readTimeout(Duration.ofSeconds(60))
            .writeTimeout(Duration.ofSeconds(30))
            .callTimeout(Duration.ofSeconds(90))
            .build();

    @Value("${GMS_KEY}")
    private String gmsKey; // "Bearer xxx"

    @Value("${CHAT_ENDPOINT}")
    private String chatEndpoint; // https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions

    @Value("${app.gms.model:gpt-4o}")
    private String model;

    private static final ObjectMapper OM = new ObjectMapper();

    public String completeJson(String prompt, int maxTokens) {
        // 1차: response_format 포함
        String primary = buildPayload(prompt, maxTokens, true);
        String body = execute(primary);
        String content = extractContentFlexible(body);

        if (content == null || content.isBlank()) {
            log.warn("[GMS Chat] empty content with response_format. Retrying without it. raw body={}", body);
            // 2차: response_format 제거
            String fallback = buildPayload(prompt, maxTokens, false);
            body = execute(fallback);
            content = extractContentFlexible(body);
        }

        if (content == null || content.isBlank()) {
            log.warn("[GMS Chat] still empty. raw body={}", body);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "[GMS Chat] 200 but empty content. Reduce prompt or increase max_tokens.");
        }
        return content;
    }

    private String buildPayload(String prompt, int maxTokens, boolean withResponseFormat) {
        // 양쪽 호환: max_tokens와 max_completion_tokens 모두 보냄
        String base = """
        {
          "model": %s,
          "messages": [
            {"role":"system","content":"Return ONLY a valid single JSON object."},
            {"role":"user","content": %s }
          ],
          "stream": false,
          "max_completion_tokens": %d
        }
        """.formatted(json(model), json(prompt), maxTokens, maxTokens);

        if (!withResponseFormat) return base;

        // 간단 삽입: "stream" 앞에 response_format 추가
        int i = base.indexOf("\"stream\"");
        return base.substring(0, i)
                + "\"response_format\": {\"type\":\"json_object\"},\n          "
                + base.substring(i);
    }

    private String execute(String payload) {
        Request request = new Request.Builder()
                .url(chatEndpoint)
                .addHeader("Authorization", gmsKey)               // "Bearer xxx"
                .addHeader("Content-Type", "application/json")
                .addHeader("Accept", "application/json")
                .post(RequestBody.create(payload.getBytes(StandardCharsets.UTF_8),
                        MediaType.get("application/json")))
                .build();

        try (Response res = http.newCall(request).execute()) {
            String body = res.body() != null ? res.body().string() : null;
            if (!res.isSuccessful()) {
                log.warn("[GMS Chat] {} {}", res.code(), body);
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "[GMS Chat] " + res.code() + " " + body);
            }
            return body;
        } catch (IOException e) {
            log.error("[GMS Chat] IO error", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "[GMS Chat] IO error: " + e.getMessage());
        }
    }

    // ================== Flexible Extractor ==================
    private static @Nullable String extractContentFlexible(@Nullable String body) {
        if (body == null || body.isBlank()) return null;

        // 1) JSON으로 파싱
        JsonNode root;
        try {
            root = OM.readTree(body);
        } catch (Exception e) {
            // JSON이 아닐 수도(Cloudflare HTML 등) → 포기
            return null;
        }

        // A) Chat Completions 표준
        try {
            JsonNode choices = root.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                // message.content
                String content = choices.get(0).path("message").path("content").asText(null);
                if (nonEmpty(content)) return content;
                // text (드물게)
                content = choices.get(0).path("text").asText(null);
                if (nonEmpty(content)) return content;
            }
        } catch (Exception ignore) {}

        // B) Responses 스타일
        try {
            // output_text
            String outText = root.path("output_text").asText(null);
            if (nonEmpty(outText)) return outText;

            // output[0].content[0].text
            JsonNode output = root.path("output");
            if (output.isArray() && output.size() > 0) {
                JsonNode contentArr = output.get(0).path("content");
                if (contentArr.isArray() && contentArr.size() > 0) {
                    String txt = contentArr.get(0).path("text").asText(null);
                    if (nonEmpty(txt)) return txt;
                }
            }
        } catch (Exception ignore) {}

        // C) content가 아예 JSON 객체일 수도: body 내부에서 우리가 원하는 JSON 블록 찾아내기
        //    schedule + supplies 키를 동시에 가진 최상위 객체 탐색
        try {
            String found = findJsonObjectWithKeys(root, "schedule", "supplies");
            if (nonEmpty(found)) return found;
        } catch (Exception ignore) {}

        return null;
    }

    private static boolean nonEmpty(String s) {
        return s != null && !s.isBlank();
    }

    /**
     * 응답 트리 어딘가에 있는 { "schedule": ..., "supplies": ... } 객체를 찾아 문자열로 반환
     */
    private static String findJsonObjectWithKeys(JsonNode node, String key1, String key2) {
        if (node.isObject()) {
            if (node.has(key1) && node.has(key2)) {
                return node.toString();
            }
            var fields = node.fields();
            while (fields.hasNext()) {
                var e = fields.next();
                String sub = findJsonObjectWithKeys(e.getValue(), key1, key2);
                if (nonEmpty(sub)) return sub;
            }
        } else if (node.isArray()) {
            for (JsonNode n : node) {
                String sub = findJsonObjectWithKeys(n, key1, key2);
                if (nonEmpty(sub)) return sub;
            }
        }
        return null;
        // 못 찾으면 null
    }

    // ===== Helpers =====
    private static String json(String s) {
        if (s == null) return "null";
        return "\"" + s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n") + "\"";
    }
}
