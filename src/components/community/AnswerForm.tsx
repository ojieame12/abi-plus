import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AnswerFormProps {
  onSubmit: (body: string) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
}

export function AnswerForm({
  onSubmit,
  isLoading = false,
  placeholder = 'Write your answer...',
}: AnswerFormProps) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validate = (): boolean => {
    if (body.trim().length < 30) {
      setError('Answer must be at least 30 characters');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit(body.trim());
    setBody(''); // Clear on success
  };

  const charCount = body.trim().length;
  const isValid = charCount >= 30;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        rows={5}
        className={`
          w-full px-4 py-3 rounded-lg bg-white/80
          border ${error ? 'border-red-300' : 'border-slate-200/60'}
          text-sm text-slate-900 placeholder:text-slate-400
          focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-none transition-all
        `}
      />

      <div className="flex items-center justify-between">
        <div className="text-xs">
          <span className={error ? 'text-red-500' : 'text-slate-400'}>
            {error || 'Markdown supported'}
          </span>
          <span className="text-slate-300 mx-2">·</span>
          <span className={`tabular-nums ${charCount >= 30 ? 'text-slate-500' : 'text-slate-400'}`}>
            {charCount}/30 min
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading || !isValid}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg
            text-sm font-medium transition-all
            ${isValid
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }
            ${isLoading ? 'opacity-70' : ''}
          `}
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          Post Answer
        </button>
      </div>
    </form>
  );
}
