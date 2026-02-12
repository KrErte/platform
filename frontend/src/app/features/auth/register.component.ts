import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card card">
        <h1>Create Account</h1>
        <p class="subtitle">Join BuildQuote today</p>

        @if (error()) {
          <div class="alert alert-error">{{ error() }}</div>
        }

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="form-group">
            <label class="form-label" for="email">Email *</label>
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
            <label class="form-label" for="password">Password *</label>
            <input
              type="password"
              id="password"
              class="form-input"
              [(ngModel)]="password"
              name="password"
              required
              minlength="6"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="companyName">Company Name</label>
            <input
              type="text"
              id="companyName"
              class="form-input"
              [(ngModel)]="companyName"
              name="companyName"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              class="form-input"
              [(ngModel)]="phone"
              name="phone"
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading()">
            @if (loading()) {
              Creating account...
            } @else {
              Create Account
            }
          </button>
        </form>

        <p class="auth-footer">
          Already have an account? <a routerLink="/login">Sign in</a>
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
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  companyName = '';
  phone = '';
  loading = signal(false);
  error = signal('');

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error.set('Please fill in all required fields');
      return;
    }

    if (this.password.length < 6) {
      this.error.set('Password must be at least 6 characters');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.register({
      email: this.email,
      password: this.password,
      companyName: this.companyName || undefined,
      phone: this.phone || undefined
    }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }
}
