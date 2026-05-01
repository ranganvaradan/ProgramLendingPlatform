package com.plp.program.service;

import com.plp.program.model.entity.Program;
import com.plp.program.model.enums.ProgramStatus;
import com.plp.program.repository.BorrowerLimitRepository;
import com.plp.program.repository.ProgramRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProgramService {

    private final ProgramRepository programRepository;
    private final BorrowerLimitRepository borrowerLimitRepository;

    @Transactional
    public Program createProgram(Program program) {
        program = programRepository.save(program);
        log.info("Program created: {} ({}) for product {}", program.getProgramName(), program.getProgramCode(), program.getProductType());
        return program;
    }

    public Program getProgram(UUID programId) {
        return programRepository.findById(programId)
                .orElseThrow(() -> new RuntimeException("Program not found: " + programId));
    }

    public Program getProgramByCode(String programCode) {
        return programRepository.findByProgramCode(programCode)
                .orElseThrow(() -> new RuntimeException("Program not found: " + programCode));
    }

    public List<Program> listPrograms() {
        return programRepository.findAll();
    }

    @Transactional
    public Program updateProgram(UUID programId, Program updated) {
        Program program = getProgram(programId);
        program.setProgramName(updated.getProgramName());
        program.setProgramLimit(updated.getProgramLimit());
        program.setAnchorLimit(updated.getAnchorLimit());
        program.setMaxBorrowerLimit(updated.getMaxBorrowerLimit());
        program.setInterestRateMin(updated.getInterestRateMin());
        program.setInterestRateMax(updated.getInterestRateMax());
        program.setDefaultInterestRate(updated.getDefaultInterestRate());
        program.setMaxTenureDays(updated.getMaxTenureDays());
        program.setMarginPercent(updated.getMarginPercent());
        program.setProcessingFeePercent(updated.getProcessingFeePercent());
        program.setPenalRatePercent(updated.getPenalRatePercent());
        program.setGracePeriodDays(updated.getGracePeriodDays());
        program.setAutoApproveThreshold(updated.getAutoApproveThreshold());
        program.setMaxConcurrentLoans(updated.getMaxConcurrentLoans());
        program.setCoolingOffDays(updated.getCoolingOffDays());
        program.setEligibilityRefreshDays(updated.getEligibilityRefreshDays());
        program.setConcentrationLimitPercent(updated.getConcentrationLimitPercent());
        program.setEligibilityRules(updated.getEligibilityRules());
        program.setParameters(updated.getParameters());
        program.setValidFrom(updated.getValidFrom());
        program.setValidTo(updated.getValidTo());
        program.setAutoRenewal(updated.isAutoRenewal());
        return programRepository.save(program);
    }

    @Transactional
    public Program updateStatus(UUID programId, ProgramStatus newStatus) {
        Program program = getProgram(programId);
        ProgramStatus currentStatus = program.getStatus();
        validateStatusTransition(currentStatus, newStatus);
        program.setStatus(newStatus);
        programRepository.save(program);
        log.info("Program {} status changed: {} → {}", program.getProgramCode(), currentStatus, newStatus);
        return program;
    }

    public Map<String, Object> getUtilization(UUID programId) {
        Program program = getProgram(programId);
        BigDecimal totalUtilized = borrowerLimitRepository.sumUtilizedByProgramId(programId);
        BigDecimal available = program.getProgramLimit().subtract(totalUtilized);
        BigDecimal utilizationPercent = totalUtilized.multiply(BigDecimal.valueOf(100))
                .divide(program.getProgramLimit(), 2, java.math.RoundingMode.HALF_UP);

        return Map.of(
                "programId", programId,
                "programLimit", program.getProgramLimit(),
                "totalUtilized", totalUtilized,
                "available", available,
                "utilizationPercent", utilizationPercent
        );
    }

    private void validateStatusTransition(ProgramStatus from, ProgramStatus to) {
        boolean valid = switch (from) {
            case DRAFT -> to == ProgramStatus.ACTIVE;
            case ACTIVE -> to == ProgramStatus.PAUSED || to == ProgramStatus.CLOSED;
            case PAUSED -> to == ProgramStatus.ACTIVE || to == ProgramStatus.CLOSED;
            case CLOSED -> false;
        };
        if (!valid) {
            throw new RuntimeException("Invalid status transition: " + from + " → " + to);
        }
    }
}
