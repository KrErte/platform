import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { Project, ProjectStatus } from '@shared/models';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h1>Projects</h1>
      <button class="btn btn-primary" (click)="showForm.set(true)">New Project</button>
    </div>

    @if (showForm()) {
      <div class="card form-card">
        <h2>{{ editingProject() ? 'Edit Project' : 'Create New Project' }}</h2>
        <form (ngSubmit)="saveProject()">
          <div class="form-group">
            <label class="form-label">Project Name *</label>
            <input type="text" class="form-input" [(ngModel)]="form.name" name="name" required />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-input" [(ngModel)]="form.description" name="description" rows="3"></textarea>
          </div>
          @if (editingProject()) {
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-input" [(ngModel)]="form.status" name="status">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          }
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="cancelForm()">Cancel</button>
            <button type="submit" class="btn btn-primary">{{ editingProject() ? 'Update' : 'Create' }}</button>
          </div>
        </form>
      </div>
    }

    <div class="card">
      @if (projects().length === 0) {
        <p class="empty-state">No projects yet. Create your first project to get started.</p>
      } @else {
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (project of projects(); track project.id) {
              <tr>
                <td>
                  <a [routerLink]="['/projects', project.id]" class="project-link">{{ project.name }}</a>
                </td>
                <td>{{ project.description || '-' }}</td>
                <td>
                  <span class="badge" [class]="'badge-' + project.status.toLowerCase()">
                    {{ project.status }}
                  </span>
                </td>
                <td>{{ formatDate(project.createdAt) }}</td>
                <td>
                  <button class="btn-icon" (click)="editProject(project)">Edit</button>
                  <button class="btn-icon btn-danger-text" (click)="deleteProject(project.id)">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .form-card {
      margin-bottom: 1.5rem;

      h2 {
        margin-bottom: 1rem;
        font-size: 1.125rem;
      }
    }

    .form-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    .empty-state {
      text-align: center;
      color: var(--text-secondary);
      padding: 2rem;
    }

    .project-link {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }

    .btn-icon {
      background: none;
      border: none;
      color: var(--primary-color);
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;

      &:hover {
        text-decoration: underline;
      }
    }

    .btn-danger-text {
      color: var(--danger-color);
    }
  `]
})
export class ProjectListComponent implements OnInit {
  private api = inject(ApiService);

  projects = signal<Project[]>([]);
  showForm = signal(false);
  editingProject = signal<Project | null>(null);

  form: { name: string; description: string; status: ProjectStatus } = {
    name: '',
    description: '',
    status: 'DRAFT'
  };

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.api.get<Project[]>('/projects').subscribe({
      next: (projects) => this.projects.set(projects)
    });
  }

  saveProject(): void {
    if (this.editingProject()) {
      this.api.put<Project>(`/projects/${this.editingProject()!.id}`, this.form).subscribe({
        next: () => {
          this.loadProjects();
          this.cancelForm();
        }
      });
    } else {
      this.api.post<Project>('/projects', this.form).subscribe({
        next: () => {
          this.loadProjects();
          this.cancelForm();
        }
      });
    }
  }

  editProject(project: Project): void {
    this.editingProject.set(project);
    this.form = {
      name: project.name,
      description: project.description || '',
      status: project.status
    };
    this.showForm.set(true);
  }

  deleteProject(id: number): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.api.delete(`/projects/${id}`).subscribe({
        next: () => this.loadProjects()
      });
    }
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingProject.set(null);
    this.form = { name: '', description: '', status: 'DRAFT' };
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
