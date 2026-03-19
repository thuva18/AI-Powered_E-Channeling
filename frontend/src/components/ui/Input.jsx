export const Input = ({ label, id, icon: Icon, error, helper, className = '', ...props }) => {
    return (
        <div className={`space-y-1.5 w-full ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                        <Icon size={16} className="text-slate-400 shrink-0" />
                    </div>
                )}
                <input
                    id={id}
                    style={Icon ? { paddingLeft: '38px' } : {}}
                    className={`
                        input-field
                        ${error ? 'border-red-400 focus:border-red-500' : ''}
                    `}
                    {...props}
                />
            </div>
            {error && <p className="text-xs font-medium text-red-500">⚠ {error}</p>}
            {helper && !error && <p className="text-xs text-slate-400">{helper}</p>}
        </div>
    );
};

export const Select = ({ label, id, children, className = '', ...props }) => {
    return (
        <div className={`space-y-1.5 w-full ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
                    {label}
                </label>
            )}
            <select
                id={id}
                className="input-field appearance-none pr-8 cursor-pointer"
                {...props}
            >
                {children}
            </select>
        </div>
    );
};

export const Textarea = ({ label, id, className = '', ...props }) => {
    return (
        <div className={`space-y-1.5 w-full ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
                    {label}
                </label>
            )}
            <textarea
                id={id}
                className="input-field resize-none"
                rows={3}
                {...props}
            />
        </div>
    );
};
