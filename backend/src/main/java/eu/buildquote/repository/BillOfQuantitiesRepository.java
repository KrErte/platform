package eu.buildquote.repository;

import eu.buildquote.entity.BillOfQuantities;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillOfQuantitiesRepository extends JpaRepository<BillOfQuantities, Long> {
    List<BillOfQuantities> findByProjectId(Long projectId);
    Optional<BillOfQuantities> findFirstByProjectIdOrderByUploadedAtDesc(Long projectId);
}
