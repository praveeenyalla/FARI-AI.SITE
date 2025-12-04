import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark as atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Task, ThinkConfig } from '../types';
import { PlusIcon, TrashIcon, ClipboardListIcon, ChevronDownIcon, BrainCircuitIcon, CheckIcon, XIcon, CopyIcon } from '../components/Icons';
import ThinkLongerModal from '../components/ThinkLongerModal';
import { generateDeepResearchResponse } from '../services/geminiService';

interface TasksPageProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const CodeBlock: React.FC<{ language: string | undefined; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-2 rounded-lg bg-[#1e1e1e] font-sans border border-slate-700/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/70 border-b border-slate-700/50">
        <span className="text-xs text-slate-400">{language || 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={atomOneDark}
        wrapLines={true}
        customStyle={{ margin: 0, padding: '1rem', background: '#1e1e1e', fontSize: '0.9em' }}
        codeTagProps={{ style: { fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }}
      >
        {String(value).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};

const ExecutionPanel: React.FC<{
    status: 'idle' | 'running' | 'completed' | 'failed';
    output: string;
    task: Task | null;
    config: ThinkConfig | null;
}> = ({ status, output, task, config }) => {

    if (status === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 p-4">
                <BrainCircuitIcon className="w-12 h-12 mb-4 text-slate-400 dark:text-slate-600" />
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">AI Execution Panel</h2>
                <p className="mt-2 text-sm">Select a task from the list and click the <BrainCircuitIcon className="w-3 h-3 inline-block mx-1" /> icon to start an in-depth analysis.</p>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="p-6">
                 <h2 className="text-xl font-bold text-red-500 dark:text-red-400 mb-2">Execution Failed</h2>
                 <pre className="text-sm text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-500/10 p-3 rounded-md whitespace-pre-wrap">{output}</pre>
            </div>
        )
    }
    
    // Running and Completed states share some logic
    const { steps, finalAnswer, conclusion } = useMemo(() => {
        const lines = output.split('\n');
        const parsedSteps: string[] = [];
        let final = '';
        let concl = '';
        let isFinalAnswerSection = false;
        let isConclusionSection = false;

        for (const line of lines) {
             if (line.startsWith('**Conclusion:**')) {
                isConclusionSection = true;
                isFinalAnswerSection = false;
                concl += line.replace('**Conclusion:**', '').trim() + '\n';
            } else if (line.startsWith('**Final Answer:**') || line.startsWith('**Objective:**')) {
                isFinalAnswerSection = true;
                final += line + '\n';
            } else if (line.startsWith('[STEP]')) {
                parsedSteps.push(line.replace('[STEP]', '').trim());
            } else if (isConclusionSection) {
                 concl += line + '\n';
            } else if (isFinalAnswerSection) {
                final += line + '\n';
            }
        }
        
        return { steps: parsedSteps, finalAnswer: final.trim(), conclusion: concl.trim() };
    }, [output]);

    const ProgressTracker: React.FC = () => {
        const [progress, setProgress] = useState(0);
        const timeBudget = config?.timeBudget || 30;

        useEffect(() => {
            if (status === 'running') {
                const startTime = Date.now();
                const interval = setInterval(() => {
                    const elapsedTime = (Date.now() - startTime) / 1000;
                    const newProgress = Math.min((elapsedTime / timeBudget) * 100, 98); // Don't hit 100% until complete
                    setProgress(newProgress);
                    if (newProgress >= 98) clearInterval(interval);
                }, 100);
                return () => clearInterval(interval);
            } else if (status === 'completed') {
                setProgress(100);
            }
        }, [status, timeBudget]);

        return (
            <div className="mb-4">
                <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-1.5">
                    <div 
                        className="bg-sky-500 h-1.5 rounded-full transition-all duration-500 ease-linear" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#1a1a1a]">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
                 <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${status === 'running' ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
                    <div className="overflow-hidden">
                        <p className="text-xs text-slate-500 dark:text-slate-400">{status === 'running' ? 'Executing' : 'Completed'}</p>
                        <h2 className="text-base font-bold truncate text-slate-800 dark:text-white">{task?.title}</h2>
                    </div>
                 </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
                <ProgressTracker />
                 {steps.length > 0 && (
                     <div className="mb-6">
                         <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Reasoning Steps</h3>
                         <div className="space-y-2 border-l-2 border-slate-300 dark:border-slate-700 pl-4">
                             {steps.map((step, index) => (
                                <div key={index} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <CheckIcon className="w-3 h-3 text-green-500"/>
                                    </div>
                                    <span>{step}</span>
                                </div>
                            ))}
                         </div>
                     </div>
                 )}
                 {status === 'completed' && finalAnswer && (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-pre:my-2">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ node, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return match ? (
                                        <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                                    ) : (
                                        <code className={className} {...props}>{children}</code>
                                    );
                                }
                            }}
                          >
                            {finalAnswer}
                          </ReactMarkdown>
                      </div>
                 )}
            </div>
        </div>
    );
};


const TaskItem: React.FC<{ 
    task: Task; 
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onExecute: (task: Task) => void;
}> = ({ task, onToggle, onDelete, onExecute }) => {
    
    const priorityClasses = {
        high: 'border-red-500/50 bg-red-50 dark:bg-red-500/10',
        medium: 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/10',
        low: 'border-sky-500/50 bg-sky-50 dark:bg-sky-500/10',
    };
    
    const priorityText = {
        high: 'High',
        medium: 'Medium',
        low: 'Low',
    };

    return (
        <div className={`flex items-start gap-4 p-3 ${priorityClasses[task.priority]} rounded-lg border-l-4 transition-all duration-200 group`}>
            <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggle(task.id)}
                className="form-checkbox h-5 w-5 mt-0.5 rounded-full bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-600 cursor-pointer flex-shrink-0"
            />
            <div className="flex-1 overflow-hidden">
                <span className={`break-words ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                    {task.title}
                </span>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>Priority: {priorityText[task.priority]}</span>
                    {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {!task.completed && (
                    <button 
                        onClick={() => onExecute(task)}
                        className="p-2 text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                        aria-label="Execute task with AI"
                        title="Think Longer"
                    >
                        <BrainCircuitIcon className="w-4 h-4" />
                    </button>
                 )}
                <button 
                    onClick={() => onDelete(task.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    aria-label="Delete task"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const TasksPage: React.FC<TasksPageProps> = ({ tasks, setTasks }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [isThinkModalOpen, setIsThinkModalOpen] = useState(false);
    
    const [executingTask, setExecutingTask] = useState<Task | null>(null);
    const [executionConfig, setExecutionConfig] = useState<ThinkConfig | null>(null);
    const [executionOutput, setExecutionOutput] = useState('');
    const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');

    useEffect(() => {
      if (executionStatus === 'running' && executingTask && executionConfig) {
        const runTask = async () => {
          try {
            const stream = await generateDeepResearchResponse(executingTask.title, [], executionConfig);
            for await (const chunk of stream) {
              setExecutionOutput(prev => prev + chunk.text);
            }
            setExecutionStatus('completed');
          } catch (e: any) {
            console.error("Task execution failed:", e);
            setExecutionOutput(e.message || "An unknown error occurred.");
            setExecutionStatus('failed');
          }
        };
        runTask();
      }
    }, [executionStatus, executingTask, executionConfig]);


    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        const newTask: Task = {
            id: uuidv4(),
            title: newTaskTitle.trim(),
            completed: false,
            priority: newTaskPriority,
            dueDate: newTaskDueDate || undefined,
            createdAt: new Date().toISOString(),
        };
        setTasks(prev => [newTask, ...prev]);
        setNewTaskTitle('');
        setNewTaskPriority('medium');
        setNewTaskDueDate('');
    };

    const handleToggleTask = (id: string) => {
        setTasks(prev => prev.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    const handleDeleteTask = (id: string) => {
        setTasks(prev => prev.filter(task => task.id !== id));
    };
    
    const handleStartExecute = (task: Task) => {
        setExecutingTask(task);
        setIsThinkModalOpen(true);
    };

    const handleConfirmExecute = (prompt: string, config: ThinkConfig) => {
        setExecutionConfig(config);
        setExecutionStatus('running');
        setExecutionOutput('');
        setIsThinkModalOpen(false);
    };

    const todoTasks = tasks.filter(t => !t.completed).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const completedTasks = tasks.filter(t => t.completed).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <>
            <ThinkLongerModal 
                isOpen={isThinkModalOpen}
                onClose={() => setIsThinkModalOpen(false)}
                onStart={handleConfirmExecute}
                initialPrompt={executingTask?.title || ''}
            />
            <div className="flex h-full w-full bg-gray-50 dark:bg-[#111111] text-slate-900 dark:text-white">
                {/* Left Panel: Task List */}
                <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col h-full border-r border-slate-200 dark:border-white/10">
                    <header className="flex-shrink-0 flex items-center justify-between p-4 md:pl-48 pt-16 border-b border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-3">
                            <ClipboardListIcon className="w-6 h-6 text-sky-500" />
                            <h1 className="text-xl font-bold">Tasks</h1>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4">
                        <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mb-6 items-end">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                    placeholder="Add a new task..."
                                    className="w-full bg-white dark:bg-[#1c1c1f] border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="relative">
                                    <select
                                        value={newTaskPriority}
                                        onChange={e => setNewTaskPriority(e.target.value as Task['priority'])}
                                        className="w-full h-full appearance-none bg-white dark:bg-[#1c1c1f] border border-slate-300 dark:border-slate-700 rounded-lg pl-4 pr-8 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                    <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                                </div>
                            </div>
                             <button type="submit" className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors h-10 w-10 flex items-center justify-center self-center justify-self-end text-white" aria-label="Add task">
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </form>

                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold mb-3 text-slate-700 dark:text-white">To-Do ({todoTasks.length})</h2>
                                <div className="space-y-3">
                                    {todoTasks.length > 0 ? (
                                        todoTasks.map(task => (
                                            <TaskItem key={task.id} task={task} onToggle={handleToggleTask} onDelete={handleDeleteTask} onExecute={handleStartExecute} />
                                        ))
                                    ) : (
                                        <p className="text-slate-500 text-sm p-4 text-center">All tasks completed! ✨</p>
                                    )}
                                </div>
                            </div>
                            
                            {completedTasks.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold mb-3 text-slate-700 dark:text-white">Completed ({completedTasks.length})</h2>
                                    <div className="space-y-3">
                                        {completedTasks.map(task => (
                                            <TaskItem key={task.id} task={task} onToggle={handleToggleTask} onDelete={handleDeleteTask} onExecute={handleStartExecute} />
                                        ))
                                    }
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>

                {/* Right Panel: Execution Output */}
                <div className="hidden md:block md:w-1/2 lg:w-2/3 h-full bg-white dark:bg-[#1a1a1a]">
                    <ExecutionPanel 
                        status={executionStatus}
                        output={executionOutput}
                        task={executingTask}
                        config={executionConfig}
                    />
                </div>
            </div>
        </>
    );
};

export default TasksPage;