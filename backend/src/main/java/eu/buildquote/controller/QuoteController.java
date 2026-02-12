package eu.buildquote.controller;

import eu.buildquote.dto.QuoteDto;
import eu.buildquote.service.QuoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/quotes")
@RequiredArgsConstructor
public class QuoteController {

    private final QuoteService quoteService;

    @GetMapping
    public ResponseEntity<List<QuoteDto>> getAllQuotes() {
        return ResponseEntity.ok(quoteService.getAllQuotes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuoteDto> getQuoteById(@PathVariable Long id) {
        return ResponseEntity.ok(quoteService.getQuoteById(id));
    }

    @GetMapping("/rfq/{rfqId}")
    public ResponseEntity<List<QuoteDto>> getQuotesByRfq(@PathVariable Long rfqId) {
        return ResponseEntity.ok(quoteService.getQuotesByRfqId(rfqId));
    }

    @PostMapping
    public ResponseEntity<QuoteDto> createQuote(@Valid @RequestBody QuoteDto dto) {
        return ResponseEntity.ok(quoteService.createQuote(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuoteDto> updateQuote(@PathVariable Long id, @Valid @RequestBody QuoteDto dto) {
        return ResponseEntity.ok(quoteService.updateQuote(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuote(@PathVariable Long id) {
        quoteService.deleteQuote(id);
        return ResponseEntity.noContent().build();
    }
}
