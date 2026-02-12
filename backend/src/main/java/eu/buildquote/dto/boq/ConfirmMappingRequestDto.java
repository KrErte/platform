package eu.buildquote.dto.boq;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmMappingRequestDto {
    @NotNull(message = "BOQ ID is required")
    private Long boqId;

    @NotNull(message = "Column mappings are required")
    private Map<String, Integer> columnMappings;

    private byte[] fileData;
}
