import React, { useState } from 'react';

interface CodePreviewProps {
  language: string;
  code: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mt-4 bg-black/80 rounded-lg overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-800/50 text-xs text-slate-400">
        <span>{language}</span>
        <button onClick={handleCopy} className="font-mono hover:text-white">
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};

export default CodePreview;
