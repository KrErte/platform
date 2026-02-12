import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card card">
        <h1>Welcome to BuildQuote</h1>
        <p class="subtitle">Sign in to your account</p>

        @if (error()) {
          <div class="alert alert-error">{{ error() }}</div>
        }

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              type="email"
              id="email"
              class="form-input"
              [(ngModel)]="email"
              name="email"
              required
              email
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              type="password"
              id="password"
              class="form-input"
              [(ngModel)]="password"
              name="password"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading()">
            @if (loading()) {
              Signing in...
            } @else {
              Sign In
            }
          </button>
        </form>

        <p class="auth-footer">
          Don't have an account? <a routerLink="/register">Sign up</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--background-color);
    }

    .auth-card {
      width: 100%;
      max-width: 400px;
      margin: 1rem;
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
    }

    .btn-block {
      width: 100%;
      margin-top: 0.5rem;
    }

    .auth-footer {
      margin-top: 1.5rem;
      text-align: center;
      color: var(--text-secondary);

      a {
        color: var(--primary-color);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error.set('Please fill in all fields');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Login failed. Please try again.');
      }
    });
  }
}
