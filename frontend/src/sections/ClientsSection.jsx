import { V, c, MODULE_AMOUNT_FORMAT, getClientPhoneDisplay } from '../utils.js';
import { useClientsContext } from '../AppContext.jsx';

export const CLIENTS_SECTION_REQUIRED_CONTEXT = [
  'clients',
  'clientSearch',
  'selectedClientId',
  'currentShopping',
  'isDesktopLayout',
  'getHomeVisibleProducts',
  'getHomeClientTotals',
  'getClientShoppingHistoryEntries',
  'copyClientMissionShareLink',
  'copyMissionBreakdown',
  'copiedMissionClients',
  'openClientShoppingGallery',
  'openClientPaymentModal',
  'openPaymentModal',
  'deletePayment',
  'onOpenClientCreate',
  'onEditClient',
  'onToggleClientStatus',
  'onOpenClientGallery',
];

const DEFAULT_CONTEXT = {
  clients: [],
  clientSearch: '',
  selectedClientId: null,
  currentShopping: null,
  isDesktopLayout: false,
  getHomeVisibleProducts: (client) =>
    (Array.isArray(client?.products) ? client.products : []).filter(
      (product) =>
        product &&
        product.shopping != null &&
        String(product.status || '').toUpperCase() !== 'IN_REVIEW' &&
        String(product.status || '').toUpperCase() !== 'REJECTED',
    ),
  getHomeClientTotals: (products) =>
    (Array.isArray(products) ? products : []).reduce(
      (acc, product) => ({
        usd: acc.usd + (Number(product?.real_price) || 0),
        sale: acc.sale + (Number(product?.charged_price) || 0),
      }),
      { usd: 0, sale: 0 },
    ),
  getClientShoppingHistoryEntries: (client) => {
    const products = Array.isArray(client?.products) ? client.products : [];
    const payments = Array.isArray(client?.payments) ? client.payments : [];
    const grouped = new Map();
    const ensure = (key, seed = {}) => {
      const id = Number(key) || 0;
      if (!grouped.has(id)) {
        grouped.set(id, {
          key: id,
          title: seed.shopping_name || seed.mission_name || seed.store_name || `Shopping #${id}`,
          date: seed.shopping_date || seed.mission_date || seed.created_at || '',
          items: [],
          payments: [],
          productsTotal: 0,
          paymentsTotal: 0,
          balance: 0,
          annotatedCount: 0,
          shopping: seed.shopping || seed.mission || null,
        });
      }
      return grouped.get(id);
    };
    products.forEach((product) => {
      const key = Number(product?.shopping || product?.mission || product?.shopping_id || product?.mission_id);
      if (!key) return;
      const entry = ensure(key, product);
      entry.items.push(product);
      entry.productsTotal += Number(product?.charged_price ?? product?.real_price ?? 0) || 0;
      entry.annotatedCount += String(product?.status || '').toUpperCase() === 'ANNOTATED' ? 1 : 0;
      if (!entry.date) entry.date = product.shopping_date || product.mission_date || product.created_at || '';
    });
    payments.forEach((payment) => {
      const key = Number(payment?.shopping || payment?.mission || payment?.shopping_id || payment?.mission_id);
      if (!key) return;
      const entry = ensure(key, payment);
      entry.payments.push(payment);
      entry.paymentsTotal += Number(payment?.amount || 0) || 0;
      if (!entry.date) entry.date = payment.created_at || payment.updated_at || '';
    });
    return Array.from(grouped.values())
      .map((entry) => ({ ...entry, balance: entry.productsTotal - entry.paymentsTotal }))
      .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
  },
  getClientPhoneDisplay,
  copyClientMissionShareLink: () => {},
  copyMissionBreakdown: () => {},
  copiedMissionClients: [],
  openClientShoppingGallery: () => {},
  openClientPaymentModal: () => {},
  openPaymentModal: () => {},
  deletePayment: () => {},
  onOpenClientCreate: () => {},
  onEditClient: () => {},
  onToggleClientStatus: () => {},
  onOpenClientGallery: () => {},
  formatAmount: (value) => MODULE_AMOUNT_FORMAT.format(Number.isFinite(Number(value)) ? Number(value) : 0),
  user: null,
  role: '',
};

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getTokens = (value) =>
  normalizeText(value).split(' ').filter(Boolean);

