export const Button = ({ children, variant = 'primary', size = 'md', isLoading, className = '', ...props }) => {
    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-2.5 text-sm',
        lg: 'px-8 py-3 text-base',
    };

    const variants = {
        primary: `
      bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold
      hover:from-blue-700 hover:to-blue-600
      shadow-lg shadow-blue-500/25
      active:scale-[0.98]
    `,
        secondary: `
      bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-semibold
      hover:from-emerald-600 hover:to-emerald-500
      shadow-lg shadow-emerald-500/25
      active:scale-[0.98]
    `,
        outline: `
      bg-white text-slate-700 font-semibold border-2 border-slate-200
      hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50
      active:scale-[0.98]
    `,
        ghost: `
      bg-transparent text-slate-600 font-medium
      hover:bg-slate-100 hover:text-slate-900
      active:scale-[0.98]
    `,
        danger: `
      bg-gradient-to-r from-red-500 to-red-400 text-white font-semibold
      hover:from-red-600 hover:to-red-500
      shadow-lg shadow-red-500/20
      active:scale-[0.98]
    `,
    };

    return (
        <button
            className={`
        flex items-center justify-center gap-2 rounded-xl
        transition-all duration-200 ease-out
        disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
        ${sizes[size]}
        ${variants[variant]}
        ${className}
      `}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Processing...
                </>
            ) : children}
        </button>
    );
};
