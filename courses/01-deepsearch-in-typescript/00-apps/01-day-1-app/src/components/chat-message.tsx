import ReactMarkdown, { type Components } from "react-markdown";
import type { Message } from "ai";

// Extract MessagePart type from Message
// 💡 TIP: Hover over MessagePart below to see all possible part types!
// This includes TextUIPart, ToolInvocationUIPart, ReasoningUIPart, and more
export type MessagePart = NonNullable<Message["parts"]>[number];

interface ChatMessageProps {
  parts?: MessagePart[];
  role: string;
  userName: string;
}

const components: Components = {
  // Override default elements with custom styling
  p: ({ children }) => <p className="mb-4 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal pl-4">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  code: ({ className, children, ...props }) => (
    <code className={`${className ?? ""}`} {...props}>
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-700 p-4">
      {children}
    </pre>
  ),
  a: ({ children, ...props }) => (
    <a
      className="text-blue-400 underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

const Markdown = ({ children }: { children: string }) => {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
};

// Component to render tool invocations
const ToolInvocationDisplay = ({
  part,
}: {
  part: Extract<MessagePart, { type: "tool-invocation" }>;
}) => {
  const invocation = part.toolInvocation;

  return (
    <div className="my-2 rounded border border-gray-700 bg-gray-900 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
        <span className="text-xs">🔧</span>
        <span>Tool: {invocation.toolName}</span>
        <span className="ml-auto text-xs">
          {invocation.state === "partial-call" && "⏳ Calling..."}
          {invocation.state === "call" && "✓ Called"}
          {invocation.state === "result" && "📊 Result"}
        </span>
      </div>

      {/* Show arguments for call states */}
      {(invocation.state === "call" || invocation.state === "partial-call") &&
        invocation.args && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">Arguments:</p>
            <pre className="mt-1 overflow-x-auto rounded bg-gray-800 p-2 text-xs text-gray-300">
              {JSON.stringify(invocation.args, null, 2)}
            </pre>
          </div>
        )}

      {/* Show result for result state */}
      {invocation.state === "result" && "result" in invocation && (
        <div className="mt-2">
          <p className="text-xs text-gray-500">Result:</p>
          <pre className="mt-1 overflow-x-auto rounded bg-gray-800 p-2 text-xs text-gray-300">
            {typeof invocation.result === "string"
              ? invocation.result
              : JSON.stringify(invocation.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// Component to render message parts
const MessagePartDisplay = ({ part }: { part: MessagePart }) => {
  switch (part.type) {
    case "text":
      return <Markdown>{part.text}</Markdown>;

    case "tool-invocation":
      return <ToolInvocationDisplay part={part} />;
    // Skip unsupported parts as specified in requirements
    case "reasoning":
    case "source":
    case "file":
    case "step-start":
      return null;

    default:
      // TypeScript will ensure all cases are handled
      return null;
  }
};

export const ChatMessage = ({ parts, role, userName }: ChatMessageProps) => {
  const isAI = role === "assistant";

  return (
    <div className="mb-6">
      <div
        className={`rounded-lg p-4 ${
          isAI ? "bg-gray-800 text-gray-300" : "bg-gray-900 text-gray-300"
        }`}
      >
        <p className="mb-2 text-sm font-semibold text-gray-400">
          {isAI ? "AI" : userName}
        </p>

        <div className="prose prose-invert max-w-none">
          {parts && parts.length > 0 ? (
            // Render each part
            parts.map((part, index) => (
              <MessagePartDisplay key={index} part={part} />
            ))
          ) : (
            // Fallback for empty messages
            <p className="italic text-gray-500">No content</p>
          )}
        </div>
      </div>
    </div>
  );
};
