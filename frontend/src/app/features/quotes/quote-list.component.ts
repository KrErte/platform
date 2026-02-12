import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Quote, RfqRequest, Supplier, BoqItem, BillOfQuantities } from '../../shared/models';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="page-header">
      <h1>Quotes</h1>
      <button class="btn btn-primary" (click)="showForm.set(true)">Add Quote</button>
    </div>

    @if (showForm()) {
      <div class="card form-card">
        <h2>Add New Quote</h2>
        <form (ngSubmit)="saveQuote()">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">RFQ Request *</label>
              <select class="form-input" [(ngModel)]="form.rfqRequestId" name="rfqRequestId" (change)="onRfqChange()">
                <option [ngValue]="null">-- Select RFQ --</option>
                @for (rfq of rfqs(); track rfq.id) {
                  <option [ngValue]="rfq.id">{{ rfq.projectName }} - {{ rfq.supplierCompanyName }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Supplier *</label>
              <select class="form-input" [(ngModel)]="form.supplierId" name="supplierId">
                <option [ngValue]="null">-- Select Supplier --</option>
                @for (supplier of suppliers(); track supplier.id) {
                  <option [ngValue]="supplier.id">{{ supplier.companyName }}</option>
                }
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">BOQ Item *</label>
              <select class="form-input" [(ngModel)]="form.boqItemId" name="boqItemId">
                <option [ngValue]="null">-- Select BOQ Item --</option>
                @for (item of boqItems(); track item.id) {
                  <option [ngValue]="item.id">{{ item.itemNumber || '#' }} - {{ item.description }}</option>
                }
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Unit Price *</label>
              <input type="number" step="0.01" class="form-input" [(ngModel)]="form.unitPrice" name="unitPrice" required />
            </div>
            <div class="form-group">
              <label class="form-label">Total Price *</label>
              <input type="number" step="0.01" class="form-input" [(ngModel)]="form.totalPrice" name="totalPrice" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Delivery Days</label>
              <input type="number" class="form-input" [(ngModel)]="form.deliveryDays" name="deliveryDays" />
            </div>
            <div class="form-group">
              <label class="form-label">Valid Until</label>
              <input type="date" class="form-input" [(ngModel)]="form.validUntil" name="validUntil" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Material Description</label>
            <textarea class="form-input" [(ngModel)]="form.materialDescription" name="materialDescription" rows="2"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-input" [(ngModel)]="form.notes" name="notes" rows="2"></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="cancelForm()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Quote</button>
          </div>
        </form>
      </div>
    }

    <div class="card">
      @if (quotes().length === 0) {
        <p class="empty-state">No quotes yet.</p>
      } @else {
        <table class="table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>BOQ Item</th>
              <th>Unit Price</th>
              <th>Total Price</th>
              <th>Delivery</th>
              <th>Valid Until</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (quote of quotes(); track quote.id) {
              <tr>
                <td>{{ quote.supplierCompanyName }}</td>
                <td>{{ quote.boqItemDescription }}</td>
                <td>{{ quote.unitPrice | number:'1.2-2' }}</td>
                <td>{{ quote.totalPrice | number:'1.2-2' }}</td>
                <td>{{ quote.deliveryDays ? quote.deliveryDays + ' days' : '-' }}</td>
                <td>{{ quote.validUntil ? formatDate(quote.validUntil) : '-' }}</td>
                <td>
                  <button class="btn-icon btn-danger-text" (click)="deleteQuote(quote.id)">Delete</button>
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
export class QuoteListComponent implements OnInit {
  private api = inject(ApiService);

  quotes = signal<Quote[]>([]);
  rfqs = signal<RfqRequest[]>([]);
  suppliers = signal<Supplier[]>([]);
  boqItems = signal<BoqItem[]>([]);
  showForm = signal(false);

  form: {
    rfqRequestId: number | null;
    supplierId: number | null;
    boqItemId: number | null;
    unitPrice: number;
    totalPrice: number;
    materialDescription: string;
    deliveryDays: number | null;
    notes: string;
    validUntil: string;
  } = {
    rfqRequestId: null,
    supplierId: null,
    boqItemId: null,
    unitPrice: 0,
    totalPrice: 0,
    materialDescription: '',
    deliveryDays: null,
    notes: '',
    validUntil: ''
  };

  ngOnInit(): void {
    this.loadQuotes();
    this.loadRfqs();
    this.loadSuppliers();
  }

  loadQuotes(): void {
    this.api.get<Quote[]>('/quotes').subscribe({
      next: (quotes) => this.quotes.set(quotes)
    });
  }

  loadRfqs(): void {
    this.api.get<RfqRequest[]>('/rfq').subscribe({
      next: (rfqs) => this.rfqs.set(rfqs)
    });
  }

  loadSuppliers(): void {
    this.api.get<Supplier[]>('/suppliers').subscribe({
      next: (suppliers) => this.suppliers.set(suppliers)
    });
  }

  onRfqChange(): void {
    if (this.form.rfqRequestId) {
      const rfq = this.rfqs().find(r => r.id === this.form.rfqRequestId);
      if (rfq) {
        this.form.supplierId = rfq.supplierId;
        this.api.get<BillOfQuantities[]>(`/projects/${rfq.projectId}/boq`).subscribe({
          next: (boqs) => {
            const items = boqs.flatMap(b => b.items || []);
            this.boqItems.set(items);
          }
        });
      }
    }
  }

  saveQuote(): void {
    if (!this.form.rfqRequestId || !this.form.supplierId || !this.form.boqItemId) {
      alert('Please fill in all required fields');
      return;
    }

    this.api.post<Quote>('/quotes', {
      ...this.form,
      validUntil: this.form.validUntil || null,
      deliveryDays: this.form.deliveryDays || null
    }).subscribe({
      next: () => {
        this.loadQuotes();
        this.cancelForm();
      }
    });
  }

  deleteQuote(id: number): void {
    if (confirm('Delete this quote?')) {
      this.api.delete(`/quotes/${id}`).subscribe({
        next: () => this.loadQuotes()
      });
    }
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.form = {
      rfqRequestId: null,
      supplierId: null,
      boqItemId: null,
      unitPrice: 0,
      totalPrice: 0,
      materialDescription: '',
      deliveryDays: null,
      notes: '',
      validUntil: ''
    };
    this.boqItems.set([]);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
