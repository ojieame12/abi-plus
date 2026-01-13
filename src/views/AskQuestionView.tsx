import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  AlertCircle,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Code,
  Image,
  Upload,
  X,
  FileText,
  Lightbulb,
  ChevronRight,
  Eye,
  MessageSquarePlus,
  Check,
} from 'lucide-react';
import { TagSelector } from '../components/community/TagSelector';
import { useTags } from '../hooks/useTags';
import type { Tag, CreateQuestionInput } from '../types/community';

interface AskQuestionViewProps {
  onBack: () => void;
  onSuccess: (questionId: string) => void;
}

interface SimilarQuestion {
  id: string;
  title: string;
  answerCount: number;
  timeAgo: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

// Mock similar questions for demo
const mockSimilarQuestions: SimilarQuestion[] = [
  {
    id: '1',
    title: 'Best practices for supplier risk assessment in manufacturing?',
    answerCount: 3,
    timeAgo: '2 days ago',
  },
  {
    id: '2',
    title: 'How do you score suppliers on risk factors?',
    answerCount: 5,
    timeAgo: '1 week ago',
  },
];

// Categories
const categories = [
  { id: 'supplier-risk', name: 'Supplier Risk' },
  { id: 'procurement', name: 'Procurement' },
  { id: 'compliance', name: 'Compliance' },
  { id: 'cost-savings', name: 'Cost Savings' },
  { id: 'due-diligence', name: 'Due Diligence' },
  { id: 'contracts', name: 'Contracts' },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AskQuestionView({ onBack, onSuccess }: AskQuestionViewProps) {
  const { tags } = useTags();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);
  const [similarDismissed, setSimilarDismissed] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; body?: string; category?: string }>({});

