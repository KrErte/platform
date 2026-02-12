package eu.buildquote.repository;

import eu.buildquote.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, Long> {
    List<Quote> findByRfqRequestId(Long rfqRequestId);
    List<Quote> findBySupplierId(Long supplierId);
    List<Quote> findByBoqItemId(Long boqItemId);

    @Query("SELECT q FROM Quote q WHERE q.rfqRequest.project.user.id = :userId ORDER BY q.createdAt DESC")
    List<Quote> findByProjectUserId(@Param("userId") Long userId);
}
