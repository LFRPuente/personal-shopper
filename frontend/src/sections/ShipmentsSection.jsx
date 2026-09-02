import {
  V,
  c,
  SHIPMENT_CARRIER_OPTIONS,
  canEditShipmentBox,
  DARK_NATIVE_SELECT_STYLE,
  NATIVE_DROPDOWN_OPTION_STYLE,
  getShipmentStatusLabel,
  getShipmentTrackingUrl,
  resolveMediaUrl,
} from '../utils.js';
import { useShipmentsContext } from '../AppContext.jsx';

export const SHIPMENTS_SECTION_REQUIRED_CONTEXT = [
  'shipments',
  'shipmentSearch',
  'setShipmentSearch',
  'shipmentStatusFilter',
  'setShipmentStatusFilter',
  'shipmentTotalCount',
  'shipmentHasNextPage',
  'shipmentLoading',
  'loadMoreShipments',
  'isDesktopLayout',
  'openShipmentEditor',
  'isShipmentExpanded',
  'shipmentHasHydratedDetail',
  'shipmentDetailLoadingIds',
  'shipmentForm',
  'getShipmentFormState',
  'shipmentSelectedProducts',
  'toggleExpandedShipment',
  'openShipmentEvidencePicker',
  'shipmentEvidenceUploadingId',
  'copyClientShipmentHistoryLink',
  'copiedClientShareLinks',
  'deleteShipment',
  'formatAmount',
  'getShipmentSalePriceAmount',
  'updateShipmentForm',
  'resetExpandedShipmentForm',
  'shipmentSaving',
  'saveShipmentEditor',
  'getClientShipmentAddressOptions',
  'toggleShipmentProductSelection',
  'openShipmentEvidenceMenuId',
  'setOpenShipmentEvidenceMenuId',
  'getShipmentEvidenceKind',
  'openShipmentEvidenceReplacePicker',
  'shipmentEvidenceReplacingId',
  'deleteShipmentEvidence',
  'shipmentEvidenceDeletingId',
  'setFullscreenImage',
  'openProductStatusId',
  'setOpenProductStatusId',
  'setOpenProductMenuId',
  'setOpenProductInfoId',
  'setShipmentProductPickerOpen',
  'getProductStatusChipClassName',
  'getProductStatusLabel',
  'productStatusUpdatingId',
  'setShipmentProductStatusQuick',
  'getProductPaymentAmount',
  'clientBalances',
];

const DEFAULT_CONTEXT = {
  shipments: [],
  shipmentSearch: '',
  setShipmentSearch: () => {},
  shipmentStatusFilter: '',
  setShipmentStatusFilter: () => {},
  shipmentTotalCount: 0,
  shipmentHasNextPage: false,
  shipmentLoading: false,
  loadMoreShipments: () => {},
  isDesktopLayout: false,
  openShipmentEditor: () => {},
  isShipmentExpanded: () => false,
  shipmentHasHydratedDetail: () => false,
  shipmentDetailLoadingIds: [],
  shipmentForm: { id: null, carrier: '', status: 'PENDING', tracking_number: '', guide_price: '', client_price: '', includes_insurance: false, insurance_price: '', insurance_sale_price: '', package_length: '', package_width: '', package_height: '', package_weight: '', shipping_address: '', product_ids: [] },
  getShipmentFormState: () => null,
  shipmentSelectedProducts: [],
  toggleExpandedShipment: () => {},
  openShipmentEvidencePicker: () => {},
  shipmentEvidenceUploadingId: null,
  copyClientShipmentHistoryLink: () => {},
  copiedClientShareLinks: [],
  deleteShipment: () => {},
  formatAmount: (value) => String(value ?? ''),
  getShipmentSalePriceAmount: () => 0,
  updateShipmentForm: () => {},
  resetExpandedShipmentForm: () => {},
  shipmentSaving: false,
  saveShipmentEditor: () => {},
  getClientShipmentAddressOptions: () => [],
  toggleShipmentProductSelection: () => {},
  openShipmentEvidenceMenuId: null,
  setOpenShipmentEvidenceMenuId: () => {},
  getShipmentEvidenceKind: () => 'IMAGE',
  openShipmentEvidenceReplacePicker: () => {},
  shipmentEvidenceReplacingId: null,
  deleteShipmentEvidence: () => {},
  shipmentEvidenceDeletingId: null,
  setFullscreenImage: () => {},
  openProductStatusId: null,
  setOpenProductStatusId: () => {},
  setOpenProductMenuId: () => {},
  setOpenProductInfoId: () => {},
  setShipmentProductPickerOpen: () => {},
  getProductStatusChipClassName: () => '',
  getProductStatusLabel: (value) => String(value || ''),
  productStatusUpdatingId: null,
  setShipmentProductStatusQuick: () => {},
  getProductPaymentAmount: () => Number.NaN,
  clientBalances: {},
};

const SHIPMENT_PRODUCT_PREVIEW_LIMIT = 6;
const SHIPMENT_EVIDENCE_PREVIEW_LIMIT = 6;

