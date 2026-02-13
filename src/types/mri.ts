export interface MRIScan {
  id: string;
  patientId: string;
  scanDate: string;
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'completed' | 'failed';
  modality: string; // e.g., 'MRI', 'CT'
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SegmentationResult {
  id: string;
  scanId: string;
  resultUrl: string; // Path to the segmentation file (e.g., NIfTI)
  label: string; // e.g., 'Brain', 'Tumor'
  confidence?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  scans?: MRIScan[];
}
