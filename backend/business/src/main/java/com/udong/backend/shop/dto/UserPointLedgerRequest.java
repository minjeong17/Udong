package com.udong.backend.shop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserPointLedgerRequest {
	
	@NotNull
	private Integer clubId;
	
	private Integer eventId;
	
	private Integer voteId;
	
	@NotBlank
	private String CodeName;
	
	@NotNull
	private Integer delta;
	
	@NotBlank
	private String memo;
	
}
