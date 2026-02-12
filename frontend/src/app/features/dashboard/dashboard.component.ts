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

        @if (!demoDataLoaded() && !demoLoading()) {
          <button class="demo-button" (click)="loadDemoData()">
            <svg class="demo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Load Demo Data
          </button>
        }

        @if (demoLoading()) {
          <button class="demo-button loading" disabled>
            <span class="spinner"></span>
            Loading Demo Data...
          </button>
        }

        @if (showSuccessToast()) {
          <div class="toast success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Demo data loaded successfully!
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .welcome-card {
      margin-bottom: 1.5rem;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
      border: 1px solid rgba(99, 102, 241, 0.3);

      h2 {
        font-size: 1.25rem;
        margin-bottom: 0.5rem;
        color: var(--text-primary);
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
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--glow-primary);
        border-color: var(--primary-color);
      }
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .stat-label {
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-link {
      font-size: 0.875rem;
      color: var(--primary-color);
      text-decoration: none;
      transition: color 0.2s ease;

      &:hover {
        color: var(--primary-hover);
        text-decoration: underline;
      }
    }

    .quick-actions h3 {
      margin-bottom: 1rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1.5rem;
      text-decoration: none;
      color: var(--text-primary);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--glow-primary);
        border-color: var(--primary-color);
      }
    }

    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--primary-gradient);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 0.75rem;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .demo-button {
      margin-top: 1.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        border-color: var(--primary-color);
        color: var(--primary-color);
        background: rgba(99, 102, 241, 0.1);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }

      &.loading {
        border-color: var(--primary-color);
        color: var(--primary-color);
      }
    }

    .demo-icon {
      width: 18px;
      height: 18px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
      z-index: 1000;

      svg {
        width: 20px;
        height: 20px;
      }

      &.success {
        border-color: #22c55e;
        color: #22c55e;
      }
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes fadeOut {
      to {
        opacity: 0;
        transform: translateY(10px);
      }
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
  demoDataLoaded = signal(false);
  demoLoading = signal(false);
  showSuccessToast = signal(false);

  ngOnInit(): void {
    this.loadData();
    this.checkDemoDataStatus();
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

  private checkDemoDataStatus(): void {
    this.api.get<{ loaded: boolean }>('/demo/status').subscribe({
      next: (res) => this.demoDataLoaded.set(res.loaded)
    });
  }

  loadDemoData(): void {
    this.demoLoading.set(true);
    this.api.post<{ success: boolean; message: string; alreadyLoaded: boolean }>('/demo/load', {}).subscribe({
      next: (res) => {
        this.demoLoading.set(false);
        this.demoDataLoaded.set(true);
        this.showSuccessToast.set(true);
        this.loadData();
        setTimeout(() => this.showSuccessToast.set(false), 3000);
      },
      error: () => {
        this.demoLoading.set(false);
      }
    });
  }
}
