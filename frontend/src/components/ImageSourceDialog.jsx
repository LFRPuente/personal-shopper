import { V, c } from '../utils.js';

const ImageSourceDialog = V.memo(function ImageSourceDialog({
  imageSourceDialog,
  imageSourceInfoOpen,
  setImageSourceInfoOpen,
  overlayBackdropClass,
  overlaySheetClass,
  dismissActiveOverlayRef,
  pickImageFromDevice,
  pickImageFromClipboard,
}) {
  if (!imageSourceDialog) return null;

  return c.jsx('div', {
    className: overlayBackdropClass(
      'fixed inset-0 z-[99] bg-black/50 flex items-end sm:items-center justify-center p-4 ui-backdrop',
      'image-source',
    ),
    onClick: () => dismissActiveOverlayRef.current(),
    children: c.jsxs('div', {
      className: overlaySheetClass(
        'bg-surface-light dark:bg-surface-dark w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl p-5 sm:p-6 ui-sheet overflow-hidden',
        'image-source',
      ),
      onClick: (event) => event.stopPropagation(),
      children: [
        c.jsxs('div', {
          className:
            'relative overflow-hidden rounded-3xl border border-sky-200/70 dark:border-sky-500/20 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,248,252,0.96))] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_46%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(10,15,29,0.98))] p-4 sm:p-5 flex items-start gap-3',
          children: [
            c.jsx('div', {
              className:
                'w-11 h-11 rounded-2xl grid place-items-center bg-white/90 dark:bg-sky-500/14 text-sky-700 dark:text-sky-300 shadow-sm',
              children: c.jsx('span', {
                className:
                  'material-symbols-outlined inline-flex items-center justify-center leading-none text-[22px]',
                children: 'imagesmode',
              }),
            }),
            c.jsxs('div', {
              className: 'flex-1',
              children: [
                c.jsx('p', {
                  className:
                    'text-[10px] font-black uppercase tracking-[0.18em] text-sky-700/75 dark:text-sky-300/75',
                  children: imageSourceDialog.eyebrow || 'Fuente de imagen',
                }),
                c.jsxs('div', {
                  className: 'mt-1 flex items-center gap-2',
                  children: [
                    c.jsx('h3', {
                      className:
                        'text-lg font-black text-text-main dark:text-white leading-tight',
                      children: imageSourceDialog.title || 'Seleccionar imagen',
                    }),
                    c.jsx('button', {
                      type: 'button',
                      onClick: () =>
                        setImageSourceInfoOpen((value) =>
                          value === 'header' ? null : 'header',
                        ),
                      title:
                        imageSourceDialog.description ||
                        'Elige si quieres tomar la imagen del dispositivo o del portapapeles.',
                      className:
                        'shrink-0 w-5 h-5 rounded-full border border-sky-200 text-sky-700 dark:border-sky-700 dark:text-sky-300 inline-flex items-center justify-center hover:bg-sky-50 dark:hover:bg-sky-950/40 transition',
                      'aria-label': 'Informacion del selector',
                      'aria-expanded': imageSourceInfoOpen === 'header',
                      children: c.jsx('span', {
                        className: 'material-symbols-outlined text-[12px] leading-none',
                        children: 'info',
                      }),
                    }),
                  ],
                }),
                imageSourceInfoOpen === 'header' &&
                  c.jsx('div', {
                    className:
                      'mt-2 rounded-2xl border border-sky-200/80 bg-white/92 px-3 py-2 text-[11px] leading-5 text-sky-900 shadow-sm dark:border-sky-800 dark:bg-slate-950/80 dark:text-sky-100',
                    children:
                      imageSourceDialog.description ||
                      'Elige si quieres tomar la imagen del dispositivo o del portapapeles.',
                  }),
              ],
            }),
          ],
        }),
        c.jsxs('div', {
          className: 'mt-5 grid grid-cols-1 gap-3',
          children: [
            c.jsxs('button', {
              type: 'button',
              onClick: pickImageFromDevice,
              className:
                'group w-full rounded-3xl border border-border-light dark:border-border-dark px-4 py-4 text-left bg-white/88 dark:bg-slate-900/75 hover:bg-white dark:hover:bg-slate-900 transition flex items-center gap-3 shadow-sm hover:shadow-md',
              children: [
                c.jsx('span', {
                  className:
                    'shrink-0 w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-500/14 text-violet-700 dark:text-violet-300 grid place-items-center',
                  children: c.jsx('span', {
                    className:
                      'material-symbols-outlined inline-flex items-center justify-center leading-none text-[24px]',
                    children: 'folder_open',
                  }),
                }),
                c.jsxs('span', {
                  className: 'flex-1 flex flex-col min-w-0',
                  children: [
                    c.jsxs('span', {
                      className: 'flex items-center gap-2 min-w-0',
                      children: [
                        c.jsx('span', {
                          className: 'text-sm font-bold text-text-main dark:text-white truncate',
                          children: imageSourceDialog.deviceLabel || 'Elegir del dispositivo',
                        }),
                        c.jsx('span', {
                          role: 'button',
                          tabIndex: 0,
                          onClick: (event) => {
                            event.stopPropagation();
                            setImageSourceInfoOpen((value) => (value === 'device' ? null : 'device'));
                          },
                          onKeyDown: (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setImageSourceInfoOpen((value) =>
                                value === 'device' ? null : 'device',
                              );
                            }
                          },
                          title:
                            imageSourceDialog.deviceDescription ||
                            (imageSourceDialog.multiple
                              ? 'Abre tu galeria o archivos y selecciona una o varias imagenes.'
                              : 'Abre tu galeria o archivos y selecciona una imagen.'),
                          className:
                            'shrink-0 w-5 h-5 rounded-full border border-violet-200 text-violet-700 dark:border-violet-800 dark:text-violet-300 inline-flex items-center justify-center hover:bg-violet-50 dark:hover:bg-violet-950/40 transition cursor-pointer',
                          children: c.jsx('span', {
                            className: 'material-symbols-outlined text-[12px] leading-none',
                            children: 'info',
                          }),
                        }),
                      ],
                    }),
                    imageSourceInfoOpen === 'device' &&
                      c.jsx('span', {
                        className:
                          'mt-2 rounded-2xl border border-violet-200 bg-white/92 px-3 py-2 text-[11px] leading-5 text-violet-900 shadow-sm dark:border-violet-900 dark:bg-slate-950/80 dark:text-violet-100',
                        children:
                          imageSourceDialog.deviceDescription ||
                          (imageSourceDialog.multiple
                            ? 'Abre tu galeria o archivos y selecciona una o varias imagenes.'
                            : 'Abre tu galeria o archivos y selecciona una imagen.'),
                      }),
                  ],
                }),
                c.jsx('span', {
                  className:
                    'material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-500 transition-transform group-hover:translate-x-0.5',
                  children: 'arrow_forward_ios',
                }),
              ],
            }),
            c.jsxs('button', {
              type: 'button',
              onClick: pickImageFromClipboard,
              className:
                'group w-full rounded-3xl border border-border-light dark:border-border-dark px-4 py-4 text-left bg-white/88 dark:bg-slate-900/75 hover:bg-white dark:hover:bg-slate-900 transition flex items-center gap-3 shadow-sm hover:shadow-md',
              children: [
                c.jsx('span', {
                  className:
                    'shrink-0 w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/14 text-emerald-700 dark:text-emerald-300 grid place-items-center',
                  children: c.jsx('span', {
                    className:
                      'material-symbols-outlined inline-flex items-center justify-center leading-none text-[24px]',
                    children: 'content_paste',
                  }),
                }),
                c.jsxs('span', {
                  className: 'flex-1 flex flex-col min-w-0',
                  children: [
                    c.jsxs('span', {
                      className: 'flex items-center gap-2 min-w-0',
                      children: [
                        c.jsx('span', {
                          className: 'text-sm font-bold text-text-main dark:text-white truncate',
                          children: imageSourceDialog.clipboardLabel || 'Usar portapapeles',
                        }),
                        c.jsx('span', {
                          role: 'button',
                          tabIndex: 0,
                          onClick: (event) => {
                            event.stopPropagation();
                            setImageSourceInfoOpen((value) => (value === 'clipboard' ? null : 'clipboard'));
                          },
                          onKeyDown: (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setImageSourceInfoOpen((value) =>
                                value === 'clipboard' ? null : 'clipboard',
                              );
                            }
                          },
                          title:
                            imageSourceDialog.clipboardDescription ||
                            'Pega la imagen que ya copiaste y usala al instante sin buscar archivos.',
                          className:
                            'shrink-0 w-5 h-5 rounded-full border border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300 inline-flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer',
                          children: c.jsx('span', {
                            className: 'material-symbols-outlined text-[12px] leading-none',
                            children: 'info',
                          }),
                        }),
                      ],
                    }),
                    imageSourceInfoOpen === 'clipboard' &&
                      c.jsx('span', {
                        className:
                          'mt-2 rounded-2xl border border-emerald-200 bg-white/92 px-3 py-2 text-[11px] leading-5 text-emerald-900 shadow-sm dark:border-emerald-900 dark:bg-slate-950/80 dark:text-emerald-100',
                        children:
                          imageSourceDialog.clipboardDescription ||
                          'Pega la imagen que ya copiaste y usala al instante sin buscar archivos.',
                      }),
                  ],
                }),
                c.jsx('span', {
                  className:
                    'material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-500 transition-transform group-hover:translate-x-0.5',
                  children: 'arrow_forward_ios',
                }),
              ],
            }),
          ],
        }),
        c.jsx('button', {
          type: 'button',
          onClick: () => dismissActiveOverlayRef.current(),
          className:
            'mt-4 w-full py-2.5 rounded-2xl border border-border-light dark:border-border-dark bg-white/75 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 text-sm font-semibold text-text-main dark:text-white transition',
          children: 'Cerrar',
        }),
      ],
    }),
  });
});

export default ImageSourceDialog;
