import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Trash2, Zap, Trophy, Leaf, MessageCircle } from 'lucide-react';
import { notificationService, EcoNotification } from '../services/notificationService';
import { cn } from '../lib/utils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<EcoNotification[]>([]);

  useEffect(() => {
    return notificationService.subscribe(setNotifications);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'reminder': return <Zap size={18} className="text-yellow-500" fill="currentColor" />;
      case 'challenge': return <Trophy size={18} className="text-orange-500" />;
      case 'impact': return <Leaf size={18} className="text-[#5CB338]" />;
      default: return <MessageCircle size={18} className="text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-[#F8FAF6] z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-8 flex justify-between items-center bg-white border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F2F9F0] rounded-2xl flex items-center justify-center text-[#5CB338]">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800 tracking-tight">Notifications</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {notifications.filter(n => !n.read).length} New Updates
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={() => notificationService.clearAll()}
                  className="p-2.5 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2.5 bg-gray-50 rounded-2xl text-gray-400 transition-transform active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center opacity-50">
                    <Bell size={32} />
                  </div>
                  <p className="font-bold text-sm">All caught up!<br/>Check back later for updates.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => notificationService.markAsRead(n.id)}
                    className={cn(
                      "p-5 rounded-[2rem] border relative transition-all active:scale-[0.98] cursor-pointer shadow-sm",
                      n.read ? "bg-white border-gray-100" : "bg-white border-[#5CB338]/20 shadow-lg shadow-[#5CB338]/5"
                    )}
                  >
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="space-y-1">
                        <h4 className={cn("text-sm tracking-tight", n.read ? "font-bold text-gray-700" : "font-black text-gray-900")}>
                          {n.title}
                        </h4>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed">
                          {n.body}
                        </p>
                        <p className="text-[9px] font-black text-gray-300 uppercase mt-2">
                          {n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {!n.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-[#5CB338] rounded-full" />
                    )}
                  </motion.div>
                ))
              )}
            </div>
            
            <div className="p-8 bg-white border-t border-gray-100">
               <button 
                onClick={async () => {
                  const success = await notificationService.requestPermission();
                  if (success) alert("Browser notifications enabled!");
                }}
                className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
               >
                 Enable System Alerts
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
