import { useState, useRef } from 'react';

function ScoreMeter({ score }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label =
    score >= 75
      ? 'Strong Match'
      : score >= 50
        ? 'Moderate Match'
        : 'Weak Match';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle
          cx="65"
          cy="65"
          r="54"
          fill="none"
          stroke="#1e293b"
          strokeWidth="10"
        />
        <circle
          cx="65"
          cy="65"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
        <text
          x="65"
          y="60"
          textAnchor="middle"
          fill="white"
          fontSize="26"
          fontWeight="700"
          fontFamily="'Syne', sans-serif"
        >
          {score}
        </text>
        <text
          x="65"
          y="78"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
          fontFamily="'DM Sans', sans-serif"
        >
          / 100
        </text>
      </svg>
      <span
        style={{
          color,
          fontSize: '0.85rem',
          fontWeight: '600',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Chip({ text, type }) {
  const styles = {
    match: { bg: '#052e16', color: '#4ade80', border: '#166534' },
    missing: { bg: '#2d0a0a', color: '#f87171', border: '#7f1d1d' },
    partial: { bg: '#1c1407', color: '#fbbf24', border: '#78350f' },
  };
  const s = styles[type] || styles.match;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.7rem',
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: '500',
        fontFamily: 'monospace',
        margin: '2px',
      }}
    >
      {text}
    </span>
  );
}

