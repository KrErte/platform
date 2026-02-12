package eu.buildquote.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuoteDto {
    private Long id;

    @NotNull(message = "RFQ Request ID is required")
    private Long rfqRequestId;

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    @NotNull(message = "BOQ Item ID is required")
    private Long boqItemId;

    @NotNull(message = "Unit price is required")
    private BigDecimal unitPrice;

    @NotNull(message = "Total price is required")
    private BigDecimal totalPrice;

    private String materialDescription;
    private Integer deliveryDays;
    private String notes;
    private LocalDate validUntil;
    private LocalDateTime createdAt;

    // Nested info for display
    private String boqItemDescription;
    private String supplierCompanyName;
}
