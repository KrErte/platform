package eu.buildquote.dto.boq;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ColumnMappingDto {
    private String targetField;
    private String detectedHeader;
    private int columnIndex;
    private double confidence;
    private List<String> alternativeHeaders;
}
