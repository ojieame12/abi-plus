import { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import type { Tag } from '../../types/community';

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  maxTags?: number;
  isLoading?: boolean;
}

export function TagSelector({
  availableTags = [],
  selectedTagIds,
  onChange,
  maxTags = 5,
  isLoading = false,
}: TagSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Ensure availableTags is always an array
  const safeAvailableTags = Array.isArray(availableTags) ? availableTags : [];

  const selectedTags = useMemo(
    () => safeAvailableTags.filter(tag => selectedTagIds.includes(tag.id)),
    [safeAvailableTags, selectedTagIds]
  );

  const filteredTags = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return safeAvailableTags
      .filter(tag => !selectedTagIds.includes(tag.id))
      .filter(tag => !query || tag.name.toLowerCase().includes(query))
      .slice(0, 10);
  }, [safeAvailableTags, selectedTagIds, searchQuery]);

  const handleAddTag = (tagId: string) => {
    if (selectedTagIds.length < maxTags) {
      onChange([...selectedTagIds, tagId]);
      setSearchQuery('');
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTagIds.filter(id => id !== tagId));
  };

  const canAddMore = selectedTagIds.length < maxTags;

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs
                         bg-slate-900 text-white rounded-lg"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="hover:bg-white/20 rounded p-0.5 transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search/Add input */}
      {canAddMore && (
        <div className="relative">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              placeholder={`Add tags (${selectedTagIds.length}/${maxTags})...`}
              disabled={isLoading}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/80
                         border border-slate-200/60
                         text-sm text-slate-900 placeholder:text-slate-400
                         focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all"
            />
          </div>

          {/* Dropdown */}
          {isOpen && filteredTags.length > 0 && (
            <div className="absolute z-10 w-full mt-1 py-1 bg-white rounded-lg
                            border border-slate-200 shadow-lg max-h-48 overflow-y-auto">
              {filteredTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleAddTag(tag.id)}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700
                             hover:bg-slate-50 transition-colors
                             flex items-center justify-between"
                >
                  <span>{tag.name}</span>
                  <span className="text-xs text-slate-400">
                    {tag.questionCount} questions
                  </span>
                </button>
              ))}
            </div>
          )}

          {isOpen && filteredTags.length === 0 && searchQuery && (
            <div className="absolute z-10 w-full mt-1 py-3 px-3 bg-white rounded-lg
                            border border-slate-200 shadow-lg text-sm text-slate-500">
              No matching tags found
            </div>
          )}
        </div>
      )}

      {!canAddMore && (
        <p className="text-xs text-slate-400">
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
}
