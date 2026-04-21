import { V, c } from '../utils.js';

export const REVIEW_CONVERSATION_MODAL_REQUIRED_PROPS = [
  'reviewConversationEntry',
  'reviewConversationScrollRef',
  'dismissActiveOverlayRef',
  'overlayBackdropClass',
  'overlaySheetClass',
  'J',
  'users',
  'currentConversationStatusActions',
  'altUploadTargetStatus',
  'setAltUploadTargetStatus',
  'altUploadDescription',
  'setAltUploadDescription',
  'altUploadFiles',
  'pickAlternativeUploadImages',
  'sendReviewAlternatives',
  'reviewConversationWahaEnabled',
  'setReviewConversationWahaEnabled',
  'reviewConversationRecipientIds',
  'setReviewConversationRecipientIds',
  'setFullscreenImage',
  'resolveMediaUrl',
  'getReviewFlowLabel',
];

const ReviewConversationModal = V.memo(function ReviewConversationModal({
  reviewConversationEntry,
  reviewConversationScrollRef,
  dismissActiveOverlayRef,
  overlayBackdropClass,
  overlaySheetClass,
  J,
  users = [],
  currentConversationStatusActions,
  altUploadTargetStatus,
  setAltUploadTargetStatus,
  altUploadDescription,
  setAltUploadDescription,
  altUploadFiles,
  pickAlternativeUploadImages,
  sendReviewAlternatives,
  reviewConversationWahaEnabled,
  setReviewConversationWahaEnabled,
  reviewConversationRecipientIds,
  setReviewConversationRecipientIds,
  setFullscreenImage,
  resolveMediaUrl,
  getReviewFlowLabel,
}) {
  if (!reviewConversationEntry) return null;

  const onDismiss = () => {
    if (dismissActiveOverlayRef && dismissActiveOverlayRef.current) {
      dismissActiveOverlayRef.current();
    }
  };

  const messages = [...((reviewConversationEntry.review && reviewConversationEntry.review.messages) || [])].sort(
    (o, N) => new Date(o.created_at || 0).getTime() - new Date(N.created_at || 0).getTime(),
  );
  const selectedRecipientSet = new Set((reviewConversationRecipientIds || []).map((value) => Number(value)));
  const selectableUsers = (users || []).filter((user) => user && user.id);

  const toggleRecipient = (userId) => {
    const numericId = Number(userId);
    if (!numericId) return;
    setReviewConversationRecipientIds((values) => {
      const next = new Set((values || []).map((value) => Number(value)));
      next.has(numericId) ? next.delete(numericId) : next.add(numericId);
      return Array.from(next);
    });
  };

  return c.jsx('div', {
    className: overlayBackdropClass(
      'fixed inset-0 z-[79] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 ui-backdrop',
      'review-conversation',
    ),
    onClick: onDismiss,
    children: c.jsxs('div', {
      className: overlaySheetClass(
        'w-full sm:max-w-lg max-h-[82vh] bg-surface-light dark:bg-surface-dark rounded-t-3xl sm:rounded-2xl border border-border-light dark:border-border-dark shadow-2xl overflow-hidden ui-sheet flex flex-col',
        'review-conversation',
      ),
      onClick: (event) => event.stopPropagation(),
      children: [
        c.jsxs('div', {
          className:
            'px-4 py-3 border-b border-border-light dark:border-border-dark flex items-start justify-between gap-3',
          children: [
            c.jsx('p', {
              className: 'text-[11px] text-gray-500 dark:text-slate-400',
              children:
                (reviewConversationEntry.product && reviewConversationEntry.product.name) ||
                'Producto',
            }),
            c.jsx('button', {
              onClick: onDismiss,
              className:
                'w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center justify-center',
              children: c.jsx('span', {
                className: 'material-symbols-outlined text-[18px]',
                children: 'close',
              }),
            }),
          ],
        }),
        c.jsx('div', {
          ref: reviewConversationScrollRef,
          className: 'px-3 py-2 flex-1 overflow-y-auto ios-scroll',
          children:
            messages.length > 0
              ? messages.map((message) => {
                  const isCurrentUser =
                    (J && message.sender && Number(message.sender) === Number(J.id)) ||
                    (J &&
                      message.sender_username &&
                      String(message.sender_username).toLowerCase() === String(J.username || '').toLowerCase());
                  return c.jsxs(
                    'div',
                    {
                      className: `w-full flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${
                        isCurrentUser ? 'mt-1' : 'mt-0.5'
                      }`,
                      children: [
                        c.jsxs('div', {
                          className:
                            `max-w-[88%] rounded-2xl px-3 py-2 ${
                              isCurrentUser
                                ? 'ml-auto bg-primary text-white rounded-br-md'
                                : 'mr-auto bg-white/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-md'
                            }`,
                          children: [
                            c.jsxs('div', {
                              className:
                                `flex items-center gap-2 text-[10px] mb-0.5 ${
                                  isCurrentUser
                                    ? 'justify-end text-white/70'
                                    : 'justify-between text-slate-400 dark:text-slate-500'
                                }`,
                              children: [
                                !isCurrentUser &&
                                  c.jsxs('span', {
                                    className: 'font-semibold text-slate-700 dark:text-slate-100',
                                    children: [
                                      message.sender_username || 'Usuario',
                                      ' • ',
                                      message.sender_role || 'AV',
                                    ],
                                  }),
                                c.jsx('span', {
                                  className: isCurrentUser ? 'inline-flex items-center gap-1 text-white/70' : '',
                                  children: isCurrentUser
                                    ? [
                                        message.created_at ? new Date(message.created_at).toLocaleString() : '',
                                        c.jsx(
                                          'span',
                                          {
                                            className: 'material-symbols-outlined text-[12px] leading-none',
                                            children: message.seen_by_other ? 'done_all' : 'done',
                                          },
                                          `${message.id}-seen-status`,
                                        ),
                                      ]
                                    : message.created_at
                                      ? new Date(message.created_at).toLocaleString()
                                      : '',
                                }),
                              ],
                            }),
                            (message.from_status || message.to_status) &&
                              c.jsx('p', {
                                className: `mb-1 text-[10px] font-semibold ${
                                  isCurrentUser
                                    ? 'text-white/80 text-right'
                                    : 'text-primary/80 dark:text-sky-300/80'
                                }`,
                                children:
                                  message.from_status &&
                                  message.to_status &&
                                  message.from_status !== message.to_status
                                    ? `${getReviewFlowLabel(message.from_status)} -> ${getReviewFlowLabel(message.to_status)}`
                                    : getReviewFlowLabel(message.to_status || message.from_status),
                              }),
                            message.message &&
                              c.jsx('p', {
                                className:
                                  `text-[12px] leading-relaxed whitespace-pre-wrap break-words ${
                                    isCurrentUser ? 'text-white text-right' : 'text-slate-700 dark:text-slate-200'
                                  }`,
                                children: message.message,
                              }),
                            (message.attachments || []).length > 0 &&
                              c.jsx('div', {
                                className: `mt-1.5 flex flex-wrap gap-1.5 ${isCurrentUser ? 'justify-end' : ''}`,
                                children: (message.attachments || []).map((attachment) =>
                                  c.jsx(
                                    'button',
                                    {
                                      onClick: () =>
                                        setFullscreenImage({
                                          url: resolveMediaUrl(attachment.file),
                                          copyOnClick: !0,
                                          copyMessage: 'Imagen copiada.',
                                        }),
                                      className:
                                        'w-14 h-14 overflow-hidden rounded-lg border border-white/20 dark:border-slate-700 bg-white dark:bg-slate-950',
                                      children: c.jsx('img', {
                                        src: resolveMediaUrl(attachment.file),
                                        className: 'w-full h-full object-cover',
                                      }),
                                    },
                                    attachment.id,
                                  ),
                                ),
                              }),
                          ],
                        }),
                      ],
                    },
                    message.id,
                  );
                })
              : c.jsx('p', {
                  className: 'text-sm text-center text-gray-500 dark:text-slate-400 py-8',
                  children: 'No hay mensajes guardados en esta revision.',
                }),
        }),
        c.jsxs('div', {
          className:
            'border-t border-border-light dark:border-border-dark px-3 py-3 bg-white/88 dark:bg-slate-950/40 space-y-2.5',
          children: [
            c.jsxs('div', {
              className: 'flex items-center justify-between gap-2',
              children: [
                c.jsxs('div', {
                  className: 'flex items-center gap-1.5',
                  children: currentConversationStatusActions.map((action) =>
                    c.jsx(
                      'button',
                      {
                        type: 'button',
                        onClick: () => setAltUploadTargetStatus(action.value),
                        className:
                          `px-2.5 py-1.5 rounded-full text-[11px] font-medium border ${
                            altUploadTargetStatus === action.value
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white/92 dark:bg-slate-900/92 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`,
                        children: action.label,
                      },
                      action.value,
                    ),
                  ),
                }),
                c.jsxs('button', {
                  type: 'button',
                  onClick: pickAlternativeUploadImages,
                  className:
                    'shrink-0 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/92 dark:bg-slate-900/92 text-[11px] font-medium text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
                  children: ['Adjuntar', altUploadFiles.length > 0 ? ` (${altUploadFiles.length})` : ''],
                }),
              ],
            }),
            c.jsx('textarea', {
              rows: 1,
              value: altUploadDescription,
              onChange: (event) => setAltUploadDescription(event.target.value),
              onKeyDown: (event) => {
                if (event.key !== 'Enter' || event.shiftKey) return;
                event.preventDefault();
                sendReviewAlternatives({ closeAfterSave: !1 });
              },
              onInput: (event) => {
                event.target.style.height = '0px';
                event.target.style.height = `${Math.min(event.target.scrollHeight, 128)}px`;
              },
              placeholder: 'Comentario opcional para este cambio',
              className:
                'w-full min-h-[38px] max-h-32 px-3 py-2 text-xs border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary resize-none overflow-y-auto ios-scroll',
            }),
            c.jsxs('div', {
              className:
                'flex items-center justify-between gap-3 rounded-xl border border-border-light dark:border-border-dark bg-white/85 dark:bg-slate-950/30 px-3 py-2',
              children: [
                c.jsxs('div', {
                  className: 'min-w-0',
                  children: [
                    c.jsx('p', {
                      className: 'text-[11px] font-semibold text-slate-900 dark:text-slate-100',
                      children: 'Enviar por WAHA',
                    }),
                    c.jsx('p', {
                      className: 'text-[10px] text-slate-500 dark:text-slate-400',
                      children: 'Activa el switch para elegir a qué usuario enviar el mensaje por WAHA.',
                    }),
                  ],
                }),
                c.jsx('button', {
                  type: 'button',
                  role: 'switch',
                  'aria-checked': !!reviewConversationWahaEnabled,
                  onClick: () => setReviewConversationWahaEnabled((value) => !value),
                  className: `relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
                    reviewConversationWahaEnabled
                      ? 'bg-primary border-primary'
                      : 'bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700'
                  }`,
                  children: c.jsx('span', {
                    className: `inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
                      reviewConversationWahaEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`,
                  }),
                }),
              ],
            }),
            reviewConversationWahaEnabled &&
              c.jsxs('div', {
                className: 'space-y-2 rounded-xl border border-border-light dark:border-border-dark bg-slate-50/90 dark:bg-slate-950/25 px-3 py-3',
                children: [
                  c.jsx('p', {
                    className: 'text-[11px] text-slate-500 dark:text-slate-400',
                    children: 'Selecciona a qué usuario enviar el mensaje por WAHA.',
                  }),
                  c.jsx('div', {
                    className: 'grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1',
                  children: selectableUsers.length > 0
                    ? selectableUsers.map((user) => {
                          const profile = user.profile || {};
                          const hasPhone = !!String(profile.phone || '').trim();
                          const userLabel =
                            String(profile.display_name || '').trim() ||
                            String(user.username || '').trim() ||
                            `Usuario ${user.id}`;
                          const checked = selectedRecipientSet.has(Number(user.id));
                          return c.jsx(
                            'button',
                            {
                              type: 'button',
                              onClick: () => hasPhone && toggleRecipient(user.id),
                              disabled: !hasPhone,
                              className: `min-w-0 inline-flex items-center justify-between gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold transition ${
                                checked
                                  ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                              } ${!hasPhone ? 'opacity-50 cursor-not-allowed' : ''}`,
                              children: [
                                c.jsx('span', {
                                  className: 'min-w-0 truncate text-left',
                                  children: userLabel,
                                }),
                                c.jsx('span', {
                                  className: 'material-symbols-outlined text-[14px] leading-none shrink-0',
                                  children: checked ? 'check_circle' : 'radio_button_unchecked',
                                }),
                              ],
                            },
                            user.id,
                          );
                        })
                      : c.jsx('p', {
                          className: 'col-span-2 text-sm text-slate-500 dark:text-slate-400',
                          children: 'No hay usuarios disponibles.',
                        }),
                  }),
                ],
              }),
            c.jsxs('div', {
              className: 'grid grid-cols-2 gap-2',
              children: [
                c.jsx('button', {
                  onClick: onDismiss,
                  className:
                    'py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-xs font-semibold',
                  children: 'Cerrar',
                }),
                c.jsx('button', {
                  onClick: () => sendReviewAlternatives({ closeAfterSave: !1 }),
                  className:
                    'py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-dark',
                  children: 'Enviar',
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
});

export default ReviewConversationModal;
