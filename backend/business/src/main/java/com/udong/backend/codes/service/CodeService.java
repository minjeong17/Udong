package com.udong.backend.codes.service;

import com.udong.backend.codes.dto.DetailResponse;
import com.udong.backend.codes.entity.CodeDetail;
import com.udong.backend.codes.repository.CodeDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CodeService {
    private final CodeDetailRepository codeDetailRepository;

    /**
     * 특정 그룹에 속한 모든 상세 코드 조회
     */
    public List<DetailResponse> getCodeDetailsByGroup(String groupName) {
        List<CodeDetail> details = codeDetailRepository.findByCodeGroup_GroupName(groupName);

        return details.stream()
                .map(DetailResponse::new) // Entity 리스트를 DTO 리스트로 변환
                .collect(Collectors.toList());
    }
}
