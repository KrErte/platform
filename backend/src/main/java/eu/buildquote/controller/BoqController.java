package eu.buildquote.controller;

import eu.buildquote.dto.BillOfQuantitiesDto;
import eu.buildquote.dto.BoqItemDto;
import eu.buildquote.service.BoqService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BoqController {

    private final BoqService boqService;

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
