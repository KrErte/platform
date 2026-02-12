package eu.buildquote.service;

import eu.buildquote.dto.QuoteDto;
import eu.buildquote.entity.*;
import eu.buildquote.exception.ResourceNotFoundException;
import eu.buildquote.repository.BoqItemRepository;
import eu.buildquote.repository.QuoteRepository;
import eu.buildquote.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuoteService {

    private final QuoteRepository quoteRepository;
    private final BoqItemRepository boqItemRepository;
    private final SupplierRepository supplierRepository;
    private final RfqService rfqService;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<QuoteDto> getAllQuotes() {
        User currentUser = userService.getCurrentUser();
        return quoteRepository.findByProjectUserId(currentUser.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public QuoteDto getQuoteById(Long id) {
        Quote quote = findQuoteById(id);
        return toDto(quote);
    }

    @Transactional(readOnly = true)
    public List<QuoteDto> getQuotesByRfqId(Long rfqId) {
        rfqService.findRfqById(rfqId); // Verify access
        return quoteRepository.findByRfqRequestId(rfqId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public QuoteDto createQuote(QuoteDto dto) {
        RfqRequest rfq = rfqService.findRfqById(dto.getRfqRequestId());

        User currentUser = userService.getCurrentUser();
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .filter(s -> s.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", dto.getSupplierId()));

        BoqItem boqItem = boqItemRepository.findById(dto.getBoqItemId())
                .orElseThrow(() -> new ResourceNotFoundException("BoqItem", "id", dto.getBoqItemId()));

        Quote quote = Quote.builder()
                .rfqRequest(rfq)
                .supplier(supplier)
                .boqItem(boqItem)
                .unitPrice(dto.getUnitPrice())
                .totalPrice(dto.getTotalPrice())
                .materialDescription(dto.getMaterialDescription())
                .deliveryDays(dto.getDeliveryDays())
                .notes(dto.getNotes())
                .validUntil(dto.getValidUntil())
                .build();

        quote = quoteRepository.save(quote);
        return toDto(quote);
    }

    @Transactional
    public QuoteDto updateQuote(Long id, QuoteDto dto) {
        Quote quote = findQuoteById(id);

        quote.setUnitPrice(dto.getUnitPrice());
        quote.setTotalPrice(dto.getTotalPrice());
        quote.setMaterialDescription(dto.getMaterialDescription());
        quote.setDeliveryDays(dto.getDeliveryDays());
        quote.setNotes(dto.getNotes());
        quote.setValidUntil(dto.getValidUntil());

        quote = quoteRepository.save(quote);
        return toDto(quote);
    }

    @Transactional
    public void deleteQuote(Long id) {
        Quote quote = findQuoteById(id);
        quoteRepository.delete(quote);
    }

    private Quote findQuoteById(Long id) {
        User currentUser = userService.getCurrentUser();
        return quoteRepository.findById(id)
                .filter(q -> q.getRfqRequest().getProject().getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Quote", "id", id));
    }

    private QuoteDto toDto(Quote quote) {
        return QuoteDto.builder()
                .id(quote.getId())
                .rfqRequestId(quote.getRfqRequest().getId())
                .supplierId(quote.getSupplier().getId())
                .boqItemId(quote.getBoqItem().getId())
                .unitPrice(quote.getUnitPrice())
                .totalPrice(quote.getTotalPrice())
                .materialDescription(quote.getMaterialDescription())
                .deliveryDays(quote.getDeliveryDays())
                .notes(quote.getNotes())
                .validUntil(quote.getValidUntil())
                .createdAt(quote.getCreatedAt())
                .boqItemDescription(quote.getBoqItem().getDescription())
                .supplierCompanyName(quote.getSupplier().getCompanyName())
                .build();
    }
}
