/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MatchConfidence = 'VERY_HIGH' | 'HIGH' | 'POSSIBLE' | 'LOW';

export type SearchTypeOption =
  | 'ALL'
  | 'NAME'
  | 'BANK_NAME'
  | 'ACCOUNT_NUMBER'
  | 'COMPANY_NAME'
  | 'MOBILE_NUMBER'
  | 'PAN'
  | 'IDENTIFIER'
  | 'OTHER';

export interface RecordItem {
  id: string;
  hunterId?: string;
  name?: string;
  bankName?: string;
  accountNumber?: string;
  company?: string;
  mobile?: string;
  pan?: string;
  status?: string;
  notes?: string;
  uploadedBy?: string;
  uploadDate?: string;
  lastUpdated?: string;
  // Dynamic arbitrary columns from CSV
  rawColumns: Record<string, string>;
}

export interface CSVMetadata {
  fileName: string;
  fileSize: string;
  recordCount: number;
  columnCount: number;
  bankCount: number;
  uploadedAt: string;
  uploadedBy?: string;
  uploadDate?: string;
  headers: string[];
  isDemo: boolean;
  status: 'ACTIVE' | 'EMPTY' | 'INDEXING' | 'ERROR';
  detectedNameCol?: string;
  detectedBankCol?: string;
  errorMessage?: string;
  storagePath?: string;
  downloadUrl?: string;
  archivePath?: string;
}

export interface SearchResultItem {
  record: RecordItem;
  score: number; // 0 to 100
  confidence: MatchConfidence;
  matchedFields: {
    field: string;
    value: string;
    score: number;
  }[];
  primaryMatchedField: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  searchType: SearchTypeOption;
  threshold: number;
  timestamp: string;
  matchCount: number;
  highestScore: number;
}

export interface SearchFilters {
  searchType: SearchTypeOption;
  threshold: number; // default 70
  bankFilter?: string;
  statusFilter?: string;
}

export type ActiveNavPage = 'search' | 'about' | 'login' | 'admin';

export type ApprovalStatus = 'approved' | 'pending' | 'rejected';

export type AdminTab =
  | 'overview'
  | 'approvals'
  | 'manual-records'
  | 'csv-management'
  | 'hunter-search'
  | 'search-history'
  | 'settings';

export interface SubmitterInfo {
  name: string;
  email?: string;
  department?: string;
  notes?: string;
  ipOrAgent?: string;
}

export interface ManualHunterRecord {
  id: string;
  hunterId: string;
  bankName: string;
  name: string;
  status: string;
  remarks: string;
  notes?: string;
  accountNumber?: string;
  mobile?: string;
  pan?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  rawColumns?: Record<string, string>;
  // Approval Workflow Fields
  orgType?: 'Bank' | 'NBFC';
  approvalStatus?: ApprovalStatus;
  submittedBy?: SubmitterInfo;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  isUpdateRequest?: boolean;
  targetRecordId?: string;
  previousRecordSnapshot?: {
    hunterId?: string;
    bankName?: string;
    name?: string;
    status?: string;
    remarks?: string;
    accountNumber?: string;
    mobile?: string;
    pan?: string;
    rawColumns?: Record<string, string>;
  };
}

export interface AdminSession {
  isAuthenticated: boolean;
  username: string;
  name: string;
  role: string;
  system: string;
  loginTime: string;
  token: string;
}

export interface CSVValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  duplicateCount: number;
  detectedHeaders: string[];
  missingColumns: string[];
  warningMessage?: string;
  errorMessage?: string;
}

export interface VisitorStats {
  totalVisits: number;
  todayVisits: number;
  lastVisit?: string;
  uniqueSessions?: number;
}

export type LiveSyncStatus = 'connected' | 'reconnecting' | 'error' | 'loading';

