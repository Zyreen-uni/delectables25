const PALETTES = {
  success: 'bg-emerald-600',
  error: 'bg-rose-600',
  warn: 'bg-amber-500',
  info: 'bg-stone-800',
};
const ICONS = { success: '✅', error: '⚠️', warn: '⚠️', info: 'ℹ️' };

export default function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[70] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((toast) => {
        const kind = PALETTES[toast.type] ? toast.type : 'info';
        return (
          <div
            key={toast.id}
            role="status"
            onClick={() => onDismiss(toast.id)}
            className={
              'pointer-events-auto flex cursor-pointer items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ring-1 ring-black/5 ' +
              PALETTES[kind]
            }
          >
            <span className="shrink-0">{ICONS[kind]}</span>
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
