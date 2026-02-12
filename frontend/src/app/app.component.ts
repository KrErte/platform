import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      @if (authService.isAuthenticated()) {
        <nav class="sidebar">
          <div class="sidebar-header">
            <h1 class="logo">BuildQuote</h1>
          </div>
          <ul class="nav-menu">
            <li>
              <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
            </li>
            <li>
              <a routerLink="/projects" routerLinkActive="active">Projects</a>
            </li>
            <li>
              <a routerLink="/suppliers" routerLinkActive="active">Suppliers</a>
            </li>
            <li>
              <a routerLink="/quotes" routerLinkActive="active">Quotes</a>
            </li>
          </ul>
          <div class="sidebar-footer">
            <div class="user-info">
              <span>{{ authService.currentUser()?.email }}</span>
            </div>
            <button class="btn btn-secondary" (click)="logout()">Logout</button>
          </div>
        </nav>
        <main class="main-content">
          <router-outlet />
        </main>
      } @else {
        <router-outlet />
      }
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background-color: var(--background-color);
    }

    .sidebar {
      width: 260px;
      background-color: var(--sidebar-color);
      color: var(--text-primary);
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border-color);
      backdrop-filter: blur(10px);
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .logo {
      font-size: 1.375rem;
      font-weight: 700;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.025em;
    }

    .nav-menu {
      list-style: none;
      padding: 1rem 0.75rem;
      flex: 1;

      li {
        margin-bottom: 0.25rem;
      }

      li a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        color: var(--text-secondary);
        text-decoration: none;
        border-radius: 8px;
        transition: all 200ms ease;
        font-weight: 500;
        font-size: 0.9rem;

        &:hover {
          color: var(--text-primary);
          background-color: var(--surface-hover);
        }

        &.active {
          color: white;
          background: var(--primary-gradient);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
      }
    }

    .sidebar-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border-color);
      background-color: rgba(0, 0, 0, 0.2);
    }

    .user-info {
      margin-bottom: 0.75rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .main-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
      background-color: var(--background-color);
    }
  `]
})
export class AppComponent {
  authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
