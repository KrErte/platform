package eu.buildquote.dto;

import eu.buildquote.enums.RfqStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RfqRequestDto {
    private Long id;

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    private RfqStatus status;
    private LocalDateTime sentAt;
    private LocalDateTime deadline;
    private LocalDateTime createdAt;

    // Nested info for display
    private String projectName;
    private String supplierCompanyName;
}
