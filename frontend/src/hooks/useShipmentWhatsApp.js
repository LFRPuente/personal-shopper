import { V, c, getClientWahaChatId } from '../utils.js';
import { getApiErrorMessage } from './useApiClient.js';

export function buildShipmentClosingMessage(clientName, shareUrl) {
  const name = String(clientName || '')
    .replace(/\d+/g, '')
    .replace(/^[\s#.:_\-–—()]+|[\s#.:_\-–—()]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'cliente';
  return `Hola ${name}, te envio el link con los productos que iran en el cierre de tu cajita, please confirmame que todo esta correcto.\n\n${shareUrl}`;
}

export function useShipmentWhatsApp({ user, apiFetch, generateClientHistoryShareLink, confirmAction, notifyInfo, notifyError, notifySuccess }) {
  const [sendingShipmentWhatsAppId, setSendingShipmentWhatsAppId] = V.useState(null);
  const busyRef = V.useRef(false);

  const sendShipmentWhatsApp = V.useCallback(async (shipment) => {
    if (!shipment?.id || !shipment.client || busyRef.current) return;
    const profile = user?.profile || {};
    if (!String(profile.waha_api_url || '').trim() || !String(profile.waha_session || '').trim()) {
      notifyInfo('Configura WAHA API URL y session en Perfil antes de enviar.');
      return;
    }
    busyRef.current = true;
    setSendingShipmentWhatsAppId(shipment.id);
    try {
      const client = await apiFetch(`/clients/${shipment.client}/`);
      const chatId = getClientWahaChatId(client, profile);
      if (!chatId) {
        notifyError('El cliente no tiene telefono configurado.');
        return;
      }
      const result = await generateClientHistoryShareLink(client);
      const url = new URL(result.share_url, window.location.origin);
      url.searchParams.set('focus_shipment_id', String(shipment.id));
      const text = buildShipmentClosingMessage(client.name, url.toString());
      const confirmed = await confirmAction({
        title: 'Enviar cierre de cajita por WhatsApp',
        message: c.jsxs('span', { className: 'block space-y-3', children: [
          c.jsx('span', { className: 'block', children: `Para: ${client.name} (${chatId})` }),
          c.jsx('span', { className: 'block whitespace-pre-wrap break-words', children: text }),
        ] }),
        confirmLabel: 'Enviar',
        cancelLabel: 'Cancelar',
        tone: 'info',
      });
      if (!confirmed) return;
      await apiFetch('/whatsapp/send-text/', {
        method: 'POST',
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      notifySuccess('Link del envío enviado por WhatsApp.');
    } catch (error) {
      console.error('Failed sending shipment WhatsApp', error);
      notifyError(getApiErrorMessage(error, 'No se pudo enviar el link del envío por WhatsApp.'));
    } finally {
      busyRef.current = false;
      setSendingShipmentWhatsAppId(null);
    }
  }, [user, apiFetch, generateClientHistoryShareLink, confirmAction, notifyInfo, notifyError, notifySuccess]);

  return { sendShipmentWhatsApp, sendingShipmentWhatsAppId };
}
