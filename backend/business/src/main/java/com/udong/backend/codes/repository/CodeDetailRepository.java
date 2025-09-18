package com.udong.backend.codes.repository;

import com.udong.backend.codes.entity.CodeDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CodeDetailRepository extends JpaRepository<CodeDetail, String> {

    // [사용 중인 것만 + 이름순]
    List<CodeDetail> findByCodeGroup_GroupNameAndIsUseTrueOrderByCodeNameAsc(String groupName);

    // [필요시: 전체 조회]
    List<CodeDetail> findByCodeGroup_GroupName(String groupName);

    // [단건 조회: 그룹 + 코드명]
    Optional<CodeDetail> findByCodeGroup_GroupNameAndCodeName(String groupName, String codeName);

    Optional<CodeDetail> findByCodeGroup_GroupNameAndCodeNameAndIsUseTrue(String groupName, String codeName);
}
