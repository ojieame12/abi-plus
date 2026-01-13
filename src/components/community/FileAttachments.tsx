import { motion } from 'framer-motion';
import { FileText, FileSpreadsheet, File, Download, Paperclip } from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number; // bytes
  type: string;
}

interface FileAttachmentsProps {
  attachments: Attachment[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return FileText;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
  return File;
}

function getFileColor(type: string): string {
  if (type.includes('pdf')) return 'text-red-500 bg-red-50';
  if (type.includes('spreadsheet') || type.includes('excel')) return 'text-emerald-500 bg-emerald-50';
  if (type.includes('word') || type.includes('document')) return 'text-blue-500 bg-blue-50';
  return 'text-slate-500 bg-slate-50';
}

export function FileAttachments({ attachments }: FileAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="my-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <Paperclip size={14} />
        <span>Attachments ({attachments.length})</span>
      </div>

      {/* File List */}
      <div className="space-y-2">
        {attachments.map((file, index) => {
          const Icon = getFileIcon(file.type);
          const colorClass = getFileColor(file.type);

          return (
            <motion.a
              key={file.id}
              href={file.url}
              download={file.name}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl
                         hover:bg-slate-100 transition-colors group"
            >
              {/* Icon */}
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon size={18} />
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {formatFileSize(file.size)}
                </p>
              </div>

              {/* Download Icon */}
              <div className="p-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                <Download size={16} />
              </div>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}
