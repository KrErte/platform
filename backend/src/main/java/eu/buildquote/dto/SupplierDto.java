package eu.buildquote.dto;

import jakarta.validation.constraints.NotBlank;
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
public class SupplierDto {
    private Long id;

    @NotBlank(message = "Company name is required")
    private String companyName;

    private String contactName;
    private String email;
    private String phone;
    private List<String> categories;
    private String notes;
    private LocalDateTime createdAt;
}
