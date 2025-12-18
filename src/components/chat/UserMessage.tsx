interface UserMessageProps {
    message: string;
    avatar?: string;
    initial?: string;
}

export const UserMessage = ({ message, initial = 'S' }: UserMessageProps) => {
    return (
        <div className="flex justify-end mb-4">
            <div className="inline-flex items-center gap-2 pl-2 pr-3 py-1 bg-violet-50/80 border border-violet-100 rounded-2xl rounded-tr-none max-w-[80%]">
                {/* Avatar */}
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-600 font-normal text-xs shrink-0">
                    {initial}
                </div>
                {/* Message */}
                <span className="text-slate-700 text-[14px] leading-normal">
                    {message}
                </span>
            </div>
        </div>
    );
};
