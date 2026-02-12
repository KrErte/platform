package eu.buildquote.dto.boq;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsedBoqItemDto {
    private int rowNumber;
    private String itemNumber;
    private String description;
    private BigDecimal quantity;
    private String unit;
    private String materialType;
    private String specification;
    private String notes;
    private boolean hasParsingErrors;
    private String errorMessage;
}
