import { Download, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';

interface ResponseFeedbackProps {
    onDownload?: () => void;
    onThumbsUp?: () => void;
    onThumbsDown?: () => void;
    onRefresh?: () => void;
}

export const ResponseFeedback = ({
    onDownload,
    onThumbsUp,
    onThumbsDown,
    onRefresh,
}: ResponseFeedbackProps) => {
    return (
        <div className="flex items-center gap-1">
            <FeedbackButton onClick={onDownload} title="Download">
                <Download size={16} />
            </FeedbackButton>
            <FeedbackButton onClick={onThumbsUp} title="Good response">
                <ThumbsUp size={16} />
            </FeedbackButton>
            <FeedbackButton onClick={onThumbsDown} title="Poor response">
                <ThumbsDown size={16} />
            </FeedbackButton>
            <FeedbackButton onClick={onRefresh} title="Regenerate">
                <RefreshCw size={16} />
            </FeedbackButton>
        </div>
    );
};

const FeedbackButton = ({
    onClick,
    title,
    children,
}: {
    onClick?: () => void;
    title: string;
    children: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        title={title}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
    >
        {children}
    </button>
);
