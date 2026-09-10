import React, { useState, useEffect } from 'react';

const DueReminderModal = ({ reminder, onMarkTaken, onTimeoutMissed }) => {
    const [secondsLeft, setSecondsLeft] = useState(30);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const speakAlert = () => {
        if (!reminder || !('speechSynthesis' in window)) return;
        try {
            // 1. Play subtle audio tone via Web Audio API to awaken browser audio engine
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    const ctx = new AudioCtx();
                    if (ctx.state === 'suspended') {
                        ctx.resume();
                    }
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
                    gain.gain.setValueAtTime(0.2, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.35);
                }
            } catch (e) {
                console.warn('Audio chime warning:', e);
            }

            // 2. Prepare and execute SpeechSynthesis out loud
            window.speechSynthesis.cancel();
            window.speechSynthesis.resume();

            const speechText = `Attention patient! Reminder alert for ${reminder.title}. ${
                reminder.notes ? 'Special note: ' + reminder.notes : ''
            }`;

            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = (err) => {
                console.warn('Speech error:', err);
                setIsSpeaking(false);
            };

            const voices = window.speechSynthesis.getVoices();
            if (voices && voices.length > 0) {
                const englishVoice = voices.find((v) => v.lang && v.lang.startsWith('en')) || voices[0];
                if (englishVoice) utterance.voice = englishVoice;
            }

            window.speechSynthesis.speak(utterance);

            // Additional resume call to work around Chromium pause bug
            setTimeout(() => {
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.resume();
                }
            }, 150);
        } catch (e) {
            console.error('Speech synthesis error:', e);
        }
    };

    // Auto-trigger voice alert IMMEDIATELY on popup mount
    useEffect(() => {
        if (reminder) {
            // Immediate speech execution
            speakAlert();

            // Handle delayed voice loading in Chrome/Edge
            if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = () => {
                    speakAlert();
                };
            }
        }

        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [reminder]);

    // 30-Second Countdown Timer
    useEffect(() => {
        setSecondsLeft(30);
        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                    }
                    onTimeoutMissed(reminder.id);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [reminder, onTimeoutMissed]);

    if (!reminder) return null;

    const progressPercentage = (secondsLeft / 30) * 100;

    const handleTaken = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        onMarkTaken(reminder.id);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <div className="bg-white border-2 border-orange-500 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-300">
                {/* TOP PULSING ICON & AUDIO STATUS */}
                <div className="flex justify-center relative">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center border-4 border-orange-400 animate-pulse shadow-lg">
                        <span className="text-4xl animate-bounce">⏰</span>
                    </div>
                    <button
                        onClick={speakAlert}
                        className="absolute right-0 top-0 p-2 text-slate-500 hover:text-orange-600 bg-slate-100 hover:bg-orange-50 rounded-full text-xs font-bold transition flex items-center gap-1"
                        title="Replay Voice Alert"
                    >
                        <span>🔊</span>
                        <span>{isSpeaking ? 'Speaking...' : 'Replay Voice'}</span>
                    </button>
                </div>

                {/* HEADER */}
                <div className="text-center space-y-1">
                    <span className="bg-orange-100 text-orange-800 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-orange-300">
                        Scheduled Patient Reminder
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 pt-2">{reminder.title}</h3>
                    <p className="text-xs text-slate-500 font-semibold">
                        Scheduled Time: <span className="text-slate-800 font-bold">{reminder.reminder_time}</span>
                    </p>
                </div>

                {/* NOTES BOX */}
                {reminder.notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 shadow-inner">
                        <p className="font-bold text-amber-800 uppercase tracking-wider mb-1">Special Instructions:</p>
                        <p className="text-sm font-medium">{reminder.notes}</p>
                    </div>
                )}

                {/* 30-SECOND COUNTDOWN & PROGRESS BAR */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                        <span>Auto-marking as missed in:</span>
                        <span className="text-orange-600 font-mono text-sm">{secondsLeft}s</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                            className="bg-gradient-to-r from-orange-500 to-red-500 h-3 transition-all duration-1000 ease-linear rounded-full"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="pt-2">
                    <button
                        onClick={handleTaken}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 border-2 border-emerald-400"
                    >
                        <span className="text-2xl">✓</span>
                        <span>Mark as Taken</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DueReminderModal;
