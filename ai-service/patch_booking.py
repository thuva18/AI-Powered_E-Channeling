filepath = r'C:\Users\ASUS\Documents\AI-Powered_E-Channeling\frontend\src\pages\PatientBookAppointment.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Lines 928-938 (0-indexed: 927-937) are the old button block
# We'll replace lines 928-938 with the new AI UI

new_lines_raw = r"""                        {/* Action Buttons Row */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleAiPredict}
                                disabled={!symptoms.trim() || aiLoading}
                                className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25 hover:from-violet-700 hover:to-purple-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {aiLoading ? (
                                    <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Analyzing...</>
                                ) : (
                                    <><Brain size={15} /> AI Suggest</>
                                )}
                            </button>
                            <button
                                onClick={() => handleSearch()}
                                disabled={!symptoms.trim() || loading}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Finding...</>
                                ) : (
                                    <><Sparkles size={15} /> Find Doctors</>
                                )}
                            </button>
                        </div>

                        {/* AI Error */}
                        {aiError && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{aiError}</p>
                            </div>
                        )}

                        {/* AI Result Card */}
                        {aiSuggestion && (
                            <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 p-5 space-y-4 animate-fade-up">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/30 shrink-0">
                                        <Brain size={18} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                                            AI Recommendation{aiSuggestion.ensembleUsed ? ' · Ensemble' : ''}
                                        </p>
                                        <h3 className="font-extrabold text-slate-900 text-lg leading-tight truncate">
                                            {aiSuggestion.predictedSpecialist}
                                        </h3>
                                    </div>
                                    {aiSuggestion.belowThreshold && (
                                        <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0">LOW CONF</span>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><TrendingUp size={11} /> Confidence</span>
                                        <span className="text-xs font-black text-violet-700">{aiSuggestion.confidence}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-700 ${
                                                aiSuggestion.confidence >= 80 ? 'bg-emerald-500' :
                                                aiSuggestion.confidence >= 60 ? 'bg-violet-500' : 'bg-amber-500'
                                            }`}
                                            style={{ width: `${Math.min(aiSuggestion.confidence, 100)}%` }}
                                        />
                                    </div>
                                    {aiSuggestion.ensembleUsed && (
                                        <p className="text-[10px] text-slate-400">
                                            LightGBM: {aiSuggestion.lgbConfidence}% · Neural Net: {aiSuggestion.nnConfidence}%
                                        </p>
                                    )}
                                </div>

                                {aiSuggestion.alternatives?.length > 1 && (
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top Matches</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {aiSuggestion.alternatives.map((alt, i) => (
                                                <span key={i} className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${
                                                    i === 0 ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                    {alt.specialist} ({alt.confidence}%)
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleSearch(aiSuggestion.predictedSpecialist)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 transition-all shadow-sm active:scale-[0.98]"
                                >
                                    <Zap size={14} /> Find {aiSuggestion.predictedSpecialist}s Now
                                </button>
                            </div>
                        )}
"""

new_lines = [line + '\n' for line in new_lines_raw.split('\n')]

# Replace lines 928-937 (1-indexed), i.e. indices 927-936 (0-indexed)
start_idx = 927   # line 928 (0-indexed)
end_idx   = 937   # line 938 (exclusive, so replace up to 937)

lines[start_idx:end_idx] = new_lines

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f"Done! File updated, new total lines: {len(lines)}")
