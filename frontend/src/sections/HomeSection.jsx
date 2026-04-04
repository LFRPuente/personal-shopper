import { V, c, resolveMediaUrl } from '../utils.js';
import { useApp } from '../AppContext.jsx';

export const HOME_SECTION_REQUIRED_CONTEXT = [
  'isDesktopLayout',
  'homeDesktopGridRef',
  'homeDesktopLayout',
  'activeMission',
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
  } = useApp();

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
                    className: 'rounded-xl border-l-4 px-3 py-2.5 shadow-sm bg-sky-50 border-sky-300 border-l-sky-500 dark:bg-slate-900/70 dark:border-slate-600 dark:border-l-sky-400',
                    children: [
                      c.jsx('p', { className: 'text-xs font-medium text-gray-700 dark:text-gray-200 mb-2', children: request.description }),
                      request.image && c.jsx('button', {
                        onClick: () => setFullscreenImage(resolveMediaUrl(request.image)),
                        className: 'mb-2 ui-media-frame ui-media-ticket-md',
                        children: c.jsx('img', { src: resolveMediaUrl(request.image), className: 'w-full h-full object-cover' }),
                      }),
                      c.jsx('div', {
                        className: 'flex flex-wrap gap-1.5',
                        children: [
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
                              className: 'material-symbols-outlined text-[14px]',
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
                              className: 'material-symbols-outlined text-[14px]',
                              children: 'block',
                            }),
                          }),
                          c.jsx('button', {
                            onClick: () => startRequestModify(request),
                            className:
                              'w-8 h-8 rounded-md border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/35 dark:text-amber-200 dark:hover:bg-amber-900/60 flex items-center justify-center',
                            title: 'Modificar',
                            children: c.jsx('span', {
                              className: 'material-symbols-outlined text-[14px]',
                              children: 'edit',
                            }),
                          }),
                          c.jsx('button', {
                            onClick: () => deleteMissionRequest(request.id),
                            className:
                              'w-8 h-8 rounded-md border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/35 dark:text-rose-200 dark:hover:bg-rose-900/60 flex items-center justify-center',
                            title: 'Eliminar',
                            children: c.jsx('span', {
                              className: 'material-symbols-outlined text-[14px]',
                              children: 'delete_forever',
                            }),
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
                  c.jsx('input', { type: 'text', value: newRequestText, onChange: (event) => setNewRequestText(event.target.value), placeholder: 'Nueva petición...', className: 'flex-1 min-w-[120px] px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary w-full' }),
                  c.jsx('button', { onClick: pickRequestImage, className: 'px-3 py-2 rounded-xl border border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-200 flex-shrink-0', children: c.jsx('span', { className: 'material-symbols-outlined text-[18px]', children: 'add_photo_alternate' }) }),
                  c.jsx('button', { onClick: createMissionRequest, disabled: !newRequestText.trim() && !newRequestImageFile, className: `px-4 py-2 rounded-xl text-sm font-semibold transition flex-shrink-0 flex-1 sm:flex-none ${newRequestText.trim() || newRequestImageFile ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`, children: 'Enviar' }),
                ],
              }),
            ],
          }),
        ],
      }),
      activeMission &&
        c.jsxs('div', {
          className: isDesktopLayout
            ? 'col-start-1 row-start-1 bg-surface-light dark:bg-surface-dark p-4 rounded-3xl border border-border-light dark:border-border-dark shadow-card h-full overflow-y-auto'
            : 'bg-surface-light dark:bg-surface-dark px-3 py-3 md:px-4',
          children: [
            c.jsxs('div', {
              className: isDesktopLayout ? 'flex items-start justify-between gap-4' : 'flex items-center justify-between gap-2',
              children: [
                c.jsxs('div', {
                  className: 'min-w-0',
                  children: [
                    c.jsx('h3', { className: isDesktopLayout ? 'font-bold text-lg text-text-main dark:text-white truncate' : 'font-bold text-sm text-text-main dark:text-white truncate', children: 'Shopping en Tienda' }),
                    c.jsx('p', { className: isDesktopLayout ? 'text-xs text-gray-500 truncate mt-0.5' : 'text-[10px] text-gray-500 truncate', children: `${getMissionStoreLabel(activeMission)} • ${activeMission.status}${activeMissionPayerLabel ? ` • Paga: ${activeMissionPayerLabel}` : ''}` }),
                  ],
                }),
                c.jsx('span', { className: `font-bold rounded-full ${isDesktopLayout ? 'text-[11px] px-2.5 py-1' : 'text-[10px] px-2 py-1'} bg-green-100 text-green-700`, children: 'ON' }),
              ],
            }),
            c.jsxs('div', {
              className: isDesktopLayout ? 'mt-3 flex items-center justify-between gap-4' : 'mt-2 flex items-start justify-between gap-3',
              children: [
                c.jsxs('span', { className: isDesktopLayout ? 'pt-0.5 text-xs font-semibold text-gray-600 dark:text-gray-300' : 'pt-0.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300', children: ['Items: ', missionProductsCount] }),
                c.jsxs('div', {
                  className: 'grid grid-cols-2 gap-2 text-right shrink-0',
                  children: [
                    c.jsxs('div', { className: 'min-w-[118px] rounded-xl border border-white/10 bg-white/5 px-3 py-2', children: [c.jsx('p', { className: 'text-[9px] font-black uppercase tracking-[0.14em] text-white/70', children: 'Compra' }), c.jsxs('span', { className: 'mt-1 block text-[10px] font-semibold text-white', children: ['$', money(missionPurchaseCost)] }), missionPurchaseCostWithDiscount > 0 && c.jsxs('span', { className: 'mt-0.5 block text-[10px] font-semibold text-white', children: ['C/desc $', money(missionPurchaseCostWithDiscount)] })] }),
                    c.jsxs('div', { className: 'min-w-[118px] rounded-xl border border-white/10 bg-white/5 px-3 py-2', children: [c.jsx('p', { className: 'text-[9px] font-black uppercase tracking-[0.14em] text-white/70', children: 'Venta' }), c.jsxs('span', { className: 'mt-1 block text-[10px] font-semibold text-white', children: ['$', money(missionTotalWithTaxes)] }), missionTotalWithDiscount > 0 && c.jsxs('span', { className: 'mt-0.5 block text-[10px] font-semibold text-white', children: ['C/desc $', money(missionTotalWithDiscount)] })] }),
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
            c.jsxs('div', { className: 'mb-3 space-y-2', children: [c.jsxs('h3', { className: 'font-bold text-sm text-text-main dark:text-white', children: ['Clients in Shopping (', filteredHomeClientsInMission.length, ')'] }), c.jsx('input', { type: 'text', value: homeClientSearch, onChange: (event) => setHomeClientSearch(event.target.value), placeholder: 'Buscar client...', className: 'w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary' })] }),
            c.jsx('div', {
              className: isDesktopLayout ? 'pr-0 flex-1 min-h-0 overflow-y-auto overscroll-contain ios-scroll' : 'pr-1 max-h-[240px] overflow-y-auto overscroll-contain ios-scroll',
              children: filteredHomeClientsInMission.length === 0
                ? c.jsxs('div', { className: 'text-center py-8', children: [c.jsx('p', { className: 'text-gray-400 text-sm', children: 'No clients assigned to this shopping yet.' }), c.jsx('p', { className: 'text-[10px] text-gray-400 mt-1', children: 'Go to the Clients tab to add clients.' })] })
                : filteredHomeClientsInMission.map((client) => {
                    const totals = homeClientMissionTotalsMap[client.id] || { usd: 0, sale: 0 };
                    const balance = homeClientGlobalBalanceMap[client.id] || 0;
                    return c.jsxs('div', {
                      className: 'flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition',
                      children: [
                        c.jsx('div', { onClick: () => openClientFullGallery(client, activeMission && activeMission.id), className: 'w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg uppercase border border-primary/20', children: client.name.charAt(0) }),
                        c.jsxs('div', { onClick: () => openClientFullGallery(client, activeMission && activeMission.id), className: 'flex-1 min-w-0', children: [c.jsxs('div', { className: 'flex items-center gap-2 min-w-0', children: [c.jsx('p', { className: 'font-semibold text-xs text-text-main dark:text-gray-100 truncate', children: client.name }), !!Object.keys(effectiveHomeClientReviewUnreadMap[client.id] || {}).length && c.jsx('span', { className: 'shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center font-bold', children: Object.keys(effectiveHomeClientReviewUnreadMap[client.id] || {}).length })] }), c.jsx('p', { className: 'text-[10px] text-gray-500', children: `${(homeClientMissionProductsMap[client.id] || []).length} items in this shopping` }), c.jsxs('div', { className: 'flex gap-2 mt-1', children: [c.jsxs('span', { className: `inline-flex items-center gap-0.5 whitespace-nowrap px-1.5 py-0.5 rounded-md text-[9px] font-bold ${balance < 0 ? 'bg-emerald-100 text-emerald-800' : balance > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`, children: [balance < 0 ? 'A favor: ' : 'Deuda: ', '$', formatAmount(Math.abs(balance))] }), c.jsxs('span', { className: 'inline-flex items-center gap-0.5 whitespace-nowrap px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[9px] font-bold', children: ['Venta: $', formatAmount(totals.sale)] })] })] }),
                        c.jsxs('div', { className: 'shrink-0 flex items-center gap-1.5', children: [c.jsx('button', { type: 'button', onClick: (event) => { event.stopPropagation(); const key = `client-history-${client.id}`; if (copiedClientShareLinks.includes(key)) { setCopiedClientShareLinks((values) => values.filter((value) => value !== key)); return; } copyClientMissionShareLink(null, client); }, className: `w-8 h-8 rounded-md border flex items-center justify-center transition ${copiedClientShareLinks.includes(`client-history-${client.id}`) ? 'border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-700 dark:bg-sky-950/35 dark:text-sky-200' : 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200'}`, children: c.jsx('span', { className: 'material-symbols-outlined text-[14px]', children: copiedClientShareLinks.includes(`client-history-${client.id}`) ? 'done' : 'share' }) }), c.jsx('button', { type: 'button', onClick: (event) => { event.stopPropagation(); openPaymentModal(client, activeMission); }, className: 'w-8 h-8 rounded-md border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200 flex items-center justify-center transition', children: c.jsx('span', { className: 'material-symbols-outlined text-[14px]', children: 'payments' }) }), c.jsx('button', { type: 'button', onClick: (event) => { event.stopPropagation(); const key = `home-${activeMission.id}-${client.id}`; if (copiedMissionClients.includes(key)) { setCopiedMissionClients((values) => values.filter((value) => value !== key)); return; } copyAnnotatedMissionBreakdown(activeMission, client); }, className: `w-8 h-8 rounded-md border flex items-center justify-center transition ${copiedMissionClients.includes(`home-${activeMission.id}-${client.id}`) ? 'border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-700 dark:bg-sky-950/35 dark:text-sky-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'}`, children: c.jsx('span', { className: 'material-symbols-outlined text-[13px]', children: copiedMissionClients.includes(`home-${activeMission.id}-${client.id}`) ? 'done' : 'receipt_long' }) })] }),
                      ],
                    }, client.id);
                  }),
            }),
          ],
        }),
    ],
  });
});

export default HomeSection;
