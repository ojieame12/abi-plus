import { ExternalLink, Download, MoreVertical, ArrowRight, Table, LayoutGrid } from 'lucide-react';

interface Column<T = Record<string, unknown>> {
    key: string;
    header: string;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T = Record<string, unknown>> {
    title: string;
    columns: Column<T>[];
    data: T[];
    selectedRowIndex?: number;
    onRowClick?: (row: T, index: number) => void;
    showViewToggle?: boolean;
    footer?: {
        text: string;
        subtext?: string;
        actionLabel?: string;
        onAction?: () => void;
    };
}

export const DataTable = ({
    title,
    columns,
    data,
    selectedRowIndex,
    onRowClick,
    showViewToggle = true,
    footer,
}: DataTableProps) => {
    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden my-4">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
                <h4 className="font-semibold text-primary">{title}</h4>
                <div className="flex items-center gap-2">
                    {showViewToggle && (
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 text-primary">
                                <Table size={14} strokeWidth={1.5} />
                                Tables
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50">
                                <LayoutGrid size={14} strokeWidth={1.5} />
                                Cards
                            </button>
                        </div>
                    )}
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <ExternalLink size={16} strokeWidth={1.5} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Download size={16} strokeWidth={1.5} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical size={16} strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <table className="w-full">
                <thead>
                    <tr className="bg-slate-50">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="px-4 py-3 text-left text-sm font-medium text-slate-600"
                            >
                                {col.header}
                            </th>
                        ))}
                        <th className="w-10"></th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            onClick={() => onRowClick?.(row, rowIndex)}
                            className={`border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                                selectedRowIndex === rowIndex
                                    ? 'border-l-4 border-l-violet-500 bg-violet-50/50'
                                    : ''
                            }`}
                        >
                            {columns.map((col) => (
                                <td key={col.key} className="px-4 py-3 text-sm">
                                    {col.render
                                        ? col.render(row[col.key], row)
                                        : row[col.key] as React.ReactNode}
                                </td>
                            ))}
                            <td className="px-2">
                                {selectedRowIndex === rowIndex && (
                                    <ArrowRight size={16} className="text-violet-500" strokeWidth={1.5} />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer */}
            {footer && (
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                    <div>
                        <span className="text-sm text-slate-500">{footer.text}</span>
                        {footer.subtext && (
                            <span className="text-sm text-primary font-medium ml-2">
                                {footer.subtext}
                            </span>
                        )}
                    </div>
                    {footer.actionLabel && (
                        <button
                            onClick={footer.onAction}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
                        >
                            {footer.actionLabel}
                            <ArrowRight size={14} strokeWidth={2} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// Match Score Badge Component
export const MatchScoreBadge = ({ score }: { score: number }) => {
    const getColorClass = (score: number) => {
        if (score >= 90) return 'bg-green-100 text-green-700';
        if (score >= 80) return 'bg-yellow-100 text-yellow-700';
        return 'bg-slate-100 text-slate-600';
    };

    return (
        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getColorClass(score)}`}>
            {score}% Match
        </span>
    );
};

// Supplier Cell Component
export const SupplierCell = ({ name, type, revenue }: { name: string; type: string; revenue: string }) => (
    <div>
        <div className="font-medium text-primary">{name}</div>
        <div className="text-xs text-slate-500">{type} • {revenue}</div>
    </div>
);
