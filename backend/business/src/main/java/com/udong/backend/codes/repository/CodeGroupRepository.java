package com.udong.backend.codes.repository;

import com.udong.backend.codes.entity.CodeGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CodeGroupRepository extends JpaRepository<CodeGroup, String> {
    Optional<CodeGroup> findByGroupName(String groupName);
}