function ShipmentProductsGrid({
  shipment,
  canEditBox,
  selectedProducts,
  formatAmount,
  resolveMediaUrl: resolveMedia = resolveMediaUrl,
  getProductPaymentAmount,
  openProductStatusId,
  setOpenProductStatusId,
  setOpenProductMenuId,
  setOpenProductInfoId,
  setShipmentProductPickerOpen,
  getProductStatusChipClassName,
  getProductStatusLabel,
  productStatusUpdatingId,
  setShipmentProductStatusQuick,
  setFullscreenImage,
  toggleShipmentProductSelection,
}) {
  const [visibleLimit, setVisibleLimit] = V.useState(SHIPMENT_PRODUCT_PREVIEW_LIMIT);
  const productsSaleTotal = selectedProducts.reduce((total, product) => total + getProductPaymentAmount(product), 0);
  V.useEffect(() => {
    setVisibleLimit(SHIPMENT_PRODUCT_PREVIEW_LIMIT);
  }, [shipment && shipment.id, selectedProducts.length]);
  const visibleProducts = selectedProducts.slice(0, visibleLimit);
  const hasMoreProducts = selectedProducts.length > visibleProducts.length;

  return c.jsxs('div', {
    className: 'rounded-lg bg-sky-50 dark:bg-sky-950/20 px-2.5 py-2',
    children: [
      c.jsxs('div', {
        className: 'flex items-center justify-between gap-2',
        children: [
          c.jsxs('p', {
            className:
              'text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300',
            children: ['Productos (', selectedProducts.length || 0, ') · Total de venta: $', formatAmount(productsSaleTotal)],
          }),
          canEditBox &&
            c.jsxs('button', {
              type: 'button',
              onClick: () => setShipmentProductPickerOpen(true),
              className:
                'inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300',
              children: [
                c.jsx('span', {
                  className: 'material-symbols-outlined text-[13px]',
                  children: 'photo_library',
                }),
                'Galeria',
              ],
            }),
        ],
      }),
      selectedProducts.length > 0
        ? c.jsx('div', {
            className: 'mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2',
            children: visibleProducts.map((product) => {
              const productPrice = getProductPaymentAmount(product);
              const productStatusValue = String(
                (product && product.status) || 'ANNOTATED',
              ).toUpperCase();
              const shipmentDisplayStatusValue =
                productStatusValue === 'BOUGHT' ? 'ANNOTATED' : productStatusValue;
              const shipmentProductStatusActions = [
                { value: 'ANNOTATED', label: 'Anotado', icon: 'edit_note' },
                { value: 'SHIPPED', label: 'Enviado', icon: 'local_shipping' },
              ];

              return c.jsx(
                'div',
                {
                  className:
                    'relative overflow-visible rounded-xl border border-sky-100 dark:border-sky-900 bg-white/90 dark:bg-slate-900/80 ui-media-card',
                  children: c.jsxs('div', {
                    className: 'relative text-left w-full',
                    children: [
                      c.jsxs('div', {
                        className: `absolute top-2 left-2 ${openProductStatusId === product.id ? 'z-50' : 'z-20'}`,
                        'data-product-status': '1',
                        children: [
                          c.jsx('button', {
                            type: 'button',
                            onClick: (event) => {
                              event.stopPropagation();
                              setOpenProductMenuId(null);
                              setOpenProductInfoId(null);
                              setOpenProductStatusId((currentId) =>
                                currentId === product.id ? null : product.id,
                              );
                            },
                            className: `w-6 h-6 rounded-full border shadow-sm backdrop-blur-[2px] flex items-center justify-center ${getProductStatusChipClassName(shipmentDisplayStatusValue)} ${productStatusUpdatingId === product.id ? 'opacity-70 cursor-wait' : ''}`,
                            title: `Cambiar status (${getProductStatusLabel(shipmentDisplayStatusValue)})`,
                            children: c.jsx('span', {
                              className: `material-symbols-outlined text-[12px] ${productStatusUpdatingId === product.id ? 'animate-spin' : ''}`,
                              children:
                                productStatusUpdatingId === product.id
                                  ? 'progress_activity'
                                  : shipmentDisplayStatusValue === 'SHIPPED'
                                    ? 'local_shipping'
                                    : 'edit_note',
                            }),
                          }),
                          openProductStatusId === product.id &&
                            c.jsxs('div', {
                              className:
                                'absolute left-0 top-8 z-40 min-w-[118px] rounded-xl border border-slate-200/90 bg-white/96 p-1 shadow-xl backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/96',
                              children: [
                                c.jsx('div', {
                                  className:
                                    'px-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400',
                                  children: 'Cambiar status',
                                }),
                                shipmentProductStatusActions.map((action) =>
                                  c.jsxs(
                                    'button',
                                    {
                                      type: 'button',
                                      onClick: (event) => {
                                        event.stopPropagation();
                                        setOpenProductStatusId(null);
                                        setShipmentProductStatusQuick(
                                          product.id,
                                          action.value,
                                        );
                                      },
                                      disabled:
                                        productStatusUpdatingId === product.id,
                                      className:
                                        'w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-[11px] text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80 disabled:opacity-60 disabled:cursor-wait',
                                      children: [
                                        c.jsx('span', { children: action.label }),
                                        c.jsx('span', {
                                          className:
                                            'material-symbols-outlined text-[13px]',
                                          children: action.icon,
                                        }),
                                      ],
                                    },
                                    `shipment-status-${product.id}-${action.value}`,
                                  ),
                                ),
                              ],
                            }),
                        ],
                      }),
                      product.image
                        ? c.jsx('img', {
                            src: resolveMedia(product.image),
                            loading: 'lazy',
                            decoding: 'async',
                            className:
                              'w-full aspect-[4/5] object-cover cursor-zoom-in rounded-t-xl',
                            onClick: (event) => {
                              event.stopPropagation();
                              setFullscreenImage({
                                url: resolveMedia(product.image),
                                copyOnClick: true,
                                copyMessage: 'Imagen copiada.',
                              });
                            },
                            title: 'Abrir imagen',
                          })
                        : c.jsx('div', {
                            className:
                              'w-full aspect-[4/5] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 rounded-t-xl',
                            children: c.jsx('span', {
                              className: 'material-symbols-outlined text-[18px]',
                              children: 'image',
                            }),
                          }),
                      Number.isFinite(productPrice) &&
                        c.jsx('div', {
                          className:
                            'absolute inset-x-0 bottom-2 z-20 flex justify-center pointer-events-none',
                          children: c.jsxs('span', {
                            className:
                              'inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white/82 dark:bg-slate-900/82 px-2 py-[3px] text-[10px] font-bold text-slate-800 dark:text-slate-100 border border-white/70 dark:border-slate-700/80 shadow-sm backdrop-blur-md',
                            children: ['$', formatAmount(productPrice)],
                          }),
                        }),
                      c.jsx('div', {
                        className:
                          'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/78 via-black/45 to-transparent px-2 py-2 pb-8',
                        children: [
                          c.jsx('p', {
                            className: 'text-[10px] font-bold text-white truncate',
                            children: product.name,
                          }),
                          c.jsxs('div', {
                            className: 'mt-1 flex flex-wrap items-center gap-1',
                            children: [
                              c.jsx('span', {
                                className:
                                  'inline-flex max-w-full truncate rounded-full bg-white/16 px-1.5 py-0.5 text-[9px] font-semibold text-white/92 backdrop-blur-sm',
                                children:
                                  product.shopping_name ||
                                  product.mission_name ||
                                  product.store_name ||
                                  'Sin shopping',
                              }),
                              (product.shopping_date || product.mission_date) &&
                                c.jsx('span', {
                                  className:
                                    'inline-flex shrink-0 rounded-full bg-white/14 px-1.5 py-0.5 text-[9px] font-semibold text-white/80 backdrop-blur-sm',
                                  children: new Date(
                                    product.shopping_date || product.mission_date,
                                  ).toLocaleDateString(),
                                }),
                            ],
                          }),
                        ],
                      }),
                      canEditBox &&
                        c.jsx('button', {
                          type: 'button',
                          onClick: (event) => {
                            event.stopPropagation();
                            toggleShipmentProductSelection(product);
                          },
                          className:
                            'absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/70',
                          children: c.jsx('span', {
                            className: 'material-symbols-outlined text-[14px]',
                            children: 'close',
                          }),
                        }),
                    ],
                  }),
                },
                `shipment-inline-product-${shipment.id}-${product.id}`,
              );
            }),
          })
        : c.jsx('p', {
            className: 'mt-1 text-xs text-sky-700/80 dark:text-sky-300/80',
            children: canEditBox
              ? 'Abre la galeria para elegir productos.'
              : 'Sin productos asignados.',
          }),
      hasMoreProducts &&
        c.jsx('button', {
          type: 'button',
          onClick: () =>
            setVisibleLimit((limit) =>
              Math.min(limit + SHIPMENT_PRODUCT_PREVIEW_LIMIT, selectedProducts.length),
            ),
          className:
            'mt-2 w-full rounded-lg border border-sky-100 bg-white/80 py-1.5 text-[11px] font-bold text-sky-700 hover:bg-sky-50 dark:border-sky-900 dark:bg-slate-900/70 dark:text-sky-300 dark:hover:bg-sky-950/40',
          children: `Ver mas productos (${visibleProducts.length} de ${selectedProducts.length})`,
        }),
    ],
  });
}

