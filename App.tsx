import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Role, StudyStyle, Difficulty } from './types';
import { generateResponse } from './services/geminiService';

declare global {
    interface Window {
        MathJax: any;
        jspdf: any;
        html2canvas: any;
        marked: any;
        DOMPurify: any;
    }
}

type Theme = 'light' | 'dark' | 'system';
type MessageUiState = {
    [key: string]: {
        isExpanded?: boolean;
        reaction?: string;
        copyButtonText?: string;
        copyFormulaButtonText?: string;
    }
};

// Icons
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>;
const ClearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.95-4.243-1.59-1.591M5.25 12H3m4.243-4.95-1.59-1.591M12 12a2.25 2.25 0 0 0-2.25 2.25c0 1.38.56 2.63 1.43 3.538.87 1.024 2.135 1.712 3.538 1.712A4.5 4.5 0 0 0 12 12Z" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>;
const SystemIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" /></svg>;
const LightbulbIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-yellow-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.311a7.5 7.5 0 0 1-7.5 0c-1.421-.668-2.67-1.83-3.516-3.32a7.5 7.5 0 0 1 14.566 0c-.846 1.49-2.095 2.652-3.516 3.32Z" /></svg>;

// Custom Hook for Local Storage - Fixed Version
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
};

const notificationSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU+AT19/AAAAAAAAAAAAAAAAAAAAAAD//wIA/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A');

// Main App Component
export default function App() {
    const [messages, setMessages] = useLocalStorage<Message[]>('studyChat-messages-v2', []);
    const [messageUiState, setMessageUiState] = useLocalStorage<MessageUiState>('studyChat-uiState-v2', {});
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [style, setStyle] = useState<StudyStyle>(StudyStyle.ASSISTANT);
    const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.INTERMEDIATE);
    const [customPrompt, setCustomPrompt] = useState('');
    const [theme, setTheme] = useLocalStorage<Theme>('studyChat-theme-v2', 'system');

    // Theme Management
    useEffect(() => {
        const applyTheme = () => {
            if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };
        applyTheme();
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', applyTheme);
        return () => mediaQuery.removeEventListener('change', applyTheme);
    }, [theme]);

    const handleSend = useCallback(async (messageContent?: string) => {
        const content = messageContent || input;
        if (content.trim() === '' || isLoading) return;
        
        const newUserMessage: Message = { id: Date.now().toString(), role: Role.USER, content };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await generateResponse(updatedMessages, style, difficulty, customPrompt);
            const newAiMessage: Message = { id: (Date.now() + 1).toString(), role: Role.ASSISTANT, content: aiResponse };
            setMessages(prev => [...prev, newAiMessage]);
            notificationSound.play().catch(e => console.error("Error playing sound:", e));
        } catch (error) {
            const errorMessage: Message = { id: (Date.now() + 1).toString(), role: Role.ASSISTANT, content: 'Sorry, something went wrong.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, setMessages, style, difficulty, customPrompt]);
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const handleExportPdf = () => {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
            const { jsPDF } = window.jspdf;
            window.html2canvas(chatContainer, { scale: 2, backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc' }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;
                const imgHeight = pdfWidth / ratio;
                let heightLeft = imgHeight;
                let position = 0;
                
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();

                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                    heightLeft -= pdf.internal.pageSize.getHeight();
                }
                pdf.save("StudyChat-conversation.pdf");
            });
        }
    };
    
    const handleTopicClick = (topic: string) => {
        setInput(topic);
        handleSend(topic);
    };

    const updateMessageUiState = (id: string, updates: Partial<MessageUiState[string]>) => {
        setMessageUiState(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
    };

    return (
        <div className="flex flex-col h-screen font-sans bg-neutral-100 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 transition-colors duration-300">
            <Header onClear={() => { setMessages([]); setMessageUiState({}); }} onExport={handleExportPdf} theme={theme} setTheme={setTheme} />
            <ChatArea messages={messages} isLoading={isLoading} uiState={messageUiState} onUpdateUiState={updateMessageUiState} onTopicClick={handleTopicClick}/>
            <Composer input={input} setInput={setInput} handleSend={() => handleSend()} handleKeyDown={handleKeyDown} isLoading={isLoading} style={style} setStyle={setStyle} difficulty={difficulty} setDifficulty={setDifficulty} customPrompt={customPrompt} setCustomPrompt={setCustomPrompt} />
        </div>
    );
}

// Sub-components
const Header: React.FC<{ onClear: () => void; onExport: () => void; theme: Theme; setTheme: (theme: Theme) => void; }> = ({ onClear, onExport, theme, setTheme }) => {
    const nextTheme: Record<Theme, Theme> = { 'light': 'dark', 'dark': 'system', 'system': 'light' };
    const handleThemeChange = () => setTheme(nextTheme[theme]);

    const ThemeIcon = () => {
        if (theme === 'light') return <SunIcon />;
        if (theme === 'dark') return <MoonIcon />;
        return <SystemIcon />;
    };

    return (
        <header className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-10 transition-colors duration-300">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">StudyChat 🚀</h1>
            <div className="flex items-center space-x-2">
                <button onClick={handleThemeChange} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all" title={`Switch to ${nextTheme[theme]} mode`}>
                    <ThemeIcon />
                </button>
                <button onClick={onClear} className="flex items-center px-3 py-2 text-sm font-medium text-neutral-700 bg-neutral-200 rounded-md hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600 transition-all duration-200 hover:scale-105">
                    <ClearIcon /> Clear
                </button>
                <button onClick={onExport} className="flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 transition-all duration-200 hover:scale-105">
                    <ExportIcon /> Export PDF
                </button>
            </div>
        </header>
    );
};

const ChatArea: React.FC<{ messages: Message[]; isLoading: boolean; uiState: MessageUiState; onUpdateUiState: (id: string, updates: Partial<MessageUiState[string]>) => void; onTopicClick: (topic: string) => void; }> = ({ messages, isLoading, uiState, onUpdateUiState, onTopicClick }) => {
    const chatEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
    useEffect(() => { if (window.MathJax) { window.MathJax.typesetPromise(); } }, [messages]);

    return (
        <main id="chat-container-wrapper" className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-secondary-950/40 animate-gradient-bg bg-[length:400%_400%]">
            <div id="chat-container" className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg) => <MessageBubble key={msg.id} message={msg} uiState={uiState[msg.id] || {}} onUpdateUiState={(updates) => onUpdateUiState(msg.id, updates)} onTopicClick={onTopicClick} />)}
                {isLoading && <TypingIndicator />}
                <div ref={chatEndRef} />
            </div>
        </main>
    );
};

