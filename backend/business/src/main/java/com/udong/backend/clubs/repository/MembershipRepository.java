package com.udong.backend.clubs.repository;

import com.udong.backend.clubs.entity.Membership;
import com.udong.backend.codes.entity.CodeDetail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Integer> {
    boolean existsByUserIdAndClub_Id(Integer userId, Integer clubId);

    @Query("""
           select m
           from Membership m
           join fetch m.club c
           where m.userId = :userId
           """)
    List<Membership> findByUserIdFetchClub(@Param("userId") Integer userId);

    @Query("""
           select m
           from Membership m
           join fetch m.club c
           left join fetch c.activeMascot mas
           where m.userId = :userId
           """)
    List<Membership> findByUserIdFetchClubAndMascot(@Param("userId") Integer userId);

    boolean existsByClub_IdAndUserId(Integer clubId, Integer userId);

    Optional<Membership> findByClub_IdAndUserId(Integer clubId, Integer userId);

    Optional<Membership> findByIdAndClub_Id(Integer id, Integer clubId);

    // 목록 검색/필터 (단순 버전)
// 기존 searchByClub 에서 actorId로 self 제외하거나 LEADER 제외하는 조건이 있었다면 제거!
    @Query("""
    select m
    from Membership m
    join m.club c
    where c.id = :clubId
      and (:role is null or :role = '' or m.roleCode = :role)
      and (:q is null or :q = '' or cast(m.userId as string) like concat('%', :q, '%'))
""")
    Page<Membership> searchByClub(@Param("clubId") Integer clubId,
                                  @Param("q") String q,
                                  @Param("role") String role,
                                  Pageable pageable);

    @Query("""
    select m
    from Membership m
    join m.club c
    where c.id = :clubId
      and (:role is null or :role = '' or m.roleCode = :role)
      and (:q is null or :q = '' or cast(m.userId as string) like concat('%', :q, '%'))
""")
    List<Membership> searchAllByClub(@Param("clubId") Integer clubId,
                                     @Param("q") String q,
                                     @Param("role") String role);

}
