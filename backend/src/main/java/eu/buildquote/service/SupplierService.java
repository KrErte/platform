package eu.buildquote.service;

import eu.buildquote.dto.SupplierDto;
import eu.buildquote.entity.Supplier;
import eu.buildquote.entity.User;
import eu.buildquote.exception.ResourceNotFoundException;
import eu.buildquote.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<SupplierDto> getAllSuppliers() {
        User currentUser = userService.getCurrentUser();
        return supplierRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public SupplierDto getSupplierById(Long id) {
        Supplier supplier = findSupplierById(id);
        return toDto(supplier);
    }

    @Transactional
    public SupplierDto createSupplier(SupplierDto dto) {
        User currentUser = userService.getCurrentUser();

        Supplier supplier = Supplier.builder()
                .user(currentUser)
                .companyName(dto.getCompanyName())
                .contactName(dto.getContactName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .categories(dto.getCategories())
                .notes(dto.getNotes())
                .build();

        supplier = supplierRepository.save(supplier);
        return toDto(supplier);
    }

    @Transactional
    public SupplierDto updateSupplier(Long id, SupplierDto dto) {
        Supplier supplier = findSupplierById(id);

        supplier.setCompanyName(dto.getCompanyName());
        supplier.setContactName(dto.getContactName());
        supplier.setEmail(dto.getEmail());
        supplier.setPhone(dto.getPhone());
        supplier.setCategories(dto.getCategories());
        supplier.setNotes(dto.getNotes());

        supplier = supplierRepository.save(supplier);
        return toDto(supplier);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = findSupplierById(id);
        supplierRepository.delete(supplier);
    }

    private Supplier findSupplierById(Long id) {
        User currentUser = userService.getCurrentUser();
        return supplierRepository.findById(id)
                .filter(s -> s.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
    }

    private SupplierDto toDto(Supplier supplier) {
        return SupplierDto.builder()
                .id(supplier.getId())
                .companyName(supplier.getCompanyName())
                .contactName(supplier.getContactName())
                .email(supplier.getEmail())
                .phone(supplier.getPhone())
                .categories(supplier.getCategories())
                .notes(supplier.getNotes())
                .createdAt(supplier.getCreatedAt())
                .build();
    }
}
