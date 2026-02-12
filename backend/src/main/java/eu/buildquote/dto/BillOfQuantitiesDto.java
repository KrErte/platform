package eu.buildquote.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillOfQuantitiesDto {
    private Long id;
    private Long projectId;
    private String originalFilename;
    private LocalDateTime uploadedAt;
    private List<BoqItemDto> items;
}
