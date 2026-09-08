import React, { useRef, useEffect, useState } from 'react';

export default function EmotionDetectionPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [emotionData, setEmotionData] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Open WebSocket connection to FastAPI
      const ws = new WebSocket('ws://localhost:8000/api/ws/patient-emotion');
      socketRef.current = ws;

      ws.onopen = () => {
        setIsStreaming(true);
        setErrorMsg('');
        
        // Capture frame every 100ms (~10 FPS)
        intervalRef.current = setInterval(() => {
          if (videoRef.current && canvasRef.current && ws.readyState === WebSocket.OPEN) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
              if (blob && ws.readyState === WebSocket.OPEN) {
                ws.send(blob);
              }
            }, 'image/jpeg', 0.7);
          }
        }, 100);
      };

      ws.onmessage = (event) => {
        const result = JSON.parse(event.data);
        setEmotionData(result);
      };

      ws.onerror = () => {
        setErrorMsg('Failed to connect to backend emotion server.');
      };

    } catch (err) {
      setErrorMsg('Webcam access denied or camera not found.');
    }
  };

  const stopStream = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (socketRef.current) socketRef.current.close();
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsStreaming(false);
    setEmotionData(null);
  };

  useEffect(() => {
    return () => stopStream();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-slate-800">Patient Emotion & Distress Monitor</h3>
        <p className="text-slate-500 text-sm mt-1">
          Real-time webcam facial expression analysis for automated distress detection.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Webcam Viewport */}
        <div className="lg:col-span-2 relative bg-slate-900 rounded-2xl overflow-hidden shadow-md aspect-video flex items-center justify-center border border-slate-800">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover scale-x-[-1]" 
          />
          <canvas ref={canvasRef} className="hidden" />

          {!isStreaming && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-400">
              <span className="text-4xl mb-2">📹</span>
              <p className="text-sm font-medium">Webcam feed is inactive</p>
            </div>
          )}

          {/* Bounding Box Overlay */}
          {isStreaming && emotionData?.detected && emotionData.bbox && (
            <div 
              className={`absolute border-2 rounded-lg transition-all duration-100 ${
                emotionData.is_distressed ? 'border-red-500 bg-red-500/20' : 'border-emerald-500 bg-emerald-500/20'
              }`}
              style={{
                // Mirror box calculation to match scale-x-[-1] video preview
                right: `${(emotionData.bbox.x / (videoRef.current?.videoWidth || 640)) * 100}%`,
                top: `${(emotionData.bbox.y / (videoRef.current?.videoHeight || 480)) * 100}%`,
                width: `${(emotionData.bbox.w / (videoRef.current?.videoWidth || 640)) * 100}%`,
                height: `${(emotionData.bbox.h / (videoRef.current?.videoHeight || 480)) * 100}%`,
              }}
            >
              <span className={`absolute -top-7 left-0 px-2 py-0.5 text-xs text-white rounded-md font-semibold shadow-sm ${
                emotionData.is_distressed ? 'bg-red-600' : 'bg-emerald-600'
              }`}>
                {emotionData.emotion} ({emotionData.confidence}%)
              </span>
            </div>
          )}
        </div>

        {/* Live Control Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-lg mb-4">Live Analytics</h4>
            
            {!isStreaming ? (
              <p className="text-slate-500 text-sm leading-relaxed">
                Click start to activate real-time frame processing.
              </p>
            ) : emotionData?.detected ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Detected Emotion</span>
                  <span className="text-2xl font-bold text-slate-800">{emotionData.emotion}</span>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Model Confidence</span>
                  <span className="text-lg font-bold text-slate-700">{emotionData.confidence}%</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Patient State</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                    emotionData.is_distressed 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {emotionData.is_distressed ? '⚠️ High Distress Level' : '✅ Stable / Normal'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium border border-amber-200">
                Searching for patient face...
              </div>
            )}
          </div>

          <button
            onClick={isStreaming ? stopStream : startStream}
            className={`w-full py-3 px-4 rounded-xl text-white font-semibold shadow-sm transition-all duration-200 mt-6 ${
              isStreaming 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isStreaming ? 'Stop Camera' : 'Start Patient Monitor'}
          </button>
        </div>
      </div>
    </div>
  );
}