<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { PROBLEMS, problemsOf, type Problem } from '#lib/kb/problems';

  // issues: problem → its issue URL, from the page's frontmatter.
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, string>> } = $props();

  const groups = $derived(problemsOf(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const total = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket).length);
  const moved = $derived(groups.find((g) => g.problem === 'one-day-move'));
  const filedUnder = $derived(moved ? groups.filter((g) => g.problem !== 'one-day-move' && g.reports.some((r) => moved.reports.includes(r))) : []);
  const issueNo = (url?: string) => (url ? `#${url.split('/').pop()}` : 'no issue yet');
</script>

<p class="sum">
  <strong>{total}</strong> reports merged into #{ticket} ·
  <strong>{groups.length}</strong> {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead><tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>issue</th></tr></thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr class:loose={g.problem === 'unplaced'}>
        <td>
          <code>{g.problem}</code>
          {#if g.problem !== 'unplaced'}<br /><span class="what">{PROBLEMS[g.problem].what}</span>{/if}
        </td>
        <td>{g.reports.length}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if g.problem !== 'unplaced' && issues[g.problem]}
            <a href={issues[g.problem]}>{issueNo(issues[g.problem])}</a>
          {:else}
            <span class="none">no issue yet</span>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#if moved}
  {#each filedUnder as g (g.problem)}
    <p class="note">{g.reports.filter((r) => moved.reports.includes(r)).length} of the <code>{g.problem}</code> reports are the <code>one-day-move</code> row: counted where they are filed, and tracked in its own issue too.</p>
  {/each}
{/if}

<style>
  .sum { font-size: 1.1rem; }
  .note { color: var(--muted); font-size: 0.85em; }
  .what { color: var(--muted); font-size: 0.85em; }
  .none, .loose td { color: var(--warn); font-weight: 600; }
</style>
