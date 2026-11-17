'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import { Mic, MicOff, Send, X, CheckCircle, AlertCircle, Sparkles, Volume2 } from 'lucide-react';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceAssistantModal({ isOpen, onClose }: VoiceModalProps) {
  const { language, t } = useApp();
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<'hi-IN' | 'en-IN'>(
    language === 'hi' ? 'hi-IN' : 'en-IN'
  );
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    action?: string;
    whatsappUrl?: string | null;
    navigateTo?: string;
  } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const processCommand = async (commandText: string) => {
    if (!commandText.trim()) return;
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: commandText }),
      });

      const data = await res.json();
      setResult(data);
      if (data.success) {
        setStatusMessage(data.message);
        // Spoken audio confirmation
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            const utterance = new SpeechSynthesisUtterance(data.message);
            utterance.lang = selectedLang;
            window.speechSynthesis.speak(utterance);
          } catch {
            // ignore audio speak error
          }
        }
        if (data.navigateTo) {
          setTimeout(() => {
            router.push(data.navigateTo);
            onClose();
          }, 1500);
        }
      } else {
        setStatusMessage(data.message || 'Could not process command.');
      }
    } catch {
      setStatusMessage('Network error processing voice command.');
    } finally {
      setIsLoading(false);
    }
  };

  const startListeningSession = () => {
    if (typeof window === 'undefined') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setStatusMessage('Microphone speech recognition not supported in this browser. Please use quick chips or type below.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = selectedLang;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinal += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (currentInterim) {
          setInterimText(currentInterim);
        }

        if (currentFinal) {
          setTranscript(currentFinal);
          setInterimText('');
          setIsListening(false);
          processCommand(currentFinal);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'no-speech') {
          setStatusMessage('Listening paused. Tap the mic to speak again.');
        } else if (event.error === 'not-allowed') {
          setStatusMessage('Microphone access blocked. Please allow mic permission in browser settings.');
        } else {
          setStatusMessage('Could not hear clearly. Try typing below or click a quick sample.');
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
      setResult(null);
      setInterimText('');
      setStatusMessage(selectedLang === 'hi-IN' ? 'सुन रहा हूँ... बोलिए (उदा. "रमेश भाई 500 उधार")' : 'Listening... speak clearly (e.g. "Ramesh Bhai 500 udhaar")');
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
    } else {
      startListeningSession();
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  if (!isOpen) return null;

  const quickSamples = [
    { label: '💰 Ramesh 500 Udhaar', text: 'Ramesh Bhai ko 500 rupay udhaar likho' },
    { label: '💵 Ramesh 200 Jama', text: 'Ramesh Bhai ne 200 rupay jama karwaye' },
    { label: '⚡ Bijli Bill 1200 Kharcha', text: 'Dukan ka bijli bill 1200 kharcha likho' },
    { label: '📦 Tata Salt 10 Add', text: 'Tata Salt 10 packet add karo' },
    { label: '💳 Paresh 300 Udhaar', text: 'Paresh Thakkar ko 300 udhaar likho' },
  ];

  return (
    <div
      className="ks-overlay animate-fade-in"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.quickVoiceEntry}
        className="ks-modal max-w-lg"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 rounded-full p-1.5 text-muted transition-colors hover:bg-hover hover:text-ink-soft"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        {/* Header */}
        <div className="mb-4 flex items-center justify-between pr-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-md shadow-accent/20">
              <Mic className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="flex items-center gap-1.5 text-base font-bold text-ink">
                <span>{t.quickVoiceEntry}</span>
                <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent-strong uppercase">
                  Voice AI
                </span>
              </h3>
              <p className="text-xs text-muted">
                {language === 'hi'
                  ? 'उधार, जमा, दुकान का खर्च या स्टॉक बोलकर दर्ज करें'
                  : 'Record credit, repayments, store expenses, or stock by speaking'}
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center rounded-lg bg-subtle p-0.5 border border-line text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setSelectedLang('hi-IN')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                selectedLang === 'hi-IN' ? 'bg-surface text-accent font-black shadow-xs' : 'text-muted'
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang('en-IN')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                selectedLang === 'en-IN' ? 'bg-surface text-accent font-black shadow-xs' : 'text-muted'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Large Interactive Mic Visualizer */}
        <div className="my-3 flex flex-col items-center justify-center rounded-2xl border border-line bg-subtle/60 py-6 transition-all">
          <button
            onClick={toggleListening}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
            className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl transition-all active:scale-95 ${
              isListening
                ? 'bg-red-500 shadow-red-500/40 ring-8 ring-red-500/20 animate-pulse'
                : 'bg-accent shadow-accent/30 hover:opacity-90'
            }`}
          >
            {isListening ? (
              <MicOff className="h-8 w-8 animate-bounce" aria-hidden />
            ) : (
              <Mic className="h-8 w-8" aria-hidden />
            )}
          </button>

          <p className="mt-3 text-xs font-bold text-ink flex items-center gap-1.5">
            {isListening ? (
              <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                <span>{selectedLang === 'hi-IN' ? 'सुन रहा हूँ... बोलिए' : 'Listening... Speak now'}</span>
              </span>
            ) : (
              <span className="text-muted">
                {selectedLang === 'hi-IN' ? 'माइक पर टैप करके बोलें' : 'Tap mic to speak voice command'}
              </span>
            )}
          </p>

          {/* Live Audio Transcript Preview */}
          {(interimText || transcript) && (
            <div className="mt-2.5 px-4 text-center">
              <p className="text-xs font-semibold text-accent-strong italic max-w-sm break-words">
                &ldquo;{interimText || transcript}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Status or Result Banner */}
        {result && (
          <div
            className={`mb-3 flex items-start gap-2.5 rounded-xl border p-3.5 text-xs animate-slide-up ${
              result.success
                ? 'border-green-500/25 bg-green-500/10 text-green-900 dark:text-green-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200'
            }`}
          >
            {result.success ? (
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">{result.message}</p>
              {result.action && (
                <p className="mt-0.5 text-[10px] text-muted font-mono">
                  Action: {result.action}
                </p>
              )}
              {result.whatsappUrl && (
                <div className="mt-2.5 border-t border-green-500/20 pt-2">
                  <a
                    href={result.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition-colors"
                  >
                    <span>📲 WhatsApp Payment Link भेजें</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {statusMessage && !result && (
          <p className="my-2 text-center text-xs font-medium text-ink-soft italic">
            {statusMessage}
          </p>
        )}

        {/* Quick Sample Demo Chips for Video Presentation */}
        <div className="mt-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden />
            <span>{language === 'hi' ? 'डेमो वौइस् कमांड्स (क्लिक करके चलाएं):' : 'Demo Voice Commands (Click to run):'}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickSamples.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTranscript(s.text);
                  processCommand(s.text);
                }}
                className="rounded-lg border border-line bg-subtle px-2.5 py-1 text-xs font-medium text-ink-soft transition-all hover:border-accent hover:bg-accent-soft hover:text-accent-strong active:scale-95"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Manual text input fallback */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processCommand(transcript)}
            placeholder={
              language === 'hi'
                ? 'बोलें या टाइप करें (उदा. रमेश भाई 500 उधार)...'
                : 'Type or speak (e.g. Ramesh 500 udhaar)...'
            }
            aria-label="Type a voice command"
            className="ks-input py-2 text-xs"
          />
          <Button
            size="sm"
            onClick={() => processCommand(transcript)}
            disabled={isLoading || !transcript.trim()}
            className="ks-btn-primary shrink-0"
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            <span>{isLoading ? '...' : 'Send'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
