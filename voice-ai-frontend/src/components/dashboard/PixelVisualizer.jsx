import React from 'react';
import { cn } from '../../utils/cn';

const PixelVisualizer = ({ isActive }) => {
    // Rastgele çubuk yükseklikleri oluşturuyoruz
    const bars = Array.from({ length: 24 }).map((_, i) => i);

    return (
        <div className="w-full h-32 flex items-center justify-center gap-1.5 bg-background-surface/30 border border-white/10 rounded-lg backdrop-blur relative overflow-hidden">
            {/* Arka plan tarama çizgisi efekti */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-20"></div>

            {/* Durum Metni */}
            <div className="absolute top-3 left-4 text-xs font-mono text-primary-dim uppercase tracking-widest border border-primary/20 px-2 py-1 rounded bg-black/40">
                Mode: Interactive
            </div>

            {isActive && (
                <div className="absolute bottom-3 text-xs font-mono text-primary animate-pulse tracking-widest">
                    LISTENING...
                </div>
            )}

            {/* Ses Çubukları */}
            <div className="flex items-end h-16 gap-[3px] z-0">
                {bars.map((bar) => (
                    <div
                        key={bar}
                        className={cn(
                            "w-2 bg-primary transition-all duration-100 ease-in-out shadow-[0_0_10px_rgba(242,242,13,0.3)]",
                            isActive ? "animate-pulse" : "h-1 opacity-20"
                        )}
                        style={{
                            height: isActive ? `${Math.max(10, Math.random() * 100)}%` : '4px',
                            animationDelay: `${bar * 0.05}s`
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default PixelVisualizer;