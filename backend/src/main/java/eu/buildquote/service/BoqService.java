package eu.buildquote.service;

import eu.buildquote.dto.BillOfQuantitiesDto;
import eu.buildquote.dto.BoqItemDto;
import eu.buildquote.entity.BillOfQuantities;
import eu.buildquote.entity.BoqItem;
import eu.buildquote.entity.Project;
import eu.buildquote.exception.ResourceNotFoundException;
import eu.buildquote.repository.BillOfQuantitiesRepository;
import eu.buildquote.repository.BoqItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoqService {

    private final BillOfQuantitiesRepository boqRepository;
    private final BoqItemRepository boqItemRepository;
    private final ProjectService projectService;

    @Transactional(readOnly = true)
    public List<BillOfQuantitiesDto> getBoqsByProjectId(Long projectId) {
        projectService.findProjectById(projectId); // Verify access
        return boqRepository.findByProjectId(projectId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public BillOfQuantitiesDto getBoqById(Long id) {
        BillOfQuantities boq = findBoqById(id);
        return toDto(boq);
    }

    @Transactional
    public BillOfQuantitiesDto createBoq(Long projectId, String filename) {
        Project project = projectService.findProjectById(projectId);

        BillOfQuantities boq = BillOfQuantities.builder()
                .project(project)
                .originalFilename(filename)
                .build();

        boq = boqRepository.save(boq);
        return toDto(boq);
    }

    @Transactional(readOnly = true)
    public List<BoqItemDto> getBoqItems(Long boqId) {
        findBoqById(boqId); // Verify access
        return boqItemRepository.findByBillOfQuantitiesId(boqId)
                .stream()
                .map(this::toItemDto)
                .toList();
    }

    @Transactional
    public BoqItemDto createBoqItem(Long boqId, BoqItemDto dto) {
        BillOfQuantities boq = findBoqById(boqId);

        BoqItem item = BoqItem.builder()
                .billOfQuantities(boq)
                .itemNumber(dto.getItemNumber())
                .description(dto.getDescription())
                .materialType(dto.getMaterialType())
                .quantity(dto.getQuantity())
                .unit(dto.getUnit())
                .specification(dto.getSpecification())
                .notes(dto.getNotes())
                .build();

        item = boqItemRepository.save(item);
        return toItemDto(item);
    }

    @Transactional
    public BoqItemDto updateBoqItem(Long itemId, BoqItemDto dto) {
        BoqItem item = findBoqItemById(itemId);

        item.setItemNumber(dto.getItemNumber());
        item.setDescription(dto.getDescription());
        item.setMaterialType(dto.getMaterialType());
        item.setQuantity(dto.getQuantity());
        item.setUnit(dto.getUnit());
        item.setSpecification(dto.getSpecification());
        item.setNotes(dto.getNotes());

        item = boqItemRepository.save(item);
        return toItemDto(item);
    }

    @Transactional
    public void deleteBoqItem(Long itemId) {
        BoqItem item = findBoqItemById(itemId);
        boqItemRepository.delete(item);
    }

    private BillOfQuantities findBoqById(Long id) {
        BillOfQuantities boq = boqRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BillOfQuantities", "id", id));
        projectService.findProjectById(boq.getProject().getId()); // Verify access
        return boq;
    }

    private BoqItem findBoqItemById(Long id) {
        BoqItem item = boqItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BoqItem", "id", id));
        findBoqById(item.getBillOfQuantities().getId()); // Verify access
        return item;
    }

    private BillOfQuantitiesDto toDto(BillOfQuantities boq) {
        return BillOfQuantitiesDto.builder()
                .id(boq.getId())
                .projectId(boq.getProject().getId())
                .originalFilename(boq.getOriginalFilename())
                .uploadedAt(boq.getUploadedAt())
                .items(boq.getItems().stream().map(this::toItemDto).toList())
                .build();
    }

    private BoqItemDto toItemDto(BoqItem item) {
        return BoqItemDto.builder()
                .id(item.getId())
                .boqId(item.getBillOfQuantities().getId())
                .itemNumber(item.getItemNumber())
                .description(item.getDescription())
                .materialType(item.getMaterialType())
                .quantity(item.getQuantity())
                .unit(item.getUnit())
                .specification(item.getSpecification())
                .notes(item.getNotes())
                .build();
    }
}
