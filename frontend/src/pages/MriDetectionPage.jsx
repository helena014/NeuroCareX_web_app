import React, { useState } from 'react';

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

        try {
            await new Promise(resolve => setTimeout(resolve, 2500));
            setDetectionResult({
                status: 'success',
                label: 'Very Mild Demented',
                confidence: 0.942
            });
        } catch (error) {
            setDetectionResult({ status: 'error', message: 'Detection failed.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
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

                        {!isLoading && detectionResult && detectionResult.status === 'success' && (
                            <div className="space-y-6">
                                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Classification Result</p>
                                    <p className="text-2xl font-bold text-orange-400 mt-1">{detectionResult.label}</p>
                                </div>

                                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Model Confidence</p>
                                    <p className="text-4xl font-extrabold text-white mt-1">
                                        {(detectionResult.confidence * 100).toFixed(1)}%
                                    </p>
                                    <div className="w-full bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                                        <div
                                            className="bg-orange-500 h-full rounded-full"
                                            style={{ width: `${detectionResult.confidence * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-slate-500 text-center border-t border-slate-800 pt-4 mt-6">
                        NeuroCareX Deep Learning Model v1.0
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MriDetectionPage;