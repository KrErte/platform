package eu.buildquote.repository;

import eu.buildquote.entity.RfqRequest;
import eu.buildquote.enums.RfqStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RfqRequestRepository extends JpaRepository<RfqRequest, Long> {
    List<RfqRequest> findByProjectId(Long projectId);
    List<RfqRequest> findBySupplierId(Long supplierId);
    List<RfqRequest> findByStatus(RfqStatus status);

    @Query("SELECT r FROM RfqRequest r WHERE r.project.user.id = :userId ORDER BY r.createdAt DESC")
    List<RfqRequest> findByProjectUserId(@Param("userId") Long userId);
}
