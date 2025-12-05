export enum AppMode {
  PFX_TO_PEM = 'PFX_TO_PEM',
  PEM_TO_PFX = 'PEM_TO_PFX',
  AI_ANALYSIS = 'AI_ANALYSIS'
}

export interface CertFile {
  name: string;
  content: string; // Base64 or Text
  type: 'pfx' | 'cert' | 'key' | 'ca';
}

export interface ParsedPFX {
  key: string | null;
  cert: string | null;
  ca: string | null;
}

export interface ParsedCertInfo {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
}
