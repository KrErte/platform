package eu.buildquote.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "boq_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoqItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "boq_id", nullable = false)
    private BillOfQuantities billOfQuantities;

    @Column(name = "item_number")
    private String itemNumber;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "material_type")
    private String materialType;

    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal quantity;

    @Column(nullable = false)
    private String unit;

    @Column(columnDefinition = "TEXT")
    private String specification;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
