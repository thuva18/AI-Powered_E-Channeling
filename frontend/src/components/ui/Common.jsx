import {
    Clock, CheckCircle, XCircle, CircleDashed,
    CreditCard, AlertCircle,
} from 'lucide-react';

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_MAP = {
    PENDING:   { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  Icon: Clock,         label: 'Pending'   },
    APPROVED:  { bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',Icon: CheckCircle,   label: 'Approved'  },
    ACCEPTED:  { bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',Icon: CheckCircle,   label: 'Accepted'  },
    REJECTED:  { bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200',    Icon: XCircle,       label: 'Rejected'  },
    CANCELLED: { bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200',    Icon: XCircle,       label: 'Cancelled' },
    COMPLETED: { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   Icon: CheckCircle,   label: 'Completed' },
    PAID:      { bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',Icon: CreditCard,    label: 'Paid'      },
    UNPAID:    { bg: 'bg-slate-100',  text: 'text-slate-500',  border: 'border-slate-200',  Icon: AlertCircle,   label: 'Unpaid'    },
};

export const Badge = ({ status }) => {
    const item = BADGE_MAP[status] || {
        bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200',
        Icon: CircleDashed, label: status,
    };
    const { bg, text, border, Icon, label } = item;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}>
            <Icon size={11} strokeWidth={2.5} />
            {label}
        </span>
    );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
export const Skeleton = ({ className = '' }) => (
    <div className={`skeleton ${className}`} />
);

export const SkeletonCard = () => (
    <div className="card p-6 space-y-4 animate-pulse">
        <div className="flex items-start justify-between">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
    </div>
);

// ── EmptyState ────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
    <div className="py-16 text-center px-6">
        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            {icon}
        </div>
        <h3 className="text-base font-bold text-slate-700 mb-1.5">{title}</h3>
        <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">{description}</p>
        {action && <div className="mt-5">{action}</div>}
    </div>
);

// ── SectionHeader ─────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action, badge }) => (
    <div className="flex items-start justify-between mb-6 gap-4">
        <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 leading-tight">{title}</h2>
                {badge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                        {badge}
                    </span>
                )}
            </div>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
);

// ── InfoBanner ────────────────────────────────────────────────────────────────
export const InfoBanner = ({ icon: Icon, title, description, variant = 'blue', action }) => {
    const variants = {
        blue:  { wrap: 'bg-blue-50 border-blue-100',       icon: 'text-blue-500',    title: 'text-blue-900',    body: 'text-blue-600'    },
        amber: { wrap: 'bg-amber-50 border-amber-100',     icon: 'text-amber-500',   title: 'text-amber-900',   body: 'text-amber-700'   },
        green: { wrap: 'bg-emerald-50 border-emerald-100', icon: 'text-emerald-600', title: 'text-emerald-900', body: 'text-emerald-700' },
        red:   { wrap: 'bg-red-50 border-red-100',         icon: 'text-red-500',     title: 'text-red-900',     body: 'text-red-600'     },
    };
    const v = variants[variant] || variants.blue;
    return (
        <div className={`flex items-start gap-3 p-4 border rounded-2xl ${v.wrap}`}>
            {Icon && <Icon size={18} className={`${v.icon} shrink-0 mt-0.5`} />}
            <div className="flex-1 min-w-0">
                {title && <p className={`text-sm font-semibold ${v.title}`}>{title}</p>}
                {description && <p className={`text-xs mt-0.5 leading-relaxed ${v.body}`}>{description}</p>}
            </div>
            {action && <div className="shrink-0 ml-2">{action}</div>}
        </div>
    );
};

// ── Toast ─────────────────────────────────────────────────────────────────────
export const Toast = ({ toast, onDismiss }) => {
    if (!toast) return null;
    return (
        <div
            role="status"
            aria-live="polite"
            onClick={onDismiss}
            className={`fixed top-5 right-5 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-medium text-sm cursor-pointer select-none animate-slide-in-right
                ${toast.type === 'success' ? 'bg-emerald-600 text-white'
                : toast.type === 'error'   ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-white'}`}
        >
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{toast.msg}</span>
        </div>
    );
};
