package com.udong.backend.fin.client;

import com.udong.backend.fin.dto.FinHeader;
import com.udong.backend.fin.util.FinHeaderFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class FinApiClient {

    @Value("${finapi.base-url}")   private String baseUrl;      // e.g. https://finopenapi.ssafy.io/ssafy/api/v1
    @Value("${finapi.userkey-path}") private String userkeyPath; // e.g. /edu/member/userKey
    @Value("${finapi.api-key}")    private String apiKey;

    private WebClient client() {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /** 이메일로 userKey 발급/조회 */
    public String fetchUserKeyByEmail(String email) {
        Map<String, Object> body = Map.of(
                "userId", email,
                "apiKey", apiKey
        );

        Map<String, Object> res = client().post()
                .uri(userkeyPath)
                .bodyValue(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, r ->
                        r.bodyToMono(String.class).map(msg ->
                                new RuntimeException("Fin userKey API " + r.statusCode() + " - " + msg)))
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();

        Object uk = (res == null) ? null : res.get("userKey"); // 응답 키 이름 문서대로
        if (uk == null) throw new IllegalStateException("userKey 응답이 없습니다.");
        return String.valueOf(uk);
    }

    /** 계좌 유효성 검증 */
    public boolean validateAccount(String userKey, String accountNumber) {
        FinHeader header = FinHeaderFactory.create(
                "inquireDemandDepositAccount",
                "00100",  // institutionCode 고정
                "001",    // fintechAppNo 고정
                apiKey,
                userKey
        );

        Map<String, Object> body = Map.of(
                "Header", header,
                "accountNo", accountNumber
        );

        try {
            client().post()
                    .uri("/edu/demandDeposit/inquireDemandDepositAccount")
                    .bodyValue(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, r -> {
                        // 400번대 에러는 계좌가 존재하지 않는 것으로 처리
                        return r.bodyToMono(String.class).map(msg ->
                                new RuntimeException("Account not found"));
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, r -> {
                        // 500번대 에러는 서버 오류
                        return r.bodyToMono(String.class).map(msg ->
                                new RuntimeException("Server error: " + msg));
                    })
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            // 200 응답이 오면 계좌가 존재
            return true;
        } catch (Exception e) {
            // 400 응답이나 기타 오류 시 계좌가 존재하지 않음
            return false;
        }
    }

    /** 공통 POST 호출 */
    public <T> T post(String path, Object body, Class<T> responseType) {
        return client().post()
                .uri(path)
                .bodyValue(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, r ->
                        r.bodyToMono(String.class).map(msg ->
                                new RuntimeException("Fin API " + r.statusCode() + " - " + msg)))
                .bodyToMono(responseType)
                .block();
    }
}