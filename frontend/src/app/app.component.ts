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
    }

    .sidebar {
      width: 250px;
      background-color: #1e293b;
      color: white;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid #334155;
    }

    .logo {
      font-size: 1.25rem;
      font-weight: 700;
      color: white;
    }

    .nav-menu {
      list-style: none;
      padding: 1rem 0;
      flex: 1;

      li a {
        display: block;
        padding: 0.75rem 1.5rem;
        color: #94a3b8;
        text-decoration: none;
        transition: all 0.15s ease;

        &:hover {
          color: white;
          background-color: #334155;
        }

        &.active {
          color: white;
          background-color: var(--primary-color);
        }
      }
    }

    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #334155;
    }

    .user-info {
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
      color: #94a3b8;
    }

    .main-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }
  `]
})
export class AppComponent {
  authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
