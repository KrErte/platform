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
public class BoqUploadResponseDto {
    private Long boqId;
    private String filename;
    private int totalRowsParsed;
    private boolean requiresConfirmation;
    private double overallConfidence;
    private List<ColumnMappingDto> columnMappings;
    private List<ParsedBoqItemDto> previewItems;
    private List<String> warnings;
}
