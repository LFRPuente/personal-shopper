import { V, c, resolveMediaUrl } from '../utils.js';
import { useApp } from '../AppContext.jsx';

const getMissionStatusClassName = (status) =>
  status === 'ACTIVE'
    ? 'bg-green-100 text-green-700'
    : status === 'PAUSED'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-gray-200 text-gray-600';

const getMissionProductStatusLabel = (status) => {
  const normalized = String(status || '').toUpperCase();
  return normalized === 'IN_REVIEW'
    ? 'Revision'
    : normalized === 'ANNOTATED'
      ? 'Anotado'
      : normalized === 'BOUGHT'
        ? 'Comprado'
        : normalized === 'SHIPPED'
          ? 'Enviado'
          : normalized === 'REJECTED'
            ? 'Rechazado'
            : status;
};

const getMissionProductStatusClassName = (status) => {
  const normalized = String(status || '').toUpperCase();
  return normalized === 'IN_REVIEW'
    ? 'bg-amber-100/92 text-amber-800'
    : normalized === 'REJECTED'
      ? 'bg-rose-100/92 text-rose-700'
      : normalized === 'BOUGHT'
        ? 'bg-emerald-100/92 text-emerald-700'
        : normalized === 'SHIPPED'
          ? 'bg-blue-100/92 text-blue-700'
          : 'bg-white/90 text-gray-700';
};