function ShipmentEvidenceGrid({
  shipment,
  openShipmentEvidencePicker,
  shipmentEvidenceUploadingId,
  openShipmentEvidenceMenuId,
  setOpenShipmentEvidenceMenuId,
  getShipmentEvidenceKind,
  openShipmentEvidenceReplacePicker,
  shipmentEvidenceReplacingId,
  deleteShipmentEvidence,
  shipmentEvidenceDeletingId,
  setFullscreenImage,
}) {
  const evidenceItems = shipment.evidence || [];
  const [visibleLimit, setVisibleLimit] = V.useState(SHIPMENT_EVIDENCE_PREVIEW_LIMIT);
  V.useEffect(() => {
    setVisibleLimit(SHIPMENT_EVIDENCE_PREVIEW_LIMIT);
  }, [shipment && shipment.id, evidenceItems.length]);
  const visibleEvidence = evidenceItems.slice(0, visibleLimit);
  const hasMoreEvidence = evidenceItems.length > visibleEvidence.length;

  return c.jsxs('div', {
    className: 'rounded-lg bg-violet-50 dark:bg-violet-950/20 px-2.5 py-1.5',
    children: [
      c.jsxs('div', {
        className: 'flex items-center justify-between gap-2',
        children: [
          c.jsx('p', {
            className:
              'text-[10px] uppercase font-bold text-violet-700 dark:text-violet-300',
            children: 'Evidencia',
          }),
          c.jsxs('button', {
            type: 'button',
            onClick: () => openShipmentEvidencePicker(shipment),
            disabled: shipmentEvidenceUploadingId === shipment.id,
            className:
              'inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 dark:text-violet-300 disabled:opacity-60',
            children: [
              c.jsx('span', {
                className: `material-symbols-outlined text-[13px] ${shipmentEvidenceUploadingId === shipment.id ? 'animate-spin' : ''}`,
                children:
                  shipmentEvidenceUploadingId === shipment.id
                    ? 'progress_activity'
                    : 'add',
              }),
              'Agregar',
            ],
          }),
        ],
      }),
      evidenceItems.length > 0
        ? c.jsx('div', {
            className: 'mt-2 grid grid-cols-3 sm:grid-cols-4 gap-1.5',
            children: visibleEvidence.map((evidenceItem) => {
              const evidenceKind = getShipmentEvidenceKind(evidenceItem);
              return c.jsxs(
                'div',
                {
                  className:
                    'relative overflow-visible rounded-xl border border-violet-100 dark:border-violet-900 bg-white/90 dark:bg-slate-900/80',
                  children: [
                    c.jsxs('div', {
                      className: 'absolute top-1.5 right-1.5 z-20',
                      'data-shipment-evidence-menu': '1',
                      children: [
                        c.jsx('button', {
                          type: 'button',
                          onClick: (event) => {
                            event.stopPropagation();
                            setOpenShipmentEvidenceMenuId((currentId) =>
                              currentId === evidenceItem.id ? null : evidenceItem.id,
                            );
                          },
                          className:
                            'w-5 h-5 rounded-full bg-white/38 text-gray-700 hover:bg-white/56 border border-white/35 shadow-sm backdrop-blur-[2px] flex items-center justify-center',
                          title: 'Opciones de evidencia',
                          children: c.jsx('span', {
                            className: 'material-symbols-outlined text-[12px]',
                            children: 'more_vert',
                          }),
                        }),
                        openShipmentEvidenceMenuId === evidenceItem.id &&
                          c.jsxs('div', {
                            className:
                              'absolute right-0 top-7 z-30 w-36 rounded-xl border border-slate-200 bg-white shadow-lg p-1 dark:border-slate-700 dark:bg-slate-900',
                            children: [
                              c.jsxs('button', {
                                type: 'button',
                                onClick: (event) => {
                                  event.stopPropagation();
                                  openShipmentEvidenceReplacePicker(
                                    shipment,
                                    evidenceItem,
                                  );
                                },
                                disabled:
                                  shipmentEvidenceReplacingId === evidenceItem.id,
                                className: `w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-blue-700 dark:text-blue-200 ${shipmentEvidenceReplacingId === evidenceItem.id ? 'opacity-60 cursor-wait bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-blue-50 dark:hover:bg-blue-950/30'}`,
                                children: [
                                  c.jsx('span', {
                                    className: `material-symbols-outlined text-[14px] ${shipmentEvidenceReplacingId === evidenceItem.id ? 'animate-spin' : ''}`,
                                    children:
                                      shipmentEvidenceReplacingId === evidenceItem.id
                                        ? 'progress_activity'
                                        : 'edit',
                                  }),
                                  shipmentEvidenceReplacingId === evidenceItem.id
                                    ? 'Cambiando'
                                    : 'Cambiar',
                                ],
                              }),
                              c.jsxs('button', {
                                type: 'button',
                                onClick: (event) => {
                                  event.stopPropagation();
                                  deleteShipmentEvidence(shipment, evidenceItem.id);
                                },
                                disabled:
                                  shipmentEvidenceDeletingId === evidenceItem.id,
                                className: `w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-red-700 dark:text-red-300 ${shipmentEvidenceDeletingId === evidenceItem.id ? 'opacity-60 cursor-wait bg-red-50 dark:bg-red-950/30' : 'hover:bg-red-50 dark:hover:bg-red-950/30'}`,
                                children: [
                                  c.jsx('span', {
                                    className: `material-symbols-outlined text-[14px] ${shipmentEvidenceDeletingId === evidenceItem.id ? 'animate-spin' : ''}`,
                                    children:
                                      shipmentEvidenceDeletingId === evidenceItem.id
                                        ? 'progress_activity'
                                        : 'delete',
                                  }),
                                  shipmentEvidenceDeletingId === evidenceItem.id
                                    ? 'Eliminando'
                                    : 'Eliminar',
                                ],
                              }),
                            ],
                          }),
                      ],
                    }),
                    evidenceKind === 'VIDEO'
                      ? c.jsx('video', {
                          src: resolveMediaUrl(evidenceItem.file),
                          controls: true,
                          preload: 'metadata',
                          className: 'w-full aspect-square bg-black object-cover',
                        })
                      : c.jsx('img', {
                          src: resolveMediaUrl(evidenceItem.file),
                          loading: 'lazy',
                          decoding: 'async',
                          onClick: () =>
                            setFullscreenImage({
                              url: resolveMediaUrl(evidenceItem.file),
                              copyOnClick: true,
                              copyMessage: 'Evidencia copiada.',
                            }),
                          className: 'w-full aspect-square object-cover cursor-zoom-in',
                        }),
                    c.jsxs('div', {
                      className:
                        'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-1.5 py-1 flex items-end justify-between gap-1',
                      children: [
                        c.jsx('span', {
                          className: 'text-[9px] font-bold uppercase text-white/90',
                          children: evidenceKind === 'VIDEO' ? 'Video' : 'Imagen',
                        }),
                        c.jsx('span', { className: 'inline-flex h-5 w-5 shrink-0' }),
                      ],
                    }),
                  ],
                },
                `shipment-evidence-${shipment.id}-${evidenceItem.id}`,
              );
            }),
          })
        : c.jsx('p', {
            className: 'mt-1 text-xs text-violet-700/80 dark:text-violet-300/80',
            children: 'Sin evidencia cargada.',
          }),
      hasMoreEvidence &&
        c.jsx('button', {
          type: 'button',
          onClick: () =>
            setVisibleLimit((limit) =>
              Math.min(limit + SHIPMENT_EVIDENCE_PREVIEW_LIMIT, evidenceItems.length),
            ),
          className:
            'mt-2 w-full rounded-lg border border-violet-100 bg-white/80 py-1.5 text-[11px] font-bold text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:bg-slate-900/70 dark:text-violet-300 dark:hover:bg-violet-950/40',
          children: `Ver mas evidencia (${visibleEvidence.length} de ${evidenceItems.length})`,
        }),
    ],
  });
}

