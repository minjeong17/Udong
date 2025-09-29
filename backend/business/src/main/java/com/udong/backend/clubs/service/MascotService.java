package com.udong.backend.clubs.service;

import com.udong.backend.clubs.dto.MascotCreateReq;
import com.udong.backend.clubs.dto.MascotDtos;
import com.udong.backend.clubs.entity.Club;
import com.udong.backend.clubs.entity.Mascot;
import com.udong.backend.clubs.repository.ClubRepository;
import com.udong.backend.clubs.repository.MascotRepository;
import com.udong.backend.clubs.service.MascotImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// MascotService.java
@Service
@RequiredArgsConstructor
public class MascotService {

    private final ClubRepository clubs;
    private final MascotRepository mascots;
    private final MascotImageService image;

    private Club club(Integer id) {
        return clubs.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("동아리를 찾을 수 없습니다"));
    }

    /** 활성 마스코트 DTO 반환 (세션 열려있는 상태에서 DTO로 변환) */
    @Transactional(readOnly = true)
    public MascotDtos.Res getActive(Integer clubId) {
        Mascot m = mascots.findActiveByClubIdWithClub(clubId);
        return (m == null) ? null :
                new MascotDtos.Res(
                        m.getId(),
                        m.getClub().getId(),
                        m.getImageUrl(),
                        m.getPromptMeta(),
                        m.getCreatedAt()
                );
    }

    @Transactional
    public Mascot reroll(Integer clubId, MascotCreateReq req) {
        Club c = club(clubId);

        String category = (req != null && req.clubCategory() != null && !req.clubCategory().isBlank())
                ? req.clubCategory()
                : c.getCategory();

        var res = image.reroll(category, clubId);

        Mascot m = Mascot.builder()
                .club(c)
                .imageUrl(res.imageUrl())
                .s3Key(res.s3Key())
                .promptMeta(res.promptUsed())
                .build();

        Mascot saved = mascots.save(m);

        if (c.getActiveMascot() == null) {
            c.setActiveMascot(saved);
        }

        if (req != null && Boolean.TRUE.equals(req.activate())) {
            c.setActiveMascot(saved);
        }
        return saved;
    }

    /** 목록도 컨트롤러가 건드리지 않게 여기서 DTO로 변환 */
    @Transactional(readOnly = true)
    public Page<MascotDtos.Res> list(Integer clubId, int page, int size) {
        Club c = club(clubId);
        return mascots.findByClubOrderByIdDesc(c, PageRequest.of(page, size))
                .map(m -> new MascotDtos.Res(
                        m.getId(),
                        m.getClub().getId(),   // 여기까지 트랜잭션 안
                        m.getImageUrl(),
                        m.getPromptMeta(),
                        m.getCreatedAt()
                ));
    }

    /** 단건 조회도 fetch join 사용 */
    @Transactional(readOnly = true)
    public MascotDtos.Res getDto(Integer clubId, Integer mascotId) {
        Club c = club(clubId);
        Mascot m = mascots.findByIdWithClub(mascotId)
                .orElseThrow(() -> new IllegalArgumentException("마스코트를 찾을 수 없습니다"));
        if (!m.getClub().getId().equals(c.getId())) {
            throw new IllegalArgumentException("해당 동아리의 마스코트가 아닙니다");
        }
        return new MascotDtos.Res(
                m.getId(),
                m.getClub().getId(),
                m.getImageUrl(),
                m.getPromptMeta(),
                m.getCreatedAt()
        );
    }

    @Transactional
    public void activate(Integer clubId, Integer mascotId) {
        Club c = club(clubId);
        // 소유권 검사까지 통과시킨 뒤 활성화
        Mascot m = mascots.findByIdWithClub(mascotId)
                .orElseThrow(() -> new IllegalArgumentException("마스코트를 찾을 수 없습니다"));
        if (!m.getClub().getId().equals(c.getId())) {
            throw new IllegalArgumentException("해당 동아리의 마스코트가 아닙니다");
        }
        c.setActiveMascot(m);
    }
}
