/**
 * Verity — shared types.
 * No external runtime dependencies beyond Node.js built-ins.
 */

export type VerityStatus = "VERIFIED" | "FAILED" | "UNCERTAIN";

export interface Evidence {
  /** Human-readable description of what was examined. */
  description: string;
  /** Optional file path that was inspected. */
  filePath?: string;
  /** Optional short code excerpt or command output snippet. */
  snippet?: string;
}

export interface CriterionResult {
  id: string;
  text: string;
  status: VerityStatus;
  reason: string;
  evidence: Evidence[];
}

export interface VerityReport {
  generatedAt: string; // ISO 8601
  specFile: string;
  summary: {
    total: number;
    verified: number;
    failed: number;
    uncertain: number;
  };
  results: CriterionResult[];
}
