'use client';
import { Send, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
export function TelegramWhatsAppCTA() {
    return (<div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      <motion.a href="https://t.me/AurumXSupport" target="_blank" rel="noopener noreferrer" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.05 }} className="group flex items-center gap-2 pr-4 pl-3 py-2.5 rounded-full text-white shadow-soft border border-white/10" style={{ background: 'linear-gradient(135deg, #229ED9 0%, #1a7cb8 100%)' }} aria-label="Contact us on Telegram">
        <Send className="h-4 w-4"/>
        <span className="text-sm font-medium hidden sm:inline">Telegram Support</span>
      </motion.a>
      <motion.a href="https://wa.me/15555550123" target="_blank" rel="noopener noreferrer" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} whileHover={{ scale: 1.05 }} className="group flex items-center gap-2 pr-4 pl-3 py-2.5 rounded-full text-white shadow-soft border border-white/10" style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }} aria-label="Contact us on WhatsApp">
        <MessageCircle className="h-4 w-4"/>
        <span className="text-sm font-medium hidden sm:inline">WhatsApp Support</span>
      </motion.a>
    </div>);
}
