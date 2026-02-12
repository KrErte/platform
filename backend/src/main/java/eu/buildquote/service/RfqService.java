package eu.buildquote.service;

import eu.buildquote.dto.RfqRequestDto;
import eu.buildquote.entity.Project;
import eu.buildquote.entity.RfqRequest;
import eu.buildquote.entity.Supplier;
import eu.buildquote.entity.User;
import eu.buildquote.enums.RfqStatus;
import eu.buildquote.exception.BadRequestException;
import eu.buildquote.exception.ResourceNotFoundException;
import eu.buildquote.repository.RfqRequestRepository;
import eu.buildquote.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RfqService {

    private final RfqRequestRepository rfqRepository;
    private final SupplierRepository supplierRepository;
    private final ProjectService projectService;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<RfqRequestDto> getAllRfqs() {
        User currentUser = userService.getCurrentUser();
        return rfqRepository.findByProjectUserId(currentUser.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public RfqRequestDto getRfqById(Long id) {
        RfqRequest rfq = findRfqById(id);
        return toDto(rfq);
    }

    @Transactional
    public RfqRequestDto createRfq(RfqRequestDto dto) {
        Project project = projectService.findProjectById(dto.getProjectId());

        User currentUser = userService.getCurrentUser();
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .filter(s -> s.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", dto.getSupplierId()));

        RfqRequest rfq = RfqRequest.builder()
                .project(project)
                .supplier(supplier)
                .status(RfqStatus.DRAFT)
                .deadline(dto.getDeadline())
                .build();

        rfq = rfqRepository.save(rfq);
        return toDto(rfq);
    }

    @Transactional
    public RfqRequestDto updateRfq(Long id, RfqRequestDto dto) {
        RfqRequest rfq = findRfqById(id);

        if (dto.getDeadline() != null) {
            rfq.setDeadline(dto.getDeadline());
        }
        if (dto.getStatus() != null) {
            rfq.setStatus(dto.getStatus());
        }

        rfq = rfqRepository.save(rfq);
        return toDto(rfq);
    }

    @Transactional
    public RfqRequestDto sendRfq(Long id) {
        RfqRequest rfq = findRfqById(id);

        if (rfq.getStatus() != RfqStatus.DRAFT) {
            throw new BadRequestException("RFQ can only be sent from DRAFT status");
        }

        rfq.setStatus(RfqStatus.SENT);
        rfq.setSentAt(LocalDateTime.now());

        rfq = rfqRepository.save(rfq);
        return toDto(rfq);
    }

    @Transactional
    public void deleteRfq(Long id) {
        RfqRequest rfq = findRfqById(id);
        rfqRepository.delete(rfq);
    }

    public RfqRequest findRfqById(Long id) {
        User currentUser = userService.getCurrentUser();
        return rfqRepository.findById(id)
                .filter(r -> r.getProject().getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("RfqRequest", "id", id));
    }

    private RfqRequestDto toDto(RfqRequest rfq) {
        return RfqRequestDto.builder()
                .id(rfq.getId())
                .projectId(rfq.getProject().getId())
                .supplierId(rfq.getSupplier().getId())
                .status(rfq.getStatus())
                .sentAt(rfq.getSentAt())
                .deadline(rfq.getDeadline())
                .createdAt(rfq.getCreatedAt())
                .projectName(rfq.getProject().getName())
                .supplierCompanyName(rfq.getSupplier().getCompanyName())
                .build();
    }
}
