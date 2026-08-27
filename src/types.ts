/** Mirrors `IVerificationResult` in the API. */
export interface VerificationResult {
  status: 'GENUINE' | 'REVOKED' | 'NOT_FOUND';
  serial: string | null;
  kind: string | null;
  issuedAt: string | null;
  contentHash: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  document: ResultSheet | null;
  supersededByNewerRecord: boolean;
}

export interface OrgUnit {
  name: string;
  code: string;
}

export interface SheetEntry {
  serial: number;
  registrationNumber: string;
  fullName: string;
  programme: string;
  test: number | null;
  lab: number | null;
  exam: number | null;
  total: number | null;
  grade: string | null;
  status: 'PASS' | 'FAIL' | null;
  moderated: boolean;
  voided: boolean;
}

export interface ResultSheet {
  institution: string;
  studentSchool: OrgUnit;
  offeringSchool: OrgUnit;
  department: OrgUnit;
  course: { code: string; title: string; unitLoad: number | null };
  session: string;
  semesterLabel: string;
  level: string;
  entries: SheetEntry[];
  summary: {
    total: number;
    totalPass: number;
    totalFail: number;
    averageTotal: number;
    percentagePass: number;
    percentageFail: number;
    distribution: Record<string, number>;
  };
  approvals: { role: string; date: string; action: string }[];
  generatedAt: string;
  partial: boolean;
}
