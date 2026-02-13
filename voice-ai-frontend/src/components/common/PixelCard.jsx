import React from 'react';
import { cn } from '../../utils/cn';

const PixelCard = ({ children, className, variant = 'default', title }) => {
    return (
        <div
            className={cn(
                "relative p-6 transition-all duration-200 group",
                // Piksel kenarlık efekti (box-shadow ile)
                variant === 'primary'
                    ? "shadow-pixel-primary bg-primary/10 border border-primary/50"
                    : "shadow-pixel bg-background-surface/50 border border-white/10 backdrop-blur-sm",
                className
            )}
        >
            {/* Köşe Süslemeleri (Clip Path yerine CSS border hilesi) */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-50" />

            {title && (
                <div className="mb-4 flex items-end justify-between">
                    <h3 className={cn(
                        "text-sm font-mono uppercase tracking-widest",
                        variant === 'primary' ? "text-primary-dim font-bold" : "text-gray-400"
                    )}>
                        [ {title} ]
                    </h3>
                </div>
            )}

            {children}
        </div>
    );
};

export default PixelCard;