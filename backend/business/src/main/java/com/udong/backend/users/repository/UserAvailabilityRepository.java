package com.udong.backend.users.repository;

import com.udong.backend.users.entity.UserAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAvailabilityRepository extends JpaRepository<UserAvailability, Integer> {}
