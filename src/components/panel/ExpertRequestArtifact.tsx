// ExpertRequestArtifact - Layer 3: Premium Expert Network
// Allows users to request introductions to industry experts for bespoke research

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Building2,
  Award,
  Clock,
  FileText,
  Send,
  Check,
  Star,
  ChevronRight,
  Shield,
  Calendar,
  DollarSign,
} from 'lucide-react';
import type { ExpertDeepDiveAction } from '../../types/aiResponse';

interface ExpertRequestArtifactProps {
  expertDeepDive: ExpertDeepDiveAction;
  queryContext?: {
    queryId?: string;
    queryText?: string;
    topic?: string;
  };
  onRequestIntro?: (expertId: string, briefing: string, projectType: string) => void;
}

// Project type options
const PROJECT_TYPES = [
  {
    id: 'consultation',
    label: '1-Hour Consultation',
    description: 'Quick expert call for specific questions',
    duration: '1 hour',
    typical: '$500-800',
  },
  {
    id: 'deep_dive',
    label: 'Deep-Dive Session',
    description: 'Extended session with prep materials',
    duration: '2-3 hours',
    typical: '$1,500-2,500',
  },
  {
    id: 'research_project',
    label: 'Bespoke Research Project',
    description: 'Custom research with deliverables',
    duration: '2-4 weeks',
    typical: '$5,000-15,000',
  },
];

export const ExpertRequestArtifact = ({
  expertDeepDive,
  queryContext,
  onRequestIntro,
}: ExpertRequestArtifactProps) => {
  const { matchedExpert, recommendedBy } = expertDeepDive;
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [briefing, setBriefing] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!matchedExpert) {
    return (
      <div className="p-6 text-center text-slate-500">
        No expert available at this time.
      </div>
    );
  }

  const handleSubmit = () => {
    if (selectedProject && briefing.trim()) {
      onRequestIntro?.(matchedExpert.id, briefing, selectedProject);
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 flex flex-col items-center justify-center min-h-[400px]"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-medium text-slate-900 mb-2">
          Request Submitted!
        </h3>
        <p className="text-slate-600 text-center max-w-sm mb-4">
          Our team will review your request and facilitate an introduction to {matchedExpert.name} within 24-48 hours.
        </p>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg border border-amber-200">
          <Shield className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-amber-800">
            NDA and compliance handled by Beroe
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-amber-400 font-medium text-sm">Expert Network</span>
          <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-medium rounded uppercase shadow-sm">
            Premium
          </span>
        </div>

        {/* Expert Profile */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-slate-900 font-medium text-lg">
            {matchedExpert.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white">{matchedExpert.name}</h3>
              {matchedExpert.isTopVoice && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded text-amber-400 text-[10px] font-medium">
                  <Star className="w-3 h-3" />
                  Top Voice
                </span>
              )}
            </div>
            <p className="text-slate-300 text-sm">{matchedExpert.title}</p>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-400">
              <Building2 className="w-3.5 h-3.5" />
              Former {matchedExpert.formerCompany}
            </div>
          </div>
        </div>

        {/* Expertise Tags */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-2">Expertise</p>
          <div className="flex flex-wrap gap-2">
            {matchedExpert.expertise.split(', ').map((skill, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        {recommendedBy && (
          <div className="mt-4 pt-4 border-t border-slate-700 flex items-start gap-2">
            <Award className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-teal-400">Recommended by {recommendedBy.analystName}</p>
              <p className="text-sm text-slate-300 mt-0.5">"{recommendedBy.reason}"</p>
            </div>
          </div>
        )}
      </div>

      {/* Query Context */}
      {queryContext?.queryText && (
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
          <p className="text-xs text-amber-600 mb-1">Topic of interest:</p>
          <p className="text-sm text-amber-900">{queryContext.queryText}</p>
        </div>
      )}

      {/* Project Type Selection */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-900">Select engagement type</h4>
        <div className="space-y-2">
          {PROJECT_TYPES.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project.id)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedProject === project.id
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{project.label}</span>
                    {selectedProject === project.id && (
                      <Check className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {project.duration}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {project.typical}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Briefing */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-900">
          <FileText className="w-4 h-4 inline mr-1.5" />
          Project Briefing
        </h4>
        <textarea
          value={briefing}
          onChange={(e) => setBriefing(e.target.value)}
          placeholder="Describe what you'd like to discuss or research with this expert. Be specific about your goals and any background context..."
          className="w-full h-32 px-4 py-3 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none text-sm"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!selectedProject || !briefing.trim()}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
          selectedProject && briefing.trim()
            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 shadow-md'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}
      >
        <Send className="w-4 h-4" />
        Request Introduction
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Trust indicators */}
      <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2">
        <span className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5" />
          NDA Protected
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          24-48h Response
        </span>
      </div>
    </div>
  );
};

export default ExpertRequestArtifact;
