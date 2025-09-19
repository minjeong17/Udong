package com.udong.backend.events.repository;

import com.udong.backend.events.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Integer> {
    boolean existsByIdAndCreatedBy_Id(Integer eventId, Integer userId);
}
