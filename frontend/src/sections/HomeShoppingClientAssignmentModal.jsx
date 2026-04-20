import { V, c } from '../utils.js';
import { useApp } from '../AppContext.jsx';

const getShoppingClientIds = (mission) => {
  const ids = new Set(
    Array.isArray(mission?.clients)
      ? mission.clients
          .map((value) => Number(value && typeof value === 'object' ? value.id : value))
          .filter((value) => Number.isFinite(value) && value > 0)
      : [],
  );

  if (Array.isArray(mission?.products)) {
    mission.products.forEach((product) => {
      const clientId = Number(product && product.client);
      if (Number.isFinite(clientId) && clientId > 0) {
        ids.add(clientId);
      }
    });
  }

  return ids;
};

const getShoppingManagerLabel = (mission) =>
  String(mission?.shopper_name || mission?.shopper_username || mission?.payer_username || 'PS').trim().toUpperCase();

const ShoppingClientAssignmentModal = V.memo(function ShoppingClientAssignmentModal({
  open,
  onClose,
}) {
  const {
    activeMission,
    clients,
    shoppingClientAssignmentSavingId,
    toggleShoppingClientAssignment,
    getMissionStoreLabel,
  } = useApp();
  const [search, setSearch] = V.useState('');

  V.useEffect(() => {
    if (!open) {
      setSearch('');
      return;
    }
    setSearch('');
  }, [open, activeMission && activeMission.id]);

  const currentMission = open ? activeMission : null;
  const currentClientIds = getShoppingClientIds(currentMission);
  const filteredClients = [...(Array.isArray(clients) ? clients : [])]
    .filter((client) =>
      String(client.name || '')
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    )
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' }));

  if (!open) return null;

  return c.jsx('div', {
    className: 'fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-3 py-6',
    onClick: onClose,
    children: c.jsxs('div', {
      className:
        'w-full max-w-3xl overflow-hidden rounded-3xl border border-border-light bg-surface-light shadow-2xl dark:border-border-dark dark:bg-surface-dark',
      onClick: (event) => event.stopPropagation(),
      children: [
        c.jsxs('div', {
          className: 'flex items-start justify-between gap-4 border-b border-border-light px-4 py-4 dark:border-border-dark',
          children: [
            c.jsxs('div', {
              children: [
                c.jsx('p', {
                  className: 'text-[10px] font-black uppercase tracking-[0.12em] text-primary',
                  children: 'Clients in Shopping',
                }),
                c.jsx('h2', {
                  className: 'text-base font-black text-text-main dark:text-white',
                  children: ['ASIGNAR CLIENTES - ', getMissionStoreLabel(currentMission)],
                }),
                c.jsx('p', {
                  className: 'mt-1 text-[11px] text-text-sub',
                  children: ['Shopping: ', getShoppingManagerLabel(currentMission)],
                }),
              ],
            }),
            c.jsx('button', {
              type: 'button',
              onClick: onClose,
              className:
                'rounded-full border border-border-light px-3 py-1.5 text-[11px] font-bold text-text-sub hover:bg-gray-100 dark:border-border-dark dark:hover:bg-slate-800',
              children: 'Cerrar',
            }),
          ],
        }),
        c.jsxs('div', {
          className: 'space-y-3 p-4',
          children: [
            c.jsx('input', {
              type: 'text',
              value: search,
              onChange: (event) => setSearch(event.target.value),
              placeholder: 'Buscar cliente para agregar o quitar...',
              className:
                'w-full rounded-xl border border-border-light bg-white px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-primary dark:border-border-dark dark:bg-slate-950',
            }),
            currentClientIds.size > 0 &&
              c.jsx('div', {
                className: 'flex flex-wrap gap-1.5',
                children: Array.from(currentClientIds)
                  .map((clientId) => (Array.isArray(clients) ? clients : []).find((client) => Number(client.id) === Number(clientId)))
                  .filter(Boolean)
                  .map((client) =>
                    c.jsx('span', {
                      className:
                        'inline-flex max-w-full items-center rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
                      children: String(client.name || '').trim(),
                    }, `assigned-client-chip-${client.id}`),
                  ),
              }),
            c.jsx('div', {
              className: 'max-h-[46vh] space-y-1 overflow-y-auto pr-1 ios-scroll',
              children: filteredClients.length > 0
                ? filteredClients.map((client) => {
                    const isAssigned = currentClientIds.has(Number(client.id));
                    const savingKey = `${Number(currentMission && currentMission.id)}-${Number(client.id)}`;
                    const isSaving = shoppingClientAssignmentSavingId === savingKey;
                    return c.jsxs('button', {
                      type: 'button',
                      onClick: () =>
                        !isSaving &&
                        typeof toggleShoppingClientAssignment === 'function' &&
                        toggleShoppingClientAssignment(currentMission, client),
                      disabled: isSaving,
                      className: `flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${
                        isAssigned
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/25 dark:text-emerald-100'
                          : 'border-border-light bg-white text-text-main hover:border-primary/40 hover:bg-primary/5 dark:border-border-dark dark:bg-slate-950/70 dark:text-slate-100'
                      } ${isSaving ? 'cursor-wait opacity-70' : ''}`,
                      children: [
                        c.jsxs('div', {
                          className: 'min-w-0',
                          children: [
                            c.jsx('p', {
                              className: 'truncate text-[11px] font-semibold',
                              children: client.name,
                            }),
                            c.jsx('p', {
                              className: 'truncate text-[9px] text-text-sub',
                              children: client.tags || 'Sin etiquetas',
                            }),
                          ],
                        }),
                        c.jsx('span', {
                          className: `shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${
                            isAssigned
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-200 text-gray-600 dark:bg-slate-800 dark:text-slate-300'
                          }`,
                          children: isAssigned ? 'Quitar' : 'Agregar',
                        }),
                      ],
                    }, `shopping-assign-client-${client.id}`);
                  })
                : c.jsx('p', {
                    className: 'py-4 text-center text-[11px] text-text-sub',
                    children: 'No hay clientes que coincidan.',
                  }),
            }),
          ],
        }),
      ],
    }),
  });
});

export default ShoppingClientAssignmentModal;
