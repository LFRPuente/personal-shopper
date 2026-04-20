import { V, c, resolveMediaUrl } from '../utils.js';
import { useApp } from '../AppContext.jsx';
import ShoppingClientAssignmentModal from './HomeShoppingClientAssignmentModal.jsx';

export const HOME_SECTION_REQUIRED_CONTEXT = [
  'isDesktopLayout',
  'homeDesktopGridRef',
  'homeDesktopLayout',
  'activeMission',
  'shoppingTabs',
  'shoppingTabLimit',
  'selectShoppingTab',
  'startHomeDesktopResize',
  'requests',
  'openMissionStart',
  'pauseMission',
  'resumeMission',
  'endMission',
  'setMissionSummaryOpen',
  'openMissionTicketPicker',
  'missionTicketUploading',
  'setFullscreenImage',
  'getMissionStoreLabel',
  'activeMissionPayerLabel',
  'missionProductsCount',
  'missionPurchaseCost',
  'missionPurchaseCostWithDiscount',
  'missionTotalWithTaxes',
  'missionTotalWithDiscount',
  'missionHasAnyDiscount',
  'calcDiscount',
  'applyCalcDiscountChange',
  'newRequestText',
  'setNewRequestText',
  'newRequestImagePreview',
  'newRequestImageFile',
  'clearNewRequestImage',
  'pickRequestImage',
  'createMissionRequest',
  'filteredHomeClientsInMission',
  'homeClientSearch',
  'setHomeClientSearch',
  'homeClientMissionTotalsMap',
  'homeClientGlobalBalanceMap',
  'homeClientMissionProductsMap',
  'effectiveHomeClientReviewUnreadMap',
  'openClientFullGallery',
  'copiedClientShareLinks',
  'setCopiedClientShareLinks',
  'copyClientMissionShareLink',
  'openPaymentModal',
  'copiedMissionClients',
  'setCopiedMissionClients',
  'copyAnnotatedMissionBreakdown',
  'formatAmount',
  'updateMissionRequest',
  'deleteMissionRequest',
  'startRequestModify',
  'editingRequestId',
  'editingRequestText',
  'setEditingRequestText',
  'editingRequestClientId',
  'setEditingRequestClientId',
  'editingRequestClientPickerOpen',
  'setEditingRequestClientPickerOpen',
  'editingRequestClientSearch',
  'setEditingRequestClientSearch',
  'editingRequestImagePreview',
  'editingRequestSaving',
  'saveRequestModify',
  'cancelRequestModify',
  'pickEditingRequestImage',
  'clearEditingRequestImage',
  'filteredEditingRequestClients',
  'getClientNameById',
  'getRelativeTime',
];