function Section({ title, icon, children }) {
  return (
    <div
      style={{
        background: '#0f1623',
        border: '1px solid #1e2d45',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          marginBottom: '1rem',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <h3
          style={{
            margin: 0,
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#94a3b8',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState('upload');
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analysis');
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setResumeText(ev.target.result);
    reader.readAsText(file);
  };

  const loadingMessages = [
    'Reading your resume...',
    'Parsing job requirements...',
    'Comparing skills & keywords...',
    'Calculating ATS score...',
    'Generating improvement suggestions...',
  ];

  const analyze = async () => {
    if (!resumeText.trim() || !jdText.trim()) {
      setError('Please provide both your resume and the job description.');
      return;
    }
    setError('');
    setLoading(true);
    setStep('analyze');

    let msgIdx = 0;
    setLoadingMsg(loadingMessages[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[msgIdx]);
    }, 1800);

    try {
      const prompt = `You are an expert ATS (Applicant Tracking System) and career coach. Analyze the following resume against the job description and return a detailed JSON analysis.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}

Return ONLY valid JSON (no markdown, no explanation) in this exact structure:
{
  "ats_score": <number 0-100>,
  "match_summary": "<2-3 sentence overall assessment>",
  "matched_keywords": ["keyword1", "keyword2"],
  "missing_keywords": ["keyword1", "keyword2"],
  "partial_matches": ["keyword1", "keyword2"],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2", "gap 3"],
  "rewritten_bullets": [
    { "original": "original bullet from resume", "improved": "improved version tailored to JD" },
    { "original": "another bullet", "improved": "improved version" },
    { "original": "another bullet", "improved": "improved version" }
  ],
  "cover_letter_opener": "<2-3 compelling opening sentences for a cover letter tailored to this JD>",
  "top_tip": "<single most impactful action the candidate can take>"
}`;

      // Calls local proxy server — avoids CORS
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const clean = data.text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setStep('results');
    } catch (err) {
      setError(
        'Analysis failed. Make sure the server is running: npm run server',
      );
      setStep('upload');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setResult(null);
    setResumeText('');
    setJdText('');
    setResumeFile(null);
    setError('');
    setActiveTab('analysis');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060d16; }
        textarea { resize: none; font-family: 'DM Mono', monospace; }
        textarea:focus, input:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1e2d45; border-radius: 2px; }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 0.6rem 1.2rem; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500; transition: all 0.2s; }
        .tab-btn.active { background: #1e2d45; color: #e2e8f0; }
        .tab-btn:not(.active) { color: #475569; }
        .tab-btn:not(.active):hover { color: #94a3b8; }
        .analyze-btn { background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; border: none; padding: 0.9rem 2.5rem; border-radius: 12px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; cursor: pointer; letter-spacing: 0.03em; transition: all 0.2s; }
        .analyze-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(99,102,241,0.4); }
        .analyze-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .drop-zone { border: 1.5px dashed #1e2d45; border-radius: 14px; padding: 1.5rem; text-align: center; cursor: pointer; transition: all 0.2s; }
        .drop-zone:hover { border-color: #3b82f6; background: rgba(59,130,246,0.04); }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 700px) { .grid-2 { grid-template-columns: 1fr; } }
        .bullet-card { background: #060d16; border: 1px solid #1e2d45; border-radius: 12px; padding: 1rem; margin-bottom: 0.75rem; }
        .tip-banner { background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12)); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; padding: 1rem 1.25rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: '#060d16',
          fontFamily: "'DM Sans', sans-serif",
          color: '#e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: '1px solid #0f1e2e',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}
          >
            🎯
          </div>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '1.1rem',
            }}
          >
            ResumeMatch <span style={{ color: '#3b82f6' }}>AI</span>
          </span>
          {result && (
            <button
              onClick={reset}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: '1px solid #1e2d45',
                color: '#64748b',
                padding: '0.4rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              ← New Analysis
            </button>
          )}
        </div>

        <div
          style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem' }}
        >
          {/* UPLOAD */}
          {step === 'upload' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h1
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: 'clamp(1.8rem,5vw,2.6rem)',
                    lineHeight: 1.1,
                    letterSpacing: '-0.03em',
                    marginBottom: '0.75rem',
                  }}
                >
                  Will your resume
                  <br />
                  <span
                    style={{
                      background: 'linear-gradient(90deg,#3b82f6,#a855f7)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    beat the ATS filter?
                  </span>
                </h1>
                <p
                  style={{
                    color: '#64748b',
                    fontSize: '1rem',
                    maxWidth: 480,
                    margin: '0 auto',
                  }}
                >
                  Paste your resume + job description. Get an instant match
                  score, missing keywords, and rewritten bullets.
                </p>
              </div>

              {error && (
                <div
                  style={{
                    background: '#2d0a0a',
                    border: '1px solid #7f1d1d',
                    color: '#f87171',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                  }}
                >
                  {error}
                </div>
              )}

              <div className="grid-2" style={{ marginBottom: '1rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#94a3b8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Your Resume
                  </label>
                  <div
                    className="drop-zone"
                    onClick={() => fileRef.current.click()}
                    style={{ marginBottom: '0.5rem' }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>
                      📄
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                      {resumeFile ? (
                        <span style={{ color: '#3b82f6' }}>
                          ✓ {resumeFile.name}
                        </span>
                      ) : (
                        'Click to upload .txt'
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".txt"
                      style={{ display: 'none' }}
                      onChange={handleFile}
                    />
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      color: '#334155',
                      marginBottom: '0.5rem',
                    }}
                  >
                    or paste directly
                  </div>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume text here..."
                    rows={10}
                    style={{
                      width: '100%',
                      background: '#0f1623',
                      border: '1px solid #1e2d45',
                      borderRadius: '12px',
                      color: '#cbd5e1',
                      padding: '0.875rem',
                      fontSize: '0.8rem',
                      lineHeight: 1.6,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#94a3b8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Job Description
                  </label>
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste the job description from LinkedIn, Naukri, Internshala..."
                    rows={13}
                    style={{
                      width: '100%',
                      background: '#0f1623',
                      border: '1px solid #1e2d45',
                      borderRadius: '12px',
                      color: '#cbd5e1',
                      padding: '0.875rem',
                      fontSize: '0.8rem',
                      lineHeight: 1.6,
                    }}
                  />
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button
                  className="analyze-btn"
                  onClick={analyze}
                  disabled={!resumeText.trim() || !jdText.trim()}
                >
                  Analyze Match →
                </button>
                <p
                  style={{
                    color: '#334155',
                    fontSize: '0.75rem',
                    marginTop: '0.75rem',
                  }}
                >
                  Powered by Claude Sonnet · Your data is never stored
                </p>
              </div>
            </div>
          )}

          {/* LOADING */}
          {step === 'analyze' && (
            <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
              <div
                style={{
                  position: 'relative',
                  width: 80,
                  height: 80,
                  margin: '0 auto 2rem',
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    border: '3px solid #1e2d45',
                    borderTop: '3px solid #3b82f6',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                  }}
                >
                  🤖
                </div>
              </div>
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: '1.4rem',
                  marginBottom: '0.5rem',
                }}
              >
                Analyzing your resume...
              </h2>
              <p style={{ color: '#475569', fontSize: '0.9rem' }}>
                {loadingMsg}
              </p>
            </div>
          )}

          {/* RESULTS */}
          {step === 'results' && result && (
            <div>
              <div
                style={{
                  background: '#0f1623',
                  border: '1px solid #1e2d45',
                  borderRadius: '20px',
                  padding: '2rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2rem',
                  flexWrap: 'wrap',
                }}
              >
                <ScoreMeter score={result.ats_score} />
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                    }}
                  >
                    ATS Match Analysis
                  </div>
                  <p
                    style={{
                      color: '#cbd5e1',
                      lineHeight: 1.7,
                      fontSize: '0.95rem',
                    }}
                  >
                    {result.match_summary}
                  </p>
                  {result.top_tip && (
                    <div className="tip-banner" style={{ marginTop: '1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#818cf8',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        💡 Top tip
                      </span>
                      <p
                        style={{
                          color: '#c7d2fe',
                          fontSize: '0.875rem',
                          marginTop: '0.3rem',
                          lineHeight: 1.6,
                        }}
                      >
                        {result.top_tip}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.25rem',
                  marginBottom: '1rem',
                  background: '#0a1220',
                  padding: '0.3rem',
                  borderRadius: '10px',
                  width: 'fit-content',
                }}
              >
                {[
                  ['analysis', '🔍 Analysis'],
                  ['bullets', '✏️ Rewrites'],
                  ['cover', '📝 Cover Letter'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={`tab-btn ${activeTab === id ? 'active' : ''}`}
                    onClick={() => setActiveTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === 'analysis' && (
                <div>
                  <div className="grid-2">
                    <Section title="Matched Keywords" icon="✅">
                      <div>
                        {result.matched_keywords?.map((k) => (
                          <Chip key={k} text={k} type="match" />
                        ))}
                      </div>
                    </Section>
                    <Section title="Missing Keywords" icon="❌">
                      <div>
                        {result.missing_keywords?.map((k) => (
                          <Chip key={k} text={k} type="missing" />
                        ))}
                      </div>
                    </Section>
                  </div>
                  {result.partial_matches?.length > 0 && (
                    <Section title="Partial Matches" icon="⚡">
                      <div>
                        {result.partial_matches.map((k) => (
                          <Chip key={k} text={k} type="partial" />
                        ))}
                      </div>
                    </Section>
                  )}
                  <div className="grid-2">
                    <Section title="Your Strengths" icon="💪">
                      {result.strengths?.map((s, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            gap: '0.6rem',
                            marginBottom: '0.6rem',
                            fontSize: '0.875rem',
                            color: '#94a3b8',
                            lineHeight: 1.5,
                          }}
                        >
                          <span style={{ color: '#22c55e', flexShrink: 0 }}>
                            →
                          </span>{' '}
                          {s}
                        </div>
                      ))}
                    </Section>
                    <Section title="Skill Gaps" icon="🎯">
                      {result.gaps?.map((g, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            gap: '0.6rem',
                            marginBottom: '0.6rem',
                            fontSize: '0.875rem',
                            color: '#94a3b8',
                            lineHeight: 1.5,
                          }}
                        >
                          <span style={{ color: '#f87171', flexShrink: 0 }}>
                            →
                          </span>{' '}
                          {g}
                        </div>
                      ))}
                    </Section>
                  </div>
                </div>
              )}

              {activeTab === 'bullets' && (
                <Section title="AI-Rewritten Bullet Points" icon="✏️">
                  <p
                    style={{
                      color: '#475569',
                      fontSize: '0.8rem',
                      marginBottom: '1rem',
                    }}
                  >
                    Tailored to match the job description's language and
                    keywords.
                  </p>
                  {result.rewritten_bullets?.map((b, i) => (
                    <div key={i} className="bullet-card">
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#475569',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: '0.4rem',
                        }}
                      >
                        Original
                      </div>
                      <div
                        style={{
                          color: '#64748b',
                          fontSize: '0.875rem',
                          fontFamily: 'monospace',
                          lineHeight: 1.5,
                        }}
                      >
                        {b.original}
                      </div>
                      <div
                        style={{
                          color: '#3b82f6',
                          fontSize: '0.8rem',
                          margin: '0.5rem 0',
                          textAlign: 'center',
                        }}
                      >
                        ↓ improved
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#22c55e',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: '0.4rem',
                        }}
                      >
                        Rewritten
                      </div>
                      <div
                        style={{
                          color: '#a7f3d0',
                          fontSize: '0.875rem',
                          fontFamily: 'monospace',
                          lineHeight: 1.5,
                        }}
                      >
                        {b.improved}
                      </div>
                    </div>
                  ))}
                </Section>
              )}

              {activeTab === 'cover' && (
                <Section title="Cover Letter Opener" icon="📝">
                  <p
                    style={{
                      color: '#475569',
                      fontSize: '0.8rem',
                      marginBottom: '1rem',
                    }}
                  >
                    A compelling opening tailored to this specific role.
                  </p>
                  <div
                    style={{
                      background: '#060d16',
                      border: '1px solid #1e2d45',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      fontSize: '0.925rem',
                      color: '#cbd5e1',
                      lineHeight: 1.8,
                    }}
                  >
                    "{result.cover_letter_opener}"
                  </div>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(result.cover_letter_opener)
                    }
                    style={{
                      marginTop: '0.75rem',
                      background: 'none',
                      border: '1px solid #1e2d45',
                      color: '#64748b',
                      padding: '0.4rem 1rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    Copy to clipboard
                  </button>
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
