import React, { useState } from 'react';

const INITIAL_FORM_STATE = {
    Age: 65,
    Gender: 'Female',
    Education_Level: 14,
    BMI: 24.5,
    Physical_Activity_Level: 'Medium',
    Smoking_Status: 'Never',
    Alcohol_Consumption: 'Never',
    Diabetes: 'No',
    Hypertension: 'No',
    Cholesterol_Level: 'Normal',
    Family_History: 'Yes',
    Cognitive_Test_Score: 68,
    Depression_Level: 'Low',
    Sleep_Quality: 'Good',
    Dietary_Habits: 'Healthy',
    Air_Pollution_Exposure: 'Low',
    Employment_Status: 'Retired',
    Marital_Status: 'Married',
    Genetic_Risk_Factor: 'Yes',
    Social_Engagement_Level: 'High',
    Income_Level: 'Medium',
    Stress_Levels: 'Low',
    Urban_vs_Rural: 'Urban'
};

const ClinicalRiskPage = () => {
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const mapFormDataToEncodedPayload = (data) => {
        const encodingMap = {
            'Male': 0, 'Female': 1,
            'Low': 0, 'Medium': 1, 'High': 2,
            'Never': 0, 'Former': 1, 'Current': 2, 'Occasionally': 1, 'Regularly': 2,
            'No': 0, 'Yes': 1,
            'Normal': 0,
            'Poor': 0, 'Average': 1, 'Good': 2,
            'Unhealthy': 0, 'Healthy': 2,
            'Employed': 0, 'Unemployed': 1, 'Retired': 2,
            'Single': 0, 'Married': 1, 'Widowed': 2, 'Divorced': 3,
            'Urban': 0, 'Rural': 1
        };

        return {
            "Age": Number(data.Age),
            "Gender": encodingMap[data.Gender] ?? 0,
            "Education Level": Number(data.Education_Level),
            "BMI": Number(data.BMI),
            "Physical Activity Level": encodingMap[data.Physical_Activity_Level] ?? 1,
            "Smoking Status": encodingMap[data.Smoking_Status] ?? 0,
            "Alcohol Consumption": encodingMap[data.Alcohol_Consumption] ?? 0,
            "Diabetes": encodingMap[data.Diabetes] ?? 0,
            "Hypertension": encodingMap[data.Hypertension] ?? 0,
            "Cholesterol Level": encodingMap[data.Cholesterol_Level] ?? 0,
            "Family History of Alzheimer's": encodingMap[data.Family_History] ?? 0,
            "Cognitive Test Score": Number(data.Cognitive_Test_Score),
            "Depression Level": encodingMap[data.Depression_Level] ?? 0,
            "Sleep Quality": encodingMap[data.Sleep_Quality] ?? 2,
            "Dietary Habits": encodingMap[data.Dietary_Habits] ?? 2,
            "Air Pollution Exposure": encodingMap[data.Air_Pollution_Exposure] ?? 0,
            "Employment Status": encodingMap[data.Employment_Status] ?? 0,
            "Marital Status": encodingMap[data.Marital_Status] ?? 1,
            "Genetic Risk Factor (APOE-ε4 allele)": encodingMap[data.Genetic_Risk_Factor] ?? 0,
            "Social Engagement Level": encodingMap[data.Social_Engagement_Level] ?? 2,
            "Income Level": encodingMap[data.Income_Level] ?? 1,
            "Stress Levels": encodingMap[data.Stress_Levels] ?? 0,
            "Urban vs Rural Living": encodingMap[data.Urban_vs_Rural] ?? 0
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);

        const payload = mapFormDataToEncodedPayload(formData);

        try {
            const response = await fetch('http://localhost:8000/api/predict-risk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Risk Assessment API call failed');
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Risk prediction error:', error);
            setResult({
                status: 'error',
                message: 'Failed to communicate with AI Backend. Make sure FastAPI server is running.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div>
                <h3 className="text-2xl font-bold text-slate-900">Alzheimer's Clinical Risk Assessment Model</h3>
                <p className="text-sm text-slate-500 mt-1">
                    An AI risk assessment model predicting Alzheimer's disease diagnosis probability based on 23 demographic, lifestyle, and clinical metrics using XGBoost.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 23 INPUT FORM PANEL */}
                <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <h4 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-3">Patient Clinical Profile (23 Features)</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                            <label className="font-semibold text-slate-700">Age</label>
                            <input type="number" name="Age" value={formData.Age} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" required />
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Gender</label>
                            <select name="Gender" value={formData.Gender} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none">
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Education Level (years)</label>
                            <input type="number" name="Education_Level" value={formData.Education_Level} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" required />
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">BMI</label>
                            <input type="number" step="0.1" name="BMI" value={formData.BMI} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" required />
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Physical Activity</label>
                            <select name="Physical_Activity_Level" value={formData.Physical_Activity_Level} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Smoking Status</label>
                            <select name="Smoking_Status" value={formData.Smoking_Status} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="Never">Never</option>
                                <option value="Former">Former</option>
                                <option value="Current">Current</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Alcohol Consumption</label>
                            <select name="Alcohol_Consumption" value={formData.Alcohol_Consumption} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="Never">Never</option>
                                <option value="Occasionally">Occasionally</option>
                                <option value="Regularly">Regularly</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Diabetes</label>
                            <select name="Diabetes" value={formData.Diabetes} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Hypertension</label>
                            <select name="Hypertension" value={formData.Hypertension} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Cholesterol Level</label>
                            <select name="Cholesterol_Level" value={formData.Cholesterol_Level} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="Normal">Normal</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Family History</label>
                            <select name="Family_History" value={formData.Family_History} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Cognitive Score (30-99)</label>
                            <input type="number" name="Cognitive_Test_Score" value={formData.Cognitive_Test_Score} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" required />
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Depression Level</label>
                            <select name="Depression_Level" value={formData.Depression_Level} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Sleep Quality</label>
                            <select name="Sleep_Quality" value={formData.Sleep_Quality} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="Poor">Poor</option>
                                <option value="Average">Average</option>
                                <option value="Good">Good</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Dietary Habits</label>
                            <select name="Dietary_Habits" value={formData.Dietary_Habits} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="Unhealthy">Unhealthy</option>
                                <option value="Average">Average</option>
                                <option value="Healthy">Healthy</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Air Pollution Exposure</label>
                            <select name="Air_Pollution_Exposure" value={formData.Air_Pollution_Exposure} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Employment Status</label>
                            <select name="Employment_Status" value={formData.Employment_Status} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="Employed">Employed</option>
                                <option value="Unemployed">Unemployed</option>
                                <option value="Retired">Retired</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Marital Status</label>
                            <select name="Marital_Status" value={formData.Marital_Status} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Widowed">Widowed</option>
                                <option value="Divorced">Divorced</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">APOE-ε4 Genetic Risk</label>
                            <select name="Genetic_Risk_Factor" value={formData.Genetic_Risk_Factor} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Social Engagement</label>
                            <select name="Social_Engagement_Level" value={formData.Social_Engagement_Level} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Income Level</label>
                            <select name="Income_Level" value={formData.Income_Level} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Stress Levels</label>
                            <select name="Stress_Levels" value={formData.Stress_Levels} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-semibold text-slate-700">Living Environment</label>
                            <select name="Urban_vs_Rural" value={formData.Urban_vs_Rural} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                <option value="Urban">Urban</option>
                                <option value="Rural">Rural</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center"
                    >
                        {isLoading ? 'Calculating XGBoost Risk Assessment...' : 'Calculate Alzheimer\'s Risk Probability'}
                    </button>
                </form>

                {/* XGBOOST OUTPUT PANEL */}
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                    <div>
                        <h4 className="text-lg font-bold border-b border-slate-800 pb-4 mb-6">XGBoost Model Prediction</h4>

                        {!isLoading && !result && (
                            <p className="text-slate-400 text-sm text-center py-12">Fill out the clinical profile and submit to calculate Alzheimer's diagnosis probability.</p>
                        )}

                        {isLoading && (
                            <div className="text-center text-teal-400 py-12 space-y-3">
                                <span className="text-4xl animate-spin inline-block">⚙️</span>
                                <p className="text-sm font-medium text-slate-300">Evaluating 23 clinical pathways...</p>
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
                                    <p className="text-xs text-slate-400 uppercase font-semibold">Diagnosis Probability</p>
                                    <p className="text-4xl font-extrabold text-teal-400 mt-1">{result.risk_probability}%</p>
                                    <div className="w-full bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${result.classification === 'High Risk' ? 'bg-red-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${result.risk_probability}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-slate-300 mt-3">
                                        Classification: <span className={`font-bold ${result.classification === 'High Risk' ? 'text-red-400' : 'text-emerald-400'}`}>{result.classification}</span>
                                    </p>
                                </div>

                                {result.top_feature_contributors && result.top_feature_contributors.length > 0 && (
                                    <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 space-y-3">
                                        <p className="text-xs text-slate-400 uppercase font-semibold">Primary Risk Drivers (SHAP)</p>
                                        {result.top_feature_contributors.map((f, i) => (
                                            <div key={i} className="text-xs flex justify-between border-b border-slate-700/50 py-1">
                                                <span className="text-slate-300">{f.feature}</span>
                                                <span className="text-teal-300 font-mono">{f.impact}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-slate-500 text-center border-t border-slate-800 pt-4 mt-6">
                        XGBoost Benchmark Model (Accuracy ~73%, ROC-AUC 0.80)
                    </div>
                </div>
            </div>

            {/* DISCLAIMER */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 leading-relaxed">
                <strong>Disclaimer:</strong> This model is a machine learning demonstration using a synthetic dataset (74,000+ Kaggle patient records). It is not a diagnostic medical device and should not be used for real clinical decision-making. Predictions reflect statistical patterns in training data, not verified medical assessments.
            </div>
        </div>
    );
};

export default ClinicalRiskPage;