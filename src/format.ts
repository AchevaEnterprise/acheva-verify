/** dd/mm/yyyy, matching the printed sheet. */
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

/** The office that signed, named to its unit exactly as the sheet prints it. */
export function officeLabel(
  role: string,
  department: { code: string; name: string },
  offeringSchool: { code: string; name: string },
): string {
  const unit = (org: { code: string; name: string }) => org.code || org.name || '—';
  if (role === 'HOD') return `HOD ${unit(department)}`;
  if (role === 'DEAN') return `Dean of ${unit(offeringSchool)}`;
  if (role === 'COURSE_COORDINATOR') return 'Examiner(s)';
  return role;
}

/** Blank rather than 0 — an unscored cell is empty on the paper too. */
export function score(value: number | null): string {
  return value === null || value === undefined ? '' : String(value);
}
