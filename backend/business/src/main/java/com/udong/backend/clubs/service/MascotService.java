package com.udong.backend.clubs.service;

import com.udong.backend.clubs.entity.Club;
import com.udong.backend.clubs.entity.Mascot;
import com.udong.backend.clubs.repository.ClubRepository;
import com.udong.backend.clubs.repository.MascotRepository;
import com.udong.backend.clubs.dto.MascotCreateReq;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional(readOnly = true)
    public Mascot getActive(Integer clubId) {
        return club(clubId).getActiveMascot();
    }

    @Transactional
    public Mascot reroll(Integer clubId, MascotCreateReq req) {
        Club c = club(clubId);

        String category = (req != null && req.clubCategory() != null && !req.clubCategory().isBlank())
                ? req.clubCategory()
                : c.getCategory();

        // GMS로 이미지 생성 (프롬프트는 내부 템플릿 사용)
        var res = image.reroll(category, clubId);

        Mascot m = Mascot.builder()
                .club(c)
                .imageUrl(res.imageUrl())
                .s3Key(res.s3Key())
                .promptMeta(res.promptUsed())
                .build();

        Mascot saved = mascots.save(m);

        if (req != null && Boolean.TRUE.equals(req.activate())) {
            c.setActiveMascot(saved);
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public Page<Mascot> list(Integer clubId, int page, int size) {
        Club c = club(clubId);
        return mascots.findByClubOrderByIdDesc(c, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public Mascot get(Integer clubId, Integer mascotId) {
        Club c = club(clubId);
        Mascot m = mascots.findById(mascotId)
                .orElseThrow(() -> new IllegalArgumentException("마스코트를 찾을 수 없습니다"));
        if (!m.getClub().getId().equals(c.getId())) {
            throw new IllegalArgumentException("해당 동아리의 마스코트가 아닙니다");
        }
        return m;
    }

    @Transactional
    public void activate(Integer clubId, Integer mascotId) {
        Club c = club(clubId);
        Mascot m = get(clubId, mascotId);
        c.setActiveMascot(m);
    }

}
