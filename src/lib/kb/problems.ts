// One problem per thing engineering has to fix. Built on causes.ts, counted the desk's way: every
// report where it is filed (its cause, by tenant). The reports the desk read as a one-day move
// (desk-notes.json) stay counted under the cause they are filed under, and also get their own row,
// because they need their own fix.
import { groupByCause, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day-move';

export const PROBLEMS: Record<Problem, { what: string; fix: string }> = {
  parser: {
    what: 'The shared parser reads every date month first. A day-first tenant gets day and month swapped.',
    fix: "Parse with the tenant's locale, not month first.",
  },
  hint: {
    what: 'booking-v3 prints MM/DD/YYYY under its date field for day-first tenants. People type month first, the form reads it day first.',
    fix: "Print the hint from the tenant's locale on booking-v3.",
  },
  'one-day-move': {
    what: 'The booking moves by one day, not a swap: same meeting on different days in different places, an invite before its booking.',
    fix: 'Look at time zones when the date is stored and sent; not the parser.',
  },
};

export type ProblemGroup = { problem: Problem | 'unplaced'; reports: Report[]; tenants: number; firstSeen: string; lastSeen: string };

export function problemsOf(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  const groups: { problem: ProblemGroup['problem']; reports: Report[] }[] = [
    ...groupByCause(merged, tenantOf).map((g) => ({ problem: g.cause, reports: g.reports })),
    ...(moved.length ? [{ problem: 'one-day-move' as const, reports: moved }] : []),
  ];
  return groups
    .map(({ problem, reports }) => {
      const days = reports.map((r) => r.receivedAt.slice(0, 10)).sort();
      return { problem, reports, tenants: new Set(reports.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1] };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