const money = (value) =>
  Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const HomeSection = V.memo(function HomeSection() {
  const {
    isDesktopLayout,
    homeDesktopGridRef,
    homeDesktopLayout,
    activeMission,
    shoppingTabs,
    shoppingTabLimit,
    selectShoppingTab,
    startHomeDesktopResize,
    requests,
    openMissionStart,
    pauseMission,
    resumeMission,
    endMission,
    setMissionSummaryOpen,
    openMissionTicketPicker,
    missionTicketUploading,
    setFullscreenImage,
    getMissionStoreLabel,
    activeMissionPayerLabel,
    missionProductsCount,
    missionPurchaseCost,
    missionPurchaseCostWithDiscount,
    missionTotalWithTaxes,
    missionTotalWithDiscount,
    missionHasAnyDiscount,
    calcDiscount,
    applyCalcDiscountChange,
    newRequestText,
    setNewRequestText,
    newRequestImagePreview,
    newRequestImageFile,
    clearNewRequestImage,
    pickRequestImage,
    createMissionRequest,
    filteredHomeClientsInMission,
    homeClientSearch,
    setHomeClientSearch,
    homeClientMissionTotalsMap,
    homeClientGlobalBalanceMap,
    homeClientMissionProductsMap,
    effectiveHomeClientReviewUnreadMap,
    openClientFullGallery,
    copiedClientShareLinks,
    setCopiedClientShareLinks,
    copyClientMissionShareLink,
    openPaymentModal,
    copiedMissionClients,
    setCopiedMissionClients,
    copyAnnotatedMissionBreakdown,
    formatAmount,
    updateMissionRequest,
    deleteMissionRequest,
    startRequestModify,
    editingRequestId,
    editingRequestText,
    setEditingRequestText,
    editingRequestClientId,
    setEditingRequestClientId,
    editingRequestClientPickerOpen,
    setEditingRequestClientPickerOpen,
    editingRequestClientSearch,
    setEditingRequestClientSearch,
    editingRequestImagePreview,
    editingRequestSaving,
    saveRequestModify,
    cancelRequestModify,
    pickEditingRequestImage,
    clearEditingRequestImage,
    filteredEditingRequestClients,
    getClientNameById,
    getRelativeTime,
  } = useApp();

  const openShoppingCount = Array.isArray(shoppingTabs) ? shoppingTabs.length : 0;
  const canCreateShopping = openShoppingCount < shoppingTabLimit;
  const [shoppingClientAssignmentModalOpen, setShoppingClientAssignmentModalOpen] = V.useState(false);

  return c.jsxs('div', {
    ref: isDesktopLayout ? homeDesktopGridRef : null,
    className: isDesktopLayout
      ? 'grid gap-0 items-stretch min-h-[720px]'
      : 'flex flex-col gap-0 pb-24 rounded-2xl overflow-hidden shadow-sm border border-border-light dark:border-border-dark',
    style: isDesktopLayout
      ? activeMission
        ? {
            gridTemplateColumns: `minmax(0, ${homeDesktopLayout.left_width_percent}%) 6px minmax(340px, 1fr)`,
            gridTemplateRows: `${homeDesktopLayout.top_height}px 6px minmax(420px, 1fr)`,
          }
        : {
            gridTemplateColumns: 'minmax(0, 1fr)',
            gridTemplateRows: `${homeDesktopLayout.top_height}px 6px minmax(420px, 1fr)`,
          }
      : void 0,
    children: [
      isDesktopLayout &&
        c.jsx('div', {
          className: 'col-start-1 row-start-2 flex items-center justify-center select-none',
          children: c.jsx('button', {
            type: 'button',
            onMouseDown: startHomeDesktopResize('row'),
            className: 'group flex h-[6px] w-full items-center justify-center cursor-row-resize',
            children: c.jsx('span', {
              className: 'block h-1 w-12 rounded-full bg-gray-300 transition group-hover:bg-primary/60 dark:bg-gray-700 dark:group-hover:bg-primary/70',
            }),
          }),
        }),
      isDesktopLayout &&
        activeMission &&
        c.jsx('div', {
          className: 'col-start-2 row-start-1 row-span-3 flex items-center justify-center select-none',
          children: c.jsx('button', {
            type: 'button',
            onMouseDown: startHomeDesktopResize('column'),
            className: 'group flex h-full w-[6px] items-center justify-center cursor-col-resize',
            children: c.jsx('span', {
              className: 'block h-16 w-1 rounded-full bg-gray-300 transition group-hover:bg-primary/60 dark:bg-gray-700 dark:group-hover:bg-primary/70',
            }),
          }),
        }),
      c.jsxs('div', {
        className: isDesktopLayout
          ? 'col-start-1 row-start-3 bg-surface-light dark:bg-surface-dark p-5 rounded-3xl border border-border-light dark:border-border-dark shadow-card min-h-0 h-full overflow-hidden flex flex-col'
          : 'bg-surface-light dark:bg-surface-dark p-3 md:p-4 border-b border-border-light dark:border-border-dark',
        children: [
          c.jsxs('h3', {
            className: 'font-bold text-sm mb-2 text-text-main dark:text-white',
            children: ['Peticiones (', requests.length, ')'],
          }),
          c.jsx('div', {
            className: isDesktopLayout ? 'space-y-2 pr-1 flex-1 min-h-0 overflow-y-auto ios-scroll' : 'space-y-2 pr-1 max-h-[200px] overflow-y-auto ios-scroll',
            children: requests.length === 0
              ? c.jsx('p', { className: 'text-xs text-gray-400 py-3 text-center', children: 'Sin peticiones activas.' })
              : requests.map((request) =>
                  c.jsxs('div', {
                    className: `relative rounded-xl border-l-4 px-3 py-2.5 shadow-sm transition ${
                      request.status === 'ACKNOWLEDGED'
                        ? 'bg-emerald-100/95 border-emerald-500 border-l-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-700 dark:border-l-emerald-500'
                        : request.status === 'NO_STOCK'
                          ? 'bg-rose-100/95 border-rose-500 border-l-rose-700 dark:bg-rose-950/60 dark:border-rose-700 dark:border-l-rose-500'
                          : request.status === 'MODIFIED'
                            ? 'bg-amber-100/95 border-amber-500 border-l-amber-700 dark:bg-amber-950/60 dark:border-amber-700 dark:border-l-amber-500'
                            : request.status === 'DISCARDED'
                              ? 'bg-slate-100/95 border-slate-400 border-l-slate-600 dark:bg-slate-900 dark:border-slate-600 dark:border-l-slate-400'
                              : 'bg-sky-50 border-sky-300 border-l-sky-500 dark:bg-slate-900/70 dark:border-slate-600 dark:border-l-sky-400'
                    }`,
                    children: [
                      editingRequestId === request.id
                        ? c.jsxs('div', {
                            className: 'space-y-2',
                            children: [
                              c.jsx('textarea', {
                                rows: 3,
                                value: editingRequestText,
                                onChange: (event) => setEditingRequestText(event.target.value),
                                className:
                                  'w-full px-2.5 py-2 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary resize-none',
                                placeholder: 'Describe la modificaciÃ³n...',
                              }),
                              c.jsxs('div', {
                                className: 'relative',
                                children: [
                                  c.jsx('button', {
                                    type: 'button',
                                    onClick: () =>
                                      setEditingRequestClientPickerOpen(
                                        (value) => !value,
                                      ),
                                    className:
                                      'w-full rounded-lg border border-slate-300 bg-white/85 px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-white dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-800',
                                    children:
                                      getClientNameById(editingRequestClientId) ||
                                      'Asignar cliente',
                                  }),
                                  editingRequestClientPickerOpen &&
                                    c.jsxs('div', {
                                      className:
                                        'absolute left-0 top-11 z-30 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-xl p-2',
                                      children: [
                                        c.jsx('input', {
                                          type: 'text',
                                          value: editingRequestClientSearch,
                                          onChange: (event) =>
                                            setEditingRequestClientSearch(
                                              event.target.value,
                                            ),
                                          placeholder: 'Buscar cliente...',
                                          className:
                                            'w-full px-2.5 py-2 text-[11px] border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary',
                                        }),
                                        c.jsxs('button', {
                                          type: 'button',
                                          onClick: () => {
                                            setEditingRequestClientId('');
                                            setEditingRequestClientPickerOpen(!1);
                                            setEditingRequestClientSearch('');
                                          },
                                          className:
                                            'mt-2 w-full text-left px-2.5 py-2 rounded-lg text-[11px] font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800',
                                          children: [
                                            'Sin cliente',
                                            getClientNameById(editingRequestClientId)
                                              ? ''
                                              : ' âœ“',
                                          ],
                                        }),
                                        c.jsx('div', {
                                          className:
                                            'mt-1 max-h-44 overflow-y-auto ios-scroll',
                                          children:
                                            filteredEditingRequestClients.length > 0
                                              ? filteredEditingRequestClients.map(
                                                  (client) =>
                                                    c.jsx(
                                                      'button',
                                                      {
                                                        type: 'button',
                                                        onClick: () => {
                                                          setEditingRequestClientId(
                                                            String(client.id),
                                                          );
                                                          setEditingRequestClientPickerOpen(
                                                            !1,
                                                          );
                                                          setEditingRequestClientSearch(
                                                            '',
                                                          );
                                                        },
                                                        className:
                                                          'w-full text-left px-2.5 py-2 rounded-lg text-[11px] font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-slate-800',
                                                        children: client.name,
                                                      },
                                                      `editing-request-client-${client.id}`,
                                                    ),
                                                )
                                              : c.jsx('p', {
                                                  className:
                                                    'px-2.5 py-3 text-[11px] text-gray-400 text-center',
                                                  children:
                                                    'No hay clientes que coincidan.',
                                                }),
                                        }),
                                      ],
                                    }),
                                ],
                              }),
                              editingRequestImagePreview &&
                                c.jsxs('div', {
                                  className:
                                    'flex items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2 text-[11px] text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100',
                                  children: [
                                    c.jsx('p', {
                                      className: 'min-w-0 flex-1 truncate',
                                      children: 'Imagen seleccionada',
                                    }),
                                    c.jsxs('div', {
                                      className: 'flex items-center gap-1.5',
                                      children: [
                                        c.jsx('button', {
                                          type: 'button',
                                          onClick: () =>
                                            setFullscreenImage({
                                              url: editingRequestImagePreview,
                                              copyOnClick: !0,
                                              copyMessage: 'Imagen copiada.',
                                            }),
                                          className:
                                            'rounded-md border border-sky-300 px-2 py-1 font-semibold text-sky-700 dark:border-sky-700 dark:text-sky-200',
                                          children: 'Abrir',
                                        }),
                                        c.jsx('button', {
                                          onClick: clearEditingRequestImage,
                                          className:
                                            'rounded-md border border-sky-300 px-2 py-1 font-semibold text-sky-700 dark:border-sky-700 dark:text-sky-200',
                                          title: 'Quitar imagen',
                                          children: 'Quitar',
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              c.jsxs('div', {
                                className: 'flex items-center gap-2',
                                children: [
                                  c.jsx('button', {
                                    onClick: () => saveRequestModify(request),
                                    disabled:
                                      editingRequestSaving ||
                                      !editingRequestText.trim(),
                                    className: `text-[10px] px-3 py-1.5 rounded-full text-white font-semibold transition ${
                                      editingRequestSaving ||
                                      !editingRequestText.trim()
                                        ? 'bg-amber-300 cursor-not-allowed'
                                        : 'bg-amber-500 hover:bg-amber-600'
                                    }`,
                                    children: editingRequestSaving
                                      ? 'Guardando...'
                                      : 'Guardar',
                                  }),
                                  c.jsx('button', {
                                    onClick: pickEditingRequestImage,
                                    disabled: editingRequestSaving,
                                    className:
                                      'text-[10px] px-3 py-1.5 rounded-lg bg-sky-100 text-sky-700 font-semibold hover:bg-sky-200 transition disabled:opacity-60 disabled:cursor-not-allowed',
                                    children: 'Imagen',
                                  }),
                                  c.jsx('button', {
                                    onClick: cancelRequestModify,
                                    disabled: editingRequestSaving,
                                    className:
                                      'text-[10px] px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition disabled:opacity-60 disabled:cursor-not-allowed',
                                    children: 'X',
                                  }),
                                ],
                              }),
                            ],
                          })
                        : c.jsxs('div', {
                            className: 'flex items-start gap-2',
                            children: [
                              c.jsxs('div', {
                                className: 'min-w-0 flex-1',
                                children: [
                                  c.jsx('p', {
                                    className:
                                      'text-xs font-semibold truncate text-gray-900 dark:text-gray-100',
                                    children: request.description,
                                  }),
                                  c.jsxs('div', {
                                    className: 'mt-1 flex items-center gap-1.5',
                                    children: [
                                      c.jsx('span', {
                                        className: `text-[9px] uppercase font-black tracking-wide px-1.5 py-0.5 rounded ${
                                          request.status === 'ACKNOWLEDGED'
                                            ? 'bg-emerald-700 text-white dark:bg-emerald-500 dark:text-slate-900'
                                            : request.status === 'NO_STOCK'
                                              ? 'bg-rose-700 text-white dark:bg-rose-500 dark:text-slate-900'
                                              : request.status === 'MODIFIED'
                                                ? 'bg-amber-700 text-white dark:bg-amber-500 dark:text-slate-900'
                                                : request.status === 'DISCARDED'
                                                  ? 'bg-slate-600 text-white dark:bg-slate-400 dark:text-slate-900'
                                                  : 'bg-sky-700 text-white dark:bg-sky-500 dark:text-slate-900'
                                        }`,
                                        children:
                                          request.status === 'ACKNOWLEDGED'
                                            ? 'ENTERADO'
                                            : request.status === 'NO_STOCK'
                                              ? 'NO HAY'
                                              : request.status === 'MODIFIED'
                                                ? 'MODIFICADA'
                                                : request.status === 'DISCARDED'
                                                  ? 'DESCARTADA'
                                                  : 'PENDIENTE',
                                      }),
                                      c.jsxs('p', {
                                        className:
                                          'text-[10px] text-gray-700 dark:text-gray-300 truncate',
                                        children: [
                                          request.created_by_username ||
                                            request.created_by_name ||
                                            'Usuario',
                                          ' (',
                                          request.created_by_role || 'AV',
                                          ') â€¢ ',
                                          request.client_name
                                            ? `${request.client_name} â€¢ `
                                            : '',
                                          getRelativeTime(
                                            request.updated_at ||
                                              request.created_at,
                                          ),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              c.jsxs('div', {
                                className: 'shrink-0 flex items-center gap-1',
                                children: [
                                  request.image &&
                                    c.jsx('button', {
                                      onClick: () =>
                                        setFullscreenImage({
                                          url: resolveMediaUrl(request.image),
                                          copyOnClick: !0,
                                          copyMessage: 'Imagen copiada.',
                                        }),
                                      className:
                                        'w-8 h-8 rounded-md border border-slate-300 bg-white/85 text-slate-700 hover:bg-white dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-800 flex items-center justify-center',
                                      title: 'Abrir imagen',
                                      children: c.jsx('span', {
                                        className:
                                          'material-symbols-outlined text-[14px]',
                                        children: 'image',
                                      }),
                                    }),
                                  c.jsx('button', {
                                    onClick: () =>
                                      updateMissionRequest(
                                        request.id,
                                        request.status === 'ACKNOWLEDGED'
                                          ? 'PENDING'
                                          : 'ACKNOWLEDGED',
                                      ),
                                    className:
                                      'w-8 h-8 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200 dark:hover:bg-emerald-900/60 flex items-center justify-center',
                                    title: 'Enterado',
                                    children: c.jsx('span', {
                                      className:
                                        'material-symbols-outlined text-[14px]',
                                      children: 'check',
                                    }),
                                  }),
                                  c.jsx('button', {
                                    onClick: () =>
                                      updateMissionRequest(
                                        request.id,
                                        request.status === 'NO_STOCK'
                                          ? 'PENDING'
                                          : 'NO_STOCK',
                                      ),
                                    className:
                                      'w-8 h-8 rounded-md border border-red-300 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/35 dark:text-red-200 dark:hover:bg-red-900/60 flex items-center justify-center',
                                    title: 'No existencia',
                                    children: c.jsx('span', {
                                      className:
                                        'material-symbols-outlined text-[14px]',
                                      children: 'block',
                                    }),
                                  }),
                                  c.jsx('button', {
                                    onClick: () => startRequestModify(request),
                                    className:
                                      'w-8 h-8 rounded-md border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/35 dark:text-amber-200 dark:hover:bg-amber-900/60 flex items-center justify-center',
                                    title: 'Modificar',
                                    children: c.jsx('span', {
                                      className:
                                        'material-symbols-outlined text-[14px]',
                                      children: 'edit',
                                    }),
                                  }),
                                  c.jsx('button', {
                                    onClick: () => deleteMissionRequest(request.id),
                                    className:
                                      'w-8 h-8 rounded-md border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/35 dark:text-rose-200 dark:hover:bg-rose-900/60 flex items-center justify-center',
                                    title: 'Eliminar',
                                    children: c.jsx('span', {
                                      className:
                                        'material-symbols-outlined text-[14px]',
                                      children: 'delete_forever',
                                    }),
                                  }),
                                ],
                              }),
                            ],
                          }),
                    ],
                  }, request.id),
                ),
          }),
          c.jsxs('div', {
            className: 'mt-3 space-y-2',
            children: [
              newRequestImagePreview &&
                c.jsxs('div', {
                  className: 'flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2 dark:border-sky-800 dark:bg-sky-950/40',
                  children: [
                    c.jsx('img', { src: newRequestImagePreview, className: 'ui-media-frame ui-media-md object-cover' }),
                    c.jsx('p', { className: 'flex-1 text-[11px] text-sky-900 dark:text-sky-100', children: newRequestImageFile && newRequestImageFile.name ? newRequestImageFile.name : 'Imagen seleccionada' }),
                    c.jsx('button', { onClick: clearNewRequestImage, className: 'w-8 h-8 rounded-full border border-sky-300 bg-white text-sky-700 dark:border-sky-700 dark:bg-slate-900 dark:text-sky-200 flex items-center justify-center', children: c.jsx('span', { className: 'material-symbols-outlined text-[16px]', children: 'close' }) }),
                  ],
                }),
              c.jsxs('div', {
                className: 'flex gap-2 items-center flex-wrap sm:flex-nowrap w-full',
                children: [
                  c.jsx('input', { type: 'text', value: newRequestText, onChange: (event) => setNewRequestText(event.target.value), placeholder: 'Nueva peticiÃ³n...', className: 'flex-1 min-w-[120px] px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary w-full' }),
                  c.jsx('button', { onClick: pickRequestImage, className: 'px-3 py-2 rounded-xl border border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-200 flex-shrink-0', children: c.jsx('span', { className: 'material-symbols-outlined text-[18px]', children: 'add_photo_alternate' }) }),
                  c.jsx('button', { onClick: createMissionRequest, disabled: !newRequestText.trim() && !newRequestImageFile, className: `px-4 py-2 rounded-xl text-sm font-semibold transition flex-shrink-0 flex-1 sm:flex-none ${newRequestText.trim() || newRequestImageFile ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`, children: 'Enviar' }),
                ],
              }),
            ],
          }),
      ],
    }),
    !activeMission &&
      c.jsxs('div', {
        className: isDesktopLayout
          ? 'col-start-1 col-span-3 row-start-1 bg-surface-light dark:bg-surface-dark p-6 rounded-3xl border border-dashed border-border-light dark:border-border-dark flex flex-col items-center justify-center text-center h-full'
          : 'bg-surface-light dark:bg-surface-dark px-4 py-8 flex flex-col items-center text-center border-b border-border-light dark:border-border-dark',
        children: [
          c.jsx('div', { className: 'w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4', children: c.jsx('span', { className: 'material-symbols-outlined text-[32px]', children: 'shopping_bag' }) }),
          c.jsx('h3', { className: 'font-bold text-lg text-text-main dark:text-white mb-2', children: 'NingÃºn Shopping Activo' }),
          c.jsx('p', { className: 'text-sm text-gray-500 mb-6 max-w-sm', children: 'Inicia un nuevo shopping en tienda para comenzar a registrar peticiones, compras y separar artÃ­culos.' }),
          c.jsx('button', { onClick: openMissionStart, className: 'px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition shadow-sm', children: 'Comenzar Shopping' }),
        ],
      }),
      activeMission &&
      c.jsxs('div', {
        className: isDesktopLayout
            ? 'col-start-1 row-start-1 bg-surface-light dark:bg-surface-dark p-4 rounded-3xl border border-border-light dark:border-border-dark shadow-card h-full overflow-y-auto'
            : 'bg-surface-light dark:bg-surface-dark px-3 py-3 md:px-4',
          children: [
            c.jsxs('div', {
              className: 'mb-3 flex flex-col gap-2',
              children: [
                c.jsxs('div', {
                  className: isDesktopLayout
                    ? 'flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1 pr-2 ios-scroll'
                    : 'grid grid-cols-3 gap-1.5',
                  children: (shoppingTabs || []).length > 0
                    ? shoppingTabs.map((mission) =>
                        c.jsxs('button', {
                          type: 'button',
                          onClick: () =>
                            typeof selectShoppingTab === 'function'
                              ? selectShoppingTab(mission.id)
                              : null,
                          className: `min-w-0 border text-left transition ${
                            isDesktopLayout
                              ? 'shrink-0 rounded-full px-5 py-2.5'
                              : 'w-full rounded-xl px-2 py-1.5'
                          } ${
                            activeMission && Number(activeMission.id) === Number(mission.id)
                              ? 'border-primary bg-primary text-white shadow-sm'
                              : 'border-border-light bg-white/80 text-text-sub hover:border-primary/40 hover:text-primary dark:border-border-dark dark:bg-slate-900/80 dark:text-slate-300'
                          }`,
                          children: [
                            c.jsx('p', {
                              className: isDesktopLayout
                                ? 'max-w-[240px] truncate text-[13px] font-black leading-tight uppercase tracking-[0.08em]'
                                : 'truncate text-[9px] font-black leading-tight uppercase',
                              children: String(getMissionStoreLabel(mission) || '').toUpperCase(),
                            }),
                            c.jsx('p', {
                              className: isDesktopLayout
                                ? 'mt-0.5 max-w-[240px] truncate text-[10px] font-black uppercase tracking-[0.12em] leading-tight opacity-80'
                                : 'mt-0.5 truncate text-[7px] font-black uppercase tracking-[0.08em] leading-tight opacity-80',
                              children: String(mission?.shopper_name || mission?.shopper_username || mission?.payer_username || 'PS').trim().toUpperCase(),
                            }),
                          ],
                        }, `shopping-tab-${mission.id}`),
                      )
                    : c.jsx('p', {
                        className: 'text-[11px] text-text-sub',
                        children: 'Sin shoppings abiertos.',
                      }),
                }),
              ],
            }),
            c.jsxs('div', {
              className: 'flex items-center justify-between gap-2',
              children: [
                c.jsxs('div', {
                  className: 'min-w-0',
                  children: [
                    c.jsx('h3', { className: isDesktopLayout ? 'truncate font-bold text-lg text-text-main dark:text-white' : 'truncate font-bold text-sm text-text-main dark:text-white', children: 'Shopping en Tienda' }),
                    c.jsx('p', { className: isDesktopLayout ? 'mt-0.5 truncate text-xs text-gray-500' : 'truncate text-[10px] text-gray-500', children: `${getMissionStoreLabel(activeMission)} • ${activeMission.status}${activeMissionPayerLabel ? ` • Paga: ${activeMissionPayerLabel}` : ''}` }),
                  ],
                }),
                c.jsxs('div', {
                  className: 'flex shrink-0 items-center gap-2',
                  children: [
                    c.jsxs('div', {
                      className: 'text-right leading-tight',
                      children: [
                        c.jsx('p', {
                          className: isDesktopLayout
                            ? 'text-sm font-bold text-text-main dark:text-white'
                            : 'text-[10px] font-bold text-text-main dark:text-white',
                          children: [openShoppingCount, '/', shoppingTabLimit, ' abiertos'],
                        }),
                      ],
                    }),
                    c.jsx('button', {
                      type: 'button',
                      onClick: openMissionStart,
                      disabled: !canCreateShopping,
                      className: `${isDesktopLayout ? 'rounded-full px-4 py-2 text-[11px]' : 'rounded-full px-3 py-1.5 text-[10px]'} font-bold transition ${canCreateShopping ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`,
                      title: canCreateShopping
                        ? 'Crear shopping activo'
                        : `Limite actual de ${shoppingTabLimit} shoppings alcanzado.`,
                      children: 'Nuevo',
                    }),
                  ],
                }),
              ],
            }),
            c.jsxs('div', {
              className: isDesktopLayout ? 'mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_170px] gap-2 items-stretch' : 'mt-2 grid grid-cols-3 gap-2 items-stretch',
              children: [
                c.jsxs('div', {
                  className: isDesktopLayout
                    ? 'flex-1 min-w-0 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-right'
                    : 'min-w-0 rounded-xl border border-sky-200 bg-sky-50 px-2 py-2 text-right dark:border-sky-800 dark:bg-sky-950/35',
                  children: [
                    c.jsx('p', {
                      className: isDesktopLayout
                        ? 'text-[8px] font-black uppercase tracking-[0.12em] text-white/70'
                        : 'text-[8px] font-black uppercase tracking-[0.12em] text-sky-700 dark:text-sky-300',
                      children: 'COMPRA USD',
                    }),
                    c.jsxs('span', {
                      className: isDesktopLayout
                        ? 'mt-1 block text-[9px] font-semibold text-white leading-none'
                        : 'mt-1 block text-[10px] font-semibold text-slate-900 leading-none dark:text-white',
                      children: ['$', money(missionPurchaseCost)],
                    }),
                    missionHasAnyDiscount &&
                      missionPurchaseCostWithDiscount !== missionPurchaseCost &&
                      c.jsxs('span', {
                        className: isDesktopLayout
                          ? 'mt-0.5 block text-[9px] font-semibold text-white leading-none'
                          : 'mt-0.5 block text-[9px] font-semibold text-slate-700 leading-none dark:text-slate-200',
                        children: ['C/desc $', money(missionPurchaseCostWithDiscount)],
                      }),
                  ],
                }),
                c.jsxs('div', {
                  className: isDesktopLayout
                    ? 'flex-1 min-w-0 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-right'
                    : 'min-w-0 rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-right dark:border-emerald-800 dark:bg-emerald-950/35',
                  children: [
                    c.jsx('p', {
                      className: isDesktopLayout
                        ? 'text-[8px] font-black uppercase tracking-[0.12em] text-white/70'
                        : 'text-[8px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300',
                      children: 'VENTA MXN',
                    }),
                    c.jsxs('span', {
                      className: isDesktopLayout
                        ? 'mt-1 block text-[9px] font-semibold text-white leading-none'
                        : 'mt-1 block text-[10px] font-semibold text-slate-900 leading-none dark:text-white',
                      children: ['$', money(missionTotalWithTaxes)],
                    }),
                    missionHasAnyDiscount &&
                      missionTotalWithDiscount !== missionTotalWithTaxes &&
                      c.jsxs('span', {
                        className: isDesktopLayout
                          ? 'mt-0.5 block text-[9px] font-semibold text-white leading-none'
                          : 'mt-0.5 block text-[9px] font-semibold text-slate-700 leading-none dark:text-slate-200',
                        children: ['C/desc $', money(missionTotalWithDiscount)],
                      }),
                  ],
                }),
                c.jsxs('div', {
                  className: 'min-w-0 rounded-xl border border-amber-200 bg-amber-50 px-2 py-2 dark:border-amber-800 dark:bg-amber-950/20',
                  children: [
                    c.jsx('label', { className: 'block text-[8px] font-black uppercase tracking-[0.1em] text-amber-700 dark:text-amber-300 mb-1', children: 'Descuento (%)' }),
                    c.jsx('input', {
                      type: 'number',
                      step: '0.01',
                      min: '0',
                      value: calcDiscount,
                      onChange: (event) => applyCalcDiscountChange(event.target.value),
                      className: 'w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-[11px] font-bold text-amber-800 caret-amber-800 outline-none focus:ring-2 focus:ring-amber-300 dark:border-amber-800 dark:bg-slate-950 dark:text-amber-100 dark:caret-amber-100',
                    }),
                  ],
                }),
              ],
            }),
            c.jsxs('div', {
              className: isDesktopLayout ? 'mt-3 grid grid-cols-2 xl:grid-cols-4 gap-2' : 'mt-2 grid grid-cols-4 gap-2',
              children: [
                activeMission.status === 'ACTIVE'
                  ? c.jsx('button', { onClick: pauseMission, className: isDesktopLayout ? 'py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600' : 'py-2 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600', children: 'Pause' }, 'pause')
                  : c.jsx('button', { onClick: resumeMission, className: isDesktopLayout ? 'py-1.5 rounded-lg bg-green-600 text-white text-[10px] font-bold hover:bg-green-700' : 'py-2 rounded-lg bg-green-600 text-white text-[11px] font-bold hover:bg-green-700', children: 'Resume' }, 'resume'),
                c.jsx('button', { onClick: endMission, className: isDesktopLayout ? 'py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-bold hover:bg-red-600' : 'py-2 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:bg-red-600', children: 'End' }, 'end'),
                c.jsx('button', { onClick: () => setMissionSummaryOpen(true), className: isDesktopLayout ? 'py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold hover:bg-primary-dark' : 'py-2 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary-dark', children: 'View' }, 'view'),
                c.jsx('button', { onClick: openMissionTicketPicker, disabled: missionTicketUploading, className: `${isDesktopLayout ? 'py-1.5 text-[10px]' : 'py-2 text-[11px]'} rounded-lg text-white font-bold ${missionTicketUploading ? 'bg-purple-400 cursor-wait opacity-80' : 'bg-purple-600 hover:bg-purple-700'}`, children: missionTicketUploading ? 'Subiendo...' : 'Ticket' }, 'ticket'),
              ],
            }),
            c.jsx('div', {
              className: isDesktopLayout ? 'mt-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-2.5' : 'mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-2',
              children: missionTicketUploading
                ? c.jsxs('div', { className: 'flex items-center gap-2 text-purple-700', children: [c.jsx('span', { className: 'material-symbols-outlined animate-spin text-[18px]', children: 'progress_activity' }), c.jsxs('div', { children: [c.jsx('p', { className: 'text-[11px] font-bold', children: 'Subiendo ticket de mision...' }), c.jsx('p', { className: 'text-[10px] text-purple-600', children: 'Se reflejara aqui al terminar la carga.' })] })] })
                : activeMission.ticket_image
                  ? c.jsxs('div', { className: 'flex items-center gap-2', children: [c.jsx('img', { src: resolveMediaUrl(activeMission.ticket_image), className: 'ui-media-frame ui-media-sm object-cover' }), c.jsx('button', { onClick: () => setFullscreenImage(resolveMediaUrl(activeMission.ticket_image)), className: 'text-[11px] font-bold text-primary hover:text-primary-dark', children: 'Ver ticket de misión' })] })
                  : c.jsx('p', { className: 'text-[11px] text-gray-500', children: 'Ticket de misión pendiente.' }),
            }),
          ],
        }),
      activeMission &&
        c.jsxs('div', {
          className: isDesktopLayout
            ? 'col-start-3 row-start-1 row-span-3 bg-surface-light dark:bg-surface-dark p-4 rounded-3xl border border-border-light dark:border-border-dark shadow-card min-h-0 h-full flex flex-col'
            : 'bg-surface-light dark:bg-surface-dark p-3 md:p-4 border-b border-border-light dark:border-border-dark',
          children: [
            c.jsxs('div', {
              className: 'mb-3 flex items-start justify-between gap-3',
              children: [
                c.jsxs('div', {
                  className: 'space-y-1',
                  children: [
                    c.jsxs('h3', {
                      className: 'font-bold text-sm text-text-main dark:text-white',
                      children: ['Clients in Shopping (', filteredHomeClientsInMission.length, ')'],
                    }),
                    c.jsx('input', {
                      type: 'text',
                      value: homeClientSearch,
                      onChange: (event) => setHomeClientSearch(event.target.value),
                      placeholder: 'Buscar client...',
                      className: 'w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary',
                    }),
                  ],
                }),
                c.jsx('button', {
                  type: 'button',
                  onClick: () => setShoppingClientAssignmentModalOpen(true),
                  className:
                    'shrink-0 rounded-full bg-primary px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white hover:bg-primary-dark',
                  children: 'Asignar clientes',
                }),
              ],
            }),
            c.jsx('div', {
              className: isDesktopLayout ? 'pr-0 flex-1 min-h-0 overflow-y-auto overscroll-contain ios-scroll' : 'pr-1 max-h-[240px] overflow-y-auto overscroll-contain ios-scroll',
              children: filteredHomeClientsInMission.length === 0
                ? c.jsxs('div', { className: 'text-center py-8', children: [c.jsx('p', { className: 'text-gray-400 text-sm', children: 'No clients assigned to this shopping yet.' }), c.jsx('p', { className: 'text-[10px] text-gray-400 mt-1', children: 'Use the Asignar clientes button to add them.' })] })
                : filteredHomeClientsInMission.map((client) => {
                    const totals = homeClientMissionTotalsMap[client.id] || { usd: 0, sale: 0 };
                    const balance = homeClientGlobalBalanceMap[client.id] || 0;
                    return c.jsxs('div', {
                      className: 'flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition',
                      children: [
                        c.jsx('div', { onClick: () => openClientFullGallery(client, activeMission && activeMission.id), className: 'w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg uppercase border border-primary/20', children: client.name.charAt(0) }),
                        c.jsxs('div', { onClick: () => openClientFullGallery(client, activeMission && activeMission.id), className: 'flex-1 min-w-0', children: [c.jsxs('div', { className: 'flex items-center gap-2 min-w-0', children: [c.jsx('p', { className: 'font-semibold text-xs text-text-main dark:text-gray-100 truncate', children: client.name }), !!Object.keys(effectiveHomeClientReviewUnreadMap[client.id] || {}).length && c.jsx('span', { className: 'shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center font-bold', children: Object.keys(effectiveHomeClientReviewUnreadMap[client.id] || {}).length })] }), c.jsx('p', { className: 'text-[10px] text-gray-500', children: `${(homeClientMissionProductsMap[client.id] || []).length} items in this shopping` }), c.jsxs('div', { className: 'flex gap-2 mt-1', children: [c.jsxs('span', { className: `inline-flex items-center gap-0.5 whitespace-nowrap px-1.5 py-0.5 rounded-md text-[9px] font-bold ${balance < 0 ? 'bg-emerald-100 text-emerald-800' : balance > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`, children: [balance < 0 ? 'A favor: ' : 'Deuda: ', '$', formatAmount(Math.abs(balance))] }), c.jsxs('span', { className: 'inline-flex items-center gap-0.5 whitespace-nowrap px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[9px] font-bold', children: ['Venta: $', formatAmount(totals.sale)] })] })] }),
                        c.jsxs('div', { className: 'shrink-0 flex items-center gap-1.5', children: [c.jsx('button', { type: 'button', onClick: (event) => { event.stopPropagation(); const key = `client-history-${client.id}`; if (copiedClientShareLinks.includes(key)) { setCopiedClientShareLinks((values) => values.filter((value) => value !== key)); return; } copyClientMissionShareLink(null, client); }, className: `w-8 h-8 rounded-md border flex items-center justify-center transition ${copiedClientShareLinks.includes(`client-history-${client.id}`) ? 'border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-700 dark:bg-sky-950/35 dark:text-sky-200' : 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200'}`, children: c.jsx('span', { className: 'material-symbols-outlined text-[14px]', children: copiedClientShareLinks.includes(`client-history-${client.id}`) ? 'done' : 'share' }) }), c.jsx('button', { type: 'button', onClick: (event) => { event.stopPropagation(); openPaymentModal(client, activeMission); }, className: 'w-8 h-8 rounded-md border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200 flex items-center justify-center transition', children: c.jsx('span', { className: 'material-symbols-outlined text-[14px]', children: 'payments' }) }), c.jsx('button', { type: 'button', onClick: (event) => { event.stopPropagation(); copyAnnotatedMissionBreakdown(activeMission, client); }, title: 'Enviar desglose por WhatsApp', className: `w-8 h-8 rounded-md border flex items-center justify-center transition ${copiedMissionClients.includes(`home-${activeMission.id}-${client.id}`) ? 'border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-700 dark:bg-sky-950/35 dark:text-sky-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'}`, children: c.jsx('span', { className: 'material-symbols-outlined text-[13px]', children: copiedMissionClients.includes(`home-${activeMission.id}-${client.id}`) ? 'done' : 'receipt_long' }) })] }),
                      ],
                    }, client.id);
                  }),
            }),
            c.jsx(ShoppingClientAssignmentModal, {
              open: shoppingClientAssignmentModalOpen,
              onClose: () => setShoppingClientAssignmentModalOpen(false),
            }),
          ],
        }),
    ],
  });
});

export default HomeSection;
