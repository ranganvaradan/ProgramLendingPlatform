package com.plp.program.repository;

import com.plp.program.model.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    List<Invoice> findByAnchorId(UUID anchorId);

    List<Invoice> findByAnchorIdAndStatus(UUID anchorId, String status);

    List<Invoice> findByBorrowerId(UUID borrowerId);

    List<Invoice> findByBorrowerIdAndStatusIn(UUID borrowerId, List<String> statuses);

    List<Invoice> findByProgramId(UUID programId);

    Optional<Invoice> findByInvoiceNumberAndAnchorId(String invoiceNumber, UUID anchorId);

    List<Invoice> findByAnchorIdAndProgramId(UUID anchorId, UUID programId);
}
