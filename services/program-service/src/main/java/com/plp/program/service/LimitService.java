package com.plp.program.service;

import com.plp.program.model.entity.BorrowerLimit;
import com.plp.program.model.entity.Program;
import com.plp.program.model.enums.LimitStatus;
import com.plp.program.repository.BorrowerLimitRepository;
import com.plp.program.repository.ProgramRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LimitService {

    private final BorrowerLimitRepository limitRepository;
    private final ProgramRepository programRepository;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String LIMIT_KEY_PREFIX = "limit:";

    @Transactional
    public BorrowerLimit assignLimit(UUID borrowerId, UUID programId, BigDecimal sanctionedLimit, BigDecimal interestRate) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new RuntimeException("Program not found: " + programId));

        if (sanctionedLimit.compareTo(program.getMaxBorrowerLimit()) > 0) {
            throw new RuntimeException("Sanctioned limit exceeds program max borrower limit: " + program.getMaxBorrowerLimit());
        }

        BorrowerLimit limit = BorrowerLimit.builder()
                .borrowerId(borrowerId)
                .programId(programId)
                .sanctionedLimit(sanctionedLimit)
                .availableLimit(sanctionedLimit)
                .utilizedLimit(BigDecimal.ZERO)
                .interestRate(interestRate != null ? interestRate : program.getDefaultInterestRate())
                .maxConcurrentLoans(program.getMaxConcurrentLoans())
                .lastEvaluatedAt(Instant.now())
                .build();

        limit = limitRepository.save(limit);
        syncLimitToRedis(limit);
        log.info("Limit assigned: borrower={} program={} limit={}", borrowerId, programId, sanctionedLimit);
        return limit;
    }

    public BorrowerLimit getLimit(UUID borrowerId, UUID programId) {
        return limitRepository.findByBorrowerIdAndProgramId(borrowerId, programId)
                .orElseThrow(() -> new RuntimeException("Limit not found for borrower " + borrowerId + " in program " + programId));
    }

    @Transactional
    public BorrowerLimit blockLimit(UUID borrowerId, UUID programId, BigDecimal amount) {
        BorrowerLimit limit = limitRepository.findByBorrowerIdAndProgramIdForUpdate(borrowerId, programId)
                .orElseThrow(() -> new RuntimeException("Limit not found for borrower " + borrowerId + " in program " + programId));

        if (limit.getStatus() != LimitStatus.ACTIVE) {
            throw new RuntimeException("Limit is not active. Status: " + limit.getStatus());
        }

        if (amount.compareTo(limit.getAvailableLimit()) > 0) {
            throw new RuntimeException("Insufficient available limit. Available: " + limit.getAvailableLimit() + ", Requested: " + amount);
        }

        // Check program-level limit
        BigDecimal programUtilized = limitRepository.sumUtilizedByProgramId(programId);
        Program program = programRepository.findById(programId).orElseThrow();
        if (programUtilized.add(amount).compareTo(program.getProgramLimit()) > 0) {
            throw new RuntimeException("Program limit would be exceeded");
        }

        limit.setUtilizedLimit(limit.getUtilizedLimit().add(amount));
        limit.setAvailableLimit(limit.getSanctionedLimit().subtract(limit.getUtilizedLimit()));
        limit.setActiveLoanCount(limit.getActiveLoanCount() + 1);
        limitRepository.save(limit);
        syncLimitToRedis(limit);

        log.info("Limit blocked: borrower={} program={} amount={} newAvailable={}", borrowerId, programId, amount, limit.getAvailableLimit());
        return limit;
    }

    @Transactional
    public BorrowerLimit releaseLimit(UUID borrowerId, UUID programId, BigDecimal amount) {
        BorrowerLimit limit = limitRepository.findByBorrowerIdAndProgramIdForUpdate(borrowerId, programId)
                .orElseThrow(() -> new RuntimeException("Limit not found for borrower " + borrowerId + " in program " + programId));

        BigDecimal newUtilized = limit.getUtilizedLimit().subtract(amount);
        if (newUtilized.compareTo(BigDecimal.ZERO) < 0) {
            log.warn("Release amount {} exceeds utilized limit {} for borrower={} program={}, clamping to zero",
                    amount, limit.getUtilizedLimit(), borrowerId, programId);
            newUtilized = BigDecimal.ZERO;
        }
        limit.setUtilizedLimit(newUtilized);
        limit.setAvailableLimit(limit.getSanctionedLimit().subtract(limit.getUtilizedLimit()));
        limit.setActiveLoanCount(Math.max(0, limit.getActiveLoanCount() - 1));
        limitRepository.save(limit);
        syncLimitToRedis(limit);

        log.info("Limit released: borrower={} program={} amount={} newAvailable={}", borrowerId, programId, amount, limit.getAvailableLimit());
        return limit;
    }

    @Transactional
    public void freezeLimit(UUID borrowerId, UUID programId, String reason) {
        BorrowerLimit limit = getLimit(borrowerId, programId);
        limit.setStatus(LimitStatus.FROZEN);
        limitRepository.save(limit);
        syncLimitToRedis(limit);
        log.warn("Limit frozen: borrower={} program={} reason={}", borrowerId, programId, reason);
    }

    private void syncLimitToRedis(BorrowerLimit limit) {
        String key = LIMIT_KEY_PREFIX + limit.getBorrowerId() + ":" + limit.getProgramId();
        redisTemplate.opsForHash().put(key, "sanctioned", limit.getSanctionedLimit().toPlainString());
        redisTemplate.opsForHash().put(key, "utilized", limit.getUtilizedLimit().toPlainString());
        redisTemplate.opsForHash().put(key, "available", limit.getAvailableLimit().toPlainString());
        redisTemplate.opsForHash().put(key, "status", limit.getStatus().name());
    }
}
