import type { ResultSheet } from '../types';
import { formatDate, officeLabel, score } from '../format';

/**
 * The issued document, rendered so it can be read alongside the paper.
 *
 * Laid out in the same order the printed sheet uses — header block, table,
 * tally, sign-offs — because the reader is comparing the two line by line and
 * a different arrangement makes that harder than it needs to be.
 */
export function SheetView({ sheet }: { sheet: ResultSheet }) {
  const meta: [string, string][] = [
    ['School of Student', sheet.studentSchool.code || sheet.studentSchool.name],
    ['Department', sheet.department.name.toUpperCase()],
    ['Title of Course', sheet.course.title.toUpperCase()],
    ['School Offering Course', sheet.offeringSchool.code || sheet.offeringSchool.name],
    ['Semester', sheet.semesterLabel],
    ['Session', sheet.session],
    [
      'Course Code',
      `${sheet.course.code}${sheet.course.unitLoad !== null ? `   ·   Units: ${sheet.course.unitLoad}` : ''}`,
    ],
    ['Date', formatDate(sheet.generatedAt)],
  ];

  return (
    <section className="rounded-xl border border-neutral-200 bg-white">
      <header className="border-b border-neutral-200 px-5 py-4 text-center">
        <h2 className="text-base font-bold tracking-tight sm:text-lg">
          {sheet.institution.toUpperCase()}
        </h2>
        <p className="text-sm font-semibold">OFFICIAL GRADE REPORT</p>
      </header>

      <dl className="grid gap-x-8 gap-y-2 px-5 py-4 sm:grid-cols-2">
        {meta.map(([label, value]) => (
          <div key={label} className="flex gap-2 text-sm">
            <dt className="shrink-0 text-neutral-500">{label}:</dt>
            <dd className="font-semibold">{value || '—'}</dd>
          </div>
        ))}
      </dl>

      {sheet.partial && (
        <p className="mx-5 mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This copy covers only some of the class, not the whole list.
        </p>
      )}

      {/* Wide on a phone; the page itself must never scroll sideways. */}
      <div className="overflow-x-auto border-y border-neutral-200">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-600">
              <th className="px-3 py-2">SN</th>
              <th className="px-3 py-2">Names</th>
              <th className="px-3 py-2">Reg. No.</th>
              <th className="px-3 py-2">Program</th>
              <th className="px-3 py-2 text-center">Test</th>
              <th className="px-3 py-2 text-center">*Lab</th>
              <th className="px-3 py-2 text-center">Exam</th>
              <th className="px-3 py-2 text-center">Total</th>
              <th className="px-3 py-2 text-center">Grade</th>
              <th className="px-3 py-2 text-center">Remark</th>
            </tr>
          </thead>
          <tbody>
            {sheet.entries.map((entry) => (
              <tr
                key={`${entry.serial}-${entry.registrationNumber}`}
                className={`border-t border-neutral-100 ${entry.voided ? 'text-neutral-400 line-through' : ''}`}
              >
                <td className="px-3 py-1.5">{entry.serial}</td>
                <td className="px-3 py-1.5 uppercase">{entry.fullName}</td>
                <td className="px-3 py-1.5 tabular-nums">{entry.registrationNumber}</td>
                <td className="px-3 py-1.5">{entry.programme}</td>
                <td className="px-3 py-1.5 text-center tabular-nums">{score(entry.test)}</td>
                <td className="px-3 py-1.5 text-center tabular-nums">{score(entry.lab)}</td>
                <td className="px-3 py-1.5 text-center tabular-nums">{score(entry.exam)}</td>
                <td className="px-3 py-1.5 text-center font-semibold tabular-nums">{score(entry.total)}</td>
                <td className="px-3 py-1.5 text-center font-semibold">{entry.grade ?? ''}</td>
                <td className="px-3 py-1.5 text-center">{entry.status ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 px-5 py-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Analysis</h3>
          <ul className="space-y-1 text-sm">
            {Object.entries(sheet.summary.distribution).map(([grade, count]) => (
              <li key={grade} className="text-neutral-700">
                {grade} = {count}
              </li>
            ))}
          </ul>
          <ul className="mt-2 space-y-1 border-t border-neutral-200 pt-2 text-sm">
            <li>Total: {sheet.summary.total}</li>
            <li>Passed: {sheet.summary.totalPass}</li>
            <li>Failed: {sheet.summary.totalFail}</li>
            <li>Average: {sheet.summary.averageTotal}%</li>
            <li className="font-semibold">Pass rate: {sheet.summary.percentagePass}%</li>
            <li className="font-semibold">Fail rate: {sheet.summary.percentageFail}%</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Approvals</h3>
          {sheet.approvals.length === 0 ? (
            <p className="text-sm text-neutral-500">None recorded.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {sheet.approvals.map((approval, index) => (
                <li
                  key={`${approval.role}-${approval.date}-${index}`}
                  className="border-l-2 border-neutral-800 pl-3"
                >
                  <span className="font-semibold">
                    {approval.action === 'REJECTED' ? 'REJECTED' : 'APPROVED'}
                  </span>{' '}
                  — {officeLabel(approval.role, sheet.department, sheet.offeringSchool)}
                  <span className="block text-neutral-500">
                    {formatDate(approval.date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
