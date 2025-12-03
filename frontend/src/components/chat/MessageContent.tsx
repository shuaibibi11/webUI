import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
  role: 'user' | 'assistant' | 'system';
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, isStreaming, role }) => {
  // 用户消息直接显示
  if (role === 'user') {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  // AI 回复使用 Markdown 渲染
  return (
    <div className="prose prose-sm max-w-none prose-headings:text-secondary-900 prose-p:text-secondary-800 prose-strong:text-secondary-900 prose-code:text-primary-700 prose-code:bg-primary-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-secondary-900 prose-pre:text-secondary-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 自定义代码块渲染
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            
            if (isInline) {
              return (
                <code className="text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }
            
            return (
              <div className="relative group">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => navigator.clipboard.writeText(String(children))}
                    className="px-2 py-1 text-xs bg-secondary-700 text-white rounded hover:bg-secondary-600"
                  >
                    复制
                  </button>
                </div>
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            );
          },
          // 自定义链接渲染
          a: ({ children, href, ...props }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 underline"
              {...props}
            >
              {children}
            </a>
          ),
          // 自定义列表渲染
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside space-y-1 my-2" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
              {children}
            </ol>
          ),
          // 自定义段落
          p: ({ children, ...props }) => (
            <p className="my-2 leading-relaxed" {...props}>
              {children}
            </p>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {/* 流式输出时显示光标 */}
      {isStreaming && (
        <span className="inline-block w-2 h-5 bg-primary-500 animate-pulse ml-0.5 align-middle rounded-sm" />
      )}
    </div>
  );
};

// 加载动画组件
export const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1.5 px-4 py-3">
    <div className="flex space-x-1">
      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
    <span className="text-sm text-secondary-500 ml-2">正在思考...</span>
  </div>
);

export default MessageContent;

