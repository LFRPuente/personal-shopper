import { V, c } from '../utils.js';

const ConfirmDialog = V.memo(function ConfirmDialog({
  confirmDialog,
  overlayBackdropClass,
  overlaySheetClass,
  onDismiss,
  onConfirm,
}) {
  if (!confirmDialog) return null;

  return c.jsx('div', {
    className: overlayBackdropClass(
      'fixed inset-0 z-[96] bg-black/45 flex items-end sm:items-center justify-center p-4 ui-backdrop',
      'confirm',
    ),
    onClick: onDismiss,
    children: c.jsxs('div', {
      className: overlaySheetClass(
        'bg-surface-light dark:bg-surface-dark w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl p-5 ui-sheet',
        'confirm',
      ),
      onClick: (event) => event.stopPropagation(),
      children: [
        c.jsxs('div', {
          className: 'flex items-start gap-3',
          children: [
            c.jsx('div', {
              className: `w-10 h-10 rounded-2xl flex items-center justify-center ${
                confirmDialog.tone === 'danger'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-sky-100 text-sky-700'
              }`,
              children: c.jsx('span', {
                className: 'material-symbols-outlined',
                children:
                  confirmDialog.tone === 'danger' ? 'warning' : 'help',
              }),
            }),
            c.jsxs('div', {
              className: 'flex-1',
              children: [
                c.jsx('h3', {
                  className: 'text-base font-bold text-text-main',
                  children: confirmDialog.title,
                }),
                c.jsx('p', {
                  className: 'text-sm text-text-sub mt-1',
                  children: confirmDialog.message,
                }),
              ],
            }),
          ],
        }),
        c.jsxs('div', {
          className: 'mt-5 grid grid-cols-2 gap-2',
          children: [
            c.jsx('button', {
              onClick: onDismiss,
              className:
                'py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold',
              children: confirmDialog.cancelLabel,
            }),
            c.jsx('button', {
              onClick: onConfirm,
              className: `py-2.5 rounded-xl text-sm font-semibold text-white ${
                confirmDialog.tone === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-primary hover:bg-primary-dark'
              }`,
              children: confirmDialog.confirmLabel,
            }),
          ],
        }),
      ],
    }),
  });
});

export default ConfirmDialog;
