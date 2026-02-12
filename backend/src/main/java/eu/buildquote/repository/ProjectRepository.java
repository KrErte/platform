package eu.buildquote.repository;

import eu.buildquote.entity.Project;
import eu.buildquote.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUserId(Long userId);
    List<Project> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Project> findByUserIdAndStatus(Long userId, ProjectStatus status);
}
