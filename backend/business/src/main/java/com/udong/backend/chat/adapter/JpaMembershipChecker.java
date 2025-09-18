// com.udong.backend.chat.adapter.JpaMembershipChecker
package com.udong.backend.chat.adapter;

import com.udong.backend.chat.port.MembershipChecker;
import com.udong.backend.clubs.repository.MembershipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class JpaMembershipChecker implements MembershipChecker {

    private final MembershipRepository membershipRepository;

    @Override
    @Transactional(readOnly = true)
    public boolean isClubMember(Integer clubId, Integer userId) {
        return membershipRepository.existsByClub_IdAndUserId(clubId, userId);
        // 또는: return membershipRepository.existsMember(clubId, userId);
    }
}
