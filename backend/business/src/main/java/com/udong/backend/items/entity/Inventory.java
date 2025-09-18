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
@Table(name = "inventories")
public class Inventory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "item_id", nullable = false)
    private Integer itemId;
    
    @Column(name = "user_id", nullable = false)
    private Integer userId;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
}