const getEntryTitle = (entry) =>
  String(entry?.title || entry?.shopping_name || entry?.mission_name || entry?.store_name || `Shopping #${entry?.key || ''}`).trim();

const getProductStatusSummary = (products = []) => {
  const counts = (Array.isArray(products) ? products : []).reduce(
    (summary, product) => {
      const status = String((product && product.status) || '').toUpperCase();
      if (status === 'ANNOTATED' || status === 'BOUGHT' || status === 'SHIPPED') {
        summary.annotated += 1;
      }
      if (status === 'IN_REVIEW') summary.review += 1;
      if (status === 'REJECTED') summary.rejected += 1;
      return summary;
    },
    { annotated: 0, review: 0, rejected: 0 },
  );
  return [
    counts.annotated > 0 ? `${counts.annotated} Anotados` : '',
    counts.review > 0 ? `${counts.review} Revision` : '',
    counts.rejected > 0 ? `${counts.rejected} Rechazados` : '',
  ].filter(Boolean).join(', ');
};

const ClientsSection = V.memo(function ClientsSection(props = {}) {
  const app = useClientsContext();
  const ctx = { ...DEFAULT_CONTEXT, ...(app || {}), ...props };
  const {
    clients,
    clientSearch,
    currentShopping,
    isDesktopLayout,
    getHomeVisibleProducts,
    getHomeClientTotals,
    getClientShoppingHistoryEntries,
    copyClientMissionShareLink,
    copyMissionBreakdown,
    copiedMissionClients,
    openClientShoppingGallery,
    openClientPaymentModal,
    openPaymentModal,
    deletePayment,
    onOpenClientCreate,
    onEditClient,
    onToggleClientStatus,
    onOpenClientGallery,
    getClientPhoneDisplay,
    formatAmount,
    user,
  } = ctx;

  const role = String(user?.profile?.role || ctx.role || '').toUpperCase();
  const canCreateClient = ['AV', 'PS', 'BOTH'].includes(role);
  const [search, setSearch] = V.useState(String(clientSearch || ''));
  const [balanceFilter, setBalanceFilter] = V.useState('ALL');
  const [expandedClientId, setExpandedClientId] = V.useState(null);
  const [expandedHistoryByClient, setExpandedHistoryByClient] = V.useState({});

  const filteredClients = V.useMemo(() => {
    const tokens = getTokens(search);
    return [...(Array.isArray(clients) ? clients : [])]
      .filter((client) => {
        if (!tokens.length) return true;
        const blob = normalizeText(
          [
            client?.name,
            client?.tags,
            client?.phone,
            client?.phone_country_code,
            client?.shipping_address,
            ...(Array.isArray(client?.shipping_addresses) ? client.shipping_addresses : []),
          ]
            .filter(Boolean)
            .join(' '),
        );
        if (!tokens.every((token) => blob.includes(token))) return false;
        if (balanceFilter !== 'BALANCE') return true;
        const balance = getClientShoppingHistoryEntries(client).reduce(
          (sum, entry) => sum + Number(entry.balance || 0),
          0,
        );
        return Math.abs(balance) > 0.009;
      })
      .sort((a, b) => {
        if (balanceFilter === 'BALANCE') {
          const getBalance = (client) =>
            getClientShoppingHistoryEntries(client).reduce(
              (sum, entry) => sum + Number(entry.balance || 0),
              0,
            );
          const aBalance = getBalance(a);
          const bBalance = getBalance(b);
          const aHasBalance = Math.abs(aBalance) > 0.009;
          const bHasBalance = Math.abs(bBalance) > 0.009;
          if (aHasBalance !== bHasBalance) return aHasBalance ? -1 : 1;
          const aGroup = aBalance > 0 ? 0 : aBalance < 0 ? 1 : 2;
          const bGroup = bBalance > 0 ? 0 : bBalance < 0 ? 1 : 2;
          if (aGroup !== bGroup) return aGroup - bGroup;
          if (aGroup === 0) return bBalance - aBalance;
          if (aGroup === 1) return Math.abs(bBalance) - Math.abs(aBalance);
        }
        const byName = String(a?.name || '').localeCompare(
          String(b?.name || ''),
          'es',
          { sensitivity: 'base' },
        );
        return byName || Number(a?.id || 0) - Number(b?.id || 0);
      });
  }, [clients, search, balanceFilter, getClientShoppingHistoryEntries]);

  return c.jsxs('section', {
    className: isDesktopLayout ? 'space-y-6' : 'space-y-4',
    children: [
      c.jsxs('div', {
        className: isDesktopLayout
          ? 'flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between mb-2'
          : 'flex items-center justify-between mb-2',
        children: [
          c.jsxs('div', {
            children: [
              c.jsx('h2', { className: 'text-lg font-bold text-text-main dark:text-white', children: 'Clients' }),
              c.jsxs('p', { className: 'text-xs text-text-sub', children: ['Total: ', filteredClients.length] }),
            ],
          }),
          canCreateClient &&
            c.jsxs('button', {
              onClick: onOpenClientCreate,
              className:
                'bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition',
              children: [
                c.jsx('span', { className: 'material-symbols-outlined text-[18px]', children: 'add' }),
                ' New',
              ],
            }),
        ],
      }),
      c.jsxs('div', {
        className: isDesktopLayout
          ? 'flex w-full max-w-2xl items-center gap-2'
          : 'flex w-full items-center gap-2',
        children: [
          c.jsx('input', {
            type: 'text',
            placeholder: 'Search by name or tags...',
            value: search,
            onChange: (event) => setSearch(event.target.value),
            className: isDesktopLayout
              ? 'min-w-0 flex-1 pl-4 pr-4 py-3.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-shadow'
              : 'min-w-0 flex-1 pl-4 pr-4 py-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-shadow',
          }),
          c.jsxs('label', {
            className:
              'relative min-w-[148px] shrink-0 rounded-xl border border-primary/15 bg-primary/5 text-primary shadow-[0_14px_28px_-24px_rgba(124,58,237,0.55)] dark:border-violet-800 dark:bg-violet-950/25 dark:text-violet-200',
            children: [
              c.jsx('span', {
                className:
                  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px]',
                children: balanceFilter === 'BALANCE' ? 'account_balance_wallet' : 'groups',
              }),
              c.jsx('select', {
                value: balanceFilter,
                onChange: (event) => setBalanceFilter(event.target.value),
                className:
                  'h-full w-full appearance-none bg-transparent py-3 pl-11 pr-9 text-[12px] font-black uppercase tracking-[0.08em] outline-none',
                children: [
                  c.jsx('option', { value: 'ALL', children: 'Todos' }),
                  c.jsx('option', { value: 'BALANCE', children: 'Con saldo' }),
                ],
              }),
              c.jsx('span', {
                className:
                  'pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px]',
                children: 'expand_more',
              }),
            ],
          }),
        ],
      }),
      filteredClients.length === 0
        ? c.jsx('div', {
            className:
              'text-center py-12 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light border-dashed',
            children: c.jsx('p', { className: 'text-gray-500 text-sm', children: 'No clients defined or matched search.' }),
          })
        : c.jsx('div', {
            className: isDesktopLayout ? 'grid grid-cols-1 xl:grid-cols-2 gap-3' : 'space-y-3',
            children: filteredClients.map((client) => {
              const isExpanded = expandedClientId === client.id;
              const visibleProducts = getHomeVisibleProducts(client);
              const totals = getHomeClientTotals(visibleProducts);
              const history = getClientShoppingHistoryEntries(client);
              const clientStatusSummary = getProductStatusSummary(client.products || []);
              const saleTotal = history.reduce((sum, entry) => sum + Number(entry.productsTotal || 0), 0);
              const balanceTotal = history.reduce((sum, entry) => sum + Number(entry.balance || 0), 0);

              return c.jsxs('div', {
                className:
                  'rounded-3xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark overflow-hidden group shadow-card ui-card-quiet',
                children: [
                  c.jsxs('div', {
                    className: 'px-3 py-3 sm:px-4 sm:py-4 flex flex-wrap items-start gap-3 relative',
                    children: [
                      c.jsx('div', {
                        className:
                          'w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base uppercase border border-primary/15',
                        children: String(client.name || '?').charAt(0).toUpperCase(),
                      }),
                      c.jsxs('div', {
                        className: 'flex-1 basis-0 min-w-0 cursor-pointer',
                        onClick: () => setExpandedClientId((current) => (Number(current) === Number(client.id) ? null : client.id)),
                        children: [
                          c.jsx('h3', { className: 'font-bold text-sm', children: client.name || 'Cliente' }),
                          c.jsx('p', {
                            className: 'text-xs text-gray-500',
                            children: clientStatusSummary || 'Sin items',
                          }),
                          c.jsxs('div', {
                            className: 'mt-2 grid grid-cols-2 gap-2 w-full max-w-none sm:max-w-[18rem] min-w-0',
                            children: [
                              c.jsxs('div', {
                                className:
                                  `rounded-xl border px-2 py-2 min-w-0 overflow-hidden ${balanceTotal < 0 ? 'border-emerald-200 bg-emerald-50/90' : balanceTotal > 0 ? 'border-slate-300 bg-slate-100/95' : 'border-slate-200 bg-slate-50/95'}`,
                                children: [
                                  c.jsx('p', {
                                    className:
                                      `text-[9px] font-black uppercase tracking-[0.08em] ${balanceTotal < 0 ? 'text-emerald-700/75' : balanceTotal > 0 ? 'text-slate-700/75' : 'text-slate-500/75'}`,
                                    children: balanceTotal < 0 ? 'A favor' : 'Deuda',
                                  }),
                                  c.jsxs('p', {
                                    className:
                                      `mt-0.5 text-[11px] sm:text-[13px] font-extrabold leading-none truncate tabular-nums ${balanceTotal < 0 ? 'text-emerald-800' : balanceTotal > 0 ? 'text-slate-800' : 'text-slate-600'}`,
                                    children: ['$', formatAmount(Math.abs(balanceTotal))],
                                  }),
                                ],
                              }),
                              c.jsxs('div', {
                                className:
                                  'rounded-xl border border-blue-200 bg-blue-50/95 px-2 py-2 shadow-[0_14px_24px_-22px_rgba(37,99,235,0.48)] min-w-0 overflow-hidden',
                                children: [
                                  c.jsx('p', {
                                    className: 'text-[9px] font-black uppercase tracking-[0.08em] text-blue-700/75',
                                    children: 'Venta',
                                  }),
                                  c.jsxs('p', {
                                    className:
                                      'mt-0.5 text-[11px] sm:text-[13px] font-extrabold text-blue-800 leading-none truncate tabular-nums',
                                    children: ['$', formatAmount(saleTotal || totals.sale)],
                                  }),
                                ],
                              }),
                            ],
                          }),
                          client.tags &&
                            c.jsx('p', {
                              className: 'text-[10px] text-gray-400 mt-0.5 max-w-[150px] truncate',
                              children: client.tags,
                            }),
                        ],
                      }),
                      c.jsxs('div', {
                        className:
                          'w-full sm:w-auto shrink-0 self-start flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 pt-0.5',
                        children: [
                          c.jsxs('div', {
                            className: 'flex items-center justify-end gap-0.5 shrink-0',
                            children: [
                              c.jsx('button', {
                                onClick: () => copyClientMissionShareLink(null, client),
                                className:
                                  'w-7 h-7 rounded-full flex items-center justify-center hover:bg-violet-100 text-violet-600 dark:text-violet-300 dark:hover:bg-violet-950/30',
                                children: c.jsx('span', {
                                  className: 'material-symbols-outlined text-[15px]',
                                  children: 'share',
                                }),
                              }),
                              c.jsx('button', {
                                onClick: () =>
                                  typeof onOpenClientGallery === 'function'
                                    ? onOpenClientGallery(client)
                                    : openClientShoppingGallery(client, null),
                                className:
                                  'w-7 h-7 rounded-full flex items-center justify-center hover:bg-primary/10 text-primary dark:text-violet-300 dark:hover:bg-violet-950/30',
                                title: 'Open Full Gallery',
                                children: c.jsx('span', {
                                  className: 'material-symbols-outlined text-[15px]',
                                  children: 'photo_library',
                                }),
                              }),
                              c.jsx('button', {
                                onClick: () => openClientPaymentModal(client),
                                className:
                                  'w-7 h-7 rounded-full flex items-center justify-center hover:bg-emerald-100 text-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-950/30',
                                title: 'Pago del cliente',
                                children: c.jsx('span', {
                                  className: 'material-symbols-outlined text-[15px]',
                                  children: 'payments',
                                }),
                              }),
                              c.jsx('button', {
                                onClick: () => typeof onEditClient === 'function' && onEditClient(client),
                                className:
                                  'w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center justify-center',
                                children: c.jsx('span', {
                                  className: 'material-symbols-outlined text-[15px]',
                                  children: 'more_vert',
                                }),
                              }),
                              c.jsx('span', {
                                className:
                                  `material-symbols-outlined text-gray-400 text-[15px] cursor-pointer ui-disclosure-chevron ${isExpanded ? 'ui-disclosure-chevron-open' : ''}`,
                                onClick: () => setExpandedClientId((current) => (Number(current) === Number(client.id) ? null : client.id)),
                                children: 'expand_more',
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  isExpanded &&
                    c.jsx('div', {
                      className: 'ui-disclosure-panel ui-disclosure-panel-open',
                      children: c.jsx('div', {
                        className: 'ui-disclosure-inner',
                        children: c.jsxs('div', {
                          className: 'border-t border-border-light dark:border-border-dark px-4 py-3',
                          children: [
                            !!getClientPhoneDisplay(client) &&
                              c.jsxs('p', { className: 'text-[10px] text-gray-500 mb-1', children: ['📱 ', getClientPhoneDisplay(client)] }),
                            client.email &&
                              c.jsxs('p', { className: 'text-[10px] text-gray-500 mb-1', children: ['📧 ', client.email] }),
                            client.shipping_address &&
                              c.jsxs('p', { className: 'text-[10px] text-gray-500 mb-2', children: ['📦 ', client.shipping_address] }),
                            Array.isArray(client.shipping_addresses) && client.shipping_addresses.length > 0 &&
                              c.jsx('div', {
                                className: 'mb-2 space-y-1',
                                children: client.shipping_addresses.map((address, index) =>
                                  c.jsxs('p', { className: 'text-[10px] text-gray-500', children: ['📍 ', address] }, `client-extra-shipping-${client.id}-${index}`),
                                ),
                              }),
                            visibleProducts.length === 0 && (client.payments || []).length === 0
                              ? c.jsx('p', { className: 'text-xs text-gray-400 text-center py-4', children: 'No purchases yet for this client.' })
                              : c.jsxs(c.Fragment, {
                                  children: [
                                    c.jsxs('h4', {
                                      className: 'text-xs font-bold text-text-sub uppercase mb-2',
                                      children: ['Shopping History (', history.length, ')'],
                                    }),
                                    c.jsx('div', {
                                      className: 'space-y-1.5 max-h-[300px] overflow-y-auto',
                                      children: history.map((entry) =>
                                        c.jsxs('div', {
                                          className: 'rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden',
                                          children: [
                                            c.jsxs('div', {
                                              className: 'px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-100/70 dark:hover:bg-gray-700/40 transition',
                                              onClick: () => openClientShoppingGallery(client, entry),
                                              children: [
                                                c.jsxs('div', {
                                                  className: 'min-w-0 flex-1',
                                                  children: [
                                                    c.jsx('p', { className: 'font-semibold text-xs truncate', children: getEntryTitle(entry) }),
                                                    c.jsxs('p', {
                                                      className: 'text-[10px] text-gray-500',
                                                      children: [
                                                        getProductStatusSummary(entry.statusItems || entry.items || []) || 'Sin items',
                                                        (entry.payments || []).length > 0 ? c.jsxs(c.Fragment, { children: [' • ', entry.payments.length, ' pago(s)'] }) : null,
                                                        entry.date ? c.jsxs(c.Fragment, { children: [' • ', new Date(entry.date).toLocaleDateString()] }) : null,
                                                      ],
                                                    }),
                                                    c.jsxs('div', {
                                                      className: 'mt-1 flex flex-wrap gap-1',
                                                      children: [
                                                        c.jsxs('span', { className: 'inline-flex items-center gap-0.5 whitespace-nowrap rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700', children: ['Venta: $', formatAmount(entry.productsTotal)] }),
                                                        c.jsxs('span', { className: 'inline-flex items-center gap-0.5 whitespace-nowrap rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700', children: ['Pagado: $', formatAmount(entry.paymentsTotal)] }),
                                                        c.jsxs('span', {
                                                          className: `inline-flex items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-bold ${entry.balance < 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`,
                                                          children: [entry.balance < 0 ? 'A favor: $' : 'Deuda: $', formatAmount(entry.balance < 0 ? Math.abs(entry.balance) : entry.balance)],
                                                        }),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                                c.jsxs('div', {
                                                  className: 'ml-2 flex items-center gap-0.5 shrink-0',
                                                  children: [
                                                    c.jsx('button', {
                                                      type: 'button',
                                                      onClick: (event) => {
                                                        event.stopPropagation();
                                                        openPaymentModal(client, entry.shopping || { id: Number(entry.key) });
                                                      },
                                                      className: 'w-7 h-7 rounded-md bg-violet-100 text-violet-700 hover:bg-violet-200 transition flex items-center justify-center',
                                                      title: 'Registrar pago',
                                                      children: c.jsx('span', { className: 'material-symbols-outlined text-[14px]', children: 'payments' }),
                                                    }),
                                                    c.jsx('button', {
                                                      type: 'button',
                                                      onClick: (event) => {
                                                        event.stopPropagation();
                                                        copyMissionBreakdown(entry.shopping || { id: Number(entry.key) }, client);
                                                      },
                                                      className: `w-7 h-7 rounded-md transition flex items-center justify-center ${
                                                        copiedMissionClients.includes(`${Number(entry.shopping?.id || entry.key)}-${client.id}`)
                                                          ? 'bg-sky-100 text-sky-700'
                                                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                      }`,
                                                      title: 'Enviar desglose por WhatsApp',
                                                      children: c.jsx('span', {
                                                        className: 'material-symbols-outlined text-[14px]',
                                                        children: copiedMissionClients.includes(`${Number(entry.shopping?.id || entry.key)}-${client.id}`)
                                                          ? 'done'
                                                          : 'receipt_long',
                                                      }),
                                                    }),
                                                    c.jsx('button', {
                                                      type: 'button',
                                                      onClick: (event) => {
                                                        event.stopPropagation();
                                                        setExpandedHistoryByClient((state) => ({
                                                          ...state,
                                                          [client.id]: state[client.id] === entry.key ? null : entry.key,
                                                        }));
                                                      },
                                                      className: 'w-7 h-7 rounded-md text-gray-500 hover:bg-gray-200/70 dark:hover:bg-gray-700/70 flex items-center justify-center',
                                                      title: 'Ver desglose',
                                                      children: c.jsx('span', {
                                                        className: `material-symbols-outlined text-[14px] ui-disclosure-chevron ${expandedHistoryByClient[client.id] === entry.key ? 'ui-disclosure-chevron-open' : ''}`,
                                                        children: 'expand_more',
                                                      }),
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                            expandedHistoryByClient[client.id] === entry.key &&
                                              c.jsx('div', {
                                                className: 'ui-disclosure-panel ui-disclosure-panel-open',
                                                children: c.jsx('div', {
                                                  className: 'ui-disclosure-inner',
                                                  children: c.jsx('div', {
                                                    className: 'border-t border-gray-200 dark:border-gray-700 px-2 py-1.5 space-y-1',
                                                    children: c.jsx('p', {
                                                      className: 'text-[10px] text-text-sub',
                                                      children:
                                                        entry.payments.length > 0
                                                          ? `Hay ${entry.payments.length} abono(s) y ${entry.items.length} producto(s).`
                                                          : 'Detalle pendiente de integrar.',
                                                    }),
                                                  }),
                                                }),
                                              }),
                                          ],
                                        }, entry.key),
                                      ),
                                    }),
                                  ],
                                }),
                          ],
                        }),
                      }),
                    }),
                ],
              }, client.id);
            }),
          }),
    ],
  });
});

export default ClientsSection;
