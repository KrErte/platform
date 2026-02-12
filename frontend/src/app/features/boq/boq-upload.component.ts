import { Component, inject, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpEventType } from '@angular/common/http';
import {
  BoqUploadResponse,
  ColumnMapping,
  ParsedBoqItem
} from '../../shared/models';

@Component({
  selector: 'app-boq-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="upload-container">
      <!-- Drag and Drop Area -->
      <div
        class="dropzone"
        [class.dragover]="isDragOver()"
        [class.uploading]="isUploading()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)">

        @if (isUploading()) {
          <div class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="uploadProgress()"></div>
            </div>
            <span>{{ uploadProgress() }}% uploaded</span>
          </div>
        } @else {
          <div class="dropzone-content">
            <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p>Drag and drop your BOQ file here</p>
            <p class="text-muted">or</p>
            <label class="btn btn-primary file-label">
              Browse Files
              <input
                type="file"
                hidden
                accept=".xlsx,.xls,.csv"
                (change)="onFileSelected($event)" />
            </label>
            <p class="supported-formats">Supported formats: .xlsx, .xls, .csv</p>
          </div>
        }
      </div>

      <!-- Error Display -->
      @if (error()) {
        <div class="alert alert-danger">
          {{ error() }}
        </div>
      }

      <!-- Column Mapping Confirmation -->
      @if (uploadResult() && uploadResult()!.requiresConfirmation) {
        <div class="mapping-section">
          <h3>Column Mapping Confirmation</h3>
          <p class="text-muted">
            Some columns could not be automatically detected with high confidence.
            Please review and confirm the mappings below.
          </p>

          <div class="mapping-grid">
            @for (mapping of uploadResult()!.columnMappings; track mapping.targetField) {
              <div class="mapping-row" [class.low-confidence]="mapping.confidence < 0.7">
                <label>{{ getFieldLabel(mapping.targetField) }}</label>
                <select
                  [ngModel]="confirmedMappings()[mapping.targetField]"
                  (ngModelChange)="updateMapping(mapping.targetField, $event)"
                  class="form-input">
                  <option [ngValue]="-1">-- Not Mapped --</option>
                  @for (header of availableHeaders(); track header.index) {
                    <option [ngValue]="header.index">
                      {{ header.name }} (Column {{ header.index + 1 }})
                    </option>
                  }
                </select>
                <span class="confidence-badge" [class]="getConfidenceClass(mapping.confidence)">
                  {{ (mapping.confidence * 100).toFixed(0) }}%
                </span>
              </div>
            }
          </div>

          <!-- Preview Table -->
          <h4>Preview (first {{ uploadResult()!.previewItems.length }} rows)</h4>
          <div class="preview-table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Item #</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Material</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (item of uploadResult()!.previewItems; track item.rowNumber) {
                  <tr [class.error-row]="item.hasParsingErrors">
                    <td>{{ item.rowNumber }}</td>
                    <td>{{ item.itemNumber || '-' }}</td>
                    <td>{{ item.description || '-' }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ item.unit || '-' }}</td>
                    <td>{{ item.materialType || '-' }}</td>
                    <td>
                      @if (item.hasParsingErrors) {
                        <span class="badge badge-danger" [title]="item.errorMessage || ''">Error</span>
                      } @else {
                        <span class="badge badge-success">OK</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Warnings -->
          @if (uploadResult()!.warnings.length > 0) {
            <div class="warnings">
              <h4>Warnings</h4>
              <ul>
                @for (warning of uploadResult()!.warnings; track warning) {
                  <li>{{ warning }}</li>
                }
              </ul>
            </div>
          }

          <div class="form-actions">
            <button class="btn btn-secondary" (click)="cancelUpload()">Cancel</button>
            <button class="btn btn-primary" (click)="confirmMappings()" [disabled]="isConfirming()">
              {{ isConfirming() ? 'Importing...' : 'Confirm and Import' }}
            </button>
          </div>
        </div>
      }

      <!-- Success Message -->
      @if (uploadResult() && !uploadResult()!.requiresConfirmation) {
        <div class="alert alert-success">
          Successfully imported {{ uploadResult()!.totalRowsParsed }} items from
          {{ uploadResult()!.filename }}
        </div>
      }
    </div>
  `,
  styles: [`
    .upload-container {
      padding: 1rem;
    }

    .dropzone {
      border: 2px dashed var(--border-color, #e2e8f0);
      border-radius: 0.5rem;
      padding: 3rem 2rem;
      text-align: center;
      transition: all 0.2s ease;
      background-color: var(--card-background, #fff);
    }

    .dropzone.dragover {
      border-color: var(--primary-color, #2563eb);
      background-color: rgba(37, 99, 235, 0.05);
    }

    .dropzone.uploading {
      border-style: solid;
    }

    .dropzone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .upload-icon {
      width: 3rem;
      height: 3rem;
      color: var(--text-secondary, #64748b);
      margin-bottom: 1rem;
    }

    .text-muted {
      color: var(--text-secondary, #64748b);
      font-size: 0.875rem;
    }

    .supported-formats {
      font-size: 0.75rem;
      color: var(--text-secondary, #64748b);
      margin-top: 1rem;
    }

    .file-label {
      cursor: pointer;
    }

    .upload-progress {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .progress-bar {
      width: 100%;
      max-width: 300px;
      height: 8px;
      background-color: var(--border-color, #e2e8f0);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: var(--primary-color, #2563eb);
      transition: width 0.2s ease;
    }

    .mapping-section {
      margin-top: 2rem;
    }

    .mapping-section h3 {
      margin-bottom: 0.5rem;
    }

    .mapping-section h4 {
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .mapping-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin: 1rem 0;
    }

    .mapping-row {
      display: grid;
      grid-template-columns: 150px 1fr 60px;
      gap: 1rem;
      align-items: center;
    }

    .mapping-row.low-confidence {
      background-color: rgba(255, 193, 7, 0.1);
      padding: 0.5rem;
      border-radius: 0.25rem;
    }

    .confidence-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-align: center;
    }

    .confidence-high {
      background-color: #d4edda;
      color: #155724;
    }

    .confidence-medium {
      background-color: #fff3cd;
      color: #856404;
    }

    .confidence-low {
      background-color: #f8d7da;
      color: #721c24;
    }

    .preview-table-container {
      overflow-x: auto;
      margin: 1rem 0;
    }

    .error-row {
      background-color: rgba(220, 53, 69, 0.05);
    }

    .warnings {
      background-color: #fff3cd;
      padding: 1rem;
      border-radius: 0.25rem;
      margin: 1rem 0;
    }

    .warnings h4 {
      margin: 0 0 0.5rem 0;
      color: #856404;
    }

    .warnings ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .form-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    .alert {
      padding: 1rem;
      border-radius: 0.25rem;
      margin-top: 1rem;
    }

    .alert-success {
      background-color: #d4edda;
      color: #155724;
    }

    .alert-danger {
      background-color: #f8d7da;
      color: #721c24;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-success {
      background-color: #d4edda;
      color: #155724;
    }

    .badge-danger {
      background-color: #f8d7da;
      color: #721c24;
    }
  `]
})
export class BoqUploadComponent {
  private http = inject(HttpClient);

  projectId = input.required<number>();
  uploadComplete = output<BoqUploadResponse>();

  isDragOver = signal(false);
  isUploading = signal(false);
  isConfirming = signal(false);
  uploadProgress = signal(0);
  uploadResult = signal<BoqUploadResponse | null>(null);
  error = signal<string | null>(null);
  confirmedMappings = signal<Record<string, number>>({});
  availableHeaders = signal<{ index: number; name: string }[]>([]);

  private uploadedFile: File | null = null;

  private readonly fieldLabels: Record<string, string> = {
    'item_number': 'Item Number',
    'description': 'Description',
    'quantity': 'Quantity',
    'unit': 'Unit',
    'material_type': 'Material Type',
    'specification': 'Specification'
  };

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
    }
  }

  private uploadFile(file: File): void {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !['xlsx', 'xls', 'csv'].includes(extension)) {
      this.error.set('Please upload a valid Excel or CSV file');
      return;
    }

    this.uploadedFile = file;
    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.error.set(null);
    this.uploadResult.set(null);

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<BoqUploadResponse>(
      `/api/v1/projects/${this.projectId()}/boq/upload`,
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    ).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((event.loaded / event.total) * 100));
        } else if (event.type === HttpEventType.Response) {
          this.isUploading.set(false);
          const result = event.body!;
          this.uploadResult.set(result);

          if (result.requiresConfirmation) {
            this.initializeMappings(result);
          } else {
            this.uploadComplete.emit(result);
          }
        }
      },
      error: (err) => {
        this.isUploading.set(false);
        this.error.set(err.error?.message || 'Upload failed. Please try again.');
      }
    });
  }

  private initializeMappings(result: BoqUploadResponse): void {
    const mappings: Record<string, number> = {};
    const headersMap = new Map<number, string>();

    result.columnMappings.forEach(mapping => {
      mappings[mapping.targetField] = mapping.columnIndex;
      headersMap.set(mapping.columnIndex, mapping.detectedHeader);
    });

    // Build headers list from detected headers
    const headers: { index: number; name: string }[] = [];
    headersMap.forEach((name, index) => {
      headers.push({ index, name });
    });

    // Sort by index
    headers.sort((a, b) => a.index - b.index);

    this.confirmedMappings.set(mappings);
    this.availableHeaders.set(headers);
  }

  updateMapping(targetField: string, columnIndex: number): void {
    const current = this.confirmedMappings();
    this.confirmedMappings.set({ ...current, [targetField]: columnIndex });
  }

  confirmMappings(): void {
    const result = this.uploadResult();
    if (!result || !this.uploadedFile) return;

    this.isConfirming.set(true);

    const formData = new FormData();
    formData.append('file', this.uploadedFile);
    formData.append('boqId', result.boqId.toString());
    formData.append('columnMappings', JSON.stringify(this.confirmedMappings()));

    this.http.post<BoqUploadResponse>(
      `/api/v1/projects/${this.projectId()}/boq/confirm-mapping`,
      formData
    ).subscribe({
      next: (response) => {
        this.isConfirming.set(false);
        this.uploadResult.set(response);
        this.uploadComplete.emit(response);
      },
      error: (err) => {
        this.isConfirming.set(false);
        this.error.set(err.error?.message || 'Failed to confirm mappings');
      }
    });
  }

  cancelUpload(): void {
    this.uploadResult.set(null);
    this.error.set(null);
    this.uploadedFile = null;
  }

  getFieldLabel(field: string): string {
    return this.fieldLabels[field] || field;
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 0.9) return 'confidence-high';
    if (confidence >= 0.7) return 'confidence-medium';
    return 'confidence-low';
  }
}
