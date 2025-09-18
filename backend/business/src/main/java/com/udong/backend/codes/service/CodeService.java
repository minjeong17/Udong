package com.udong.backend.codes.service;

import com.udong.backend.codes.dto.DetailResponse;
import com.udong.backend.codes.entity.CodeDetail;
import com.udong.backend.codes.repository.CodeDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CodeService {
    private final CodeDetailRepository codeDetailRepository;

    /**
     * 특정 그룹에 속한 모든 '사용중' 상세 코드 조회 (권장)
     */
    public List<DetailResponse> getCodeDetailsByGroup(String groupName) {
        String key = groupName.toLowerCase(Locale.ROOT);

        List<CodeDetail> details =
                codeDetailRepository.findByCodeGroup_GroupNameAndIsUseTrueOrderByCodeNameAsc(key);

        return details.stream()
                .map(DetailResponse::new)   // Entity -> DTO
                .toList();
    }

    /**
     * 필요시: 비활성 포함 전체 조회
     */
    public List<DetailResponse> getAllCodeDetailsByGroup(String groupName) {
        String key = groupName.toLowerCase(Locale.ROOT);

        List<CodeDetail> details =
                codeDetailRepository.findByCodeGroup_GroupName(key);

        return details.stream()
                .map(DetailResponse::new)
                .toList();
    }

    // com.udong.backend.codes.service.CodeService
    @Transactional(readOnly = true)
    public CodeDetail getActiveDetailOrThrow(String groupName, String codeName) {
        String g = groupName.toLowerCase(Locale.ROOT);
        String c = codeName.toUpperCase(Locale.ROOT);
        return codeDetailRepository.findByCodeGroup_GroupNameAndCodeNameAndIsUseTrue(g, c)
                .orElseThrow(() -> new IllegalArgumentException(
                        "유효하지 않은 코드입니다. group=" + g + ", code=" + c));
    }

}
