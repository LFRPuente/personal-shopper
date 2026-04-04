import { V, c } from '../utils.js';

export const MISSION_SECTION_REQUIRED_PROPS = [
  'isDesktopLayout',
  'missions',
  'missionSearch',
  'onMissionSearchChange',
  'selectedMissionId',
  'expandedMissionId',
  'editingMissionId',
  'editingMissionName',
  'onOpenMissionStart',
  'onToggleMission',
  'onEditMissionNameChange',
  'onSaveMissionName',
  'onCancelMissionName',
  'onPauseMission',
  'onResumeMission',
  'onEndMission',
  'onViewClient',
  'onCopyBreakdown',
  'onSetFullscreenImage',
  'copiedMissionClients',
  'clientLookupById',
  'getMissionSearchBlob',
  'getSearchTokens',
  'getMissionStoreLabel',
  'getTagClassName',
  'parseVisualTag',
  'getProductQuickFinalPrice',
  'formatProductQuickFinalPrice',
];

const MissionsSection = V.memo(function MissionsSection({
  isDesktopLayout = false,
  missionSearch = '',
  onMissionSearchChange = () => {},
  missions = [],
  selectedMissionId = null,
  expandedMissionId = null,
  editingMissionId = null,
  editingMissionName = '',
  onOpenMissionStart = () => {},
  onToggleMission = () => {},
  onEditMissionNameChange = () => {},
  onSaveMissionName = () => {},
  onCancelMissionName = () => {},
  onPauseMission = () => {},
  onResumeMission = () => {},
  onEndMission = () => {},
  onViewClient = () => {},
  onCopyBreakdown = () => {},
  onSetFullscreenImage = () => {},
  copiedMissionClients = [],
  clientLookupById = new Map(),
  getMissionSearchBlob = () => '',
  getSearchTokens = () => [],
  getMissionStoreLabel = (mission) => (mission && mission.name) || '',
  getTagClassName = () => '',
  parseVisualTag = () => null,
  getProductQuickFinalPrice = () => Number.NaN,
  formatProductQuickFinalPrice = () => '',
}) {
  const filteredMissions = V.useMemo(() => {
    const tokens = getSearchTokens(missionSearch);
    if (!tokens.length) return missions;
    return (missions || []).filter((mission) => {
      const blob = String(getMissionSearchBlob(mission) || '').toLowerCase();
      return tokens.every((token) => blob.includes(String(token || '').toLowerCase()));
    });
  }, [getMissionSearchBlob, getSearchTokens, missionSearch, missions]);

  return c.jsxs('section', {
    className: isDesktopLayout ? 'space-y-6' : 'space-y-4',
    children: [
      c.jsxs('div', {
        className: isDesktopLayout
          ? 'flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between mt-2 mb-2'
          : 'flex items-center justify-between mt-2 mb-2',
        children: [
          c.jsx('h2', {
            className: 'text-lg font-bold text-text-main dark:text-white',
            children: 'Shoppings',
          }),
          !selectedMissionId &&
            c.jsxs('button', {
              onClick: onOpenMissionStart,
              className:
                'text-xs font-bold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition flex items-center gap-1',
              children: [
                c.jsx('span', {
                  className: 'material-symbols-outlined text-[16px]',
                  children: 'add',
                }),
                ' New',
              ],
            }),
        ],
      }),
      c.jsx('input', {
        type: 'text',
        value: missionSearch,
        onChange: (event) => onMissionSearchChange(event.target.value),
        placeholder: 'Buscar misión o fecha...',
        className: isDesktopLayout
          ? 'w-full max-w-2xl px-4 py-3 rounded-2xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary'
          : 'w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary',
      }),
      c.jsx('div', {
        className:
          'rounded-2xl border border-dashed border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4 text-xs text-text-sub',
        children: [
          'Scaffold de MissionsSection listo para integrar.',
          ' Dependencias faltantes: ',
          MISSION_SECTION_REQUIRED_PROPS.join(', '),
        ],
      }),
      c.jsx('div', {
        className: isDesktopLayout
          ? 'grid gap-4 xl:grid-cols-2 2xl:grid-cols-3'
          : 'space-y-3',
        children: filteredMissions.map((mission) => {
          const isExpanded = expandedMissionId === mission.id;
          const isEditing = editingMissionId === mission.id;
          const missionProducts = mission.products || [];
          const clientIds = Array.from(
            new Set(
              missionProducts
                .map((product) => Number(product && product.client))
                .filter((clientId) => Number.isFinite(clientId) && clientId > 0),
            ),
          );
          const clients = clientIds
            .map((clientId) => clientLookupById.get(clientId))
            .filter(Boolean);
          const annotatedProducts = missionProducts.filter((product) =>
            mission.status === 'COMPLETED'
              ? String(product && product.status || '').toUpperCase() === 'ANNOTATED'
              : true,
          );

          return c.jsxs(
            'div',
            {
              className: `bg-surface-light dark:bg-surface-dark rounded-xl border shadow-sm overflow-hidden transition-all ui-card-quiet h-full ${isDesktopLayout ? 'rounded-2xl' : ''} ${selectedMissionId === mission.id ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border-light dark:border-border-dark'}`,
              children: [
                c.jsx('div', {
                  className: isDesktopLayout
                    ? 'p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition'
                    : 'p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition',
                  onClick: () => onToggleMission(isExpanded ? null : mission.id),
                  children: c.jsxs('div', {
                    className: 'flex items-center justify-between',
                    children: [
                      c.jsx('div', {
                        className: 'flex-1 min-w-0',
                        children: isEditing
                          ? c.jsxs('div', {
                              className: 'flex gap-2',
                              onClick: (event) => event.stopPropagation(),
                              children: [
                                c.jsx('input', {
                                  type: 'text',
                                  value: editingMissionName,
                                  onChange: (event) => onEditMissionNameChange(event.target.value),
                                  className: 'flex-1 px-2 py-1 text-sm border rounded-lg dark:bg-gray-800',
                                  autoFocus: true,
                                }),
                                c.jsx('button', {
                                  onClick: () => onSaveMissionName(mission.id),
                                  className: 'text-xs bg-primary text-white px-3 py-1 rounded-lg font-bold',
                                  children: 'Save',
                                }),
                                c.jsx('button', {
                                  onClick: onCancelMissionName,
                                  className: 'text-xs text-gray-500',
                                  children: '✕',
                                }),
                              ],
                            })
                          : c.jsxs(c.Fragment, {
                              children: [
                                c.jsx('p', {
                                  className: isDesktopLayout ? 'font-bold text-base truncate' : 'font-bold text-sm truncate',
                                  children: mission.name || getMissionStoreLabel(mission),
                                }),
                                c.jsxs('p', {
                                  className: isDesktopLayout ? 'text-[11px] text-gray-500 mt-0.5' : 'text-[10px] text-gray-500 mt-0.5',
                                  children: [
                                    mission.start_time ? new Date(mission.start_time).toLocaleDateString() : 'Sin fecha',
                                    mission.store_name ? c.jsxs(c.Fragment, { children: [' • ', mission.store_name] }) : null,
                                    ' • ',
                                    clients.length,
                                    ' clients • ',
                                    annotatedProducts.length,
                                    ' products',
                                  ],
                                }),
                              ],
                            }),
                      }),
                      c.jsxs('div', {
                        className: 'flex items-center gap-2 ml-2',
                        children: [
                          c.jsx('span', {
                            className: `text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${mission.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : mission.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'}`,
                            children: mission.status || 'PENDING',
                          }),
                          c.jsx('span', {
                            className: 'material-symbols-outlined text-gray-400 text-[18px] transition-transform',
                            style: {
                              transform: isExpanded ? 'rotate(180deg)' : '',
                            },
                            children: 'expand_more',
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
                isExpanded &&
                  c.jsxs('div', {
                    className: 'border-t border-border-light dark:border-border-dark',
                    children: [
                      c.jsxs('div', {
                        className: 'px-4 py-3 bg-primary/5 border-b border-border-light flex gap-2',
                        children: [
                          c.jsx('button', {
                            onClick: onPauseMission,
                            className: 'flex-1 py-2 text-white font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-xs',
                            children: 'Pause',
                          }),
                          c.jsx('button', {
                            onClick: onResumeMission,
                            className: 'flex-1 py-2 text-white font-bold rounded-lg bg-green-600 hover:bg-green-700 text-xs',
                            children: 'Resume',
                          }),
                          c.jsx('button', {
                            onClick: onEndMission,
                            className: 'flex-1 py-2 text-white font-bold rounded-lg bg-red-500 hover:bg-red-600 text-xs',
                            children: 'End',
                          }),
                        ],
                      }),
                      c.jsx('div', {
                        className: 'px-4 py-3 border-b border-border-light dark:border-border-dark',
                        children: c.jsxs('p', {
                          className: 'text-[11px] text-gray-500',
                          children: [
                            'Detalle aún no integrado. ',
                            'Aquí van ticket, clientes y productos.',
                          ],
                        }),
                      }),
                      clients.length > 0 &&
                        c.jsxs('div', {
                          className: 'px-4 py-3',
                          children: [
                            c.jsxs('h4', {
                              className: 'text-xs font-bold text-text-sub uppercase mb-2',
                              children: ['Clients (', clients.length, ')'],
                            }),
                            c.jsx('div', {
                              className: 'space-y-2',
                              children: clients.map((client) =>
                                c.jsxs(
                                  'div',
                                  {
                                    className: 'flex items-center justify-between gap-3 p-2.5 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700',
                                    children: [
                                      c.jsxs('div', {
                                        className: 'min-w-0',
                                        children: [
                                          c.jsx('p', {
                                            className: 'font-semibold text-xs truncate',
                                            children: client.name,
                                          }),
                                          c.jsx('p', {
                                            className: 'text-[10px] text-gray-500',
                                            children: `${(client.products || []).length} items`,
                                          }),
                                        ],
                                      }),
                                      c.jsx('span', {
                                        className: 'text-[10px] text-gray-400',
                                        children: 'TODO',
                                      }),
                                    ],
                                  },
                                  client.id,
                                ),
                              ),
                            }),
                          ],
                        }),
                      annotatedProducts.length > 0 &&
                        c.jsxs('div', {
                          className: 'px-4 py-3 border-t border-border-light dark:border-border-dark',
                          children: [
                            c.jsxs('h4', {
                              className: 'text-xs font-bold text-text-sub uppercase mb-2',
                              children: ['Products (', annotatedProducts.length, ')'],
                            }),
                            c.jsx('div', {
                              className: 'grid grid-cols-3 gap-1.5',
                              children: annotatedProducts.map((product) =>
                                c.jsxs(
                                  'div',
                                  {
                                    className: 'rounded-lg border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark shadow-card ui-card-quiet p-2',
                                    children: [
                                      c.jsx('p', {
                                        className: 'text-[10px] font-bold truncate',
                                        children: product.name,
                                      }),
                                      c.jsx('p', {
                                        className: 'text-[9px] text-gray-500 mt-0.5',
                                        children: product.client_name || `Cliente #${product.client}`,
                                      }),
                                      Number.isFinite(getProductQuickFinalPrice(product)) &&
                                        c.jsxs('p', {
                                          className: 'text-[10px] font-bold mt-1',
                                          children: [
                                            '$',
                                            formatProductQuickFinalPrice(product),
                                          ],
                                        }),
                                    ],
                                  },
                                  product.id,
                                ),
                              ),
                            }),
                          ],
                        }),
                    ],
                  }),
              ],
            },
            mission.id,
          );
        }),
      }),
    ],
  });
});

export default MissionsSection;
