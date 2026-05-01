package com.plp.program.repository;

import com.plp.program.model.entity.EmployeeSalaryData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeSalaryDataRepository extends JpaRepository<EmployeeSalaryData, UUID> {

    List<EmployeeSalaryData> findByAnchorIdAndPayPeriod(UUID anchorId, String payPeriod);

    List<EmployeeSalaryData> findByAnchorId(UUID anchorId);

    List<EmployeeSalaryData> findByBorrowerId(UUID borrowerId);

    Optional<EmployeeSalaryData> findByBorrowerIdAndPayPeriod(UUID borrowerId, String payPeriod);

    List<EmployeeSalaryData> findByProgramId(UUID programId);

    Optional<EmployeeSalaryData> findTopByBorrowerIdOrderByPayPeriodDesc(UUID borrowerId);
}
