import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Supplier } from '../../shared/models';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <h1>Suppliers</h1>
      <button class="btn btn-primary" (click)="showForm.set(true)">Add Supplier</button>
    </div>

    @if (showForm()) {
      <div class="card form-card">
        <h2>{{ editingSupplier() ? 'Edit Supplier' : 'Add New Supplier' }}</h2>
        <form (ngSubmit)="saveSupplier()">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Company Name *</label>
              <input type="text" class="form-input" [(ngModel)]="form.companyName" name="companyName" required />
            </div>
            <div class="form-group">
              <label class="form-label">Contact Name</label>
              <input type="text" class="form-input" [(ngModel)]="form.contactName" name="contactName" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" [(ngModel)]="form.email" name="email" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" class="form-input" [(ngModel)]="form.phone" name="phone" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Categories (comma-separated)</label>
            <input type="text" class="form-input" [(ngModel)]="categoriesInput" name="categories" placeholder="e.g., Concrete, Steel, Timber" />
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-input" [(ngModel)]="form.notes" name="notes" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="cancelForm()">Cancel</button>
            <button type="submit" class="btn btn-primary">{{ editingSupplier() ? 'Update' : 'Create' }}</button>
          </div>
        </form>
      </div>
    }

    <div class="card">
      @if (suppliers().length === 0) {
        <p class="empty-state">No suppliers yet. Add your first supplier to get started.</p>
      } @else {
        <table class="table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Categories</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (supplier of suppliers(); track supplier.id) {
              <tr>
                <td>{{ supplier.companyName }}</td>
                <td>{{ supplier.contactName || '-' }}</td>
                <td>{{ supplier.email || '-' }}</td>
                <td>{{ supplier.phone || '-' }}</td>
                <td>
                  @if (supplier.categories?.length) {
                    @for (cat of supplier.categories; track cat) {
                      <span class="badge badge-draft">{{ cat }}</span>
                    }
                  } @else {
                    -
                  }
                </td>
                <td>
                  <button class="btn-icon" (click)="editSupplier(supplier)">Edit</button>
                  <button class="btn-icon btn-danger-text" (click)="deleteSupplier(supplier.id)">Delete</button>
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

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
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

    .badge {
      margin-right: 0.25rem;
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
export class SupplierListComponent implements OnInit {
  private api = inject(ApiService);

  suppliers = signal<Supplier[]>([]);
  showForm = signal(false);
  editingSupplier = signal<Supplier | null>(null);

  form = {
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    notes: ''
  };
  categoriesInput = '';

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.api.get<Supplier[]>('/suppliers').subscribe({
      next: (suppliers) => this.suppliers.set(suppliers)
    });
  }

  saveSupplier(): void {
    const categories = this.categoriesInput
      ? this.categoriesInput.split(',').map(c => c.trim()).filter(c => c)
      : undefined;

    const data = { ...this.form, categories };

    if (this.editingSupplier()) {
      this.api.put<Supplier>(`/suppliers/${this.editingSupplier()!.id}`, data).subscribe({
        next: () => {
          this.loadSuppliers();
          this.cancelForm();
        }
      });
    } else {
      this.api.post<Supplier>('/suppliers', data).subscribe({
        next: () => {
          this.loadSuppliers();
          this.cancelForm();
        }
      });
    }
  }

  editSupplier(supplier: Supplier): void {
    this.editingSupplier.set(supplier);
    this.form = {
      companyName: supplier.companyName,
      contactName: supplier.contactName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      notes: supplier.notes || ''
    };
    this.categoriesInput = supplier.categories?.join(', ') || '';
    this.showForm.set(true);
  }

  deleteSupplier(id: number): void {
    if (confirm('Are you sure you want to delete this supplier?')) {
      this.api.delete(`/suppliers/${id}`).subscribe({
        next: () => this.loadSuppliers()
      });
    }
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingSupplier.set(null);
    this.form = { companyName: '', contactName: '', email: '', phone: '', notes: '' };
    this.categoriesInput = '';
  }
}
