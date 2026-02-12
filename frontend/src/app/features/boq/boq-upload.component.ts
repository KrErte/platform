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
            <span class="progress-text">{{ uploadProgress() }}% uploaded</span>
          </div>
        } @else {
          <div class="dropzone-content">
            <div class="upload-icon-wrapper">
              <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p class="upload-title">Drag and drop your BOQ file here</p>
            <p class="upload-or">or</p>
            <label class="btn btn-primary file-label">
              Browse Files
              <input
                type="file"
                hidden
                accept=".xlsx,.xls,.csv"
                (change)="onFileSelected($event)" />
            </label>
            <p class="supported-formats">Supported: .xlsx, .xls, .csv (max 10MB)</p>
          </div>
        }
      </div>

      <!-- Error Display -->
      @if (error()) {
        <div class="alert alert-error">
          <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {{ error() }}
        </div>
      }

      <!-- Column Mapping Confirmation -->
      @if (uploadResult() && uploadResult()!.requiresConfirmation) {
        <div class="mapping-section animate-slideUp">
          <div class="mapping-header">
            <h3>Column Mapping Confirmation</h3>
            <span class="confidence-overall" [class]="getOverallConfidenceClass()">
              {{ (uploadResult()!.overallConfidence * 100).toFixed(0) }}% confidence
            </span>
          </div>
          <p class="mapping-description">
            Some columns could not be automatically detected with high confidence.
            Please review and confirm the mappings below.
          </p>

          <div class="mapping-grid">
            @for (mapping of uploadResult()!.columnMappings; track mapping.targetField) {
              <div class="mapping-row" [class.low-confidence]="mapping.confidence < 0.7">
                <label class="mapping-label">{{ getFieldLabel(mapping.targetField) }}</label>
                <select
                  [ngModel]="confirmedMappings()[mapping.targetField]"
                  (ngModelChange)="updateMapping(mapping.targetField, $event)"
                  class="form-input mapping-select">
                  <option [ngValue]="-1">-- Not Mapped --</option>
                  @for (header of availableHeaders(); track header.index) {
                    <option [ngValue]="header.index">
                      {{ header.name }} (Col {{ header.index + 1 }})
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
          <div class="preview-section">
            <h4>Preview ({{ uploadResult()!.previewItems.length }} rows)</h4>
            <div class="preview-table-container">
              <table class="table preview-table">
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
                      <td class="desc-cell">{{ item.description || '-' }}</td>
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
          </div>

          <!-- Warnings -->
          @if (uploadResult()!.warnings.length > 0) {
            <div class="warnings-section">
              <h4>Warnings ({{ uploadResult()!.warnings.length }})</h4>
              <ul class="warnings-list">
                @for (warning of uploadResult()!.warnings.slice(0, 5); track warning) {
                  <li>{{ warning }}</li>
                }
              </ul>
              @if (uploadResult()!.warnings.length > 5) {
                <p class="more-warnings">+ {{ uploadResult()!.warnings.length - 5 }} more warnings</p>
              }
            </div>
          }

          <div class="form-actions">
            <button class="btn btn-secondary" (click)="cancelUpload()">Cancel</button>
            <button class="btn btn-primary" (click)="confirmMappings()" [disabled]="isConfirming()">
              @if (isConfirming()) {
                <span class="spinner"></span>
                Importing...
              } @else {
                Confirm and Import
              }
            </button>
          </div>
        </div>
      }

      <!-- Success Message -->
      @if (uploadResult() && !uploadResult()!.requiresConfirmation) {
        <div class="alert alert-success animate-slideUp">
          <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Successfully imported {{ uploadResult()!.totalRowsParsed }} items from {{ uploadResult()!.filename }}
        </div>
      }
    </div>
  `,
  styles: [`
    .upload-container {
      padding: 0;
    }

    .dropzone {
      border: 2px dashed var(--primary-color);
      border-radius: var(--radius-md);
      padding: 3rem 2rem;
      text-align: center;
      transition: all 0.2s ease;
      background-color: rgba(99, 102, 241, 0.05);
      cursor: pointer;
    }

    .dropzone:hover {
      background-color: rgba(99, 102, 241, 0.1);
      border-color: var(--primary-hover);
    }

    .dropzone.dragover {
      border-color: var(--primary-color);
      background-color: rgba(99, 102, 241, 0.15);
      box-shadow: var(--glow-primary);
      animation: pulse-glow 1.5s infinite;
    }

    .dropzone.uploading {
      border-style: solid;
      border-color: var(--primary-color);
      cursor: default;
    }

    @keyframes pulse-glow {
      0%, 100% {
        box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
      }
      50% {
        box-shadow: 0 0 35px rgba(99, 102, 241, 0.5);
      }
    }

    .dropzone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .upload-icon-wrapper {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      background: var(--primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }

    .upload-icon {
      width: 2rem;
      height: 2rem;
      color: white;
    }

    .upload-title {
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .upload-or {
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .supported-formats {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
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
      background-color: var(--border-color);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary-gradient);
      border-radius: var(--radius-full);
      transition: width 0.2s ease;
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
    }

    .progress-text {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .mapping-section {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }

    .mapping-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .mapping-header h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .confidence-overall {
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .mapping-description {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }

    .mapping-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .mapping-row {
      display: grid;
      grid-template-columns: 140px 1fr 70px;
      gap: 1rem;
      align-items: center;
      padding: 0.75rem;
      background-color: var(--table-row-odd);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }

    .mapping-row.low-confidence {
      border-color: var(--warning-color);
      background-color: rgba(245, 158, 11, 0.1);
    }

    .mapping-label {
      font-weight: 500;
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .mapping-select {
      background-color: var(--input-background);
    }

    .confidence-badge {
      padding: 0.375rem 0.625rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      text-align: center;
    }

    .confidence-high {
      background-color: rgba(16, 185, 129, 0.2);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .confidence-medium {
      background-color: rgba(245, 158, 11, 0.2);
      color: #fcd34d;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .confidence-low {
      background-color: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .preview-section {
      margin-top: 1.5rem;
    }

    .preview-section h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .preview-table-container {
      overflow-x: auto;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
    }

    .preview-table {
      margin: 0;
    }

    .desc-cell {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .error-row {
      background-color: rgba(239, 68, 68, 0.1) !important;
    }

    .warnings-section {
      margin-top: 1.5rem;
      padding: 1rem;
      background-color: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: var(--radius-sm);
    }

    .warnings-section h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #fcd34d;
      margin: 0 0 0.75rem 0;
    }

    .warnings-list {
      margin: 0;
      padding-left: 1.25rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .warnings-list li {
      margin-bottom: 0.25rem;
    }

    .more-warnings {
      margin: 0.5rem 0 0 0;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-sm);
      margin-top: 1rem;
    }

    .alert-icon {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
    }

    .alert-success {
      background-color: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .alert-error {
      background-color: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .animate-slideUp {
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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

    const headers: { index: number; name: string }[] = [];
    headersMap.forEach((name, index) => {
      headers.push({ index, name });
    });

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

  getOverallConfidenceClass(): string {
    const result = this.uploadResult();
    if (!result) return 'confidence-low';
    return this.getConfidenceClass(result.overallConfidence);
  }
}
