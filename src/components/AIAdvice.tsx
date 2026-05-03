import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, RefreshCw, TreePine, Lightbulb, Recycle, TrendingUp } from 'lucide-react';
import { getEcoAdvice } from '../services/geminiService';
import { cn } from '../lib/utils';

interface AdviceData {
  suggestion: string;
  category: string;
  actionLabel: string;
}

export default function AIAdvice() {
  const [advice, setAdvice] = useState<AdviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAdvice = async (force = false) => {
    setIsRefreshing(true);
    try {
      const data = await getEcoAdvice(undefined, force);
      setAdvice(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdvice(false);
  }, []);

  const handleRefresh = () => {
    fetchAdvice(true);
  };

  const getIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('plant') || cat.includes('conservation') || cat.includes('tree')) return <TreePine size={20} className="text-emerald-500" />;
    if (cat.includes('energy') || cat.includes('hack')) return <Lightbulb size={20} className="text-yellow-500" />;
    if (cat.includes('recycle') || cat.includes('waste')) return <Recycle size={20} className="text-blue-500" />;
    return <TrendingUp size={20} className="text-[#5CB338]" />;
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-40 bg-white rounded-[2.5rem] border border-gray-100 flex flex-col items-center justify-center gap-3 shadow-sm"
          >
            <div className="relative">
              <RefreshCw className="text-eco-primary animate-spin" size={24} />
              <Sparkles size={12} className="absolute -top-1 -right-1 text-yellow-400" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Consulting Eco-AI...</span>
          </motion.div>
        ) : (
          advice && (
            <motion.div
              key="advice"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-eco-primary/5 to-eco-dark/10 rounded-[2.5rem]" />
              
              <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl shadow-eco-dark/5 relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-eco-primary border border-gray-50 group-hover:rotate-6 transition-transform">
                      {getIcon(advice.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={10} className="text-eco-primary" />
                        <p className="text-[10px] font-black text-eco-primary uppercase tracking-[0.2em]">AI Intelligence</p>
                      </div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-tight mt-0.5 font-display">{advice.category}</h4>
                    </div>
                  </div>
                  <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={cn(
                      "p-2.5 bg-eco-light rounded-xl text-eco-primary hover:bg-eco-primary hover:text-white transition-all shadow-sm",
                      isRefreshing && "animate-spin"
                    )}
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>

                <p className="text-lg font-bold text-gray-800 leading-tight mb-8 font-display italic">
                  "{advice.suggestion}"
                </p>

                <button className="group w-full py-4 bg-eco-dark text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-eco-dark/20 active:scale-[0.98] transition-all hover:bg-eco-primary">
                  {advice.actionLabel}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Decorative Glows */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-eco-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -ml-16 -mb-16" />
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
