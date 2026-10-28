import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  BarChart3,
  History,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Star,
  Layers,
  ArrowRight,
  Trash2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { SAMPLE_REVIEWS } from './sampleReviews';

export default function App() {
  // Form state
  const [reviewText, setReviewText] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [productName, setProductName] = useState('');
  const [starRating, setStarRating] = useState(5);

  // App & Request state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [serverHealth, setServerHealth] = useState(null);

  // History & Statistics state (stored in frontend memory only)
  const [history, setHistory] = useState([]);

  // Calculated session stats
  const totalAnalyzed = history.length;
  const fakeCount = history.filter(item => item.prediction === 'FAKE').length;
  const genuineCount = history.filter(item => item.prediction === 'GENUINE').length;

  // Check backend health on mount and periodically
  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerHealth(data);
      } else {
        setServerHealth({ status: 'offline', error: 'HTTP error ' + res.status });
      }
    } catch (err) {
      setServerHealth({ status: 'offline', error: err.message });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!reviewText.trim() || reviewText.trim().length < 3) {
      setError('Please provide at least 3 characters of review text to analyze.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const payload = {
      review_text: reviewText.trim(),
      review_title: reviewTitle.trim() || null,
      product_name: productName.trim() || null,
      star_rating: starRating ? Number(starRating) : null,
    };

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);

      // Add to session history
      const historyItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        title: reviewTitle.trim() || (productName.trim() ? `${productName.trim()} review` : 'Product Review'),
        preview: reviewText.slice(0, 110) + (reviewText.length > 110 ? '...' : ''),
        fullText: reviewText,
        fullTitle: reviewTitle,
        fullProduct: productName,
        starRating,
        ...data,
      };

      setHistory(prev => [historyItem, ...prev]);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Failed to reach ReviewGuard backend service. Is the Python server running?');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = (sample) => {
    setReviewTitle(sample.title);
    setReviewText(sample.text);
    setProductName(sample.product);
    setStarRating(sample.rating);
    setError(null);
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  const clearForm = () => {
    setReviewText('');
    setReviewTitle('');
    setProductName('');
    setStarRating(5);
    setResult(null);
    setError(null);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">ReviewGuard</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-sky-100 text-sky-700 rounded-full">AI</span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-none">Fake Product Review Detection System</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Backend Health Pill */}
            <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full border bg-slate-50">
              <span className={`w-2 h-2 rounded-full ${serverHealth?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="font-medium text-slate-600 hidden sm:inline">
                {serverHealth?.status === 'healthy' ? 'Model Engine Ready' : 'Backend Disconnected'}
              </span>
              <button 
                onClick={checkHealth} 
                title="Refresh API Connection" 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="hidden md:flex items-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
              <Layers className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
              <span>TF-IDF + Logistic Regression</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero & Description */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Natural Language Processing • Trained Classifier</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Instantly Inspect & Verify E-Commerce Product Reviews
            </h1>
            <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
              ReviewGuard AI analyzes syntactic patterns, vocabulary choices, and linguistic confidence using your pre-trained TF-IDF vectorizer and logistic regression classifier to estimate whether a product review is authentic or fraudulent.
            </p>
          </div>

          {/* Session Statistics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Reviews Analyzed</p>
                <p className="text-xl font-bold text-slate-900">{totalAnalyzed}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-100/70">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-700">Genuine Detected</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-xl font-bold text-emerald-800">{genuineCount}</p>
                  {totalAnalyzed > 0 && (
                    <span className="text-xs font-medium text-emerald-600">
                      ({Math.round((genuineCount / totalAnalyzed) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 rounded-xl bg-rose-50/70 border border-rose-100/70">
              <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-rose-700">Fake Flagged</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-xl font-bold text-rose-800">{fakeCount}</p>
                  {totalAnalyzed > 0 && (
                    <span className="text-xs font-medium text-rose-600">
                      ({Math.round((fakeCount / totalAnalyzed) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clickable Sample Reviews */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
              <span>Quick Test Samples</span>
              <span className="text-xs font-normal normal-case text-slate-400">(Click to load into editor)</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {SAMPLE_REVIEWS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => loadSample(sample)}
                className="text-left bg-white p-4 rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      sample.tag === 'Genuine' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      Target: {sample.tag}
                    </span>
                    <span className="text-xs text-amber-500 font-semibold flex items-center">
                      ★ {sample.rating}
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs text-slate-900 group-hover:text-sky-600 line-clamp-1">
                    {sample.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {sample.text}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-sky-600 font-medium">
                  <span>Load Sample</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Input Form & Real-Time Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Input Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>Review Inspection Form</span>
              </h2>
              <button
                type="button"
                onClick={clearForm}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
              >
                Clear Form
              </button>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800 text-sm animate-in fade-in">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Input or Server Error</p>
                  <p className="text-rose-700 text-xs mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAnalyze} className="space-y-4">
              {/* Product Name & Star Rating (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="product-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="product-name"
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Wireless Ergonomic Keyboard"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="star-rating" className="block text-xs font-semibold text-slate-700 mb-1">
                    Rating <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    id="star-rating"
                    value={starRating}
                    onChange={(e) => setStarRating(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition bg-white"
                  >
                    <option value="5">★★★★★ (5 Stars)</option>
                    <option value="4">★★★★☆ (4 Stars)</option>
                    <option value="3">★★★☆☆ (3 Stars)</option>
                    <option value="2">★★☆☆☆ (2 Stars)</option>
                    <option value="1">★☆☆☆☆ (1 Star)</option>
                  </select>
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label htmlFor="review-title" className="block text-xs font-semibold text-slate-700 mb-1">
                  Review Title <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="review-title"
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Exactly as described, sturdy build"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>

              {/* Review Text (Required) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="review-text" className="block text-xs font-semibold text-slate-700">
                    Review Text <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {reviewText.trim().split(/\s+/).filter(Boolean).length} words • {reviewText.length} characters
                  </span>
                </div>
                <textarea
                  id="review-text"
                  rows={6}
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Paste or write the customer review here to analyze with the machine learning model..."
                  className="w-full p-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition leading-relaxed resize-y"
                />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !reviewText.trim()}
                  className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
                    isLoading || !reviewText.trim()
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10 active:scale-[0.99]'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                      <span>Computing TF-IDF & Logistic Classifier...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span>Analyze Review Authenticity</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Prediction Result (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {result ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6 animate-in fade-in">
                {/* Result Status Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Verdict</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Threshold: {result.threshold_used}
                  </span>
                </div>

                {/* Primary Card Badge */}
                <div className={`p-5 rounded-2xl border flex items-center space-x-4 ${
                  result.prediction === 'GENUINE'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                    result.prediction === 'GENUINE'
                      ? 'bg-emerald-500 text-white shadow-emerald-600/30'
                      : 'bg-rose-500 text-white shadow-rose-600/30'
                  }`}>
                    {result.prediction === 'GENUINE' ? (
                      <ShieldCheck className="w-8 h-8" />
                    ) : (
                      <ShieldAlert className="w-8 h-8" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-black tracking-tight">{result.prediction}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        result.prediction === 'GENUINE'
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-rose-200 text-rose-800'
                      }`}>
                        Class {result.label}
                      </span>
                    </div>
                    <p className="text-xs font-medium opacity-85 mt-0.5">
                      {result.prediction === 'GENUINE'
                        ? 'Natural language markers indicate authentic customer feedback.'
                        : 'Linguistic patterns match incentivized or artificial review signatures.'}
                    </p>
                  </div>
                </div>

                {/* Probabilities and Progress Bars */}
                <div className="space-y-4 pt-1">
                  {/* Genuine Progress */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                      <span className="text-slate-700 flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <span>Genuine Probability</span>
                      </span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {(result.genuine_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-3 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(100, Math.max(0, result.genuine_probability * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Fake Progress */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                      <span className="text-slate-700 flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                        <span>Fake Probability</span>
                      </span>
                      <span className="font-mono text-rose-700 font-bold">
                        {(result.fake_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-rose-500 h-3 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(100, Math.max(0, result.fake_probability * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Confidence Metric & Model Info */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-medium text-slate-500">Confidence</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{result.confidence}%</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-medium text-slate-500">Classifier Architecture</p>
                    <p className="text-xs font-bold text-slate-800 truncate mt-1" title={result.model_name}>
                      Logistic Regression
                    </p>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start space-x-2.5 text-xs text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong className="font-semibold">Disclaimer:</strong> Predictions are statistical estimates generated by a trained NLP classifier, not absolute proof of fraud or authenticity. Always verify with cross-platform purchase records.
                  </p>
                </div>
              </div>
            ) : (
              /* Empty state before running analysis */
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[360px] text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-700 text-sm">Awaiting Review Input</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                  Enter a product review or pick one of the quick test samples above to generate real-time authenticity classification.
                </p>
                <div className="mt-4 text-[11px] text-sky-600 font-medium flex items-center space-x-1">
                  <span>Pre-trained Scikit-Learn model active</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Session History (stored in frontend memory only) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-bold text-slate-900">Session Analysis History</h2>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                {history.length}
              </span>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center space-x-1 font-medium transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Session</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-xs">No reviews analyzed in this browser session yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">All analyses in this session are kept in browser memory and reset upon reload.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-2.5">Time</th>
                    <th className="pb-2.5">Title / Product</th>
                    <th className="pb-2.5">Review Preview</th>
                    <th className="pb-2.5">Verdict</th>
                    <th className="pb-2.5">Genuine %</th>
                    <th className="pb-2.5">Confidence</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {item.timestamp}
                      </td>
                      <td className="py-3 font-semibold text-slate-800 max-w-[160px] truncate">
                        {item.title}
                      </td>
                      <td className="py-3 text-slate-500 max-w-[280px] truncate">
                        {item.preview}
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          item.prediction === 'GENUINE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.prediction}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-700 whitespace-nowrap">
                        {(item.genuine_probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 font-semibold text-slate-800 whitespace-nowrap">
                        {item.confidence}%
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setReviewText(item.fullText);
                            setReviewTitle(item.fullTitle || '');
                            setProductName(item.fullProduct || '');
                            setStarRating(item.starRating || 5);
                            setResult(item);
                            window.scrollTo({ top: 320, behavior: 'smooth' });
                          }}
                          className="text-sky-600 hover:text-sky-800 font-medium text-xs underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} ReviewGuard AI — Pre-trained NLP Classification System</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Offline ML Architecture</span>
            </span>
            <span>•</span>
            <span>No Cloud Database Required</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
