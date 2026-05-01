package com.plp.program.repository;

import com.plp.program.model.entity.Program;
import com.plp.program.model.enums.ProductType;
import com.plp.program.model.enums.ProgramStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProgramRepository extends JpaRepository<Program, UUID> {

    Optional<Program> findByProgramCode(String programCode);

    List<Program> findByAnchorId(UUID anchorId);

    List<Program> findByProductType(ProductType productType);

    List<Program> findByStatus(ProgramStatus status);

    List<Program> findByAnchorIdAndProductTypeAndStatus(UUID anchorId, ProductType productType, ProgramStatus status);
}
