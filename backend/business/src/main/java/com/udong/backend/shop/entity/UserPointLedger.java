package com.udong.backend.shop.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicInsert;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
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
@DynamicInsert
@Entity 
@Table(
    name = "user_points_ledger",
    indexes = {
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_club_id", columnList = "club_id")
    }
)
public class UserPointLedger {
	@Id @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;
	    
	@Column(name = "club_id", nullable = false)
	private Integer clubId;
	    
	@Column(name = "user_id", nullable = false)
	private Integer userId;
	 
	@Column(name = "event_id")
	private Integer eventId;
	
	@Column(name = "vote_id")
	private Integer voteId;
	
	@Column(name = "code_name", nullable = false)
	private String codeName;
	
	@Column(name = "curr_point", nullable = false)
	@ColumnDefault("0")
	private Integer currPoint;
	
	@Column(nullable = false)
	private String memo;
	
	@Column(nullable = false)
	private Integer delta;
	    
	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;
}
