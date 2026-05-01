package com.plp.program.service;

import com.plp.program.model.entity.Borrower;
import com.plp.program.model.entity.Invoice;
import com.plp.program.model.entity.Program;
import com.plp.program.repository.BorrowerRepository;
import com.plp.program.repository.InvoiceRepository;
import com.plp.program.repository.ProgramRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final BorrowerRepository borrowerRepository;
    private final ProgramRepository programRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Transactional
    public Invoice createInvoice(Invoice invoice) {
        validateInvoice(invoice);
        computeEligibleAmount(invoice);
        invoice.setStatus("UPLOADED");
        invoice.setSource("MANUAL");
        invoice = invoiceRepository.save(invoice);
        log.info("Invoice created: {} anchor={} borrower={} amount={}",
                invoice.getInvoiceNumber(), invoice.getAnchorId(), invoice.getBorrowerId(), invoice.getInvoiceAmount());
        return invoice;
    }

    @Transactional
    public List<Invoice> uploadInvoiceCsv(UUID anchorId, UUID programId, InputStream csvStream, UUID uploadedBy) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new RuntimeException("Program not found: " + programId));

        BigDecimal marginPct = program.getMarginPercent() != null ? program.getMarginPercent() : new BigDecimal("10.00");

        List<Invoice> results = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(csvStream))) {
            String header = reader.readLine();
            if (header == null) {
                throw new RuntimeException("CSV file is empty");
            }

            String line;
            int rowNum = 1;
            while ((line = reader.readLine()) != null) {
                rowNum++;
                String[] cols = line.split(",", -1);
                if (cols.length < 6) {
                    log.warn("Skipping row {}: insufficient columns (need 6: invoiceNumber,borrowerCode,invoiceDate,dueDate,invoiceAmount,taxAmount)", rowNum);
                    continue;
                }

                String invoiceNumber = cols[0].trim();
                String borrowerCode = cols[1].trim();
                String invoiceDateStr = cols[2].trim();
                String dueDateStr = cols[3].trim();
                String invoiceAmtStr = cols[4].trim().replace(",", "");
                String taxAmtStr = cols[5].trim().replace(",", "");

                if (invoiceNumber.isEmpty() || borrowerCode.isEmpty()) {
                    log.warn("Skipping row {}: missing invoiceNumber or borrowerCode", rowNum);
                    continue;
                }

                Optional<Invoice> existing = invoiceRepository.findByInvoiceNumberAndAnchorId(invoiceNumber, anchorId);
                if (existing.isPresent()) {
                    log.warn("Skipping row {}: duplicate invoice {} for anchor {}", rowNum, invoiceNumber, anchorId);
                    continue;
                }

                Optional<Borrower> borrowerOpt = borrowerRepository.findByBorrowerCode(borrowerCode);
                if (borrowerOpt.isEmpty()) {
                    log.warn("Skipping row {}: borrower not found: {}", rowNum, borrowerCode);
                    continue;
                }

                BigDecimal invoiceAmt;
                BigDecimal taxAmt;
                try {
                    invoiceAmt = new BigDecimal(invoiceAmtStr);
                    taxAmt = taxAmtStr.isEmpty() ? BigDecimal.ZERO : new BigDecimal(taxAmtStr);
                } catch (NumberFormatException e) {
                    log.warn("Skipping row {}: invalid amount", rowNum);
                    continue;
                }

                if (invoiceAmt.compareTo(BigDecimal.ZERO) <= 0) {
                    log.warn("Skipping row {}: invoice amount must be positive", rowNum);
                    continue;
                }

                LocalDate invoiceDate;
                LocalDate dueDate;
                try {
                    invoiceDate = LocalDate.parse(invoiceDateStr, DATE_FMT);
                    dueDate = LocalDate.parse(dueDateStr, DATE_FMT);
                } catch (Exception e) {
                    log.warn("Skipping row {}: invalid date format (use yyyy-MM-dd)", rowNum);
                    continue;
                }

                BigDecimal netAmount = invoiceAmt.add(taxAmt);

                Invoice invoice = Invoice.builder()
                        .invoiceNumber(invoiceNumber)
                        .anchorId(anchorId)
                        .borrowerId(borrowerOpt.get().getId())
                        .programId(programId)
                        .invoiceDate(invoiceDate)
                        .dueDate(dueDate)
                        .invoiceAmount(invoiceAmt)
                        .taxAmount(taxAmt)
                        .netAmount(netAmount)
                        .marginPercent(marginPct)
                        .source("MANUAL")
                        .status("UPLOADED")
                        .build();

                computeEligibleAmount(invoice);
                invoice = invoiceRepository.save(invoice);
                results.add(invoice);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error processing invoice CSV: " + e.getMessage(), e);
        }

        log.info("Invoice CSV upload: anchor={} program={} rows={}", anchorId, programId, results.size());
        return results;
    }

    @Transactional
    public Invoice verifyInvoice(UUID invoiceId, UUID verifiedBy) {
        Invoice invoice = getInvoice(invoiceId);
        invoice.setVerified(true);
        invoice.setVerifiedAt(Instant.now());
        invoice.setVerifiedBy(verifiedBy);
        if ("UPLOADED".equals(invoice.getStatus())) {
            invoice.setStatus("VERIFIED");
        }
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice confirmInvoice(UUID invoiceId) {
        Invoice invoice = getInvoice(invoiceId);
        invoice.setAnchorConfirmed(true);
        invoice.setAnchorConfirmedAt(Instant.now());
        if ("VERIFIED".equals(invoice.getStatus())) {
            invoice.setStatus("ELIGIBLE");
        }
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice markDiscounted(UUID invoiceId, BigDecimal discountedAmount) {
        Invoice invoice = invoiceRepository.findByIdForUpdate(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceId));
        BigDecimal newDiscounted = invoice.getDiscountedAmount().add(discountedAmount);
        invoice.setDiscountedAmount(newDiscounted);
        invoice.setAvailableAmount(invoice.getEligibleAmount().subtract(newDiscounted));
        if (invoice.getAvailableAmount().compareTo(BigDecimal.ZERO) <= 0) {
            invoice.setAvailableAmount(BigDecimal.ZERO);
            invoice.setStatus("FULLY_DISCOUNTED");
        } else {
            invoice.setStatus("PARTIALLY_DISCOUNTED");
        }
        return invoiceRepository.save(invoice);
    }

    public Invoice getInvoice(UUID invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceId));
    }

    public List<Invoice> getByAnchor(UUID anchorId) {
        return invoiceRepository.findByAnchorId(anchorId);
    }

    public List<Invoice> getByAnchorAndProgram(UUID anchorId, UUID programId) {
        return invoiceRepository.findByAnchorIdAndProgramId(anchorId, programId);
    }

    public List<Invoice> getByBorrower(UUID borrowerId) {
        return invoiceRepository.findByBorrowerId(borrowerId);
    }

    public List<Invoice> getEligibleByBorrower(UUID borrowerId) {
        return invoiceRepository.findByBorrowerIdAndStatusIn(borrowerId,
                List.of("VERIFIED", "ELIGIBLE", "PARTIALLY_DISCOUNTED"));
    }

    public List<Invoice> getByProgram(UUID programId) {
        return invoiceRepository.findByProgramId(programId);
    }

    private void validateInvoice(Invoice invoice) {
        if (invoice.getInvoiceNumber() == null || invoice.getInvoiceNumber().isBlank()) {
            throw new RuntimeException("Invoice number is required");
        }
        if (invoice.getInvoiceAmount() == null || invoice.getInvoiceAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Invoice amount must be positive");
        }
        if (invoice.getDueDate() != null && invoice.getDueDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Invoice due date cannot be in the past");
        }

        Optional<Invoice> existing = invoiceRepository.findByInvoiceNumberAndAnchorId(
                invoice.getInvoiceNumber(), invoice.getAnchorId());
        if (existing.isPresent()) {
            throw new RuntimeException("Duplicate invoice number: " + invoice.getInvoiceNumber() + " for this anchor");
        }

        borrowerRepository.findById(invoice.getBorrowerId())
                .orElseThrow(() -> new RuntimeException("Borrower not found: " + invoice.getBorrowerId()));
    }

    private void computeEligibleAmount(Invoice invoice) {
        Program program = programRepository.findById(invoice.getProgramId())
                .orElseThrow(() -> new RuntimeException("Program not found: " + invoice.getProgramId()));

        BigDecimal marginPct = invoice.getMarginPercent() != null
                ? invoice.getMarginPercent()
                : (program.getMarginPercent() != null ? program.getMarginPercent() : new BigDecimal("10.00"));
        invoice.setMarginPercent(marginPct);

        BigDecimal netAmount = invoice.getNetAmount() != null
                ? invoice.getNetAmount()
                : invoice.getInvoiceAmount().add(invoice.getTaxAmount() != null ? invoice.getTaxAmount() : BigDecimal.ZERO);
        invoice.setNetAmount(netAmount);

        BigDecimal eligible = netAmount
                .multiply(new BigDecimal("100").subtract(marginPct))
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        invoice.setEligibleAmount(eligible);
        invoice.setAvailableAmount(eligible.subtract(
                invoice.getDiscountedAmount() != null ? invoice.getDiscountedAmount() : BigDecimal.ZERO));
    }
}
