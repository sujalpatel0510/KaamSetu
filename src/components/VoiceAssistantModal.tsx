'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import { Mic, MicOff, Send, X, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceAssistantModal({ isOpen, onClose }: VoiceModalProps) {
  const { language, t } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    action?: string;
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
        // Hands-free earphone audio feedback (Track 1 requirement)
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(data.message);
          utterance.lang = 'hi-IN';
          window.speechSynthesis.speak(utterance);
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

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        processCommand(text);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setStatusMessage('Could not hear clearly. Try typing below or speak again.');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setStatusMessage('Microphone speech recognition not supported in this browser. Please use quick buttons or type below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setResult(null);
      setStatusMessage('Listening... Speak now (e.g. "Ramesh ko 500 udhaar likho")');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const quickSamples = [
    { label: '40 Rs Udhaar Ramesh', text: 'Write 40 rupees credit for Ramesh, and order 20 packets of milk' },
    { label: 'Ramesh 500 Udhaar', text: 'Ramesh Bhai ko 500 rupay udhaar likho' },
    { label: 'Ramesh 200 Jama', text: 'Ramesh Bhai ne 200 rupay jama karwaye' },
    { label: 'Add 10 Milk Packets', text: 'Amul Taaza Milk 10 packet add karo' },
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
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-strong text-accent-fg shadow-md shadow-accent/30">
            <Mic className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h3 className="flex items-center gap-1.5 text-lg font-bold text-ink">
              {t.quickVoiceEntry}
              <span className="ks-badge bg-teal-500/15 text-teal-800 dark:text-teal-300">Track 1</span>
            </h3>
            <p className="text-xs text-muted">{t.voiceHelpText}</p>
          </div>
        </div>

        {/* Large Mic Button */}
        <div className="my-3 flex flex-col items-center justify-center rounded-xl border border-line bg-subtle py-6">
          <button
            onClick={toggleListening}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
            className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 ${
              isListening
                ? 'animate-pulse bg-red-500 shadow-red-500/40'
                : 'bg-brand-600 shadow-brand-600/30 hover:bg-brand-700'
            }`}
          >
            {isListening ? (
              <MicOff className="h-8 w-8" aria-hidden />
            ) : (
              <Mic className="h-8 w-8" aria-hidden />
            )}
          </button>
          <p className="mt-3 text-xs font-semibold text-ink-soft">
            {isListening ? '🔴 ' + t.listening : t.startVoice}
          </p>
        </div>

        {/* Status or Result Banner */}
        {result && (
          <div
            className={`mb-3 flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
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
            <div>
              <p className="font-semibold">{result.message}</p>
              {result.action && (
                <p className="mt-0.5 text-[10px] text-muted">
                  Database Action: {result.action}
                </p>
              )}
              {/* @ts-expect-error whatsappUrl comes from the voice API but is not part of the local result type */}
              {result.whatsappUrl && (
                <div className="mt-2 border-t border-green-500/25 pt-2">
                  <a
                    /* @ts-expect-error whatsappUrl comes from the voice API but is not part of the local result type */
                    href={result.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ks-btn ks-btn-emerald ks-btn-sm text-[11px]"
                  >
                    📲 Send Polite UPI Payment Link to Customer
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

        {/* Quick sample chips */}
        <div className="mt-3">
          <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold tracking-wider text-muted uppercase">
            <Sparkles className="h-3 w-3 text-teal-500" aria-hidden />
            Quick Demo Voice Commands (Click to simulate):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickSamples.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(s.text);
                  processCommand(s.text);
                }}
                className="rounded-lg border border-line bg-subtle px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-accent-strong"
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
            placeholder="Type or speak (e.g. Ramesh 500 udhaar)…"
            aria-label="Type a voice command"
            className="ks-input py-2 text-xs"
          />
          <Button
            size="sm"
            onClick={() => processCommand(transcript)}
            disabled={isLoading || !transcript.trim()}
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
