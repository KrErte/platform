package eu.buildquote.repository;

import eu.buildquote.entity.BoqItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoqItemRepository extends JpaRepository<BoqItem, Long> {
    List<BoqItem> findByBillOfQuantitiesId(Long boqId);
}
