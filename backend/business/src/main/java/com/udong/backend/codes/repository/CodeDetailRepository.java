package com.udong.backend.codes.repository;

import com.udong.backend.codes.entity.CodeDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CodeDetailRepository extends JpaRepository<CodeDetail, String> {
    List<CodeDetail> findByCodeGroup_GroupName(String groupName);
}