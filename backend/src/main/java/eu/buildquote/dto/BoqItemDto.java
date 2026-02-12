package eu.buildquote.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoqItemDto {
    private Long id;
    private Long boqId;
    private String itemNumber;

    @NotBlank(message = "Description is required")
    private String description;

    private String materialType;

    @NotNull(message = "Quantity is required")
    private BigDecimal quantity;

    @NotBlank(message = "Unit is required")
    private String unit;

    private String specification;
    private String notes;
}
