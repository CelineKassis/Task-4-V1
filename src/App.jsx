import React, { useEffect, useMemo, useRef, useState } from 'react';

const KEY = 'acl-course-pulse-v2';

// Fictional teaching records for the self-contained UI/UX exercise.
// Staff names and course descriptions are examples, not GUC historical records.
const COURSE_CATALOG = {
  CSEN701: {
    name: 'Advanced Computer Lab',
    description: 'A project-focused course emphasizing teamwork, planning, software development, and delivery across several milestones.',
    history: [
      {year: '2025/26', instructors: ['Dr. Mariam Farouk'], tas: ['Yara Hassan', 'Omar Fawzy']},
      {year: '2024/25', instructors: ['Dr. Karim Nabil'], tas: ['Nour Adel', 'Mina Sameh']},
    ],
  },
  MATH204: {
    name: 'Linear Algebra',
    description: 'Vectors, matrices, linear systems, and mathematical methods used in technical problem solving.',
    history: [
      {year: '2025/26', instructors: ['Dr. Salma Younis'], tas: ['Layla Maher', 'Ahmed Sherif']},
      {year: '2024/25', instructors: ['Dr. Rana Hamdy'], tas: ['Youssef Tarek', 'Dina Mourad']},
    ],
  },
  CSEN401: {
    name: 'Software Engineering',
    description: 'Software requirements, architecture, implementation practices, testing, and collaborative development.',
    history: [
      {year: '2025/26', instructors: ['Dr. Tamer Elsayed'], tas: ['Rana Fathy', 'Adham Khalil']},
      {year: '2024/25', instructors: ['Dr. Hala Mansour'], tas: ['Malak Samir', 'Ali Mahmoud']},
    ],
  },
  HUMA101: {
    name: 'Critical Thinking & Communication',
    description: 'A discussion-based course about assessing arguments, presenting ideas, and communicating effectively.',
    history: [
      {year: '2025/26', instructors: ['Dr. Dina Saad'], tas: ['Mariam Hossam', 'Youssef Nader']},
      {year: '2024/25', instructors: ['Dr. Reem Taha'], tas: ['Farah Amr', 'Sara Magdy']},
    ],
  },
  CSEN202: {
    name: 'Data Structures',
    description: 'Core data organization techniques and algorithms, with a focus on selecting suitable structures for different problems.',
    history: [
      {year: '2025/26', instructors: ['Dr. Amina Rashed'], tas: ['Rami Elshamy', 'Nada Wael']},
      {year: '2024/25', instructors: ['Dr. Yasser Salem'], tas: ['Hana Ehab', 'Bassel Mostafa']},
    ],
  },
};
const isKnownCourse = code => Boolean(COURSE_CATALOG[code?.trim().toUpperCase()]);
const getCourse = code => COURSE_CATALOG[code?.trim().toUpperCase()] || {
  name: 'Course details not yet added',
  description: 'This course does not have a profile in the example catalog.',
  history: [],
};
const readRoute = () => {
  const match = window.location.hash.match(/^#\/courses\/([^/?#]+)$/);
  return match ? decodeURIComponent(match[1]).toUpperCase() : null;
};
const seed = [
  {id:'r1',courseCode:'CSEN701',rating:4,comment:'A challenging team project. The weekly milestones helped.',owner:'you',name:'You',date:'2026-10-06'},
  {id:'r2',courseCode:'CSEN701',rating:5,comment:'You learn the most when your group communicates well.',owner:'other',name:'Farida',date:'2026-10-02'},
  {id:'r3',courseCode:'MATH204',rating:3,comment:'Useful material but the pace felt fast.',owner:'other',name:'Karim',date:'2026-09-28'},
  {id:'r4',courseCode:'CSEN401',rating:4,comment:'Tutorial exercises are very important.',owner:'you',name:'You',date:'2026-09-24'},
  {id:'r5',courseCode:'HUMA101',rating:5,comment:'Well organized and approachable.',owner:'other',name:'Mariam',date:'2026-09-21'},
  {id:'r6',courseCode:'CSEN701',rating:3,comment:'Good practical work, but demanding during exam week.',owner:'other',name:'Youssef',date:'2026-09-15'},
  {id:'r7',courseCode:'MATH204',rating:5,comment:'Excellent explanation of difficult concepts.',owner:'other',name:'Nadine',date:'2026-08-30'},
  {id:'r8',courseCode:'CSEN401',rating:2,comment:'More worked examples in lectures would help.',owner:'other',name:'Adam',date:'2026-08-17'},
  {id:'r9',courseCode:'CSEN202',rating:4,comment:'The assignments strengthened problem-solving skills.',owner:'other',name:'Hassan',date:'2026-08-09'},
];
function getSaved(){try {let s=JSON.parse(localStorage.getItem(KEY));return Array.isArray(s)?s:seed;}catch{return seed;}}
const avg = a => a.length?(a.reduce((s,r)=>s+r.rating,0)/a.length).toFixed(1):'—';
const sameCode = (a, b) => a.trim().toUpperCase() === b.trim().toUpperCase();
const reviewsFor = (list, code) => list.filter(r => sameCode(r.courseCode, code));
const distributionOf = list => [5,4,3,2,1].map(n => ({n, total: list.filter(r => r.rating === n).length}));
const fmtDate = d => {
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'});
};
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
const SORTS = {
  newest: (a, b) => b.date.localeCompare(a.date),
  highest: (a, b) => b.rating - a.rating || b.date.localeCompare(a.date),
  lowest: (a, b) => a.rating - b.rating || b.date.localeCompare(a.date),
};

/* ---------- Small presentational pieces ---------- */

// One star display used everywhere, so ratings always look the same.
function Stars({ value, size = 'md' }) {
  const num = Number(value);
  if (!num) return <span className="no-rating">No ratings yet</span>;
  return (
    <span className={`stars stars-${size}`} role="img" aria-label={`${num} out of 5 stars`}>
      <span className="stars-empty" aria-hidden="true">★★★★★</span>
      <span className="stars-fill" aria-hidden="true" style={{width: `${(num / 5) * 100}%`}}>★★★★★</span>
    </span>
  );
}

function RatingBars({ list, onPick }) {
  const dist = distributionOf(list);
  const total = list.length || 1;
  return (
    <ul className="rating-bars">
      {dist.map(d => {
        const pct = Math.round((d.total / total) * 100);
        const content = <>
          <span className="bar-label">{d.n} ★</span>
          <span className="bar-track"><span className="bar-fill" style={{width: `${list.length ? pct : 0}%`}} /></span>
          <span className="bar-count">{d.total}</span>
        </>;
        return <li key={d.n}>
          {onPick
            ? <button type="button" className="bar-row" onClick={() => onPick(d.n)} aria-label={`Show ${d.n}-star reviews (${d.total})`}>{content}</button>
            : <div className="bar-row" aria-label={`${d.n} stars: ${d.total}`}>{content}</div>}
        </li>;
      })}
    </ul>
  );
}

function CourseOptions() {
  return <datalist id="course-options">
    {Object.entries(COURSE_CATALOG).map(([code, c]) => <option key={code} value={code}>{c.name}</option>)}
  </datalist>;
}

/* ---------- App ---------- */

export default function App(){
  const [reviews,setReviews] = useState(getSaved);
  const [search,setSearch] = useState('');
  const [rating,setRating] = useState('all');
  const [mineOnly,setMineOnly] = useState(false);
  const [sort,setSort] = useState('newest');
  const [course,setCourse] = useState('CSEN701');
  const [editor,setEditor] = useState(null);
  const [errors,setErrors] = useState({});
  const [hoverRating,setHoverRating] = useState(0);
  const [toast,setToast] = useState(null);
  const [section,setSection] = useState('overview');
  const [pendingScroll,setPendingScroll] = useState(null);
  const [activeCourseCode,setActiveCourseCode] = useState(readRoute);

  const modalRef = useRef(null);
  const courseInputRef = useRef(null);
  const ratingRef = useRef(null);
  const returnFocusRef = useRef(null);

  /* Routing (hash based, so course pages are shareable links) */
  useEffect(()=>{
    const changePage = () => {setActiveCourseCode(readRoute());window.scrollTo({top:0,behavior:'instant'});};
    window.addEventListener('hashchange',changePage);
    return ()=>window.removeEventListener('hashchange',changePage);
  },[]);
  useEffect(()=>{
    document.title = activeCourseCode
      ? `${activeCourseCode} · ${isKnownCourse(activeCourseCode) ? getCourse(activeCourseCode).name : 'Course'} | Course Review Board`
      : 'Course Review Board | ACL UI/UX';
  },[activeCourseCode]);
  const openCourse = code => {
    const c = code.trim().toUpperCase();
    window.location.hash=`#/courses/${encodeURIComponent(c)}`;
    setActiveCourseCode(c);
    window.scrollTo({top:0,behavior:'instant'});
  };
  const goHome = where => {
    if (window.location.hash !== '#/') window.location.hash = '#/';
    setActiveCourseCode(null);
    setPendingScroll(where);
  };
  // Scroll after the home page has rendered.
  useEffect(()=>{
    if (!pendingScroll || activeCourseCode) return;
    const id = requestAnimationFrame(()=>{
      if (pendingScroll === 'overview') window.scrollTo({top:0,behavior:'smooth'});
      else document.getElementById(pendingScroll)?.scrollIntoView({behavior:'smooth', block:'start'});
      setPendingScroll(null);
    });
    return () => cancelAnimationFrame(id);
  },[pendingScroll, activeCourseCode]);

  // Highlight the nav item for the section currently on screen.
  useEffect(()=>{
    if (activeCourseCode) return;
    const ids = ['overview','courses','reviews'];
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setSection(e.target.id); });
    }, {rootMargin: '-35% 0px -60% 0px'});
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  },[activeCourseCode]);

  /* Persistence */
  useEffect(()=>localStorage.setItem(KEY,JSON.stringify(reviews)),[reviews]);

  /* Toast auto-dismiss */
  useEffect(()=>{
    if (!toast) return;
    const t = setTimeout(()=>setToast(null), 5000);
    return () => clearTimeout(t);
  },[toast]);

  /* Derived data */
  const result = useMemo(()=>reviews
    .filter(r=>(rating==='all'||r.rating===Number(rating))
      && (!mineOnly || r.owner==='you')
      && `${r.courseCode} ${r.comment} ${r.name}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort(SORTS[sort]),
  [reviews,search,rating,mineOnly,sort]);
  const filtersActive = search.trim() !== '' || rating !== 'all' || mineOnly;
  const clearFilters = () => {setSearch('');setRating('all');setMineOnly(false);};

  const selected = reviewsFor(reviews, course);
  const uniqueCourses = [...new Set(reviews.map(x=>x.courseCode.toUpperCase()))];
  const myReviews = reviews.filter(r => r.owner === 'you');

  const courseStats = useMemo(()=>{
    const codes = [...new Set([...Object.keys(COURSE_CATALOG), ...reviews.map(r => r.courseCode.toUpperCase())])];
    return codes.map(code => {
      const rs = reviewsFor(reviews, code);
      return {code, name: getCourse(code).name, known: isKnownCourse(code), average: avg(rs), count: rs.length,
        mine: rs.find(r => r.owner === 'you')};
    }).sort((a, b) => (Number(b.average) || 0) - (Number(a.average) || 0) || b.count - a.count || a.code.localeCompare(b.code));
  },[reviews]);

  /* ---------- Review editor ---------- */
  function openEditor(r, presetCode = ''){
    if(r&&r.owner!=='you')return;
    returnFocusRef.current = document.activeElement;
    const fields = {courseCode:r?.courseCode||presetCode,rating:String(r?.rating||''),comment:r?.comment||''};
    setErrors({});
    setHoverRating(0);
    setEditor({id:r?.id||null, ...fields, initial: fields});
  }
  const isDirty = ed => ed && ['courseCode','rating','comment'].some(k => ed[k] !== ed.initial[k]);
  function closeEditor(force = false){
    if (!force && isDirty(editor) && !window.confirm('Discard your unsaved review?')) return;
    setEditor(null);
    setErrors({});
    requestAnimationFrame(()=>returnFocusRef.current?.focus?.());
  }
  const updateField = (field, value) => {
    setEditor(s => ({...s, [field]: value}));
    if (errors[field]) setErrors(e => ({...e, [field]: undefined}));
  };
  const duplicateOf = ed => ed && ed.courseCode.trim()
    ? reviews.find(r=>r.id!==ed.id&&r.owner==='you'&&r.courseCode.toLowerCase()===ed.courseCode.trim().toLowerCase())
    : null;
  const duplicate = duplicateOf(editor);

  // Focus the first useful field when the dialog opens, trap Tab, close on Escape, lock page scroll.
  const editorOpen = Boolean(editor);
  useEffect(()=>{
    if (!editorOpen) return;
    requestAnimationFrame(()=>{
      if (editor?.courseCode) ratingRef.current?.querySelector('input:checked, input')?.focus();
      else courseInputRef.current?.focus();
    });
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[editorOpen]);
  useEffect(()=>{
    if (!editor) return;
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); closeEditor(); }
      if (e.key === 'Tab' && modalRef.current) {
        const items = [...modalRef.current.querySelectorAll('button, input, textarea, select')]
          .filter(el => !el.disabled && el.offsetParent !== null && !(el.type === 'radio' && !el.checked && modalRef.current.querySelector(`input[name="${el.name}"]:checked`)));
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  function submit(e){
    e.preventDefault();
    const errs = {};
    if(!editor.courseCode.trim()) errs.courseCode = 'Enter a course code, for example CSEN701.';
    else if(duplicateOf(editor)) errs.courseCode = `You have already reviewed ${editor.courseCode.trim().toUpperCase()}. You can only write one review per course.`;
    if(!/^[1-5]$/.test(editor.rating)) errs.rating = 'Choose a rating from 1 to 5 stars.';
    if (Object.keys(errs).length) {
      setErrors(errs);
      if (errs.courseCode) courseInputRef.current?.focus();
      else ratingRef.current?.querySelector('input')?.focus();
      return;
    }
    const payload={courseCode:editor.courseCode.trim().toUpperCase(),rating:Number(editor.rating),comment:editor.comment.trim(),name:'You',owner:'you',date:new Date().toISOString().slice(0,10)};
    if(editor.id){
      setReviews(reviews.map(r=>r.id===editor.id?{...r,...payload}:r));
      setToast({text:`Your review of ${payload.courseCode} was updated.`, code: payload.courseCode});
    } else {
      setReviews([{...payload,id:'r-'+Date.now()},...reviews]);
      setToast({text:`Thanks! Your review of ${payload.courseCode} is posted.`, code: payload.courseCode});
    }
    closeEditor(true);
  }

  function reset(){
    if (!window.confirm('Restore the example reviews? Any reviews you added or edited will be lost.')) return;
    setReviews(seed);setSearch('');setRating('all');setMineOnly(false);setSort('newest');setCourse('CSEN701');setEditor(null);
    setToast({text:'Example data restored.'});
  }

  const copyLink = () => {
    const url = window.location.href;
    const done = () => setToast({text:'Link copied. Paste it anywhere to share this course page.'});
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done, () => setToast({text:`Copy this link: ${url}`}));
    else setToast({text:`Copy this link: ${url}`});
  };

  const showMyReviews = () => {setMineOnly(true);setSearch('');setRating('all');goHome('reviews');};
  const filterByStars = n => {setRating(String(n));goHome('reviews');};

  /* ---------- Views ---------- */

  const ReviewCard = ({ r, showCourse = true }) => (
    <li className={`review-card${r.owner==='you' ? ' is-mine' : ''}`}>
      <div className="review-card-top">
        {showCourse
          ? <button type="button" className="course-link" onClick={()=>openCourse(r.courseCode)}>
              <span className="code-chip">{r.courseCode}</span>
              <span className="course-link-name">{getCourse(r.courseCode).name}</span>
            </button>
          : <span className="reviewer-name">{r.name}{r.owner==='you' && <span className="you-badge">Your review</span>}</span>}
        <Stars value={r.rating} />
      </div>
      <p className={`review-comment${r.comment ? '' : ' is-empty'}`}>{r.comment || 'No comment provided.'}</p>
      <div className="review-card-meta">
        <span>
          {showCourse && <><span className="reviewer-name">{r.name}</span>{r.owner==='you' && <span className="you-badge">Your review</span>}<span aria-hidden="true"> · </span></>}
          <time dateTime={r.date}>{fmtDate(r.date)}</time>
        </span>
        {r.owner==='you' && <button type="button" className="btn btn-ghost btn-sm" onClick={()=>openEditor(r)} aria-label={`Edit your review of ${r.courseCode}`}>✎ Edit</button>}
      </div>
    </li>
  );

  const renderCoursePage = () => {
    const code = activeCourseCode;
    const known = isKnownCourse(code);
    const info = getCourse(code);
    const list = reviewsFor(reviews, code).sort(SORTS.newest);
    const mine = list.find(r => r.owner === 'you');
    const average = avg(list);
    return (
      <div className="page course-page">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <button type="button" onClick={()=>goHome('overview')}>Home</button><span aria-hidden="true">/</span>
          <button type="button" onClick={()=>goHome('courses')}>Courses</button><span aria-hidden="true">/</span>
          <span aria-current="page">{code}</span>
        </nav>

        <header className="card course-hero">
          <div className="course-hero-main">
            <span className="code-chip code-chip-lg">{code}</span>
            <h1>{known ? info.name : code}</h1>
            {!known && <p className="placeholder-note"><strong>{info.name}</strong></p>}
            <p className="course-description">{info.description}</p>
            <div className="hero-actions">
              {mine
                ? <button type="button" className="btn btn-primary" onClick={()=>openEditor(mine)}>✎ Edit your review</button>
                : <button type="button" className="btn btn-primary" onClick={()=>openEditor(null, code)}>＋ Review this course</button>}
              <button type="button" className="btn btn-secondary" onClick={copyLink}>🔗 Copy link</button>
            </div>
          </div>
          <div className="score-box" aria-label="Course average">
            <span className="label">Course average</span>
            <strong className="score-num">{average}{average !== '—' && <small> / 5</small>}</strong>
            <Stars value={average} />
            <span className="muted">{plural(list.length, 'review')}</span>
          </div>
        </header>

        <div className="course-grid">
          <section className="card" aria-labelledby="history-title">
            <h2 id="history-title">Teaching history</h2>
            <p className="section-sub">Instructors and teaching assistants for the previous two academic years.</p>
            {info.history.length ? <div className="history-list">
              {info.history.map(entry => <div className="history-entry" key={entry.year}>
                <h3>{entry.year}</h3>
                <dl>
                  <dt>{entry.instructors.length === 1 ? 'Instructor' : 'Instructors'}</dt><dd>{entry.instructors.join(', ')}</dd>
                  <dt>Teaching assistants</dt><dd>{entry.tas.join(', ')}</dd>
                </dl>
              </div>)}
            </div> : <p className="empty-inline">No example teaching records for this course.</p>}
            <p className="disclaimer">Illustrative course and teaching records; staff names are fictional.</p>
          </section>

          <section className="card" aria-labelledby="course-reviews-title">
            <div className="section-head">
              <div>
                <h2 id="course-reviews-title">Student reviews</h2>
                <p className="section-sub">What students said about {code}, newest first.</p>
              </div>
            </div>
            {list.length > 0 && <RatingBars list={list} />}
            {list.length ? <ul className="review-list">{list.map(r => <ReviewCard key={r.id} r={r} showCourse={false} />)}</ul>
              : <div className="empty-state">
                  <p><strong>No reviews for this course yet.</strong></p>
                  <p className="muted">Taken {code}? Your review helps the next student decide.</p>
                  <button type="button" className="btn btn-primary" onClick={()=>openEditor(null, code)}>Write the first review</button>
                </div>}
          </section>
        </div>
      </div>
    );
  };

  const lookupCode = course.trim().toUpperCase();
  const renderHome = () => (
    <div className="page">
      <section id="overview" className="intro" aria-labelledby="page-title">
        <div>
          <h1 id="page-title">Course Review Board</h1>
          <p className="lead">Compare courses, read what other students said, and share your own experience.</p>
        </div>
        <button type="button" className="btn btn-primary btn-lg" onClick={()=>openEditor(null)}>＋ Write a review</button>
      </section>

      <section className="metrics" aria-label="Overview statistics">
        <div className="metric"><span className="label">Total reviews</span><strong>{reviews.length}</strong></div>
        <div className="metric"><span className="label">Average score</span><strong>{avg(reviews)}<small> / 5</small></strong></div>
        <div className="metric"><span className="label">Courses rated</span><strong>{uniqueCourses.length}</strong></div>
        <div className="metric"><span className="label">Your reviews</span><strong>{myReviews.length}</strong>
          {myReviews.length > 0 && <button type="button" className="link" onClick={showMyReviews}>View yours</button>}</div>
      </section>

      <section id="courses" className="section" aria-labelledby="courses-title">
        <div className="section-head">
          <div>
            <h2 id="courses-title">Compare courses</h2>
            <p className="section-sub">Sorted by average rating. Open a course to see its staff history and every review.</p>
          </div>
        </div>
        <ul className="course-cards">
          {courseStats.map(c => <li key={c.code} className="card course-card">
            <div className="course-card-head">
              <span className="code-chip">{c.code}</span>
              {c.mine && <span className="you-badge">You reviewed</span>}
            </div>
            <h3>{c.known ? c.name : c.code}</h3>
            <div className="course-card-score">
              <strong>{c.average}</strong>
              <div><Stars value={c.average} size="sm" /><span className="muted">{plural(c.count, 'review')}</span></div>
            </div>
            <button type="button" className="btn btn-secondary btn-block" onClick={()=>openCourse(c.code)} aria-label={`View ${c.code} details and reviews`}>View course →</button>
          </li>)}
        </ul>
      </section>

      <div className="two-col">
        <section className="card" aria-labelledby="dist-title">
          <h2 id="dist-title">Rating distribution</h2>
          <p className="section-sub">All {plural(reviews.length, 'review')}. Select a row to see those reviews.</p>
          <div className="dist-body">
            <div className="dist-avg">
              <strong className="score-num">{avg(reviews)}</strong>
              <Stars value={avg(reviews)} />
              <span className="muted">overall average</span>
            </div>
            <RatingBars list={reviews} onPick={filterByStars} />
          </div>
        </section>

        <section className="card" aria-labelledby="lookup-title">
          <h2 id="lookup-title">Course score lookup</h2>
          <p className="section-sub">Type any course code to see its average rating.</p>
          <label className="field">
            <span className="field-label">Course code</span>
            <input className="input" list="course-options" value={course} onChange={e=>setCourse(e.target.value)} placeholder="e.g. CSEN701" autoComplete="off" />
          </label>
          {lookupCode ? <div className="lookup-result" aria-live="polite">
            <div>
              <span className="lookup-name">{isKnownCourse(lookupCode) ? getCourse(lookupCode).name : lookupCode}</span>
              {selected.length
                ? <div className="lookup-score"><strong>{avg(selected)}</strong><Stars value={avg(selected)} size="sm" /><span className="muted">{plural(selected.length, 'review')}</span></div>
                : <p className="muted">No reviews for this code yet.</p>}
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={()=>openCourse(lookupCode)}>View course details →</button>
          </div> : <p className="muted lookup-hint">Start typing to pick from the course list.</p>}
        </section>
      </div>

      <section id="reviews" className="card section" aria-labelledby="reviews-title">
        <div className="section-head">
          <div>
            <h2 id="reviews-title">Student reviews</h2>
            <p className="section-sub">Search across course codes, comments and reviewer names.</p>
          </div>
        </div>
        <div className="filters" role="search">
          <label className="field field-grow">
            <span className="field-label">Search</span>
            <span className="search-wrap">
              <span aria-hidden="true" className="search-icon">⌕</span>
              <input className="input" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Course code, comment or reviewer name" />
            </span>
          </label>
          <label className="field">
            <span className="field-label">Rating</span>
            <select className="input" value={rating} onChange={e=>setRating(e.target.value)}>
              <option value="all">All ratings</option>
              {[5,4,3,2,1].map(n=><option key={n} value={n}>{n} {n===1?'star':'stars'}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Sort by</span>
            <select className="input" value={sort} onChange={e=>setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={mineOnly} onChange={e=>setMineOnly(e.target.checked)} />
            <span>Only my reviews</span>
          </label>
        </div>
        <div className="results-bar" aria-live="polite">
          <span>Showing <strong>{result.length}</strong> of {plural(reviews.length, 'review')}</span>
          {filtersActive && <button type="button" className="link" onClick={clearFilters}>Clear filters</button>}
        </div>
        {result.length
          ? <ul className="review-list">{result.map(r => <ReviewCard key={r.id} r={r} />)}</ul>
          : <div className="empty-state">
              <p><strong>No reviews match your filters.</strong></p>
              <p className="muted">Try a different search term or rating.</p>
              <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>
            </div>}
      </section>
    </div>
  );

  const navItem = (id, label, onClick, active) => (
    <button type="button" className={`nav-link${active ? ' active' : ''}`} aria-current={active ? 'true' : undefined} onClick={onClick}>{label}</button>
  );

  return <div className="app">
    <a className="skip-link" href="#main" onClick={e=>{e.preventDefault();document.getElementById('main')?.focus();}}>Skip to content</a>
    <header className="topbar">
      <div className="topbar-inner">
        <button type="button" className="brand" onClick={()=>goHome('overview')} aria-label="Course Review Board home">
          <span className="brand-mark" aria-hidden="true">✦</span> course<span>pulse</span>
        </button>
        <nav className="nav" aria-label="Main">
          {navItem('overview','Overview',()=>goHome('overview'), !activeCourseCode && section==='overview')}
          {navItem('courses','Courses',()=>goHome('courses'), Boolean(activeCourseCode) || section==='courses')}
          {navItem('reviews','Reviews',()=>{setMineOnly(false);goHome('reviews');}, !activeCourseCode && section==='reviews' && !mineOnly)}
          {navItem('mine','My reviews',showMyReviews, !activeCourseCode && section==='reviews' && mineOnly)}
        </nav>
        <button type="button" className="btn btn-primary topbar-cta" aria-label="Write a review" onClick={()=>openEditor(null, activeCourseCode && !reviewsFor(reviews, activeCourseCode).some(r=>r.owner==='you') ? activeCourseCode : '')}>
          ＋ <span className="cta-text">Write a review</span>
        </button>
      </div>
    </header>

    <main id="main" tabIndex={-1} className="main">
      {activeCourseCode ? renderCoursePage() : renderHome()}
    </main>

    <footer className="footer">
      <p>Demo data is saved in this browser only.</p>
      <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>↺ Reset demo</button>
    </footer>

    <CourseOptions />

    {toast && <div className="toast" role="status">
      <span>✓ {toast.text}</span>
      {toast.code && toast.code !== activeCourseCode && <button type="button" className="toast-action" onClick={()=>{openCourse(toast.code);setToast(null);}}>View course</button>}
      <button type="button" className="toast-close" onClick={()=>setToast(null)} aria-label="Dismiss notification">✕</button>
    </div>}

    {editor&&<div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&closeEditor()}>
      <div className="modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div className="modal-head">
          <div>
            <h2 id="editor-title">{editor.id ? `Edit your review of ${editor.initial.courseCode}` : 'Write a review'}</h2>
            <p className="muted">Fields marked * are required.</p>
          </div>
          <button type="button" className="icon-btn" onClick={()=>closeEditor()} aria-label="Close">✕</button>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="field">
            <label className="field-label" htmlFor="f-course">Course code *</label>
            <input id="f-course" ref={courseInputRef} className={`input${errors.courseCode ? ' has-error' : ''}`} list="course-options"
              value={editor.courseCode} onChange={e=>updateField('courseCode', e.target.value)} placeholder="e.g. CSEN401" autoComplete="off"
              aria-invalid={Boolean(errors.courseCode)} aria-describedby="f-course-help" />
            <div id="f-course-help" className="field-help" aria-live="polite">
              {errors.courseCode
                ? <span className="error-text">{errors.courseCode}{duplicate && <> <button type="button" className="link" onClick={()=>openEditor(duplicate)}>Edit that review instead</button></>}</span>
                : duplicate
                  ? <span className="warn-text">You already reviewed {duplicate.courseCode}. <button type="button" className="link" onClick={()=>openEditor(duplicate)}>Edit that review instead</button></span>
                  : editor.courseCode.trim()
                    ? isKnownCourse(editor.courseCode)
                      ? <span className="ok-text">✓ {getCourse(editor.courseCode).name}</span>
                      : <span className="muted">Not in the course list. Your review will still be saved.</span>
                    : <span className="muted">Pick from the list or type a code.</span>}
            </div>
          </div>

          <fieldset className="field" ref={ratingRef} aria-describedby="f-rating-help" aria-invalid={Boolean(errors.rating)}>
            <legend className="field-label">Your rating *</legend>
            <div className="star-input" onMouseLeave={()=>setHoverRating(0)}>
              {[1,2,3,4,5].map(n => {
                const lit = n <= (hoverRating || Number(editor.rating));
                return <label key={n} className={`star-option${lit ? ' lit' : ''}`} onMouseEnter={()=>setHoverRating(n)}>
                  <input type="radio" name="rating" value={n} checked={editor.rating===String(n)} onChange={()=>updateField('rating', String(n))} />
                  <span aria-hidden="true">★</span>
                  <span className="sr-only">{n} {n===1?'star':'stars'}, {RATING_WORDS[n]}</span>
                </label>;
              })}
              <span className="star-word" aria-hidden="true">{RATING_WORDS[hoverRating || Number(editor.rating)] || 'Select 1–5 stars'}</span>
            </div>
            <div id="f-rating-help" className="field-help">{errors.rating && <span className="error-text">{errors.rating}</span>}</div>
          </fieldset>

          <div className="field">
            <label className="field-label" htmlFor="f-comment">Comment <span className="muted">(optional)</span></label>
            <textarea id="f-comment" className="input" value={editor.comment} rows={4}
              onChange={e=>updateField('comment', e.target.value)} placeholder="What should other students know? e.g. workload, teaching, exams." />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={()=>closeEditor()}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editor.id?'Save changes':'Post review'}</button>
          </div>
        </form>
      </div>
    </div>}
  </div>;
}