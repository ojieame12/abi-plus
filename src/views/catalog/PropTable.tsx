import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { PropDefinition } from './catalogData';

interface PropTableProps {
  props: PropDefinition[];
  defaultExpanded?: boolean;
}

export const PropTable = ({ props, defaultExpanded = false }: PropTableProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (props.length === 0) {
    return (
      <div className="text-sm text-slate-400 italic">No props defined</div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700">
          Props ({props.length})
        </span>
        {isExpanded ? (
          <ChevronDown size={16} className="text-slate-400" />
        ) : (
          <ChevronRight size={16} className="text-slate-400" />
        )}
      </button>

      {/* Table */}
      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="text-left px-4 py-2 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600 w-20">Required</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Default</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Description</th>
              </tr>
            </thead>
            <tbody>
              {props.map((prop, index) => (
                <tr
                  key={prop.name}
                  className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                >
                  <td className="px-4 py-2">
                    <code className="text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded text-xs font-mono">
                      {prop.name}
                    </code>
                  </td>
                  <td className="px-4 py-2">
                    <code className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">
                      {prop.type}
                    </code>
                  </td>
                  <td className="px-4 py-2">
                    {prop.required ? (
                      <span className="text-rose-500 font-medium">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {prop.default ? (
                      <code className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-xs font-mono">
                        {prop.default}
                      </code>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600 max-w-xs">
                    {prop.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
