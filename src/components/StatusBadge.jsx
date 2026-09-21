const STYLES = {
  pending: { pill: 'bg-amber-100 text-amber-800 ring-amber-300', dot: 'bg-amber-500' },
  confirmed: { pill: 'bg-emerald-100 text-emerald-800 ring-emerald-300', dot: 'bg-emerald-500' },
};

export default function StatusBadge({ status }) {
  const key = STYLES[status] ? status : 'pending';
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ' +
        STYLES[key].pill
      }
    >
      <span className={'h-1.5 w-1.5 rounded-full ' + STYLES[key].dot}></span>
      {key}
    </span>
  );
}
