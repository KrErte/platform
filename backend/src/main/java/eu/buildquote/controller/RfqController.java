package eu.buildquote.controller;

import eu.buildquote.dto.RfqRequestDto;
import eu.buildquote.service.RfqService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rfq")
@RequiredArgsConstructor
public class RfqController {

    private final RfqService rfqService;

    @GetMapping
    public ResponseEntity<List<RfqRequestDto>> getAllRfqs() {
        return ResponseEntity.ok(rfqService.getAllRfqs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RfqRequestDto> getRfqById(@PathVariable Long id) {
        return ResponseEntity.ok(rfqService.getRfqById(id));
    }

    @PostMapping
    public ResponseEntity<RfqRequestDto> createRfq(@Valid @RequestBody RfqRequestDto dto) {
        return ResponseEntity.ok(rfqService.createRfq(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RfqRequestDto> updateRfq(@PathVariable Long id, @Valid @RequestBody RfqRequestDto dto) {
        return ResponseEntity.ok(rfqService.updateRfq(id, dto));
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<RfqRequestDto> sendRfq(@PathVariable Long id) {
        return ResponseEntity.ok(rfqService.sendRfq(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRfq(@PathVariable Long id) {
        rfqService.deleteRfq(id);
        return ResponseEntity.noContent().build();
    }
}
