'use client';
import { Send, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
export function TelegramWhatsAppCTA() {
    const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_URL || 'https://t.me/AurumXSupport';
    const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_URL || 'https://wa.me/15555550123';
    return (<motion.div drag dragMomentum={false} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-20 lg:bottom-5 right-4 z-30 flex flex-col items-end gap-2 touch-none" aria-label="Draggable support shortcuts">
      <motion.a href={telegramUrl} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} className="group h-12 w-12 rounded-full text-white shadow-soft border border-white/10 inline-flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #229ED9 0%, #1a7cb8 100%)' }} aria-label="Open Telegram support" title="Telegram support">
        <Send className="h-4 w-4"/>
        <span className="sr-only">Telegram Support</span>
      </motion.a>
      <motion.a href={whatsappUrl} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} className="group h-12 w-12 rounded-full text-white shadow-soft border border-white/10 inline-flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }} aria-label="Open WhatsApp support" title="WhatsApp support">
        <MessageCircle className="h-4 w-4"/>
        <span className="sr-only">WhatsApp Support</span>
      </motion.a>
    </motion.div>);
}
