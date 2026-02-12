import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { Project, BillOfQuantities, BoqItem, Supplier, RfqRequest } from '@shared/models';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/projects" class="back-link">&larr; Back to Projects</a>
        <h1>{{ project()?.name }}</h1>
      </div>
      <span class="badge" [class]="'badge-' + project()?.status?.toLowerCase()">
        {{ project()?.status }}
      </span>
    </div>

    @if (project()?.description) {
      <p class="project-description">{{ project()?.description }}</p>
    }

    <div class="section">
      <div class="section-header">
        <h2>Bill of Quantities</h2>
        <button class="btn btn-primary" (click)="createBoq()">Create BOQ</button>
      </div>

      @if (boqs().length === 0) {
        <div class="card">
          <p class="empty-state">No BOQ uploaded yet.</p>
        </div>
      } @else {
        @for (boq of boqs(); track boq.id) {
          <div class="card boq-card">
            <div class="boq-header">
              <h3>{{ boq.originalFilename }}</h3>
              <span class="upload-date">Uploaded: {{ formatDate(boq.uploadedAt) }}</span>
            </div>

            <button class="btn btn-secondary" (click)="showItemForm.set(boq.id)">Add Item</button>

            @if (showItemForm() === boq.id) {
              <div class="item-form">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Item Number</label>
                    <input type="text" class="form-input" [(ngModel)]="itemForm.itemNumber" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description *</label>
                    <input type="text" class="form-input" [(ngModel)]="itemForm.description" required />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Quantity *</label>
                    <input type="number" class="form-input" [(ngModel)]="itemForm.quantity" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Unit *</label>
                    <input type="text" class="form-input" [(ngModel)]="itemForm.unit" required placeholder="e.g., m3, kg, pcs" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Material Type</label>
                    <input type="text" class="form-input" [(ngModel)]="itemForm.materialType" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Specification</label>
                    <input type="text" class="form-input" [(ngModel)]="itemForm.specification" />
                  </div>
                </div>
                <div class="form-actions">
                  <button type="button" class="btn btn-secondary" (click)="showItemForm.set(null)">Cancel</button>
                  <button type="button" class="btn btn-primary" (click)="saveItem(boq.id)">Add Item</button>
                </div>
              </div>
            }

            @if (boq.items?.length) {
              <table class="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Material</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of boq.items; track item.id) {
                    <tr>
                      <td>{{ item.itemNumber || '-' }}</td>
                      <td>{{ item.description }}</td>
                      <td>{{ item.materialType || '-' }}</td>
                      <td>{{ item.quantity }}</td>
                      <td>{{ item.unit }}</td>
                      <td>
                        <button class="btn-icon btn-danger-text" (click)="deleteItem(item.id)">Delete</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }
      }
    </div>

    <div class="section">
      <div class="section-header">
        <h2>RFQ Requests</h2>
        <button class="btn btn-primary" (click)="showRfqForm.set(true)">Create RFQ</button>
      </div>

      @if (showRfqForm()) {
        <div class="card">
          <h3>Create RFQ Request</h3>
          <div class="form-group">
            <label class="form-label">Select Supplier *</label>
            <select class="form-input" [(ngModel)]="rfqForm.supplierId">
              <option [ngValue]="null">-- Select Supplier --</option>
              @for (supplier of suppliers(); track supplier.id) {
                <option [ngValue]="supplier.id">{{ supplier.companyName }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Deadline</label>
            <input type="datetime-local" class="form-input" [(ngModel)]="rfqForm.deadline" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="showRfqForm.set(false)">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="createRfq()">Create RFQ</button>
          </div>
        </div>
      }

      @if (rfqs().length === 0) {
        <div class="card">
          <p class="empty-state">No RFQ requests yet.</p>
        </div>
      } @else {
        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Sent At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (rfq of rfqs(); track rfq.id) {
                <tr>
                  <td>{{ rfq.supplierCompanyName }}</td>
                  <td>
                    <span class="badge" [class]="'badge-' + rfq.status.toLowerCase()">
                      {{ rfq.status }}
                    </span>
                  </td>
                  <td>{{ rfq.deadline ? formatDate(rfq.deadline) : '-' }}</td>
                  <td>{{ rfq.sentAt ? formatDate(rfq.sentAt) : '-' }}</td>
                  <td>
                    @if (rfq.status === 'DRAFT') {
                      <button class="btn-icon" (click)="sendRfq(rfq.id)">Send</button>
                    }
                    <button class="btn-icon btn-danger-text" (click)="deleteRfq(rfq.id)">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .back-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.875rem;

      &:hover {
        color: var(--primary-color);
      }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;

      h1 {
        margin-top: 0.5rem;
      }
    }

    .project-description {
      color: var(--text-secondary);
      margin-bottom: 2rem;
    }

    .section {
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h2 {
        font-size: 1.125rem;
      }
    }

    .boq-card {
      margin-bottom: 1rem;
    }

    .boq-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h3 {
        font-size: 1rem;
      }

      .upload-date {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    .item-form {
      margin: 1rem 0;
      padding: 1rem;
      background-color: var(--background-color);
      border-radius: 0.375rem;
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
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  projectId!: number;
  project = signal<Project | null>(null);
  boqs = signal<BillOfQuantities[]>([]);
  rfqs = signal<RfqRequest[]>([]);
  suppliers = signal<Supplier[]>([]);

  showItemForm = signal<number | null>(null);
  showRfqForm = signal(false);

  itemForm: Partial<BoqItem> = {
    itemNumber: '',
    description: '',
    materialType: '',
    quantity: 0,
    unit: '',
    specification: ''
  };

  rfqForm: { supplierId: number | null; deadline: string } = {
    supplierId: null,
    deadline: ''
  };

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject();
    this.loadBoqs();
    this.loadRfqs();
    this.loadSuppliers();
  }

  loadProject(): void {
    this.api.get<Project>(`/projects/${this.projectId}`).subscribe({
      next: (project) => this.project.set(project)
    });
  }

  loadBoqs(): void {
    this.api.get<BillOfQuantities[]>(`/projects/${this.projectId}/boq`).subscribe({
      next: (boqs) => this.boqs.set(boqs)
    });
  }

  loadRfqs(): void {
    this.api.get<RfqRequest[]>('/rfq').subscribe({
      next: (rfqs) => this.rfqs.set(rfqs.filter(r => r.projectId === this.projectId))
    });
  }

  loadSuppliers(): void {
    this.api.get<Supplier[]>('/suppliers').subscribe({
      next: (suppliers) => this.suppliers.set(suppliers)
    });
  }

  createBoq(): void {
    const filename = prompt('Enter BOQ filename:', 'boq.xlsx');
    if (filename) {
      this.api.post<BillOfQuantities>(`/projects/${this.projectId}/boq?filename=${encodeURIComponent(filename)}`, {}).subscribe({
        next: () => this.loadBoqs()
      });
    }
  }

  saveItem(boqId: number): void {
    this.api.post<BoqItem>(`/boq/${boqId}/items`, this.itemForm).subscribe({
      next: () => {
        this.loadBoqs();
        this.showItemForm.set(null);
        this.itemForm = { itemNumber: '', description: '', materialType: '', quantity: 0, unit: '', specification: '' };
      }
    });
  }

  deleteItem(itemId: number): void {
    if (confirm('Delete this item?')) {
      this.api.delete(`/boq/items/${itemId}`).subscribe({
        next: () => this.loadBoqs()
      });
    }
  }

  createRfq(): void {
    if (!this.rfqForm.supplierId) {
      alert('Please select a supplier');
      return;
    }

    this.api.post<RfqRequest>('/rfq', {
      projectId: this.projectId,
      supplierId: this.rfqForm.supplierId,
      deadline: this.rfqForm.deadline || null
    }).subscribe({
      next: () => {
        this.loadRfqs();
        this.showRfqForm.set(false);
        this.rfqForm = { supplierId: null, deadline: '' };
      }
    });
  }

  sendRfq(rfqId: number): void {
    this.api.post<RfqRequest>(`/rfq/${rfqId}/send`, {}).subscribe({
      next: () => this.loadRfqs()
    });
  }

  deleteRfq(rfqId: number): void {
    if (confirm('Delete this RFQ?')) {
      this.api.delete(`/rfq/${rfqId}`).subscribe({
        next: () => this.loadRfqs()
      });
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
