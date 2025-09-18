package com.udong.backend.items.entity;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import com.udong.backend.clubs.entity.Club;
import com.udong.backend.dutchpay.entity.Dutchpay;
import com.udong.backend.dutchpay.entity.DutchpayParticipant;
import com.udong.backend.events.entity.Event;
import com.udong.backend.users.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity 
@Table(name = "items")
public class Item {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    private String description;
    
    private Integer price;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
