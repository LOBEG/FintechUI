const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

export async function sendWhatsAppMessage({ to, body }) {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
        console.warn('WhatsApp not configured. Set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID to enable WhatsApp notifications.');
        return { ok: false, error: 'WhatsApp not configured' };
    }

    try {
        const response = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('WhatsApp send failed:', error);
            return { ok: false, error };
        }

        const data = await response.json();
        return { ok: true, data };
    } catch (err) {
        console.error('WhatsApp send error:', err);
        return { ok: false, error: err.message };
    }
}

export async function sendWhatsAppAdminAlert(message) {
    const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER;
    if (!adminNumber) {
        console.warn('WHATSAPP_ADMIN_NUMBER not set. Admin alerts will not be sent via WhatsApp.');
        return;
    }
    return sendWhatsAppMessage({ to: adminNumber, body: message });
}
