import React from 'react';
import { cn } from '../../utils/cn';

const Button = ({ children, variant = 'primary', className, ...props }) => {
    const baseStyles = "relative px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-all duration-200 active:translate-y-1";

    const variants = {
        primary: "bg-primary text-black hover:bg-white hover:text-black border-2 border-transparent shadow-[4px_4px_0px_0px_rgba(242,242,13,0.3)] hover:shadow-none",
        outline: "bg-transparent text-primary border border-primary hover:bg-primary hover:text-black",
        ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5",
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], className)}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;