function ShipmentExpandedPanel(props) {
  const {
    shipment,
    hasHydratedDetail,
    isLoadingDetail,
    formState,
    canEditBox,
    selectedProducts,
    updateShipmentForm,
    getClientShipmentAddressOptions,
    resetExpandedShipmentForm,
    shipmentSaving,
    saveShipmentEditor,
  } = props;

  if (!hasHydratedDetail) {
    return c.jsxs('div', {
      className: 'space-y-2.5 pt-2 pb-1 text-xs text-text-sub',
      children: [
        c.jsxs('div', {
          className:
            'rounded-xl border border-border-light dark:border-border-dark bg-slate-50/70 dark:bg-slate-900/40 px-3 py-3 flex items-center gap-2',
          children: [
            c.jsx('span', {
              className: `material-symbols-outlined text-[16px] ${isLoadingDetail ? 'animate-spin' : ''}`,
              children: isLoadingDetail ? 'progress_activity' : 'hourglass_top',
            }),
            c.jsx('span', {
              children: isLoadingDetail
                ? 'Cargando detalle del envio...'
                : 'Preparando detalle del envio...',
            }),
          ],
        }),
      ],
    });
  }

  const shipmentTrackingUrl = getShipmentTrackingUrl(
    formState.carrier,
    formState.tracking_number,
  );

  return c.jsxs('div', {
    className: 'space-y-2.5 pt-0.5',
    children: [
      c.jsxs('div', {
        className: 'grid grid-cols-1 sm:grid-cols-2 gap-2',
        children: [
          c.jsxs('label', {
            className: 'rounded-lg bg-slate-50 dark:bg-slate-900/50 px-2.5 py-2',
            children: [
              c.jsx('p', {
                className: 'text-[10px] uppercase font-bold text-text-sub',
                children: 'Paqueteria',
              }),
              c.jsx('select', {
                value: formState.carrier,
                onChange: (event) =>
                  updateShipmentForm('carrier', event.target.value),
                className:
                  'mt-1 w-full bg-transparent text-xs font-semibold outline-none',
                children: SHIPMENT_CARRIER_OPTIONS.map((option) =>
                  c.jsx(
                    'option',
                    { value: option.value, children: option.label },
                    `shipment-inline-carrier-${option.value || 'empty'}`,
                  ),
                ),
              }),
            ],
          }),
          c.jsxs('label', {
            className: 'rounded-lg bg-slate-50 dark:bg-slate-900/50 px-2.5 py-2',
            children: [
              c.jsx('p', {
                className: 'text-[10px] uppercase font-bold text-text-sub',
                children: 'Guia',
              }),
              c.jsxs('div', {
                className: 'mt-1 flex items-center gap-2',
                children: [
                  c.jsx('input', {
                    type: 'text',
                    value: formState.tracking_number,
                    onChange: (event) =>
                      updateShipmentForm('tracking_number', event.target.value),
                    placeholder: 'Numero de rastreo',
                    className:
                      'min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none',
                  }),
                  shipmentTrackingUrl &&
                    c.jsxs('a', {
                      href: shipmentTrackingUrl,
                      target: '_blank',
                      rel: 'noreferrer',
                      onClick: (event) => event.stopPropagation(),
                      className:
                        'shrink-0 inline-flex items-center gap-0.5 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/30 dark:text-sky-300 dark:hover:bg-sky-900/40',
                      title: 'Abrir rastreo de guia',
                      children: [
                        c.jsx('span', {
                          className: 'material-symbols-outlined text-[13px]',
                          children: 'open_in_new',
                        }),
                        'Rastrear',
                      ],
                    }),
                ],
              }),
            ],
          }),
        ],
      }),
      c.jsxs('div', {
        className: 'grid grid-cols-1 sm:grid-cols-4 gap-2',
        children: [
          c.jsxs('label', {
            className: 'rounded-lg bg-slate-50 dark:bg-slate-900/50 px-2.5 py-2',
            children: [
              c.jsx('p', {
                className: 'text-[10px] uppercase font-bold text-text-sub',
                children: 'Status',
              }),
              c.jsx('select', {
                value: formState.status,
                onChange: (event) =>
                  updateShipmentForm('status', event.target.value),
                style: DARK_NATIVE_SELECT_STYLE,
                className:
                  'mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-primary/40',
                children: [
                  c.jsx(
                    'option',
                    {
                      value: 'PENDING',
                      style: NATIVE_DROPDOWN_OPTION_STYLE,
                      children: 'Pendiente',
                    },
                    'shipment-inline-status-pending',
                  ),
                  c.jsx(
                    'option',
                    {
                      value: 'SHIPPED',
                      style: NATIVE_DROPDOWN_OPTION_STYLE,
                      children: 'Enviado',
                    },
                    'shipment-inline-status-shipped',
                  ),
                  c.jsx(
                    'option',
                    {
                      value: 'DELIVERED',
                      style: NATIVE_DROPDOWN_OPTION_STYLE,
                      children: 'Entregado',
                    },
                    'shipment-inline-status-delivered',
                  ),
                  c.jsx(
                    'option',
                    {
                      value: 'CANCELLED',
                      style: NATIVE_DROPDOWN_OPTION_STYLE,
                      children: 'Cancelado',
                    },
                    'shipment-inline-status-cancelled',
                  ),
                ],
              }),
            ],
          }),
          c.jsxs('label', {
            className: 'rounded-lg bg-amber-50 dark:bg-amber-950/20 px-2.5 py-2',
            children: [
              c.jsx('p', {
                className:
                  'text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300',
                children: 'Costo de compra',
              }),
              c.jsx('input', {
                type: 'text',
                inputMode: 'decimal',
                value: formState.guide_price,
                onChange: (event) =>
                  updateShipmentForm('guide_price', event.target.value),
                placeholder: '0.00',
                className:
                  'mt-1 w-full bg-transparent text-xs font-semibold text-amber-800 dark:text-amber-200 outline-none',
              }),
            ],
          }),
          c.jsxs('label', {
            className:
              'rounded-lg bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-2',
            children: [
              c.jsx('p', {
                className:
                  'text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300',
                children: 'Costo de venta',
              }),
              c.jsx('input', {
                type: 'text',
                inputMode: 'decimal',
                value: formState.client_price,
                onChange: (event) =>
                  updateShipmentForm('client_price', event.target.value),
                placeholder: '0.00',
                className:
                  'mt-1 w-full bg-transparent text-xs font-semibold text-emerald-800 dark:text-emerald-200 outline-none',
              }),
            ],
          }),
          c.jsxs('div', {
            className: 'rounded-lg bg-sky-50 dark:bg-sky-950/20 px-2.5 py-2',
            children: [
              c.jsx('p', {
                className:
                  'text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300',
                children: 'Items',
              }),
              c.jsxs('p', {
                className:
                  'mt-1 text-xs font-semibold text-sky-800 dark:text-sky-100',
                children: [selectedProducts.length || 0, ' producto(s)'],
              }),
            ],
          }),
        ],
      }),
      c.jsxs('div', {
        className: 'grid grid-cols-1 gap-2',
        children: [
          c.jsxs('label', {
            className: 'rounded-lg bg-violet-50 dark:bg-violet-950/20 px-2.5 py-2',
            children: [
              c.jsx('p', {
                className:
                  'text-[10px] uppercase font-bold text-violet-700 dark:text-violet-300',
                children: 'Incluye seguro',
              }),
              c.jsxs('button', {
                type: 'button',
                role: 'switch',
                'aria-checked': formState.includes_insurance,
                onClick: () =>
                  updateShipmentForm(
                    'includes_insurance',
                    !formState.includes_insurance,
                  ),
                className:
                  `mt-1 inline-flex h-10 w-full items-center justify-between rounded-xl border px-3 text-xs font-semibold transition ${formState.includes_insurance ? 'border-primary/40 bg-primary/10 text-primary' : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`,
                children: [
                  c.jsx('span', {
                    children: formState.includes_insurance ? 'Sí' : 'No',
                  }),
                  c.jsx('span', {
                    className:
                      `inline-flex h-5 w-10 items-center rounded-full p-0.5 transition ${formState.includes_insurance ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`,
                    children: c.jsx('span', {
                      className:
                        `h-4 w-4 rounded-full bg-white shadow transition ${formState.includes_insurance ? 'translate-x-5' : 'translate-x-0'}`,
                    }),
                  }),
                ],
              }),
            ],
          }),
          formState.includes_insurance &&
            c.jsxs('div', {
              className: 'grid grid-cols-1 sm:grid-cols-2 gap-2',
              children: [
                c.jsxs('label', {
                  className: 'rounded-lg bg-amber-50 dark:bg-amber-950/20 px-2.5 py-2',
                  children: [
                    c.jsx('p', {
                      className:
                        'text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300',
                      children: 'Costo del seguro',
                    }),
                    c.jsx('input', {
                      type: 'text',
                      inputMode: 'decimal',
                      value: formState.insurance_price,
                      onChange: (event) =>
                        updateShipmentForm('insurance_price', event.target.value),
                      placeholder: '0.00',
                      className:
                        'mt-1 w-full bg-transparent text-xs font-semibold text-amber-800 dark:text-amber-200 outline-none',
                    }),
                  ],
                }),
                c.jsxs('label', {
                  className:
                    'rounded-lg bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-2',
                  children: [
                    c.jsx('p', {
                      className:
                        'text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300',
                      children: 'Costo de venta',
                    }),
                    c.jsx('input', {
                      type: 'text',
                      inputMode: 'decimal',
                      value: formState.insurance_sale_price,
                      onChange: (event) =>
                        updateShipmentForm('insurance_sale_price', event.target.value),
                      placeholder: '0.00',
                      className:
                        'mt-1 w-full bg-transparent text-xs font-semibold text-emerald-800 dark:text-emerald-200 outline-none',
                    }),
                  ],
                }),
              ],
            }),
        ],
      }),
      c.jsx('div', {
        className:
          'grid grid-cols-4 gap-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 px-2.5 py-2',
        children: [
          ['package_length', 'Largo CM'],
          ['package_width', 'Ancho CM'],
          ['package_height', 'Alto CM'],
          ['package_weight', 'Peso KG'],
        ].map(([field, label]) =>
          c.jsxs(
            'label',
            {
              className: 'block min-w-0',
              children: [
                c.jsx('p', {
                  className:
                    'text-center text-[9px] uppercase font-bold text-text-sub',
                  children: label,
                }),
                c.jsx('input', {
                  type: 'text',
                  inputMode: 'decimal',
                  value: formState[field] || '',
                  onChange: (event) => updateShipmentForm(field, event.target.value),
                  className:
                    'mt-1 h-7 w-full rounded-md border border-slate-200 bg-white px-1 text-center text-xs font-semibold text-text-main outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
                }),
              ],
            },
            `shipment-inline-package-${field}`,
          ),
        ),
      }),
      c.jsxs('label', {
        className:
          'block rounded-lg bg-gray-50 dark:bg-gray-900/40 px-2.5 py-2',
        children: [
          c.jsx('p', {
            className: 'text-[10px] uppercase font-bold text-text-sub',
            children: 'Direccion de envio',
          }),
          getClientShipmentAddressOptions(formState.client).length > 1 &&
            c.jsxs('select', {
              value: formState.shipping_address,
              onChange: (event) =>
                updateShipmentForm('shipping_address', event.target.value),
              style: DARK_NATIVE_SELECT_STYLE,
              className:
                'mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-primary/40',
              children: getClientShipmentAddressOptions(formState.client).map(
                (address, index) =>
                  c.jsx(
                    'option',
                    {
                      value: address,
                      style: NATIVE_DROPDOWN_OPTION_STYLE,
                      children: address,
                    },
                    `shipment-inline-address-${index}`,
                  ),
              ),
            }),
          c.jsx('textarea', {
            rows: 2,
            value: formState.shipping_address,
            onChange: (event) =>
              updateShipmentForm('shipping_address', event.target.value),
            className:
              'mt-1 w-full bg-transparent text-xs text-text-main dark:text-slate-200 outline-none resize-none whitespace-pre-wrap',
            placeholder: 'Sin direccion capturada',
          }),
        ],
      }),
      c.jsx(ShipmentProductsGrid, props),
      c.jsxs('div', {
        className: 'flex items-center gap-2',
        children: [
          c.jsx('button', {
            type: 'button',
            onClick: () => resetExpandedShipmentForm(shipment),
            disabled: shipmentSaving,
            className:
              'flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-60',
            children: 'Restablecer',
          }),
          c.jsx('button', {
            type: 'button',
            onClick: saveShipmentEditor,
            disabled: shipmentSaving,
            className:
              'flex-1 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark text-xs font-semibold disabled:opacity-60',
            children: shipmentSaving ? 'Guardando...' : 'Guardar cambios',
          }),
        ],
      }),
      c.jsx(ShipmentEvidenceGrid, props),
    ],
  });
}

