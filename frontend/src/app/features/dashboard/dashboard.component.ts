import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, Supplier, RfqRequest } from '../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <h1>Dashboard</h1>
      </div>

      <div class="welcome-card card">
        <h2>Welcome back, {{ authService.currentUser()?.companyName || authService.currentUser()?.email }}!</h2>
        <p>Manage your construction procurement from one place.</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-value">{{ projects().length }}</div>
          <div class="stat-label">Projects</div>
          <a routerLink="/projects" class="stat-link">View all</a>
        </div>

        <div class="stat-card card">
          <div class="stat-value">{{ suppliers().length }}</div>
          <div class="stat-label">Suppliers</div>
          <a routerLink="/suppliers" class="stat-link">View all</a>
        </div>

        <div class="stat-card card">
          <div class="stat-value">{{ rfqs().length }}</div>
          <div class="stat-label">RFQs</div>
          <a routerLink="/quotes" class="stat-link">View all</a>
        </div>

        <div class="stat-card card">
          <div class="stat-value">{{ activeProjects() }}</div>
          <div class="stat-label">Active Projects</div>
        </div>
      </div>

      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <div class="actions-grid">
          <a routerLink="/projects" class="action-card card">
            <span class="action-icon">+</span>
            <span>New Project</span>
          </a>
          <a routerLink="/suppliers" class="action-card card">
            <span class="action-icon">+</span>
            <span>Add Supplier</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .welcome-card {
      margin-bottom: 1.5rem;

      h2 {
        font-size: 1.25rem;
        margin-bottom: 0.5rem;
      }

      p {
        color: var(--text-secondary);
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      text-align: center;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .stat-label {
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    .stat-link {
      font-size: 0.875rem;
      color: var(--primary-color);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .quick-actions h3 {
      margin-bottom: 1rem;
      font-size: 1rem;
      font-weight: 600;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      text-decoration: none;
      color: var(--text-primary);
      transition: all 0.15s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }
    }

    .action-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private api = inject(ApiService);

  projects = signal<Project[]>([]);
  suppliers = signal<Supplier[]>([]);
  rfqs = signal<RfqRequest[]>([]);

  activeProjects = signal(0);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.api.get<Project[]>('/projects').subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.activeProjects.set(projects.filter(p => p.status === 'ACTIVE').length);
      }
    });

    this.api.get<Supplier[]>('/suppliers').subscribe({
      next: (suppliers) => this.suppliers.set(suppliers)
    });

    this.api.get<RfqRequest[]>('/rfq').subscribe({
      next: (rfqs) => this.rfqs.set(rfqs)
    });
  }
}
