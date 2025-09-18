package com.udong.backend.chat.port;

public interface MembershipChecker {
    boolean isClubMember(Integer clubId, Integer userId);
}
