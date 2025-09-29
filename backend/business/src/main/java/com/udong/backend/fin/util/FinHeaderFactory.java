package com.udong.backend.fin.util;

import com.udong.backend.fin.dto.FinHeader;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

public final class FinHeaderFactory {

    private static final DateTimeFormatter D8 = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter T6 = DateTimeFormatter.ofPattern("HHmmss");
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private FinHeaderFactory() {}

    /** 담백: 현재시각 기반, 20자리 숫자 UID 자동생성 */
    public static FinHeader create(String apiName,
                                   String institutionCode,
                                   String fintechAppNo,
                                   String apiKey,
                                   String userKey) {
        var now = ZonedDateTime.now(KST);

        FinHeader h = new FinHeader();
        h.setApiName(apiName);
        h.setApiServiceCode(apiName); // 문서대로 apiName과 동일
        h.setTransmissionDate(now.format(D8)); // yyyyMMdd
        h.setTransmissionTime(now.format(T6)); // HHmmss
        h.setInstitutionCode(institutionCode);
        h.setFintechAppNo(fintechAppNo);
        h.setInstitutionTransactionUniqueNo(genTxnUid20(now)); // 20자리 숫자
        h.setApiKey(apiKey);
        h.setUserKey(userKey);
        return h;
    }

    /** 20자리 숫자: yyyyMMddHHmmss(14) + 랜덤 6자리(000000~999999) */
    private static String genTxnUid20(ZonedDateTime now) {
        String ts14 = now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int rnd = ThreadLocalRandom.current().nextInt(0, 1_000_000);
        return ts14 + String.format("%06d", rnd);
    }
}