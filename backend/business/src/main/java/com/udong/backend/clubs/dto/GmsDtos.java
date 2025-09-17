package com.udong.backend.clubs.dto;

import java.util.List;

public class GmsDtos {
    // OpenAI Images API 요청 형식
    public record ImagesRequest(
            String model,
            String prompt,
            String size,
            String response_format // "url" (기본) 또는 "b64_json"
    ) {}

    // OpenAI Images API 응답 형식
    public record ImagesResponse(
            long created,
            List<ImageData> data
    ) {
        public record ImageData(String url, String b64_json, String revised_prompt) {}
    }
}

