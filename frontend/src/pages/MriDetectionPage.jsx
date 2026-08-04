import React, { useState } from 'react';

// Knowledge base for stage descriptions and recommended actions
const STAGE_DETAILS = {
    'NonDemented': {
        title: 'Non-Demented (Normal Cognitive Status)',
        description: 'No significant signs of neurodegeneration or structural brain atrophy associated with Alzheimer\'s disease were detected in this MRI scan.',
        recommendations: [
            'Maintain a healthy lifestyle with regular cardiovascular exercise.',
            'Keep active with cognitive exercises, reading, and social interaction.',
            'Schedule routine wellness check-ups with your healthcare provider.'
        ],
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    'VeryMildDemented': {
        title: 'Very Mild Demented (Minimal Cognitive Changes)',
        description: 'Minor structural variations detected. This stage often corresponds to very early memory lapses that may be subtle or typical of normal age-related changes.',
        recommendations: [
            'Consult a neurologist for a detailed baseline cognitive assessment.',
            'Track any subtle memory or daily task difficulties over time.',
            'Focus on brain-healthy nutrition (e.g., Mediterranean diet) and adequate sleep.'
        ],
        badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    },
    'MildDemented': {
        title: 'Mild Demented (Early Stage Alzheimer\'s)',
        description: 'Noticeable structural patterns associated with mild Alzheimer\'s disease. Individuals may experience mild confusion, memory loss, and difficulty managing complex tasks.',
        recommendations: [
            'Schedule a comprehensive neurological and clinical evaluation.',
            'Discuss early intervention strategies and potential medications with a specialist.',
            'Establish memory tools (calendars, reminders) and supportive daily routines.'
        ],
        badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    },
    'ModerateDemented': {
        title: 'Moderate Demented (Moderate Stage Alzheimer\'s)',
        description: 'Clear structural markers of neurodegeneration present. Characterized by increased memory loss, language challenges, and requiring assistance with routine daily activities.',
        recommendations: [
            'Seek specialized care from a neurologist or memory care team immediately.',
            'Ensure a safe home environment to prevent confusion or wandering.',
            'Evaluate caregiver support systems and long-term care plans.'
        ],
        badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30'
    }
};

const MriDetectionPage = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [detectionResult, setDetectionResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setDetectionResult(null);
        }
    };

    const handleRunDetection = async () => {
        if (!selectedImage) return;

        setIsLoading(true);
        setDetectionResult(null);

        const formData = new FormData();
        formData.append('file', selectedImage);

        try {
            const response = await fetch('http://localhost:8000/api/predict', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Detection API failed');
            }

            const data = await response.json();

            setDetectionResult({
                status: 'success',
                label: data.prediction,
                confidence: data.confidence,
                breakdown: data.breakdown || []
            });
        } catch (error) {
            console.error('Detection error:', error);
            setDetectionResult({ 
                status: 'error', 
                message: 'Failed to communicate with AI Backend. Ensure FastAPI is running.' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    const currentStageInfo = detectionResult?.status === 'success' 
        ? STAGE_DETAILS[detectionResult.label] 
        : null;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div>
                <h3 className="text-2xl font-bold text-slate-900">Alzheimer's Disease MRI Scan Detection</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Upload an axial brain MRI scan to evaluate Alzheimer's disease progression markers.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* UPLOAD AND PREVIEW PANEL */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-orange-500 transition-all cursor-pointer text-center relative group shadow-sm">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="space-y-3">
                            <span className="text-5xl block text-slate-400 group-hover:scale-110 transition-transform">🧠</span>
                            <p className="text-base font-semibold text-slate-700">
                                Drop MRI scan image here or <span className="text-orange-600 underline">browse</span>
                            </p>
                            <p className="text-xs text-slate-400">Supported formats: PNG, JPG, JPEG</p>
                            {selectedImage && (
                                <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 py-1 px-3 rounded-full inline-block mt-2">
                                    Selected: {selectedImage.name}
                                </p>
                            )}
                        </div>
                    </div>

                    {previewUrl && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                            <h4 className="text-sm font-semibold text-slate-700 mb-4">Selected MRI Image Preview</h4>
                            <img src={previewUrl} alt="MRI Preview" className="max-h-80 mx-auto rounded-lg border border-slate-200" />
                            <button
                                onClick={handleRunDetection}
                                disabled={isLoading}
                                className="mt-6 px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center mx-auto"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="animate-spin mr-2">🔄</span> Analyzing Scan...
                                    </>
                                ) : (
                                    'Analyze MRI Scan'
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* RESULTS SIDEBAR */}
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                    <div>
                        <h4 className="text-lg font-bold border-b border-slate-800 pb-4 mb-6">Model Output Analysis</h4>

                        {!isLoading && !detectionResult && (
                            <div className="text-center text-slate-400 py-12">
                                <p className="text-sm">Upload an image and click <strong>"Analyze MRI Scan"</strong> to view model prediction results.</p>
                            </div>
                        )}

                        {isLoading && (
                            <div className="text-center text-orange-400 py-12 space-y-3">
                                <span className="text-4xl animate-spin inline-block">🧠</span>
                                <p className="text-sm font-medium text-slate-300">Evaluating brain structural patterns...</p>
                            </div>
                        )}

                        {!isLoading && detectionResult && detectionResult.status === 'error' && (
                            <div className="bg-red-900/40 border border-red-700 p-4 rounded-xl text-red-200 text-sm">
                                <p className="font-semibold mb-1">⚠️ Error</p>
                                {detectionResult.message}
                            </div>
                        )}

                        {!isLoading && detectionResult && detectionResult.status === 'success' && (
                            <div className="space-y-6">
                                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Classification Result</p>
                                    <p className="text-2xl font-bold text-orange-400 mt-1">{detectionResult.label}</p>
                                </div>

                                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Model Confidence</p>
                                    <p className="text-4xl font-extrabold text-white mt-1">
                                        {detectionResult.confidence}%
                                    </p>
                                    <div className="w-full bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                                        <div
                                            className="bg-orange-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${detectionResult.confidence}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {detectionResult.breakdown && detectionResult.breakdown.length > 0 && (
                                    <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 space-y-3">
                                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Class Probabilities</p>
                                        {detectionResult.breakdown.map((item) => (
                                            <div key={item.label} className="text-xs space-y-1">
                                                <div className="flex justify-between text-slate-300">
                                                    <span>{item.label}</span>
                                                    <span className="font-mono">{item.score}%</span>
                                                </div>
                                                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-slate-400 h-full rounded-full"
                                                        style={{ width: `${item.score}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-slate-500 text-center border-t border-slate-800 pt-4 mt-6">
                        NeuroCareX Deep Learning Model v1.0
                    </div>
                </div>
            </div>

            {/* NEW: DETAILED EXPLANATION CARD (APPEARS BELOW AFTER ANALYSIS) */}
            {!isLoading && currentStageInfo && (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h4 className="text-xl font-bold text-slate-800">{currentStageInfo.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">Clinical Classification Breakdown & Next Steps</p>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${currentStageInfo.badgeColor}`}>
                            {detectionResult.label}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h5 className="text-sm font-semibold text-slate-700 mb-1">What does this mean?</h5>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {currentStageInfo.description}
                            </p>
                        </div>

                        <div>
                            <h5 className="text-sm font-semibold text-slate-700 mb-2">Recommended Next Steps:</h5>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                {currentStageInfo.recommendations.map((step, index) => (
                                    <li key={index}>{step}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800">
                        <strong>Medical Disclaimer:</strong> This AI prediction is intended for educational and decision-support purposes only. It should not replace a formal medical diagnosis by a qualified healthcare professional or certified radiologist.
                    </div>
                </div>
            )}
        </div>
    );
};

export default MriDetectionPage;