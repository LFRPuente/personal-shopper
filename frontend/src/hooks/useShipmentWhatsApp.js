import { V, getClientWahaChatId } from '../utils.js';
import { getPendingShipmentAge } from '../pendingShipmentAge.js';
import { getApiErrorMessage } from './useApiClient.js';

function greeting(clientName) {
  const name = String(clientName || '')
    .replace(/\d+/g, '')
    .replace(/^[\s#.:_\-–—()]+|[\s#.:_\-–—()]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return name ? `¡Hola, ${name}! ✨` : '¡Hola! ✨';
}

export function buildShipmentClosingMessage(clientName, shareUrl) {
  return [
    greeting(clientName),
    '📦 Ya estamos preparando el cierre de tu cajita. ¿Nos confirmas que todo está correcto?',
    `🔗 *Revisa los productos de tu envío aquí:*\n${shareUrl}`,
    '¡Gracias! 💛',
  ].join('\n\n');
}

export function buildWarehouseReminder(clientName, { count, oldestDays, items }, shareUrl) {
  const overdue = items.filter(({ days }) => days > 45);
  if (overdue.length) {
    const oldest = overdue[0].days;
    const youngest = overdue[overdue.length - 1].days;
    const duration = youngest === oldest ? `*${oldest} días*` : `entre *${youngest} y ${oldest} días*`;
    const pending = overdue.length === 1
      ? '*1 producto* pendiente de envío que lleva'
      : `*${overdue.length} productos* pendientes de envío que llevan`;
    const availability = overdue.length === 1 ? 'que ya no esté disponible' : 'que ya no estén disponibles';

    return [
      `📦 ${greeting(clientName)} Te escribimos para avisarte sobre tus productos en bodega.`,
      'Recuerda que, por el espacio disponible y el volumen de mercancía que manejamos, nuestras políticas establecen *30 días* de resguardo sin costo. Pasado ese plazo, los productos pueden descartarse por falta de espacio y ya no nos es posible hacernos responsables.',
      `Vimos que tienes ${pending} ${duration} en bodega. Cada client@ debe solicitar su envío dentro del plazo. Es posible ${availability}, pero con gusto podemos revisar su estatus por ti.`,
      'Si deseas agendar tu envío, escríbenos por aquí y con gusto te ayudamos 💛',
      `🔗 *Puedes revisar tus productos en tu historial:*\n${shareUrl}`,
    ].join('\n\n');
  }

  const youngestDays = items[items.length - 1].days;
  const days = youngestDays === oldestDays ? `${oldestDays} días` : `entre ${youngestDays} y ${oldestDays} días`;
  const products = count === 1 ? '*1 producto* pendiente de envío que lleva' : `*${count} productos* pendientes de envío que llevan`;
  return [
    greeting(clientName),
    '📦 Según nuestras políticas, el plazo de resguardo es de *30 días*. Después de ese plazo, ya no nos hacemos responsables de los productos que sigan en bodega y podrían descartarse.',
    `Tienes ${products} ${days} en nuestra bodega. Si quieres agendar tu envío, escríbenos y con gusto te ayudamos 💛`,
    `🔗 *Puedes revisar tus productos en tu historial:*\n${shareUrl}`,
  ].join('\n\n');
}

export function useShipmentWhatsApp({ user, apiFetch, generateClientHistoryShareLink, openInputDialog, notifyInfo, notifyError, notifySuccess }) {
  const [activeMessage, setActiveMessage] = V.useState(null);
  const busyRef = V.useRef(false);

  const compose = V.useCallback(async ({ client, shipment }) => {
    if (busyRef.current) return;
    const profile = user?.profile || {};
    if (!String(profile.waha_api_url || '').trim() || !String(profile.waha_session || '').trim()) {
      notifyInfo('Configura la URL de WAHA y la sesión en Perfil.');
      return;
    }

    busyRef.current = true;
    setActiveMessage(shipment ? { shipmentId: shipment.id } : { clientId: client.id });
    try {
      const recipient = client || await apiFetch(`/clients/${shipment.client}/`);
      const chatId = getClientWahaChatId(recipient, profile);
      if (!chatId) {
        notifyError('El cliente no tiene teléfono configurado.');
        return;
      }
      const aged = shipment ? null : getPendingShipmentAge(recipient);
      if (aged && !aged.count) {
        notifyInfo('El cliente ya no tiene productos de más de 30 días pendientes de envío.');
        return;
      }

      const result = await generateClientHistoryShareLink(recipient);
      const url = new URL(result.share_url, window.location.origin);
      if (shipment) url.searchParams.set('focus_shipment_id', String(shipment.id));
      const text = shipment
        ? buildShipmentClosingMessage(recipient.name, url.toString())
        : buildWarehouseReminder(recipient.name, aged, url.toString());

      const draft = await openInputDialog({
        title: shipment ? 'Cierre de cajita por WhatsApp' : 'Recordatorio de bodega por WhatsApp',
        message: `Para: ${recipient.name} · ${chatId.split('@')[0]}`,
        confirmLabel: 'Enviar por WhatsApp',
        fields: [{ name: 'text', type: 'whatsapp', label: 'Mensaje', value: text, required: true, rows: 10 }],
      });
      if (!draft) return;
      await apiFetch('/whatsapp/send-text/', {
        method: 'POST',
        body: JSON.stringify({ chat_id: chatId, text: draft.text.trim() }),
      });
      notifySuccess('Mensaje enviado por WhatsApp.');
    } catch (error) {
      console.error('Failed sending WhatsApp message', error);
      notifyError(getApiErrorMessage(error, 'No se pudo enviar el mensaje por WhatsApp.'));
    } finally {
      busyRef.current = false;
      setActiveMessage(null);
    }
  }, [user, apiFetch, generateClientHistoryShareLink, openInputDialog, notifyInfo, notifyError, notifySuccess]);

  const sendShipmentWhatsApp = V.useCallback((shipment) => {
    if (shipment?.id && shipment.client) return compose({ shipment });
  }, [compose]);
  const sendWarehouseReminder = V.useCallback((client) => {
    if (client?.id) return compose({ client });
  }, [compose]);

  return {
    sendShipmentWhatsApp,
    sendingShipmentWhatsAppId: activeMessage?.shipmentId ?? null,
    sendWarehouseReminder,
    sendingWarehouseReminderId: activeMessage?.clientId ?? null,
  };
}