const MissionsSection = V.memo(function MissionsSection() {
  const {
    isDesktopLayout,
    missions,
    activeMission,
    missionSearch,
    setMissionSearch,
    expandedMissionId,
    setExpandedMissionId,
    editingMissionId,
    editingMissionName,
    setEditingMissionId,
    setEditingMissionName,
    openMissionStart,
    pauseMission,
    resumeMission,
    endMission,
    saveEditedMission,
    deleteMission,
    openMissionClientView,
    copiedMissionClients,
    clientLookupById,
    getMissionSearchBlob,
    getSearchTokens,
    getMissionStoreLabel,
    getTagClassName,
    parseVisualTag,
    getProductQuickFinalPrice,
    formatProductQuickFinalPrice,
    setFullscreenImage,
    exportMissionCsv,
  } = useApp();

  const filteredMissions = V.useMemo(() => {
    const tokens = getSearchTokens(missionSearch);
    if (!tokens.length) return missions || [];
    return (missions || []).filter((mission) => {
      const blob = getMissionSearchBlob(mission);
      return tokens.every((token) => blob.includes(token));
    });
  }, [getMissionSearchBlob, getSearchTokens, missionSearch, missions]);

  return c.jsxs('div', {
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
          !activeMission &&
            c.jsxs('button', {
              onClick: openMissionStart,
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
        onChange: (event) => setMissionSearch(event.target.value),
        placeholder: 'Buscar misión o fecha...',
        className: isDesktopLayout
          ? 'w-full max-w-2xl px-4 py-3 rounded-2xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary'
          : 'w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary',
      }),
      (missions || []).length === 0
        ? c.jsxs('div', {
            className:
              'text-center py-12 bg-surface-light dark:bg-surface-dark rounded-xl border border-dashed border-gray-300 p-6',
            children: [
              c.jsx('span', {
                className:
                  'material-symbols-outlined text-4xl text-gray-300 mb-2',
                children: 'store_off',
              }),
              c.jsx('p', {
                className: 'font-bold text-lg mb-2',
                children: 'No shoppings yet',
              }),
              c.jsx('p', {
                className: 'text-gray-500 text-sm mb-4',
                children: 'Inicia tu primer shopping en tienda desde aqui.',
              }),
              c.jsx('button', {
                onClick: openMissionStart,
                className:
                  'px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition',
                children: 'Iniciar Shopping',
              }),
            ],
          })
        : c.jsx('div', {
            className: isDesktopLayout
              ? 'grid gap-4 xl:grid-cols-2 2xl:grid-cols-3'
              : 'space-y-3',
            children: filteredMissions.map((mission) => {
              const isExpanded = expandedMissionId === mission.id;
              const isActiveMission = activeMission && activeMission.id === mission.id;
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
              const visibleProducts = missionProducts.filter((product) =>
                mission.status === 'COMPLETED'
                  ? String((product && product.status) || '').toUpperCase() ===
                    'ANNOTATED'
                  : true,
              );

              return c.jsxs(
                'div',
                {
                  className: `bg-surface-light dark:bg-surface-dark rounded-xl border shadow-sm overflow-hidden transition-all ui-card-quiet h-full ${
                    isDesktopLayout ? 'rounded-2xl' : ''
                  } ${
                    isActiveMission
                      ? 'border-primary/50 ring-1 ring-primary/20'
                      : 'border-border-light dark:border-border-dark'
                  }`,
                  children: [
                    c.jsx('div', {
                      className: isDesktopLayout
                        ? 'p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition'
                        : 'p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition',
                      onClick: () =>
                        setExpandedMissionId(isExpanded ? null : mission.id),
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
                                      onChange: (event) =>
                                        setEditingMissionName(event.target.value),
                                      className:
                                        'flex-1 px-2 py-1 text-sm border rounded-lg dark:bg-gray-800',
                                      autoFocus: true,
                                    }),
                                    c.jsx('button', {
                                      onClick: () => saveEditedMission(mission.id),
                                      className:
                                        'text-xs bg-primary text-white px-3 py-1 rounded-lg font-bold',
                                      children: 'Save',
                                    }),
                                    c.jsx('button', {
                                      onClick: () => setEditingMissionId(null),
                                      className: 'text-xs text-gray-500',
                                      children: '✕',
                                    }),
                                  ],
                                })
                              : c.jsxs(c.Fragment, {
                                  children: [
                                    c.jsx('p', {
                                      className: isDesktopLayout
                                        ? 'font-bold text-base truncate'
                                        : 'font-bold text-sm truncate',
                                      children:
                                        mission.name || getMissionStoreLabel(mission),
                                    }),
                                    c.jsxs('p', {
                                      className: isDesktopLayout
                                        ? 'text-[11px] text-gray-500 mt-0.5'
                                        : 'text-[10px] text-gray-500 mt-0.5',
                                      children: [
                                        mission.start_time
                                          ? new Date(
                                              mission.start_time,
                                            ).toLocaleDateString()
                                          : 'Sin fecha',
                                        mission.store_name &&
                                          c.jsxs(c.Fragment, {
                                            children: [' • ', mission.store_name],
                                          }),
                                        ' • ',
                                        clients.length,
                                        ' clients • ',
                                        visibleProducts.length,
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
                                className: `text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getMissionStatusClassName(
                                  mission.status,
                                )}`,
                                children: mission.status || 'PENDING',
                              }),
                              c.jsx('span', {
                                className:
                                  'material-symbols-outlined text-gray-400 text-[18px] transition-transform',
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
                        className:
                          'border-t border-border-light dark:border-border-dark',
                        children: [
                          isActiveMission &&
                            c.jsxs('div', {
                              className:
                                'px-4 py-3 bg-primary/5 border-b border-border-light flex gap-2',
                              children: [
                                activeMission.status === 'ACTIVE'
                                  ? c.jsxs('button', {
                                      onClick: pauseMission,
                                      className:
                                        'flex-1 py-2 text-white font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-xs flex justify-center items-center gap-1',
                                      children: [
                                        c.jsx('span', {
                                          className:
                                            'material-symbols-outlined text-[14px]',
                                          children: 'pause_circle',
                                        }),
                                        ' Pause',
                                      ],
                                    })
                                  : c.jsxs('button', {
                                      onClick: resumeMission,
                                      className:
                                        'flex-1 py-2 text-white font-bold rounded-lg bg-green-600 hover:bg-green-700 text-xs flex justify-center items-center gap-1',
                                      children: [
                                        c.jsx('span', {
                                          className:
                                            'material-symbols-outlined text-[14px]',
                                          children: 'play_circle',
                                        }),
                                        ' Resume',
                                      ],
                                    }),
                                c.jsxs('button', {
                                  onClick: endMission,
                                  className:
                                    'flex-1 py-2 text-white font-bold rounded-lg bg-red-500 hover:bg-red-600 text-xs flex justify-center items-center gap-1',
                                  children: [
                                    c.jsx('span', {
                                      className:
                                        'material-symbols-outlined text-[14px]',
                                      children: 'stop_circle',
                                    }),
                                    ' End',
                                  ],
                                }),
                              ],
                            }),
                          c.jsx('div', {
                            className:
                              'px-4 py-3 border-b border-border-light dark:border-border-dark',
                            children: mission.ticket_image
                              ? c.jsxs('div', {
                                  className: 'flex items-center gap-2',
                                  children: [
                                    c.jsx('img', {
                                      src: resolveMediaUrl(mission.ticket_image),
                                      className:
                                        'ui-media-frame ui-media-sm object-cover',
                                    }),
                                    c.jsx('button', {
                                      onClick: () =>
                                        setFullscreenImage(
                                          resolveMediaUrl(mission.ticket_image),
                                        ),
                                      className:
                                        'text-[11px] font-bold text-primary hover:text-primary-dark',
                                      children: 'Ver ticket de esta misión',
                                    }),
                                  ],
                                })
                              : c.jsx('p', {
                                  className: 'text-[11px] text-gray-500',
                                  children: 'Sin ticket cargado para esta misión.',
                                }),
                          }),
                          clients.length > 0 &&
                            c.jsxs('div', {
                              className: 'px-4 py-3',
                              children: [
                                c.jsxs('h4', {
                                  className:
                                    'text-xs font-bold text-text-sub uppercase mb-2',
                                  children: ['Clients (', clients.length, ')'],
                                }),
                                c.jsx('div', {
                                  className: 'space-y-2',
                                  children: clients.map((client) => {
                                    const copyKey = `${mission.id}-${client.id}`;
                                    const clientProducts = (client.products || []).filter(
                                      (product) =>
                                        Number(product.shopping) === Number(mission.id) &&
                                        (mission.status === 'COMPLETED'
                                          ? String(
                                              (product && product.status) || '',
                                            ).toUpperCase() === 'ANNOTATED'
                                          : true),
                                    );
                                    return c.jsxs(
                                      'div',
                                      {
                                        className: `flex items-center gap-3 p-2.5 rounded-lg border ${
                                          copiedMissionClients.includes(copyKey)
                                            ? 'bg-emerald-50 border-emerald-200'
                                            : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                        }`,
                                        children: [
                                          c.jsx('div', {
                                            className:
                                              'w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase',
                                            children: client.name.charAt(0),
                                          }),
                                          c.jsxs('div', {
                                            className: 'flex-1 min-w-0',
                                            children: [
                                              c.jsx('p', {
                                                className:
                                                  'font-semibold text-xs truncate',
                                                children: client.name,
                                              }),
                                              c.jsxs('p', {
                                                className:
                                                  'text-[10px] text-gray-500',
                                                children: [
                                                  clientProducts.length,
                                                  ' items • ',
                                                  (client.receipts || []).length,
                                                  ' tickets',
                                                ],
                                              }),
                                            ],
                                          }),
                                          c.jsxs('div', {
                                            className:
                                              'flex items-center gap-1 shrink-0',
                                            children: [
                                              c.jsx('button', {
                                                onClick: () =>
                                                  openMissionClientView(
                                                    client,
                                                    mission.id,
                                                  ),
                                                className:
                                                  'text-[10px] font-bold bg-white text-primary border border-primary/20 px-2.5 py-1 rounded-lg hover:bg-primary/10 dark:bg-white dark:text-primary dark:border-white/80 transition',
                                                children: 'View',
                                              }),
                                            ],
                                          }),
                                        ],
                                      },
                                      client.id,
                                    );
                                  }),
                                }),
                              ],
                            }),
                          visibleProducts.length > 0 &&
                            c.jsxs('div', {
                              className:
                                'px-4 py-3 border-t border-border-light dark:border-border-dark',
                              children: [
                                c.jsxs('h4', {
                                  className:
                                    'text-xs font-bold text-text-sub uppercase mb-2',
                                  children: ['Products (', visibleProducts.length, ')'],
                                }),
                                c.jsx('div', {
                                  className: 'grid grid-cols-3 gap-1.5',
                                  children: visibleProducts.map((product) =>
                                    c.jsxs(
                                      'div',
                                      {
                                        className:
                                          'relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark shadow-card ui-card-quiet',
                                        children: [
                                          c.jsx('div', {
                                            className:
                                              'relative h-36 bg-[radial-gradient(circle_at_top,rgba(19,127,236,0.10),transparent_42%),linear-gradient(180deg,rgba(244,247,251,0.95),rgba(236,242,248,0.95))] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_38%),linear-gradient(180deg,rgba(22,31,43,0.96),rgba(15,23,34,0.98))]',
                                            children: [
                                              product.image
                                                ? c.jsx('img', {
                                                    src: resolveMediaUrl(
                                                      product.image,
                                                    ),
                                                    className:
                                                      'w-full h-full object-cover cursor-zoom-in',
                                                    onClick: () =>
                                                      setFullscreenImage({
                                                        url: resolveMediaUrl(
                                                          product.image,
                                                        ),
                                                        copyOnClick: true,
                                                        copyMessage:
                                                          'Imagen copiada.',
                                                      }),
                                                    title: 'Abrir imagen',
                                                  })
                                                : c.jsxs('div', {
                                                    className:
                                                      'w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500',
                                                    children: [
                                                      c.jsx('span', {
                                                        className:
                                                          'material-symbols-outlined text-3xl mb-0.5',
                                                        children: 'image',
                                                      }),
                                                      c.jsx('span', {
                                                        className:
                                                          'text-[9px] uppercase font-bold tracking-wide',
                                                        children: 'No Image',
                                                      }),
                                                    ],
                                                  }),
                                              c.jsx('span', {
                                                className: `absolute right-1.5 top-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${getMissionProductStatusClassName(
                                                  product.status,
                                                )}`,
                                                children:
                                                  getMissionProductStatusLabel(
                                                    product.status,
                                                  ),
                                              }),
                                              c.jsxs('div', {
                                                className:
                                                  'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/78 via-black/45 to-transparent px-2 py-1.5',
                                                children: [
                                                  c.jsx('p', {
                                                    className:
                                                      'text-[10px] font-bold text-white truncate',
                                                    children: product.name,
                                                  }),
                                                  c.jsxs('div', {
                                                    className:
                                                      'mt-1 flex items-center justify-between gap-1',
                                                    children: [
                                                      c.jsx('span', {
                                                        className:
                                                          'inline-flex max-w-[70%] truncate rounded-full bg-white/16 px-1.5 py-0.5 text-[9px] font-semibold text-white/92 backdrop-blur-sm',
                                                        children:
                                                          product.client_name ||
                                                          `Cliente #${product.client}`,
                                                      }),
                                                      Number.isFinite(
                                                        getProductQuickFinalPrice(
                                                          product,
                                                        ),
                                                      ) &&
                                                        c.jsxs('span', {
                                                          className:
                                                            'shrink-0 rounded-full bg-white/18 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm',
                                                          children: [
                                                            '$',
                                                            formatProductQuickFinalPrice(
                                                              product,
                                                            ),
                                                          ],
                                                        }),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                            ],
                                          }),
                                          product.tags
                                            ? c.jsx('div', {
                                                className:
                                                  'px-1.5 py-1 flex flex-wrap gap-1 border-t border-gray-100 dark:border-gray-800 bg-white/75 dark:bg-gray-900/25',
                                                children: product.tags
                                                  .split(',')
                                                  .map((tag) => parseVisualTag(tag))
                                                  .filter(Boolean)
                                                  .slice(0, 2)
                                                  .map((tag, index) =>
                                                    c.jsx(
                                                      'span',
                                                      {
                                                        className: `${getTagClassName(tag.type)} text-[9px] px-1.5 py-0.5 rounded`,
                                                        children: tag.label,
                                                      },
                                                      `${product.id}-shopping-product-tag-${index}`,
                                                    ),
                                                  ),
                                              })
                                            : c.jsx('div', {
                                                className:
                                                  'h-1.5 bg-white dark:bg-gray-900/25',
                                              }),
                                        ],
                                      },
                                      product.id,
                                    ),
                                  ),
                                }),
                              ],
                            }),
                          clients.length === 0 &&
                            visibleProducts.length === 0 &&
                            c.jsx('div', {
                              className: 'px-4 py-6 text-center',
                              children: c.jsx('p', {
                                className: 'text-xs text-gray-400',
                                children:
                                  'No clients or products linked to this shopping.',
                              }),
                            }),
                          mission.status === 'COMPLETED' &&
                            c.jsx('div', {
                              className:
                                'px-4 py-3 border-t border-border-light dark:border-border-dark',
                              children: c.jsxs('button', {
                                onClick: () => exportMissionCsv(mission),
                                className:
                                  'w-full py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition flex justify-center items-center gap-1',
                                children: [
                                  c.jsx('span', {
                                    className:
                                      'material-symbols-outlined text-[14px]',
                                    children: 'download',
                                  }),
                                  ' Export CSV',
                                ],
                              }),
                            }),
                          c.jsxs('div', {
                            className:
                              'px-4 py-3 border-t border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-900/30 flex gap-2',
                            children: [
                              c.jsxs('button', {
                                onClick: (event) => {
                                  event.stopPropagation();
                                  setEditingMissionId(mission.id);
                                  setEditingMissionName(mission.name || '');
                                },
                                className:
                                  'flex-1 py-2 text-xs font-semibold text-gray-600 bg-white dark:bg-gray-800 dark:text-gray-300 border rounded-lg hover:bg-gray-100 transition flex justify-center items-center gap-1',
                                children: [
                                  c.jsx('span', {
                                    className:
                                      'material-symbols-outlined text-[14px]',
                                    children: 'edit',
                                  }),
                                  ' Rename',
                                ],
                              }),
                              c.jsxs('button', {
                                onClick: (event) => {
                                  event.stopPropagation();
                                  deleteMission(mission.id);
                                },
                                className:
                                  'flex-1 py-2 text-xs font-semibold text-red-500 bg-white dark:bg-gray-800 border border-red-100 rounded-lg hover:bg-red-50 transition flex justify-center items-center gap-1',
                                children: [
                                  c.jsx('span', {
                                    className:
                                      'material-symbols-outlined text-[14px]',
                                    children: 'delete',
                                  }),
                                  ' Delete',
                                ],
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
