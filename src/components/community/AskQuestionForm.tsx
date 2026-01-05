import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { TagSelector } from './TagSelector';
import type { Tag, CreateQuestionInput } from '../../types/community';

interface AskQuestionFormProps {
  availableTags: Tag[];
  onSubmit: (input: CreateQuestionInput) => Promise<void>;
  isLoading?: boolean;
  isTagsLoading?: boolean;
}

export function AskQuestionForm({
  availableTags,
  onSubmit,
  isLoading = false,
  isTagsLoading = false,
}: AskQuestionFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});

  const validate = (): boolean => {
    const newErrors: { title?: string; body?: string } = {};

    if (title.trim().length < 15) {
      newErrors.title = 'Title must be at least 15 characters';
    }

    if (body.trim().length < 30) {
      newErrors.body = 'Body must be at least 30 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit({
      title: title.trim(),
      body: body.trim(),
      tagIds,
    });
  };

  const titleCharCount = title.trim().length;
  const bodyCharCount = body.trim().length;
  const isValid = titleCharCount >= 15 && bodyCharCount >= 30;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What's your question? Be specific."
          disabled={isLoading}
          className={`
            w-full h-11 px-4 rounded-lg bg-white/80
            border ${errors.title ? 'border-red-300' : 'border-slate-200/60'}
            text-sm text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all
          `}
        />
        <div className="flex justify-between text-xs">
          <span className={errors.title ? 'text-red-500' : 'text-slate-400'}>
            {errors.title || 'Be specific and concise'}
          </span>
          <span className={`tabular-nums ${titleCharCount >= 15 ? 'text-slate-500' : 'text-slate-400'}`}>
            {titleCharCount}/15 min
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-2">
        <label htmlFor="body" className="block text-sm font-medium text-slate-700">
          Details
        </label>
        <textarea
          id="body"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Include all the details someone would need to answer your question..."
          disabled={isLoading}
          rows={8}
          className={`
            w-full px-4 py-3 rounded-lg bg-white/80
            border ${errors.body ? 'border-red-300' : 'border-slate-200/60'}
            text-sm text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none transition-all
          `}
        />
        <div className="flex justify-between text-xs">
          <span className={errors.body ? 'text-red-500' : 'text-slate-400'}>
            {errors.body || 'Markdown supported'}
          </span>
          <span className={`tabular-nums ${bodyCharCount >= 30 ? 'text-slate-500' : 'text-slate-400'}`}>
            {bodyCharCount}/30 min
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Tags
        </label>
        <TagSelector
          availableTags={availableTags}
          selectedTagIds={tagIds}
          onChange={setTagIds}
          maxTags={5}
          isLoading={isTagsLoading}
        />
        <p className="text-xs text-slate-400">
          Add up to 5 tags to help others find your question
        </p>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading || !isValid}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-lg
            text-sm font-medium transition-all
            ${isValid
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }
            ${isLoading ? 'opacity-70' : ''}
          `}
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          Post Question
        </button>
      </div>
    </form>
  );
}