const ShipmentsSection = V.memo(function ShipmentsSection() {
  const ctx = useShipmentsContext() || DEFAULT_CONTEXT;
  const {
    shipments,
    shipmentSearch,
    setShipmentSearch,
    shipmentStatusFilter,
    setShipmentStatusFilter,
    shipmentTotalCount,
    shipmentHasNextPage,
    shipmentLoading,
    loadMoreShipments,
    isDesktopLayout,
    openShipmentEditor,
    isShipmentExpanded,
    shipmentHasHydratedDetail,
    shipmentDetailLoadingIds,
    shipmentForm,
    getShipmentFormState,
    shipmentSelectedProducts,
    toggleExpandedShipment,
    openShipmentEvidencePicker,
    shipmentEvidenceUploadingId,
    copyClientShipmentHistoryLink,
    copiedClientShareLinks,
    deleteShipment,
    formatAmount,
    getShipmentSalePriceAmount,
    updateShipmentForm,
    resetExpandedShipmentForm,
    shipmentSaving,
    saveShipmentEditor,
    getClientShipmentAddressOptions,
    toggleShipmentProductSelection,
    openShipmentEvidenceMenuId,
    setOpenShipmentEvidenceMenuId,
    getShipmentEvidenceKind,
    openShipmentEvidenceReplacePicker,
    shipmentEvidenceReplacingId,
    deleteShipmentEvidence,
    shipmentEvidenceDeletingId,
    setFullscreenImage,
    openProductStatusId,
    setOpenProductStatusId,
    setOpenProductMenuId,
    setOpenProductInfoId,
    setShipmentProductPickerOpen,
    getProductStatusChipClassName,
    getProductStatusLabel,
    productStatusUpdatingId,
    setShipmentProductStatusQuick,
    getProductPaymentAmount,
    clientBalances,
  } = { ...DEFAULT_CONTEXT, ...ctx };

  return c.jsxs('div', {
    className: 'space-y-4',
    children: [
      c.jsxs('div', {
        className: 'flex items-center justify-between mb-2',
        children: [
          c.jsxs('div', {
            children: [
              c.jsx('h2', {
                className: 'text-lg font-bold text-text-main dark:text-white',
                children: 'Shipments',
              }),
              c.jsxs('p', {
                className: 'text-xs text-text-sub',
                children: ['Total: ', shipmentTotalCount],
              }),
            ],
          }),
          c.jsxs('button', {
            onClick: () => openShipmentEditor(),
            className:
              'bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition',
            children: [
              c.jsx('span', {
                className: 'material-symbols-outlined text-[18px]',
                children: 'add',
              }),
              ' New',
            ],
          }),
        ],
      }),
      c.jsxs('div', {
        className: 'flex gap-2',
        children: [
          c.jsxs('div', {
            className: 'relative flex-1',
            children: [
              c.jsx('span', {
                className:
                  'material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400',
                children: 'search',
              }),
              c.jsx('input', {
                type: 'text',
                placeholder: 'Buscar envio, cliente o guia...',
                value: shipmentSearch,
                onChange: (event) => setShipmentSearch(event.target.value),
                className:
                  'w-full pl-10 pr-4 py-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-shadow',
              }),
            ],
          }),
          c.jsx('select', {
            value: shipmentStatusFilter,
            onChange: (event) => setShipmentStatusFilter(event.target.value),
            className: 'w-36 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-text-main outline-none focus:ring-2 focus:ring-primary/50 dark:border-gray-700 dark:bg-surface-dark dark:text-white',
            children: [['', 'Todos'], ['PENDING', 'Pendiente'], ['SHIPPED', 'Enviado'], ['DELIVERED', 'Entregado'], ['CANCELLED', 'Cancelado']].map(([value, label]) => c.jsx('option', { value, children: label }, value || 'all')),
          }),
        ],
      }),
      shipments.length === 0 && !shipmentLoading
        ? c.jsx('div', {
            className:
              'text-center py-12 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light border-dashed',
            children: c.jsx('p', {
              className: 'text-gray-500 text-sm',
              children: 'No hay envios definidos o coincidentes.',
            }),
          })
        : c.jsx('div', {
            className: isDesktopLayout
              ? 'grid gap-4 xl:grid-cols-2 2xl:grid-cols-3'
              : 'space-y-2',
            children: shipments.map((shipment) => {
              const isExpanded = isShipmentExpanded(shipment.id);
              const clientBalance = isExpanded ? Number(clientBalances[shipment.client]) || 0 : 0;
              const hasHydratedDetail = shipmentHasHydratedDetail(shipment);
              const isLoadingDetail = shipmentDetailLoadingIds.includes(Number(shipment.id));
              const formState = isExpanded
                ? hasHydratedDetail && Number(shipmentForm.id) === Number(shipment.id)
                  ? shipmentForm
                  : hasHydratedDetail
                    ? getShipmentFormState(shipment)
                    : null
                : null;
              const canEditBox = canEditShipmentBox(shipment);
              const canDeleteShipment = String(shipment.status || '').toUpperCase() === 'PENDING';
              const selectedProducts = isExpanded
                ? hasHydratedDetail && Number(shipmentForm.id) === Number(shipment.id)
                  ? shipmentSelectedProducts
                  : hasHydratedDetail
                    ? shipment.products_detail || []
                    : []
                : [];
              return c.jsxs(
                'div',
                {
                  className: `rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2.5 shadow-sm h-full ${isDesktopLayout ? 'rounded-2xl' : ''}`,
                  children: [
                    c.jsxs('div', {
                      className: isDesktopLayout
                        ? 'flex items-start justify-between gap-3'
                        : 'flex items-start justify-between gap-2',
                      children: [
                        c.jsxs('div', {
                          className: 'min-w-0 flex-1',
                          children: [
                            c.jsxs('p', {
                              className: isDesktopLayout
                                ? 'text-base font-bold text-text-main dark:text-white truncate'
                                : 'text-sm font-bold text-text-main dark:text-white truncate',
                              children: [
                                shipment.client_name || 'Cliente',
                                Number(shipment.client_shipment_number) > 0
                                  ? ` | (${shipment.client_shipment_number})`
                                  : '',
                              ],
                            }),
                            c.jsxs('p', {
                              className: isDesktopLayout
                                ? 'text-[12px] text-slate-600 dark:text-slate-300 truncate'
                                : 'text-[11px] text-slate-600 dark:text-slate-300 truncate',
                              children: [
                                shipment.carrier || 'Paqueteria sin definir',
                                ' - ',
                                shipment.product_count || 0,
                                ' items',
                                Number(shipment.evidence_count || 0) > 0
                                  ? ` - ${shipment.evidence_count} evid.`
                                  : '',
                                ' - ',
                                shipment.created_at
                                  ? new Date(shipment.created_at).toLocaleDateString()
                                  : 'Sin fecha',
                              ],
                            }),
                            c.jsxs('div', {
                              className: 'mt-1 flex items-center gap-2 text-[11px]',
                              children: [
                                c.jsx('span', {
                                  className:
                                    'font-bold uppercase text-sky-700 dark:text-sky-300',
                                  children: getShipmentStatusLabel(shipment.status),
                                }),
                                c.jsxs('span', {
                                  className: 'text-text-sub',
                                  children:
                                    getShipmentSalePriceAmount(shipment) <= 0
                                      ? 'Gratis'
                                      : ['$', formatAmount(getShipmentSalePriceAmount(shipment))],
                                }),
                              ],
                            }),
                          ],
                        }),
                        isExpanded &&
                          c.jsx('span', {
                            className: `shrink-0 rounded-xl border px-4 py-2 text-sm font-bold ${clientBalance < 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200' : clientBalance > 0 ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-200' : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200'}`,
                            children: clientBalance < 0 ? `A favor $${formatAmount(-clientBalance)}` : clientBalance > 0 ? `Deuda $${formatAmount(clientBalance)}` : 'Sin saldo',
                          }),
                        c.jsxs('div', {
                          className: 'flex items-center gap-1',
                          children: [
                            c.jsx('button', {
                              type: 'button',
                              onClick: () => toggleExpandedShipment(shipment),
                              className:
                                'w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
                              children: c.jsx('span', {
                                className: `material-symbols-outlined text-[16px] ui-disclosure-chevron ${isExpanded ? 'ui-disclosure-chevron-open' : ''}`,
                                children: 'expand_more',
                              }),
                            }),
                            c.jsx('button', {
                              type: 'button',
                              onClick: () => openShipmentEvidencePicker(shipment),
                              disabled: shipmentEvidenceUploadingId === shipment.id,
                              className:
                                'w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60',
                              title: 'Agregar evidencia',
                              children: c.jsx('span', {
                                className: `material-symbols-outlined text-[16px] ${shipmentEvidenceUploadingId === shipment.id ? 'animate-spin' : ''}`,
                                children: shipmentEvidenceUploadingId === shipment.id ? 'progress_activity' : 'add',
                              }),
                            }),
                            c.jsx('button', {
                              type: 'button',
                              onClick: () => copyClientShipmentHistoryLink(shipment),
                              className:
                                'w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
                              title: 'Copiar link del cliente con este envio abierto',
                              children: c.jsx('span', {
                                className: 'material-symbols-outlined text-[16px]',
                                children: copiedClientShareLinks.includes(`shipment-client-history-share-${shipment.id}`)
                                  ? 'done'
                                  : 'link',
                              }),
                            }),
                            c.jsx('button', {
                              type: 'button',
                              onClick: () => deleteShipment(shipment),
                              disabled: !canDeleteShipment,
                              className:
                                'w-8 h-8 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:cursor-not-allowed disabled:opacity-35',
                              title: canDeleteShipment ? 'Eliminar envio' : 'Solo se pueden eliminar envios pendientes',
                              children: c.jsx('span', {
                                className: 'material-symbols-outlined text-[16px]',
                                children: 'delete',
                              }),
                            }),
                          ],
                        }),
                      ],
                    }),
                    isExpanded &&
                      c.jsxs('div', {
                        className: 'mt-3 space-y-2',
                        children: [
                          c.jsx(ShipmentExpandedPanel, {
                            shipment,
                            hasHydratedDetail,
                            isLoadingDetail,
                            formState,
                            canEditBox,
                            selectedProducts,
                            updateShipmentForm,
                            getClientShipmentAddressOptions,
                            resetExpandedShipmentForm,
                            shipmentSaving,
                            saveShipmentEditor,
                            openShipmentEvidencePicker,
                            shipmentEvidenceUploadingId,
                            openShipmentEvidenceMenuId,
                            setOpenShipmentEvidenceMenuId,
                            getShipmentEvidenceKind,
                            openShipmentEvidenceReplacePicker,
                            shipmentEvidenceReplacingId,
                            deleteShipmentEvidence,
                            shipmentEvidenceDeletingId,
                            setFullscreenImage,
                            formatAmount,
                            resolveMediaUrl,
                            getProductPaymentAmount,
                            openProductStatusId,
                            setOpenProductStatusId,
                            setOpenProductMenuId,
                            setOpenProductInfoId,
                            setShipmentProductPickerOpen,
                            getProductStatusChipClassName,
                            getProductStatusLabel,
                            productStatusUpdatingId,
                            setShipmentProductStatusQuick,
                            toggleShipmentProductSelection,
                          }),
                        ],
                      }),
                  ],
                },
                shipment.id,
              );
            }),
          }),
      shipmentHasNextPage &&
        c.jsx('button', {
          type: 'button',
          onClick: loadMoreShipments,
          disabled: shipmentLoading,
          className: 'w-full rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/10 disabled:cursor-wait disabled:opacity-60',
          children: shipmentLoading ? 'Cargando envios...' : 'Cargar 20 mas',
        }),
    ],
  });
});

export default ShipmentsSection;
