package com.udong.backend.shop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPointLedgerRequest {
	
	@NotNull
	private Integer clubId;
	
	private Integer eventId;
	
	private Integer voteId;
	
	@NotBlank
	private String codeName;
	
	@NotNull
	private Integer delta;
	
	@NotBlank
	private String memo;
	
}