const MessageBubble: React.FC<{ message: Message; uiState: MessageUiState[string]; onUpdateUiState: (updates: Partial<MessageUiState[string]>) => void; onTopicClick: (topic: string) => void; }> = ({ message, uiState, onUpdateUiState, onTopicClick }) => {
    const isUser = message.role === Role.USER;

    // Parse the structured AI response
    const parts = message.content.split(/STUDY_TIP::|RELATED_TOPICS::/);
    const mainContentWithSummary = parts[0];
    const tipMatch = message.content.match(/STUDY_TIP::(.*?)(?=RELATED_TOPICS::|$)/s);
    const topicsMatch = message.content.match(/RELATED_TOPICS::(.*?)$/s);
    const studyTip = tipMatch ? tipMatch[1].trim() : null;
    const relatedTopics = topicsMatch ? topicsMatch[1].trim().split(/[\n-]/).map(t => t.trim()).filter(Boolean) : [];

    const [summary, ...details] = mainContentWithSummary.split('SUMMARY::').length > 1 ? mainContentWithSummary.split('SUMMARY::') : ['', mainContentWithSummary];
    const fullContent = details.join('SUMMARY::').trim();
    const hasSummary = summary.trim() !== '' && mainContentWithSummary.includes('SUMMARY::');

    const processContent = (content: string): string => {
        const mathBlocks: string[] = [];
        const placeholder = (i: number) => `___MATHJAX_PLACEHOLDER_${i}___`;

        // More robust regex to capture both inline ($...$) and display ($$...) LaTeX, protecting it from the Markdown parser.
        const contentWithPlaceholders = content.replace(/\$\$[\s\S]*?\$\$|\$[^\s$][\s\S]*?[^\s$]\$/g, (match) => {
            mathBlocks.push(match);
            return placeholder(mathBlocks.length - 1);
        });
        
        let html = window.marked.parse(contentWithPlaceholders);

        mathBlocks.forEach((block, index) => {
            // Use a replacer function to avoid issues with special characters in LaTeX (like '$&')
            html = html.replace(new RegExp(placeholder(index), 'g'), () => block);
        });

        return window.DOMPurify.sanitize(html, { ADD_TAGS: ['strong'] });
    };

    const contentToDisplay = hasSummary && !uiState.isExpanded ? summary : (hasSummary ? summary + '\n\n' + fullContent : fullContent);
    const sanitizedHtml = processContent(contentToDisplay);

    return (
        <div className={`group flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in-up`}>
            <div className={`max-w-xl lg:max-w-2xl px-5 py-3 rounded-2xl shadow-md transition-all hover:shadow-lg ${isUser ? 'bg-primary-500 text-white dark:bg-primary-700 rounded-br-lg' : 'bg-white dark:bg-neutral-800 rounded-bl-lg'}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
            </div>
            {!isUser && (
                <>
                    {studyTip && <StudyTip content={studyTip} />}
                    <MessageActions message={message} uiState={uiState} onUpdateUiState={onUpdateUiState} hasSummary={hasSummary} />
                    {relatedTopics.length > 0 && <RelatedTopics topics={relatedTopics} onTopicClick={onTopicClick} />}
                </>
            )}
        </div>
    );
};

const StudyTip: React.FC<{ content: string }> = ({ content }) => (
    <div className="mt-2 flex items-start max-w-xl p-3 text-sm border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-200 text-yellow-800 rounded-r-lg">
        <LightbulbIcon />
        <div><strong className="font-semibold">Study Tip:</strong> {content}</div>
    </div>
);

const RelatedTopics: React.FC<{ topics: string[]; onTopicClick: (topic: string) => void }> = ({ topics, onTopicClick }) => (
    <div className="mt-2 max-w-xl">
        <p className="text-xs font-semibold mb-1 text-neutral-500 dark:text-neutral-400">Explore Related Topics:</p>
        <div className="flex flex-wrap gap-2">
            {topics.map(topic => (
                <button key={topic} onClick={() => onTopicClick(topic)} className="px-3 py-1 text-xs font-medium text-primary-700 bg-primary-100 rounded-full hover:bg-primary-200 dark:bg-primary-900/50 dark:text-primary-200 dark:hover:bg-primary-900 transition-colors">
                    {topic}
                </button>
            ))}
        </div>
    </div>
);

const MessageActions: React.FC<{ message: Message; uiState: MessageUiState[string]; onUpdateUiState: (updates: Partial<MessageUiState[string]>) => void; hasSummary: boolean; }> = ({ message, uiState, onUpdateUiState, hasSummary }) => {
    const handleCopy = (text: string, type: 'copyButtonText' | 'copyFormulaButtonText') => {
        navigator.clipboard.writeText(text);
        onUpdateUiState({ [type]: 'Copied!' });
        setTimeout(() => onUpdateUiState({ [type]: undefined }), 2000);
    };
    const handleCopyFormulas = () => {
        const formulas = message.content.match(/\$\$[\s\S]*?\$\$|\$[^\s$][\s\S]*?[^\s$]\$/g) || [];
        if (formulas.length > 0) handleCopy(formulas.join('\n'), 'copyFormulaButtonText');
        else {
            onUpdateUiState({ copyFormulaButtonText: 'No Formulas' });
            setTimeout(() => onUpdateUiState({ copyFormulaButtonText: undefined }), 2000);
        }
    };
    const EMOJIS = ['👍', '💡', '❤️'];

    return (
        <div className="flex items-center space-x-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {hasSummary && <button onClick={() => onUpdateUiState({ isExpanded: !uiState.isExpanded })} className="action-btn">{uiState.isExpanded ? 'Show less' : 'Show more'}</button>}
            <button onClick={() => handleCopy(message.content, 'copyButtonText')} className="action-btn">{uiState.copyButtonText || 'Copy'}</button>
            <button onClick={handleCopyFormulas} className="action-btn">{uiState.copyFormulaButtonText || 'Copy Formulas'}</button>
            <div className="flex items-center space-x-1 rounded-full bg-white/50 dark:bg-neutral-900/50 p-0.5">
                {EMOJIS.map(emoji => (
                    <button key={emoji} onClick={() => onUpdateUiState({ reaction: uiState.reaction === emoji ? undefined : emoji })} className={`text-sm rounded-full transition-transform hover:scale-125 p-1 ${uiState.reaction === emoji ? 'bg-secondary-200 dark:bg-secondary-700' : ''}`}>{emoji}</button>
                ))}
            </div>
        </div>
    );
};

const TypingIndicator = () => (
    <div className="flex justify-start"><div className="px-5 py-3 rounded-2xl shadow-md bg-white dark:bg-neutral-700 rounded-bl-lg"><div className="flex items-center space-x-1.5"><div className="w-2 h-2 bg-neutral-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]"></div><div className="w-2 h-2 bg-neutral-400 rounded-full animate-[pulse_1s_ease-in-out_0.2s_infinite]"></div><div className="w-2 h-2 bg-neutral-400 rounded-full animate-[pulse_1s_ease-in-out_0.4s_infinite]"></div></div></div></div>
);

const Composer: React.FC<{ input: string; setInput: (value: string) => void; handleSend: () => void; handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void; isLoading: boolean; style: StudyStyle; setStyle: (style: StudyStyle) => void; difficulty: Difficulty; setDifficulty: (d: Difficulty) => void; customPrompt: string; setCustomPrompt: (prompt: string) => void; }> = ({ input, setInput, handleSend, handleKeyDown, isLoading, style, setStyle, difficulty, setDifficulty, customPrompt, setCustomPrompt }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const selectClass = "w-full sm:w-auto flex-grow bg-neutral-100 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 transition-all";

    return (
        <footer className="p-4 bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
            <div className="max-w-3xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                        <label htmlFor="style-select" className="text-sm font-medium whitespace-nowrap">Style:</label>
                        <select id="style-select" value={style} onChange={e => setStyle(e.target.value as StudyStyle)} className={selectClass}>
                            {Object.values(StudyStyle).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="difficulty-select" className="text-sm font-medium whitespace-nowrap">Level:</label>
                        <select id="difficulty-select" value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)} className={selectClass}>
                            {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
                {style === StudyStyle.CUSTOM && <input type="text" value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Enter custom instructions..." className="w-full bg-neutral-100 border border-neutral-300 text-sm rounded-lg p-2.5 dark:bg-neutral-700 dark:border-neutral-600 mb-2" />}
                <div className="relative">
                    <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about a topic... (e.g., 'Explain the Pythagorean theorem')" className="w-full p-4 pr-14 text-base border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-400 focus:outline-none dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:focus:ring-primary-500 transition-shadow resize-none overflow-y-hidden" rows={1} disabled={isLoading} />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-white bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-100" aria-label="Send message"><SendIcon /></button>
                </div>
            </div>
        </footer>
    );
};

// Add a shared style for action buttons
const actionBtnStyle = document.createElement('style');
actionBtnStyle.innerHTML = `
    .action-btn {
        padding: 2px 8px;
        font-size: 12px;
        font-weight: 500;
        border-radius: 9999px;
        background-color: rgba(0, 0, 0, 0.05);
        color: #334155; /* neutral-700 */
        transition: all 0.2s ease-in-out;
    }
    .action-btn:hover {
        background-color: rgba(0, 0, 0, 0.1);
        transform: translateY(-1px);
    }
    .dark .action-btn {
        background-color: rgba(255, 255, 255, 0.1);
        color: #cbd5e1; /* neutral-300 */
    }
    .dark .action-btn:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(actionBtnStyle);
