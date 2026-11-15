'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
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

  const quickSamples = [
    { label: '40 Rs Udhaar Ramesh', text: 'Write 40 rupees credit for Ramesh, and order 20 packets of milk' },
    { label: 'Ramesh 500 Udhaar', text: 'Ramesh Bhai ko 500 rupay udhaar likho' },
    { label: 'Ramesh 200 Jama', text: 'Ramesh Bhai ne 200 rupay jama karwaye' },
    { label: 'Add 10 Milk Packets', text: 'Amul Taaza Milk 10 packet add karo' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-teal-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              {t.quickVoiceEntry}
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                Track 1
              </span>
            </h3>
            <p className="text-xs text-slate-500">{t.voiceHelpText}</p>
          </div>
        </div>

        {/* Large Mic Button */}
        <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-xl border border-slate-200/80 my-3">
          <button
            onClick={toggleListening}
            className={`h-20 w-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
              isListening
                ? 'bg-red-500 shadow-red-500/40 animate-bounce'
                : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
            }`}
          >
            {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </button>
          <p className="mt-3 text-xs font-semibold text-slate-700">
            {isListening ? '🔴 ' + t.listening : t.startVoice}
          </p>
        </div>

        {/* Status or Result Banner */}
        {result && (
          <div
            className={`p-3.5 rounded-xl text-xs mb-3 flex items-start gap-2.5 ${
              result.success
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-amber-50 text-amber-900 border border-amber-200'
            }`}
          >
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{result.message}</p>
              {result.action && (
                <p className="text-[10px] text-slate-500 mt-0.5">Database Action: {result.action}</p>
              )}
              {/* @ts-ignore */}
              {result.whatsappUrl && (
                <div className="mt-2 pt-2 border-t border-emerald-200">
                  <a
                    /* @ts-ignore */
                    href={result.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                  >
                    📲 Send Polite UPI Payment Link to Customer
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {statusMessage && !result && (
          <p className="text-xs text-center text-slate-600 font-medium my-2 italic">{statusMessage}</p>
        )}

        {/* Quick sample chips */}
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
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
                className="text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
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
            placeholder="Type or speak (e.g. Ramesh 500 udhaar)..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={() => processCommand(transcript)}
            disabled={isLoading || !transcript.trim()}
            className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
