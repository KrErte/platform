package eu.buildquote.controller;

import eu.buildquote.dto.BillOfQuantitiesDto;
import eu.buildquote.dto.BoqItemDto;
import eu.buildquote.dto.boq.BoqUploadResponseDto;
import eu.buildquote.dto.boq.ConfirmMappingRequestDto;
import eu.buildquote.service.BoqParserService;
import eu.buildquote.service.BoqService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BoqController {

    private final BoqService boqService;
    private final BoqParserService boqParserService;

    @GetMapping("/projects/{projectId}/boq")
    public ResponseEntity<List<BillOfQuantitiesDto>> getBoqsByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(boqService.getBoqsByProjectId(projectId));
    }

    @PostMapping("/projects/{projectId}/boq")
    public ResponseEntity<BillOfQuantitiesDto> createBoq(
            @PathVariable Long projectId,
            @RequestParam String filename) {
        return ResponseEntity.ok(boqService.createBoq(projectId, filename));
    }

    @PostMapping("/projects/{projectId}/boq/upload")
    public ResponseEntity<BoqUploadResponseDto> uploadBoq(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(boqParserService.parseAndUpload(projectId, file));
    }

    @PostMapping("/projects/{projectId}/boq/confirm-mapping")
    public ResponseEntity<BoqUploadResponseDto> confirmMapping(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("boqId") Long boqId,
            @RequestParam("columnMappings") String columnMappingsJson) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            @SuppressWarnings("unchecked")
            java.util.Map<String, Integer> mappings = mapper.readValue(columnMappingsJson,
                    mapper.getTypeFactory().constructMapType(java.util.Map.class, String.class, Integer.class));

            ConfirmMappingRequestDto request = ConfirmMappingRequestDto.builder()
                    .boqId(boqId)
                    .columnMappings(mappings)
                    .build();

            return ResponseEntity.ok(boqParserService.confirmMapping(projectId, request, file));
        } catch (Exception e) {
            throw new eu.buildquote.exception.BadRequestException("Invalid column mappings format");
        }
    }

    @GetMapping("/boq/{boqId}")
    public ResponseEntity<BillOfQuantitiesDto> getBoqById(@PathVariable Long boqId) {
        return ResponseEntity.ok(boqService.getBoqById(boqId));
    }

    @GetMapping("/boq/{boqId}/items")
    public ResponseEntity<List<BoqItemDto>> getBoqItems(@PathVariable Long boqId) {
        return ResponseEntity.ok(boqService.getBoqItems(boqId));
    }

    @PostMapping("/boq/{boqId}/items")
    public ResponseEntity<BoqItemDto> createBoqItem(
            @PathVariable Long boqId,
            @Valid @RequestBody BoqItemDto dto) {
        return ResponseEntity.ok(boqService.createBoqItem(boqId, dto));
    }

    @PutMapping("/boq/items/{itemId}")
    public ResponseEntity<BoqItemDto> updateBoqItem(
            @PathVariable Long itemId,
            @Valid @RequestBody BoqItemDto dto) {
        return ResponseEntity.ok(boqService.updateBoqItem(itemId, dto));
    }

    @DeleteMapping("/boq/items/{itemId}")
    public ResponseEntity<Void> deleteBoqItem(@PathVariable Long itemId) {
        boqService.deleteBoqItem(itemId);
        return ResponseEntity.noContent().build();
    }
}
