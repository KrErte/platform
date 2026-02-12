export interface User {
  id: number;
  email: string;
  companyName?: string;
  phone?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  companyName?: string;
  userId: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  companyName?: string;
  phone?: string;
}

export interface Supplier {
  id: number;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  categories?: string[];
  notes?: string;
  createdAt: string;
}

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED';

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface BillOfQuantities {
  id: number;
  projectId: number;
  originalFilename: string;
  uploadedAt: string;
  items: BoqItem[];
}

export interface BoqItem {
  id: number;
  boqId: number;
  itemNumber?: string;
  description: string;
  materialType?: string;
  quantity: number;
  unit: string;
  specification?: string;
  notes?: string;
}

export type RfqStatus = 'DRAFT' | 'SENT' | 'RESPONDED' | 'DECLINED';

export interface RfqRequest {
  id: number;
  projectId: number;
  supplierId: number;
  status: RfqStatus;
  sentAt?: string;
  deadline?: string;
  createdAt: string;
  projectName?: string;
  supplierCompanyName?: string;
}

export interface Quote {
  id: number;
  rfqRequestId: number;
  supplierId: number;
  boqItemId: number;
  unitPrice: number;
  totalPrice: number;
  materialDescription?: string;
  deliveryDays?: number;
  notes?: string;
  validUntil?: string;
  createdAt: string;
  boqItemDescription?: string;
  supplierCompanyName?: string;
}

// BOQ Upload Types
export interface ColumnMapping {
  targetField: string;
  detectedHeader: string;
  columnIndex: number;
  confidence: number;
  alternativeHeaders: string[];
}

export interface ParsedBoqItem {
  rowNumber: number;
  itemNumber?: string;
  description: string;
  quantity: number;
  unit: string;
  materialType?: string;
  specification?: string;
  notes?: string;
  hasParsingErrors: boolean;
  errorMessage?: string;
}

export interface BoqUploadResponse {
  boqId: number;
  filename: string;
  totalRowsParsed: number;
  requiresConfirmation: boolean;
  overallConfidence: number;
  columnMappings: ColumnMapping[];
  previewItems: ParsedBoqItem[];
  warnings: string[];
}

export interface ConfirmMappingRequest {
  boqId: number;
  columnMappings: Record<string, number>;
}
