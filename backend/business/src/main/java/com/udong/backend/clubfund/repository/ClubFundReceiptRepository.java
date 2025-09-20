// com.udong.backend.clubfund.repository.ClubFundReceiptRepository
package com.udong.backend.clubfund.repository;

import com.udong.backend.clubfund.entity.ClubFundReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ClubFundReceiptRepository extends JpaRepository<ClubFundReceipt, Integer> {
    boolean existsByTransactionId(Integer transactionId);

    // 거래ID 묶음으로 한 번에 가져와서 hasReceipt 계산
    List<ClubFundReceipt> findByTransactionIdIn(Collection<Integer> txnIds);
}
