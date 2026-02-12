package eu.buildquote.service;

import eu.buildquote.dto.ProjectDto;
import eu.buildquote.entity.Project;
import eu.buildquote.entity.User;
import eu.buildquote.enums.ProjectStatus;
import eu.buildquote.exception.ResourceNotFoundException;
import eu.buildquote.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<ProjectDto> getAllProjects() {
        User currentUser = userService.getCurrentUser();
        return projectRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectDto getProjectById(Long id) {
        Project project = findProjectById(id);
        return toDto(project);
    }

    @Transactional
    public ProjectDto createProject(ProjectDto dto) {
        User currentUser = userService.getCurrentUser();

        Project project = Project.builder()
                .user(currentUser)
                .name(dto.getName())
                .description(dto.getDescription())
                .status(dto.getStatus() != null ? dto.getStatus() : ProjectStatus.DRAFT)
                .build();

        project = projectRepository.save(project);
        return toDto(project);
    }

    @Transactional
    public ProjectDto updateProject(Long id, ProjectDto dto) {
        Project project = findProjectById(id);

        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        if (dto.getStatus() != null) {
            project.setStatus(dto.getStatus());
        }

        project = projectRepository.save(project);
        return toDto(project);
    }

    @Transactional
    public void deleteProject(Long id) {
        Project project = findProjectById(id);
        projectRepository.delete(project);
    }

    public Project findProjectById(Long id) {
        User currentUser = userService.getCurrentUser();
        return projectRepository.findById(id)
                .filter(p -> p.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
    }

    private ProjectDto toDto(Project project) {
        return ProjectDto.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus())
                .createdAt(project.getCreatedAt())
                .build();
    }
}
