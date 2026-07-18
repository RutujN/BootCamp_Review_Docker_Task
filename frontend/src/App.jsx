import React, { useState, useEffect, useMemo, useRef } from 'react';
import hero3dImage from './assets/hero-3d.png';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AVAILABLE_TAGS = [
  'Workload',
  'Support',
  'Complexity',
  'Pacing',
  'Clarity'
];

const WEEK_TOPICS = {
  1: 'React Fundamentals (1/2)',
  2: 'React Fundamentals (2/2)',
  3: 'Core Logic and Typescript',
  4: 'Database and Canvas',
  5: 'Data Implementation',
  6: 'Advanced Version Control & DevOps',
  7: 'Deployment Strategies'
};

const WEEK_PROJECTS = {
  1: 'Setup modern environment using Vite + React components',
  2: 'Interactive Student Analytics Dashboard & APIs fetching',
  3: 'TS Foundations, HTML5 canvas graphics & animations loop',
  4: 'Express CRUD server connection with JWT auth login system',
  5: 'Responsive Figma designs translated to pixel-perfect code',
  6: 'Isolation containerization of web apps using Dockerfiles',
  7: 'Major Project: Final full-stack automated CI/CD deployment'
};

function App() {
  // Application State
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTableTab, setActiveTableTab] = useState('foundations');
  
  // Filtering & Sorting State
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formWeek, setFormWeek] = useState('1');
  const [formReviewer, setFormReviewer] = useState('');
  const [formRating, setFormRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formReview, setFormReview] = useState('');
  const [formTags, setFormTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Advanced features state
  const [apiLogs, setApiLogs] = useState([]);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // DOM Refs for scroll controls and keyboards
  const searchInputRef = useRef(null);
  const reviewerInputRef = useRef(null);
  const dashboardRef = useRef(null);
  const curriculumRef = useRef(null);

  // Local upvotes storage
  const [votedReviews, setVotedReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('voted_reviews');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom Toast State
  const [toasts, setToasts] = useState([]);

  // Double-check Delete State
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Save upvotes
  useEffect(() => {
    localStorage.setItem('voted_reviews', JSON.stringify(votedReviews));
  }, [votedReviews]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore shortcuts if user is typing in inputs or textareas
      const activeEl = document.activeElement;
      const isInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT';

      if (isInput) {
        if (e.key === 'Escape') {
          activeEl.blur();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'n':
          e.preventDefault();
          reviewerInputRef.current?.focus();
          // Scroll to reviewer inputs
          reviewerInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        case 'escape':
          setSelectedWeek('all');
          setSelectedTags([]);
          setSearchQuery('');
          showToast('Filters cleared', 'warning');
          break;
        case '?':
          e.preventDefault();
          setShowShortcutsModal((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Advanced feature: API Fetch Interceptor Log middleware
  const logFetch = async (url, options = {}) => {
    const start = performance.now();
    const timestamp = new Date().toLocaleTimeString();
    const method = options.method || 'GET';
    const cleanUrl = url.replace(API_BASE_URL, '');

    let requestBody = '';
    if (options.body) {
      try {
        requestBody = JSON.stringify(JSON.parse(options.body), null, 2);
      } catch {
        requestBody = options.body;
      }
    }

    const logId = Math.random();
    const newLog = {
      id: logId,
      timestamp,
      method,
      url: cleanUrl,
      status: 'PENDING',
      latency: null,
      requestBody,
      responseBody: '',
      error: false
    };

    setApiLogs((prev) => [newLog, ...prev].slice(0, 30));

    try {
      const response = await fetch(url, options);
      const latency = Math.round(performance.now() - start);

      const clone = response.clone();
      let responseBody = '';
      try {
        const json = await clone.json();
        responseBody = JSON.stringify(json, null, 2);
      } catch {
        responseBody = await clone.text();
      }

      setApiLogs((prev) =>
        prev.map((log) =>
          log.id === logId
            ? { ...log, status: response.status, latency, responseBody }
            : log
        )
      );

      return response;
    } catch (err) {
      const latency = Math.round(performance.now() - start);
      setApiLogs((prev) =>
        prev.map((log) =>
          log.id === logId
            ? { ...log, status: 'FAILED', latency, responseBody: err.message, error: true }
            : log
        )
      );
      throw err;
    }
  };

  // Helper to trigger toasts
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Fetch reviews from API using logger
  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await logFetch(`${API_BASE_URL}/api/reviews`);
      if (!res.ok) throw new Error('Failed to fetch reviews.');
      const data = await res.json();
      
      const filtered = data.filter((r) => r.week >= 1 && r.week <= 7);
      setReviews(filtered);
    } catch (err) {
      console.error(err);
      setError('Could not connect to database. Ensure API server is active.');
      showToast('Database offline', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Form Tag selection toggler
  const handleTagToggle = (tag) => {
    setFormTags((prev) => 
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Tag filter toggler
  const handleFilterTagToggle = (tag) => {
    setSelectedTags((prev) => 
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formRating === 0) {
      showToast('Rating score required', 'warning');
      return;
    }
    if (formReview.trim().length < 10) {
      showToast('Comments too short', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await logFetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week: parseInt(formWeek, 10),
          reviewer: formReviewer,
          rating: formRating,
          review: formReview,
          tags: formTags
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit review.');
      }

      const newReview = await res.json();
      setReviews((prev) => [newReview, ...prev]);
      
      // Reset form
      setFormReviewer('');
      setFormRating(0);
      setFormReview('');
      setFormTags([]);
      showToast('Review published', 'success');
    } catch (err) {
      showToast(err.message || 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Upvote Click Handler
  const handleHelpfulClick = async (id) => {
    if (votedReviews.includes(id)) {
      showToast('Already voted helpful', 'warning');
      return;
    }

    try {
      const res = await logFetch(`${API_BASE_URL}/api/reviews/${id}/helpful`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Could not process vote.');
      
      const updated = await res.json();
      
      // Update UI state
      setReviews((prev) => 
        prev.map((r) => r.id === id ? { ...r, helpfulCount: updated.helpfulCount } : r)
      );
      setVotedReviews((prev) => [...prev, id]);
      showToast('Vote registered', 'success');
    } catch (err) {
      showToast('Vote failed', 'error');
    }
  };

  // Delete Review
  const handleDelete = async (id) => {
    try {
      const res = await logFetch(`${API_BASE_URL}/api/reviews/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete review.');

      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast('Review removed', 'success');
      setConfirmDeleteId(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Calculations for UI Stats ---
  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return { avg: 0, total: 0, breakdown: [0, 0, 0, 0, 0], activeWeeks: new Set(), activeTags: {} };
    }
    const total = reviews.length;
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = (sum / total).toFixed(1);

    const counts = [0, 0, 0, 0, 0];
    const activeWeeks = new Set();
    const activeTags = {};

    reviews.forEach((r) => {
      counts[r.rating - 1] += 1;
      activeWeeks.add(r.week);
      
      if (r.tags && Array.isArray(r.tags)) {
        r.tags.forEach((t) => {
          activeTags[t] = (activeTags[t] || 0) + 1;
        });
      }
    });

    return {
      avg,
      total,
      breakdown: counts.reverse(),
      activeWeeks,
      activeTags
    };
  }, [reviews]);

  // --- Sentiment Diagnostics Calculations ---
  const sentimentStats = useMemo(() => {
    const filteredList = reviews.filter((r) => {
      if (selectedWeek !== 'all' && r.week !== parseInt(selectedWeek, 10)) return false;
      if (selectedTags.length > 0 && !selectedTags.every((t) => r.tags && r.tags.includes(t))) return false;
      return true;
    });

    if (filteredList.length === 0) {
      return { score: null, label: 'No Data Available', text: 'Select a different week or clear tag filters to review cohort recommendations.', colorClass: 'neutral' };
    }

    const total = filteredList.length;
    const sum = filteredList.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / total;

    const score = Math.round((avg / 5) * 100);

    if (avg >= 4.5) {
      return {
        score,
        label: 'Optimal pacing and quality',
        text: 'Sentiment is exceptionally positive. Students report clear instructions and optimal pace. Recommended action: Share advanced docker compose configurations or deployment templates.',
        colorClass: 'excellent'
      };
    } else if (avg >= 3.8) {
      return {
        score,
        label: 'Stable cohort progress',
        text: 'General cohort progression is stable. Minor friction points highlighted around volumes or configuration flags. Recommended action: Dedicate 10 minutes of the next class to Q&A.',
        colorClass: 'steady'
      };
    } else {
      return {
        score,
        label: 'Pacing bottleneck warning',
        text: 'Low ratings and difficult pacing reported. Complexity feedback is elevated. Recommended action: Urgently schedule supplemental review hours and evaluate current task deadlines.',
        colorClass: 'warning-alert'
      };
    }
  }, [reviews, selectedWeek, selectedTags]);

  // --- Filtered and Sorted Reviews ---
  const processedReviews = useMemo(() => {
    let list = [...reviews];
    
    // Filter by Week
    if (selectedWeek !== 'all') {
      list = list.filter((r) => r.week === parseInt(selectedWeek, 10));
    }

    // Filter by Tags (And filter)
    if (selectedTags.length > 0) {
      list = list.filter((r) => 
        selectedTags.every((tag) => r.tags && r.tags.includes(tag))
      );
    }

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => 
        r.review.toLowerCase().includes(q) || 
        r.reviewer.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'helpful') {
        return (b.helpfulCount || 0) - (a.helpfulCount || 0) || new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'rating-desc') {
        return b.rating - a.rating || new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'rating-asc') {
        return a.rating - b.rating || new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    return list;
  }, [reviews, selectedWeek, selectedTags, searchQuery, sortBy]);

  // Initials and Color Hash
  const getAvatarDetails = (name) => {
    const cleanName = name ? name.trim() : 'Anonymous';
    const initials = cleanName
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
    
    const colors = [
      '#27272a', // zinc
      '#3f3f46', // slate
      '#182a24', // dark forest
      '#2d1d18', // dark clay
      '#1c2834', // slate blue
      '#22252a'  // dark charcoal
    ];
    let sum = 0;
    for (let i = 0; i < cleanName.length; i++) {
      sum += cleanName.charCodeAt(i);
    }
    const color = colors[sum % colors.length];

    return { initials, color };
  };

  // Date Formatter
  const formatDate = (isoString) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Scroll to layout sections
  const handleScrollTo = (section) => {
    setActiveTab(section);
    if (section === 'dashboard') {
      dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'curriculum') {
      curriculumRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // SVG Helper: Golden Star Component
  const StarIcon = ({ filled }) => (
    <svg 
      width="14" 
      height="14" 
      viewBox="0 0 24 24" 
      fill={filled ? "var(--accent-gold)" : "none"} 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={`star-svg ${filled ? 'filled' : 'empty'}`}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  );

  return (
    <div className="app-layout">
      {/* Background dot grid matrix */}
      <div className="grid-overlay-bg"></div>

      {/* Toast Alert System */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card ${t.type}`}>
            <span className="toast-icon">
              {t.type === 'success' && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              )}
              {t.type === 'error' && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              )}
              {t.type === 'warning' && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              )}
            </span>
            <p className="toast-message">{t.message}</p>
          </div>
        ))}
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="shortcuts-modal-overlay" onClick={() => setShowShortcutsModal(false)}>
          <div className="shortcuts-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-modal-header">
              <h3>Command Hotkeys</h3>
              <button className="close-modal-btn" onClick={() => setShowShortcutsModal(false)}>✕</button>
            </div>
            <div className="shortcuts-list">
              <div className="shortcut-row"><kbd>N</kbd> <span>Jump & Focus New Review Form</span></div>
              <div className="shortcut-row"><kbd>/</kbd> <span>Focus Search Query Filter</span></div>
              <div className="shortcut-row"><kbd>Esc</kbd> <span>Reset Active Filters / Clear Inputs</span></div>
              <div className="shortcut-row"><kbd>?</kbd> <span>Toggle Command Shortcuts Menu</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header Navigation */}
      <header className="navbar-container">
        <div className="navbar-inner">
          <div className="nav-brand" onClick={() => handleScrollTo('dashboard')}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#121214',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '11px',
              fontFamily: 'var(--font-display)'
            }}>T</div>
            <span className="brand-text">TDA SummerSchool</span>
          </div>

          <nav className="nav-links">
            <button 
              className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleScrollTo('dashboard')}
            >
              Home
            </button>
            <button 
              className={`nav-tab-btn ${activeTab === 'curriculum' ? 'active' : ''}`}
              onClick={() => handleScrollTo('curriculum')}
            >
              Curriculum Timeline
            </button>
            <button 
              className="nav-tab-btn"
              onClick={() => {
                reviewerInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                reviewerInputRef.current?.focus();
              }}
            >
              Write Review
            </button>
          </nav>

          <div className="nav-toolbar">
            <button 
              className="keyboard-shortcut-trigger"
              onClick={() => setShowShortcutsModal(true)}
              title="Show Hotkeys"
            >
              Hotkeys <kbd>?</kbd>
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable Layout Container */}
      <div className="scroll-container-folds">
        
        {/* ================= FOLD 1: MAIN DASHBOARD ================= */}
        <section ref={dashboardRef} className="scroll-fold-slide dashboard-main-fold">
          <div className="app-container">
            
            {/* Golden Hero Banner */}
            <div className="hero-banner-container">
              <div className="hero-banner-left">
                <h1 className="hero-banner-title">Bootcamp Reviews</h1>
              </div>
              <div className="hero-banner-right">
                <img src={hero3dImage} alt="3D illustration" className="hero-banner-image" />
              </div>
            </div>

            <main className="dashboard-grid">
              
              {/* Left Side: Stats and Submit Form */}
              <section className="dashboard-sidebar">
                
                {/* Overall Rating (Kraken style) */}
                <div className="kraken-rating-card">
                  <div className="kraken-header-row">
                    <div className="kraken-brand-box">
                      <div className="kraken-logo-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                      </div>
                      <span className="kraken-brand-title">TDA WEBDEV</span>
                    </div>
                    <div className="kraken-verify-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                  <div className="kraken-stats-body">
                    <div className="kraken-stars-row">
                      <div className="kraken-star-list">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <StarIcon key={s} filled={s <= Math.round(stats.avg)} />
                        ))}
                      </div>
                      <span className="kraken-rating-val">{stats.avg}</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    className="kraken-action-btn"
                    onClick={() => {
                      reviewerInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      reviewerInputRef.current?.focus();
                    }}
                  >
                    Write Review
                  </button>
                </div>

                {/* Pros and Cons Card */}
                <div className="dashboard-card">
                  <h2>Pros and Cons</h2>
                  <div className="proscons-section">
                    <div className="proscons-list">
                      <h4 className="proscons-list-title">Pros</h4>
                      <div className="pro-item">
                        <svg className="pro-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Hands-on projects & API fetching</span>
                      </div>
                      <div className="pro-item">
                        <svg className="pro-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Comprehensive Git & DevOps syllabus</span>
                      </div>
                      <div className="pro-item">
                        <svg className="pro-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Active mentor support & guidance</span>
                      </div>
                    </div>
                    <div className="proscons-list">
                      <h4 className="proscons-list-title">Cons</h4>
                      <div className="con-item">
                        <svg className="con-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span>Fast-paced curriculum & workload</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating breakdown stats panel */}
                <div className="dashboard-card stats-card">
                  <h2>Domain Statistics</h2>
                  <div className="stats-main">
                    <div className="breakdown-list">
                      {stats.breakdown.map((count, idx) => {
                        const ratingVal = 5 - idx;
                        const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                          <div key={ratingVal} className="breakdown-row">
                            <span className="row-star-num">{ratingVal}★</span>
                            <div className="progress-bar-container">
                              <div 
                                className="progress-bar-fill" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="row-count">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Week selectors */}
                  <div className="week-grid-container">
                    <h3>Filter by Curriculum Week</h3>
                    <div className="week-btn-grid">
                      <button 
                        onClick={() => setSelectedWeek('all')}
                        className={`week-grid-btn ${selectedWeek === 'all' ? 'active' : ''}`}
                      >
                        All
                      </button>
                      {[1, 2, 3, 4, 5, 6, 7].map((w) => {
                        const hasReviews = stats.activeWeeks.has(w);
                        return (
                          <button
                            key={w}
                            onClick={() => setSelectedWeek(w.toString())}
                            className={`week-grid-btn ${selectedWeek === w.toString() ? 'active' : ''} ${hasReviews ? 'has-data' : ''}`}
                          >
                            W{w}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sidebar Tag Filters */}
                  <div className="sidebar-tags-container">
                    <h3>Filter by Focus Area</h3>
                    <div className="filter-tags-flex">
                      {AVAILABLE_TAGS.map((tag) => {
                        const isActive = selectedTags.includes(tag);
                        const count = stats.activeTags[tag] || 0;
                        return (
                          <button
                            key={tag}
                            onClick={() => handleFilterTagToggle(tag)}
                            className={`filter-tag-pill ${isActive ? 'active' : ''} ${count > 0 ? 'has-count' : ''}`}
                          >
                            <span className="pill-tag-name">{tag}</span>
                            {count > 0 && <span className="pill-tag-count">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                    {selectedTags.length > 0 && (
                      <button 
                        className="clear-all-tags-btn"
                        onClick={() => setSelectedTags([])}
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Card */}
                <div className="dashboard-card form-card">
                  <h2>Submit Evaluation</h2>
                  <form onSubmit={handleSubmit} className="review-form">
                    
                    <div className="form-row">
                      <div className="form-group flex-2">
                        <label htmlFor="reviewerName">Name</label>
                        <input
                          ref={reviewerInputRef}
                          type="text"
                          id="reviewerName"
                          value={formReviewer}
                          onChange={(e) => setFormReviewer(e.target.value)}
                          placeholder="Anonymous (Press N to focus)"
                          maxLength={30}
                          disabled={submitting}
                        />
                      </div>

                      <div className="form-group flex-1">
                        <label htmlFor="weekNum">Week</label>
                        <select
                          id="weekNum"
                          value={formWeek}
                          onChange={(e) => setFormWeek(e.target.value)}
                          disabled={submitting}
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map((w) => (
                            <option key={w} value={w}>Week {w}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Topic Indicator */}
                    <div className="form-group curriculum-mapping-display">
                      <span className="curriculum-mapping-label">Curriculum Scope</span>
                      <span className="curriculum-mapping-value">{WEEK_TOPICS[formWeek]}</span>
                    </div>

                    {/* Rating star selectors */}
                    <div className="form-group">
                      <label>Rating Score</label>
                      <div className="star-rating-input">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            className={`star-btn ${(star <= (hoverRating || formRating)) ? 'filled' : ''}`}
                            onClick={() => setFormRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            disabled={submitting}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                          </button>
                        ))}
                        <span className="rating-descriptor">
                          {formRating === 5 && 'Excellent'}
                          {formRating === 4 && 'Good'}
                          {formRating === 3 && 'Adequate'}
                          {formRating === 2 && 'Poor'}
                          {formRating === 1 && 'Inadequate'}
                          {formRating === 0 && 'Unselected'}
                        </span>
                      </div>
                    </div>

                    {/* Tag selectors in Form */}
                    <div className="form-group">
                      <label>Evaluation Criteria Tags</label>
                      <div className="form-tags-selection-grid">
                        {AVAILABLE_TAGS.map((tag) => {
                          const isSelected = formTags.includes(tag);
                          return (
                            <button
                              type="button"
                              key={tag}
                              onClick={() => handleTagToggle(tag)}
                              className={`form-tag-btn-option ${isSelected ? 'selected' : ''}`}
                              disabled={submitting}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="form-group">
                      <div className="label-with-counter">
                        <label htmlFor="reviewText">Review Comments</label>
                        <span className={`char-counter ${formReview.length > 480 ? 'near-limit' : ''}`}>
                          {formReview.length}/500
                        </span>
                      </div>
                      <textarea
                        id="reviewText"
                        value={formReview}
                        onChange={(e) => setFormReview(e.target.value)}
                        placeholder="Provide details on codebase quality, assignments workload, and project pacing..."
                        rows={4}
                        maxLength={500}
                        required
                        disabled={submitting}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="submit-btn" 
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span className="button-loader">
                          <span className="spinner"></span> Processing...
                        </span>
                      ) : (
                        'Publish Evaluation'
                      )}
                    </button>
                  </form>
                </div>
              </section>

              {/* Right Side: Search and feed list */}
              <section className="dashboard-feed">
                
                {/* Search Bar / Sort bar */}
                <div className="feed-header-controls">
                  <div className="feed-title-info">
                    <h2>Cohort Feed Ledger</h2>
                    <p className="feed-summary-text">
                      Displaying {processedReviews.length} {processedReviews.length === 1 ? 'entry' : 'entries'} 
                      {selectedWeek !== 'all' && ` for Week ${selectedWeek}`}
                    </p>
                  </div>

                  <div className="feed-actions-row">
                    {/* Live Search bar */}
                    <div className="search-bar-wrapper">
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search logs... (Press / to focus)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="feed-search-input"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')} 
                          className="clear-search-btn"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      )}
                    </div>

                    {/* Sorter */}
                    <div className="filter-select-group">
                      <select 
                        id="sortFilter" 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="newest">Newest First</option>
                        <option value="helpful">Helpful Votes</option>
                        <option value="rating-desc">Highest Rated</option>
                        <option value="rating-asc">Lowest Rated</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Connection Alerts */}
                {error && (
                  <div className="error-alert-banner">
                    <span className="alert-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </span>
                    <div className="alert-message">
                      <h4>Connection Failure</h4>
                      <p>{error}</p>
                    </div>
                    <button onClick={fetchReviews} className="retry-btn">Retry Connection</button>
                  </div>
                )}

                {/* Reviews Feed */}
                {loading ? (
                  <div className="feed-loading-container">
                    <div className="large-spinner"></div>
                    <p>Accessing curriculum ledger...</p>
                  </div>
                ) : processedReviews.length === 0 ? (
                  <div className="empty-feed-card">
                    <div className="empty-icon-box">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    </div>
                    <h3>Query Returned Empty</h3>
                    <p>
                      No database logs match your selected filter matrices.
                    </p>
                    <div className="empty-state-buttons">
                      {(selectedWeek !== 'all' || selectedTags.length > 0 || searchQuery) && (
                        <button 
                          onClick={() => {
                            setSelectedWeek('all');
                            setSelectedTags([]);
                            setSearchQuery('');
                          }} 
                          className="clear-filter-btn"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="reviews-list-container">
                    {processedReviews.map((item) => {
                      const { initials, color } = getAvatarDetails(item.reviewer);
                      const isConfirmingDelete = confirmDeleteId === item.id;
                      const hasVoted = votedReviews.includes(item.id);
                      
                      return (
                        <article key={item.id} className="review-card-item">
                          <div className="card-top-row">
                            <div className="reviewer-info">
                              <div 
                                className="reviewer-avatar" 
                                style={{ backgroundColor: color }}
                              >
                                {initials}
                              </div>
                              <div className="name-date-column">
                                <h4 className="reviewer-name">{item.reviewer}</h4>
                                <span className="review-date">{formatDate(item.createdAt)}</span>
                              </div>
                            </div>

                            <div className="badge-row">
                              <span className="card-week-badge">Week {item.week}</span>
                              <div className="card-stars">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <StarIcon key={s} filled={s <= item.rating} />
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="card-body">
                            <h5 className="card-curriculum-topic">{WEEK_TOPICS[item.week]}</h5>
                            <p>{item.review}</p>
                            
                            {/* Card tags */}
                            {item.tags && item.tags.length > 0 && (
                              <div className="card-tags-list">
                                {item.tags.map((tag) => (
                                  <span 
                                    key={tag} 
                                    className="card-tag-pill"
                                    onClick={() => handleFilterTagToggle(tag)}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="card-footer">
                            {/* Upvote */}
                            <button
                              onClick={() => handleHelpfulClick(item.id)}
                              className={`helpful-btn ${hasVoted ? 'voted' : ''}`}
                              disabled={hasVoted}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill={hasVoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                              </svg>
                              <span className="helpful-text">Helpful ({item.helpfulCount || 0})</span>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (isConfirmingDelete) {
                                  handleDelete(item.id);
                                } else {
                                  setConfirmDeleteId(item.id);
                                }
                              }}
                              onMouseLeave={() => {
                                if (isConfirmingDelete) {
                                  setConfirmDeleteId(null);
                                }
                              }}
                              className={`delete-btn ${isConfirmingDelete ? 'confirm' : ''}`}
                              title="Delete record"
                            >
                              {isConfirmingDelete ? (
                                <span className="btn-text">Confirm?</span>
                              ) : (
                                <svg 
                                  className="trash-icon" 
                                  viewBox="0 0 24 24" 
                                  width="12" 
                                  height="12" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                >
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              )}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {/* Tab-driven comparison table (Bootcamp Curriculum Explorer) */}
                <div className="curriculum-tabs-table-wrapper">
                  <div className="tabs-header-container">
                    <button 
                      type="button"
                      className={`table-tab-btn ${activeTableTab === 'foundations' ? 'active' : ''}`}
                      onClick={() => setActiveTableTab('foundations')}
                    >
                      React Foundations
                    </button>
                    <button 
                      type="button"
                      className={`table-tab-btn ${activeTableTab === 'ts-canvas' ? 'active' : ''}`}
                      onClick={() => setActiveTableTab('ts-canvas')}
                    >
                      TS & Canvas
                    </button>
                    <button 
                      type="button"
                      className={`table-tab-btn ${activeTableTab === 'db-figma' ? 'active' : ''}`}
                      onClick={() => setActiveTableTab('db-figma')}
                    >
                      Databases & Figma
                    </button>
                    <button 
                      type="button"
                      className={`table-tab-btn ${activeTableTab === 'devops-deploy' ? 'active' : ''}`}
                      onClick={() => setActiveTableTab('devops-deploy')}
                    >
                      DevOps & Deploy
                    </button>
                  </div>
                  <div className="tabs-table-body">
                    {activeTableTab === 'foundations' && (
                      <table className="comparison-table">
                        <thead>
                          <tr>
                            <th>Week & Topic</th>
                            <th>Workload & Pacing</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="week-row-label">
                              <div className="week-circle-marker">1</div>
                              <span className="topic-text">{WEEK_TOPICS[1]}</span>
                            </td>
                            <td className="pacing-status">10-12 Hours (Normal)</td>
                            <td>
                              <button 
                                type="button"
                                className="table-action-btn"
                                onClick={() => {
                                  setSelectedWeek('1');
                                  showToast("Filtering Week 1 evaluations", "success");
                                  window.scrollTo({ top: 300, behavior: 'smooth' });
                                }}
                              >
                                Filter reviews
                              </button>
                            </td>
                          </tr>
                          <tr>
                            <td className="week-row-label">
                              <div className="week-circle-marker">2</div>
                              <span className="topic-text">{WEEK_TOPICS[2]}</span>
                            </td>
                            <td className="pacing-status">12-15 Hours (Moderate)</td>
                            <td>
                              <button 
                                type="button"
                                className="table-action-btn"
                                onClick={() => {
                                  setSelectedWeek('2');
                                  showToast("Filtering Week 2 evaluations", "success");
                                  window.scrollTo({ top: 300, behavior: 'smooth' });
                                }}
                              >
                                Filter reviews
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                    {activeTableTab === 'ts-canvas' && (
                      <table className="comparison-table">
                        <thead>
                          <tr>
                            <th>Week & Topic</th>
                            <th>Workload & Pacing</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="week-row-label">
                              <div className="week-circle-marker">3</div>
                              <span className="topic-text">{WEEK_TOPICS[3]}</span>
                            </td>
                            <td className="pacing-status">15+ Hours (Challenging)</td>
                            <td>
                              <button 
                                type="button"
                                className="table-action-btn"
                                onClick={() => {
                                  setSelectedWeek('3');
                                  showToast("Filtering Week 3 evaluations", "success");
                                  window.scrollTo({ top: 300, behavior: 'smooth' });
                                }}
                              >
                                Filter reviews
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                    {activeTableTab === 'db-figma' && (
                      <table className="comparison-table">
                        <thead>
                          <tr>
                            <th>Week & Topic</th>
                            <th>Workload & Pacing</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="week-row-label">
                              <div className="week-circle-marker">4</div>
                              <span className="topic-text">{WEEK_TOPICS[4]}</span>
                            </td>
                            <td className="pacing-status">15-18 Hours (Heavy)</td>
                            <td>
                              <button 
                                type="button"
                                className="table-action-btn"
                                onClick={() => {
                                  setSelectedWeek('4');
                                  showToast("Filtering Week 4 evaluations", "success");
                                  window.scrollTo({ top: 300, behavior: 'smooth' });
                                }}
                              >
                                Filter reviews
                              </button>
                            </td>
                          </tr>
                          <tr>
                            <td className="week-row-label">
                              <div className="week-circle-marker">5</div>
                              <span className="topic-text">{WEEK_TOPICS[5]}</span>
                            </td>
                            <td className="pacing-status">12-15 Hours (Moderate)</td>
                            <td>
                              <button 
                                type="button"
                                className="table-action-btn"
                                onClick={() => {
                                  setSelectedWeek('5');
                                  showToast("Filtering Week 5 evaluations", "success");
                                  window.scrollTo({ top: 300, behavior: 'smooth' });
                                }}
                              >
                                Filter reviews
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                    {activeTableTab === 'devops-deploy' && (
                      <table className="comparison-table">
                        <thead>
                          <tr>
                            <th>Week & Topic</th>
                            <th>Workload & Pacing</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="week-row-label">
                              <div className="week-circle-marker">6</div>
                              <span className="topic-text">{WEEK_TOPICS[6]}</span>
                            </td>
                            <td className="pacing-status">15+ Hours (Challenging)</td>
                            <td>
                              <button 
                                type="button"
                                className="table-action-btn"
                                onClick={() => {
                                  setSelectedWeek('6');
                                  showToast("Filtering Week 6 evaluations", "success");
                                  window.scrollTo({ top: 300, behavior: 'smooth' });
                                }}
                              >
                                Filter reviews
                              </button>
                            </td>
                          </tr>
                          <tr>
                            <td className="week-row-label">
                              <div className="week-circle-marker">7</div>
                              <span className="topic-text">{WEEK_TOPICS[7]}</span>
                            </td>
                            <td className="pacing-status">20+ Hours (Capstone Project)</td>
                            <td>
                              <button 
                                type="button"
                                className="table-action-btn"
                                onClick={() => {
                                  setSelectedWeek('7');
                                  showToast("Filtering Week 7 evaluations", "success");
                                  window.scrollTo({ top: 300, behavior: 'smooth' });
                                }}
                              >
                                Filter reviews
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </section>
            </main>
          </div>
        </section>

        {/* ================= FOLD 2: CURRICULUM TIMELINE & METRICS ================= */}
        <section ref={curriculumRef} className="scroll-fold-slide secondary-details-fold">
          <div className="app-container">
            <h2 className="fold-title">Bootcamp Curriculum Map & Analytics</h2>
            
            <div className="curriculum-layout-grid">
              
              {/* Interactive Curriculum Branches Map */}
              <div className="dashboard-card curriculum-branch-map-card">
                <h3>Curriculum Branch Timeline</h3>
                <div className="curriculum-timeline-vertical">
                  {[1, 2, 3, 4, 5, 6, 7].map((w) => {
                    const isFiltered = selectedWeek === w.toString();
                    return (
                      <div 
                        key={w} 
                        className={`timeline-week-node ${isFiltered ? 'active' : ''}`}
                        onClick={() => setSelectedWeek(selectedWeek === w.toString() ? 'all' : w.toString())}
                      >
                        <div className="node-marker">{w}</div>
                        <div className="node-details">
                          <h4>Week {w}: {WEEK_TOPICS[w]}</h4>
                          <p>{WEEK_PROJECTS[w]}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sentiment Analyzer and Analytics details */}
              <div className="sentiment-analytics-wrapper">
                <div className={`dashboard-card sentiment-analyzer-card ${sentimentStats.colorClass}`}>
                  <h2>Diagnostics Advisor</h2>
                  <div className="sentiment-header-row">
                    <span className="sentiment-label">{sentimentStats.label}</span>
                    {sentimentStats.score !== null && (
                      <span className="sentiment-score-badge">{sentimentStats.score}% Positive</span>
                    )}
                  </div>
                  <p className="sentiment-description-text">{sentimentStats.text}</p>
                </div>


              </div>
            </div>
          </div>
        </section>



      </div>
    </div>
  );
}

export default App;