  // Simulate similar question search when title changes
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (value.length > 20 && !similarDismissed) {
      setShowSimilar(true);
    } else {
      setShowSimilar(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    const newFiles: UploadedFile[] = Array.from(uploadedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (title.trim().length < 15) newErrors.title = 'Title must be at least 15 characters';
    if (body.trim().length < 30) newErrors.body = 'Details must be at least 30 characters';
    if (!category) newErrors.category = 'Please select a category';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsLoading(false);
    onSuccess('new-question-id');
  };

  const isValid = title.trim().length >= 15 && body.trim().length >= 30 && category;

  return (
    <div className="flex flex-col h-full w-full relative z-10 overflow-auto">
      <div className="p-4">
        <div className="relative">
          {/* Hero Section - matches Community */}
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-violet-600 to-purple-700 min-h-[340px] rounded-2xl">
            {/* Background image - cover fit */}
            <img
              src="/bgd.png"
              alt=""
              className="absolute right-0 top-0 w-4/5 h-full object-cover object-right"
            />
            {/* Gradient overlay - only on left side for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 from-30% to-transparent to-50%" />

            <div className="relative z-10 pt-8 pb-28 px-4">
              <div className="max-w-5xl mx-auto">
                {/* Top row: Logo + Back button */}
                <div className="flex items-center justify-between mb-10">
                  {/* Abi Logo */}
                  <img
                    src="/logo-white.svg"
                    alt="abi"
                    className="h-10"
                  />

                  {/* Back button */}
                  <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={16} />
                    Back to Community
                  </button>
                </div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h1 className="text-3xl font-light mb-2" style={{ color: '#FFFFFF' }}>
                    Ask a Question
                  </h1>
                  <p className="text-base" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Get help from the procurement community
                  </p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Content - overlaps hero */}
          <div className="relative -mt-16 z-10 px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex gap-6">
            {/* Main Form */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 4px 40px rgba(0, 0, 0, 0.08)' }}
            >
              <div className="p-6 space-y-6">
                {/* Title Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="What's your question? Be specific..."
                    className={`w-full h-12 px-4 rounded-xl bg-[#FAFBFD] border ${
                      errors.title ? 'border-rose-300' : 'border-slate-200'
                    } text-sm text-slate-900 placeholder:text-slate-400
                    focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300
                    transition-all`}
                  />
                  <div className="flex justify-between text-xs">
                    <span className={errors.title ? 'text-rose-500' : 'text-slate-400'}>
                      {errors.title || 'Good titles are specific and searchable'}
                    </span>
                    <span className={`tabular-nums ${title.length >= 15 ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {title.length}/15 min
                    </span>
                  </div>
                </div>

                {/* Similar Questions Panel */}
                <AnimatePresence>
                  {showSimilar && !similarDismissed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-3 mb-3">
                          <Lightbulb size={18} className="text-amber-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-amber-800">
                              Similar questions that might help
                            </h4>
                            <p className="text-xs text-amber-600 mt-0.5">
                              Check if your question has already been answered
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {mockSimilarQuestions.map((q, index) => (
                            <motion.button
                              key={q.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="w-full p-3 bg-white rounded-lg text-left hover:bg-amber-50 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="text-sm text-slate-700 group-hover:text-violet-700 transition-colors">
                                    {q.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                                      <Check size={12} />
                                      {q.answerCount} answers
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      Asked {q.timeAgo}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-400 group-hover:text-violet-500" />
                              </div>
                            </motion.button>
                          ))}
                        </div>

                        <button
                          onClick={() => setSimilarDismissed(true)}
                          className="mt-3 text-xs text-amber-700 hover:text-amber-800 font-medium"
                        >
                          My question is different, continue →
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Rich Text Editor */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Details <span className="text-rose-500">*</span>
                  </label>

                  {/* Toolbar */}
                  <div className="flex items-center gap-1 p-2 bg-[#FAFBFD] rounded-t-xl border border-b-0 border-slate-200">
                    <button type="button" className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                      <Bold size={16} className="text-slate-600" />
                    </button>
                    <button type="button" className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                      <Italic size={16} className="text-slate-600" />
                    </button>
                    <div className="w-px h-5 bg-slate-200 mx-1" />
                    <button type="button" className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                      <List size={16} className="text-slate-600" />
                    </button>
                    <button type="button" className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                      <ListOrdered size={16} className="text-slate-600" />
                    </button>
                    <div className="w-px h-5 bg-slate-200 mx-1" />
                    <button type="button" className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                      <Link2 size={16} className="text-slate-600" />
                    </button>
                    <button type="button" className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                      <Code size={16} className="text-slate-600" />
                    </button>
                    <button type="button" className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                      <Image size={16} className="text-slate-600" />
                    </button>
                  </div>

                  {/* Editor */}
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Include all the details someone would need to answer your question. You can format your text using the toolbar above..."
                    rows={10}
                    className={`w-full px-4 py-3 rounded-b-xl bg-white border ${
                      errors.body ? 'border-rose-300' : 'border-slate-200'
                    } border-t-0 text-sm text-slate-900 placeholder:text-slate-400
                    focus:outline-none focus:ring-2 focus:ring-violet-100
                    resize-none transition-all`}
                  />
                  <div className="flex justify-between text-xs">
                    <span className={errors.body ? 'text-rose-500' : 'text-slate-400'}>
                      {errors.body || 'Markdown formatting supported'}
                    </span>
                    <span className={`tabular-nums ${body.length >= 30 ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {body.length}/30 min
                    </span>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className={`w-full h-12 px-4 rounded-xl bg-[#FAFBFD] border ${
                      errors.category ? 'border-rose-300' : 'border-slate-200'
                    } text-sm text-slate-900
                    focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300
                    transition-all appearance-none cursor-pointer`}
                  >
                    <option value="">Select a category...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <span className="text-xs text-rose-500">{errors.category}</span>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Tags <span className="text-slate-400 font-normal">(up to 5)</span>
                  </label>
                  <TagSelector
                    availableTags={tags || []}
                    selectedTagIds={tagIds}
                    onChange={setTagIds}
                    maxTags={5}
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Attachments
                  </label>

                  {/* Upload Zone */}
                  <label className="block">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6
                                    hover:border-violet-300 hover:bg-violet-50/30 transition-colors cursor-pointer">
                      <div className="flex flex-col items-center text-center">
                        <Upload size={24} className="text-slate-400 mb-2" />
                        <p className="text-sm text-slate-600">
                          <span className="text-violet-600 font-medium">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          PNG, JPG, PDF up to 10MB
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Uploaded Files */}
                  {files.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {files.map(file => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 bg-[#FAFBFD] rounded-lg"
                        >
                          {file.preview ? (
                            <img src={file.preview} alt="" className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center">
                              <FileText size={18} className="text-slate-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 truncate">{file.name}</p>
                            <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <X size={16} className="text-slate-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#FAFBFD] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-slate-500 text-sm font-medium">?</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Post anonymously</p>
                      <p className="text-xs text-slate-500">Your name won't be shown publicly</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      isAnonymous ? 'bg-violet-600' : 'bg-slate-300'
                    }`}
                  >
                    <motion.div
                      animate={{ x: isAnonymous ? 22 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPreview(!isPreview)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600
                               hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                    Preview
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onBack}
                      className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100
                                 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!isValid || isLoading}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                                 transition-all ${
                                   isValid && !isLoading
                                     ? 'bg-slate-900 text-white hover:bg-slate-800'
                                     : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                 }`}
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          />
                          Posting...
                        </>
                      ) : (
                        <>
                          <MessageSquarePlus size={16} />
                          Post Question
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tips Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="w-72 flex-shrink-0 hidden lg:block"
            >
              <div className="bg-white rounded-2xl overflow-hidden sticky top-4"
                   style={{ boxShadow: '0 4px 40px rgba(0, 0, 0, 0.06)' }}>
                <div className="px-5 py-3 bg-[#FAFBFD]">
                  <h3 className="text-sm font-normal text-slate-700">Tips for a good question</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-violet-600 font-medium">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Be specific</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Include details about your situation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-violet-600 font-medium">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Add context</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Industry, contract type, constraints
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-violet-600 font-medium">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Use tags</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Help others find your question
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-violet-600 font-medium">4</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Check for duplicates</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Your question might be answered already
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-slate-100">
                  <button className="w-full text-sm text-violet-600 hover:text-violet-700 flex items-center justify-center gap-1">
                    Community Guidelines
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
