import React, { useState, useRef } from 'react';

const SpeechDetectionPage = () => {
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'record'
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Live Recording States
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    // Reset / Clear state for choosing a new audio
    const handleClearAudio = () => {
        setFile(null);
        setResult(null);
        setAudioUrl(null);
        setRecordingTime(0);
        if (isRecording) {
            stopRecording();
        }
    };

    // --- FILE UPLOAD HANDLERS ---
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setAudioUrl(URL.createObjectURL(selectedFile));
            setResult(null);
        }
    };

    // --- LIVE RECORDING HANDLERS ---
    const startRecording = async () => {
        setResult(null);
        audioChunksRef.current = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const recordedFile = new File([audioBlob], `live_speech_sample_${Date.now()}.webm`, {
                    type: 'audio/webm',
                });
                setFile(recordedFile);
                setAudioUrl(URL.createObjectURL(audioBlob));
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            alert('Microphone access denied or unavailable in your browser.');
            console.error('Microphone access error:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    // --- FORM SUBMIT HANDLER ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        setIsLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/predict-speech', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Speech API request failed');
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Speech prediction error:', error);
            setResult({
                status: 'error',
                message: 'Failed to process audio file. Ensure FastAPI backend is running with Librosa installed.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div>
                <h3 className="text-2xl font-bold text-slate-900">Acoustic Speech & Voice Biomarker Screening</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Extracts acoustic features (Pitch $F_0$, RMS Energy, Pause Ratios, and MFCC spectral vectors) from speech recordings to screen for cognitive impairment markers.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* INPUT PANEL */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    {/* MODE TOGGLE TABS */}
                    <div className="flex border-b border-slate-200 space-x-4">
                        <button
                            type="button"
                            onClick={() => { setActiveTab('upload'); handleClearAudio(); }}
                            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'upload'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            📁 File Upload (.wav, .mp3)
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveTab('record'); handleClearAudio(); }}
                            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'record'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            🎙️ Live Voice Recorder
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* TAB 1: FILE UPLOAD MODE */}
                        {activeTab === 'upload' && (
                            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-orange-500 transition-colors bg-slate-50/50">
                                <input
                                    type="file"
                                    accept=".wav,.mp3,.m4a,.webm"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="audio-upload"
                                />
                                <label htmlFor="audio-upload" className="cursor-pointer space-y-3 block">
                                    <span className="text-4xl block">📁</span>
                                    <p className="text-sm font-semibold text-slate-700">
                                        {file ? file.name : 'Click to select audio file (.wav, .mp3, .m4a)'}
                                    </p>
                                    <p className="text-xs text-slate-400">Supported formats: WAV, MP3, M4A, WEBM</p>
                                </label>
                            </div>
                        )}

                        {/* TAB 2: LIVE RECORDING MODE */}
                        {activeTab === 'record' && (
                            <div className="border-2 border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 space-y-4">
                                <div className="text-4xl">🎙️</div>
                                
                                {!isRecording && !file && (
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">Record Patient's Voice Live</p>
                                        <p className="text-xs text-slate-400 mt-1">Click start and read a short prompt (10-20 seconds recommended).</p>
                                        <button
                                            type="button"
                                            onClick={startRecording}
                                            className="mt-4 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm shadow-md transition-all inline-flex items-center space-x-2"
                                        >
                                            <span className="w-3 h-3 bg-white rounded-full animate-ping"></span>
                                            <span>Start Live Recording</span>
                                        </button>
                                    </div>
                                )}

                                {isRecording && (
                                    <div className="space-y-3">
                                        <p className="text-sm font-bold text-red-600 animate-pulse">
                                            🔴 Recording in progress... ({recordingTime}s)
                                        </p>
                                        <button
                                            type="button"
                                            onClick={stopRecording}
                                            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-sm shadow-md transition-all"
                                        >
                                            ⏹️ Stop Recording
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* AUDIO PLAYER & CLEAR / NEW AUDIO CONTROL */}
                        {audioUrl && (
                            <div className="bg-slate-100 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200">
                                <div className="flex items-center space-x-3 w-full sm:w-auto">
                                    <span className="text-xl">🎵</span>
                                    <div className="truncate max-w-xs">
                                        <p className="text-xs font-semibold text-slate-800 truncate">{file?.name}</p>
                                        <p className="text-[10px] text-slate-500">Ready for screening analysis</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                                    <audio controls className="h-8 max-w-xs">
                                        <source src={audioUrl} />
                                    </audio>

                                    {/* CLEAR / CHOOSE NEW AUDIO BUTTON */}
                                    <button
                                        type="button"
                                        onClick={handleClearAudio}
                                        className="px-3 py-1.5 bg-slate-200 hover:bg-red-100 hover:text-red-600 text-slate-600 text-xs font-semibold rounded-lg transition-colors shrink-0"
                                        title="Clear and choose a new audio"
                                    >
                                        ✕ Clear
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={!file || isLoading || isRecording}
                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center"
                        >
                            {isLoading ? 'Extracting Acoustic Biomarkers...' : 'Analyze Speech Recording'}
                        </button>
                    </form>
                </div>

                {/* RESULTS PANEL */}
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                    <div>
                        <h4 className="text-lg font-bold border-b border-slate-800 pb-4 mb-6">Biomarker Screening Results</h4>

                        {!isLoading && !result && (
                            <p className="text-slate-400 text-sm text-center py-12">Upload or record a speech sample to compute acoustic biomarkers.</p>
                        )}

                        {isLoading && (
                            <div className="text-center text-orange-400 py-12 space-y-3">
                                <span className="text-4xl animate-spin inline-block">⏳</span>
                                <p className="text-sm font-medium text-slate-300">Computing 35 spectral & prosodic features...</p>
                            </div>
                        )}

                        {!isLoading && result && result.status === 'error' && (
                            <div className="bg-red-900/40 border border-red-700 p-4 rounded-xl text-red-200 text-sm">
                                <p className="font-semibold mb-1">⚠️ Error</p>
                                {result.message}
                            </div>
                        )}

                        {!isLoading && result && result.status === 'success' && (
                            <div className="space-y-6">
                                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-400 uppercase font-semibold">Primary Prediction</p>
                                    <p className={`text-3xl font-extrabold mt-1 ${result.predicted_label === 'Impaired' ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {result.predicted_label}
                                    </p>
                                    <p className="text-xs text-slate-300 mt-1">Impairment Probability: <strong>{result.impaired_probability}%</strong></p>
                                    
                                    <div className="w-full bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${result.predicted_label === 'Impaired' ? 'bg-red-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${result.impaired_probability}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 space-y-3">
                                    <p className="text-xs text-slate-400 uppercase font-semibold">Key Acoustic Metrics</p>
                                    
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
                                            <span className="text-slate-400 block">Total Duration</span>
                                            <span className="font-mono text-slate-200 font-bold">{result.metrics_summary.total_duration}s</span>
                                        </div>
                                        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
                                            <span className="text-slate-400 block">Speech Time</span>
                                            <span className="font-mono text-slate-200 font-bold">{result.metrics_summary.speech_time}s</span>
                                        </div>
                                        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
                                            <span className="text-slate-400 block">Pause Time (% Total)</span>
                                            <span className="font-mono text-orange-400 font-bold">{result.metrics_summary.pause_time}s ({result.metrics_summary.pause_ratio_pct}%)</span>
                                        </div>
                                        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
                                            <span className="text-slate-400 block">Pause Count</span>
                                            <span className="font-mono text-slate-200 font-bold">{result.metrics_summary.pause_count}</span>
                                        </div>
                                        <div className="col-span-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
                                            <span className="text-slate-400 block">Mean Pitch ($F_0$)</span>
                                            <span className="font-mono text-teal-300 font-bold">{result.metrics_summary.mean_pitch_hz} Hz</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-slate-500 text-center border-t border-slate-800 pt-4 mt-6">
                        RandomForest Acoustic Classifier (35-Feature Vector)
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpeechDetectionPage;