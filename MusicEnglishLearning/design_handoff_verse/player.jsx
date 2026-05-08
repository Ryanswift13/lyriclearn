// Now Playing screen — album, lyrics, controls.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

function formatTime(s) {
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

// Parse a lyric line into tokens (words + punctuation)
function tokenize(line) {
  const out = [];
  const re = /([A-Za-z']+)|([^A-Za-z']+)/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    if (m[1]) out.push({ type: "word", text: m[1] });
    else out.push({ type: "sep", text: m[2] });
  }
  return out;
}

function lookupWord(raw) {
  const k = raw.toLowerCase().replace(/[^a-z']/g, "");
  if (window.GLOSSARY[k]) return window.GLOSSARY[k];
  // try singular -s
  if (k.endsWith("s") && window.GLOSSARY[k.slice(0, -1)]) return window.GLOSSARY[k.slice(0, -1)];
  return null;
}

function AlbumArt({ song, playing, big }) {
  // Big circular album with rotating gradient + concentric vinyl grooves
  const size = big ? 380 : 64;
  return (
    <div className={`album-art ${playing ? "spinning" : ""}`} style={{ width: size, height: size }}>
      <div
        className="album-disc"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${song.color} 0%, ${song.color2} 70%, #1a1a1a 100%)`,
        }}
      >
        <div className="album-grooves" aria-hidden="true"></div>
        <div className="album-label" style={{ background: song.color2 }}>
          <div className="album-label-inner"></div>
        </div>
      </div>
    </div>
  );
}

function Controls({ playing, setPlaying, time, setTime, duration, onPrev, onNext }) {
  const barRef = useRef(null);
  const onScrub = (e) => {
    const r = barRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    setTime(Math.max(0, Math.min(duration, x * duration)));
  };
  const [drag, setDrag] = useState(false);
  useEffect(() => {
    if (!drag) return;
    const move = (e) => onScrub(e);
    const up = () => setDrag(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [drag]);

  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div className="controls">
      <div
        className="scrubber"
        ref={barRef}
        onMouseDown={(e) => {
          setDrag(true);
          onScrub(e);
        }}
      >
        <div className="scrub-track">
          <div className="scrub-fill" style={{ width: `${pct}%` }}></div>
          <div className="scrub-thumb" style={{ left: `${pct}%` }}></div>
        </div>
        <div className="scrub-times">
          <span>{formatTime(time)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <div className="control-row">
        <button className="ctl ctl-sm" onClick={onPrev} aria-label="Previous">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="19 20 9 12 19 4 19 20" fill="currentColor"></polygon>
            <line x1="5" y1="19" x2="5" y2="5"></line>
          </svg>
        </button>
        <button className="ctl ctl-lg" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"}>
          {playing ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1"></rect>
              <rect x="14" y="5" width="4" height="14" rx="1"></rect>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 5 L19 12 L7 19 Z"></path>
            </svg>
          )}
        </button>
        <button className="ctl ctl-sm" onClick={onNext} aria-label="Next">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4" fill="currentColor"></polygon>
            <line x1="19" y1="5" x2="19" y2="19"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}

function LyricLine({ line, idx, currentIdx, time, prevT, nextT, onWord, showCN, karaoke }) {
  const isCurrent = idx === currentIdx;
  const isPast = idx < currentIdx;
  const isFuture = idx > currentIdx;
  const tokens = useMemo(() => tokenize(line.en || ""), [line.en]);
  const dist = Math.abs(idx - currentIdx);

  // Per-line karaoke progress (0..1) — used to compute continuous lit per word
  let progress = 0;
  if (isCurrent && karaoke) {
    const dur = Math.max(0.5, nextT - line.t);
    progress = Math.max(0, Math.min(1, (time - line.t) / dur));
  } else if (isPast || (isCurrent && !karaoke)) {
    progress = 1;
  }

  const wordCount = tokens.filter((t) => t.type === "word").length;
  let wIndex = 0;

  const ref = useRef(null);
  useEffect(() => {
    if (isCurrent && ref.current) {
      const container = ref.current.closest(".lyrics-scroll");
      if (container) {
        const lineRect = ref.current.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();
        const target = ref.current.offsetTop - container.clientHeight / 2 + ref.current.offsetHeight / 2;
        container.scrollTo({ top: target, behavior: "smooth" });
      }
    }
  }, [isCurrent]);

  if (!line.en) return <div className="lyric-line lyric-spacer" ref={ref}></div>;

  // Soft-focus: blur + fade neighboring lines
  const blur = isCurrent ? 0 : Math.min(4, 0.5 + (dist - 1) * 0.9);
  const lineOpacity = isCurrent ? 1 : Math.max(0.18, 1 - dist * 0.20);
  const lineStyle = { filter: `blur(${blur}px)`, opacity: lineOpacity };

  return (
    <div
      ref={ref}
      style={lineStyle}
      className={`lyric-line ${isCurrent ? "current" : ""} ${isPast ? "past" : ""} ${isFuture ? "future" : ""} ${line.kind || ""}`}
    >
      <div className="lyric-en">
        {tokens.map((tok, i) => {
          if (tok.type === "sep") return <span key={i}>{tok.text}</span>;
          const myIdx = wIndex++;
          // Continuous lit (0..1) — drives a smooth color-mix in CSS so the
          // bright color sweeps across each word instead of popping on/off.
          let lit;
          if (isPast) lit = 1;
          else if (isFuture) lit = 0;
          else if (karaoke) lit = Math.max(0, Math.min(1, progress * wordCount - myIdx));
          else lit = 1;
          return (
            <span
              key={i}
              className="word"
              style={{ "--lit": lit }}
              onClick={() => onWord && onWord(tok.text, line)}
            >
              {tok.text}
            </span>
          );
        })}
      </div>
      {showCN && line.cn ? <div className="lyric-cn">{line.cn}</div> : null}
    </div>
  );
}

function LyricsPanel({ song, time, currentIdx, onWord, showCN, karaoke }) {
  return (
    <div className={`lyrics-scroll ${karaoke ? "is-karaoke" : ""}`}>
      <div className="lyrics-spacer-top"></div>
      {song.lyrics.map((line, i) => (
        <LyricLine
          key={i}
          line={line}
          idx={i}
          currentIdx={currentIdx}
          time={time}
          prevT={i > 0 ? song.lyrics[i - 1].t : 0}
          nextT={i < song.lyrics.length - 1 ? song.lyrics[i + 1].t : song.duration}
          onWord={onWord}
          showCN={showCN}
          karaoke={karaoke}
        />
      ))}
      <div className="lyrics-spacer-bottom"></div>
    </div>
  );
}

function VocabCard({ entry, sourceLine, onClose, onSave, saved }) {
  const [closing, setClosing] = useState(false);
  const close = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };
  return (
    <div className={`vocab-card ${closing ? "closing" : ""}`} onClick={(e) => e.stopPropagation()}>
      <button className="vocab-close" onClick={close} aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round">
          <line x1="6" y1="6" x2="18" y2="18"></line>
          <line x1="18" y1="6" x2="6" y2="18"></line>
        </svg>
      </button>
      <div className="vocab-head">
        <div>
          <div className="vocab-word">{entry.word}</div>
          <div className="vocab-meta">
            <span className="vocab-ipa">{entry.ipa}</span>
            <span className="vocab-pos">{entry.pos}</span>
            <span className="vocab-level">CEFR {entry.level}</span>
          </div>
        </div>
        <button className="vocab-pron" aria-label="Play pronunciation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
        </button>
      </div>
      <div className="vocab-cn">{entry.cn}</div>
      <div className="vocab-def">{entry.def}</div>
      {entry.examples?.[0] && (
        <div className="vocab-example">
          <div className="vocab-example-en">"{entry.examples[0].en}"</div>
          <div className="vocab-example-cn">{entry.examples[0].cn}</div>
        </div>
      )}
      {sourceLine && (
        <div className="vocab-source">
          From this song: <em>"{sourceLine.en}"</em>
        </div>
      )}
      <button className={`vocab-save ${saved ? "is-saved" : ""}`} onClick={onSave}>
        {saved ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            Saved to flashcards
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            Save to flashcards
          </>
        )}
      </button>
    </div>
  );
}

function Confetti({ x, y, color }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        a: (i / 18) * Math.PI * 2 + Math.random() * 0.4,
        r: 60 + Math.random() * 80,
        s: 6 + Math.random() * 8,
        c: [color, "#f5d76e", "#ff8a8a", "#7ec4cf", "#c8a2ff"][i % 5],
        rot: Math.random() * 360,
      })),
    []
  );
  return (
    <div className="confetti-root" style={{ left: x, top: y }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            background: p.c,
            width: p.s,
            height: p.s * 0.4,
            ["--dx"]: `${Math.cos(p.a) * p.r}px`,
            ["--dy"]: `${Math.sin(p.a) * p.r}px`,
            ["--rot"]: `${p.rot}deg`,
          }}
        ></span>
      ))}
    </div>
  );
}

function Player({ song, songs, onChangeSong, tweaks }) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [openWord, setOpenWord] = useState(null); // { entry, line, x, y }
  const [saved, setSaved] = useState(() => new Set(window.INITIAL_SAVED));
  const [confetti, setConfetti] = useState(null);
  const [toast, setToast] = useState(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  // restore time
  useEffect(() => {
    const k = `verse:time:${song.id}`;
    const v = parseFloat(localStorage.getItem(k) || "0");
    if (!isNaN(v)) setTime(v);
  }, [song.id]);
  useEffect(() => {
    const k = `verse:time:${song.id}`;
    localStorage.setItem(k, String(time));
  }, [time, song.id]);

  // playback loop
  useEffect(() => {
    if (!playing) return;
    lastRef.current = performance.now();
    const tick = (now) => {
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setTime((t) => {
        const nt = t + dt;
        if (nt >= song.duration) {
          setPlaying(false);
          return 0;
        }
        return nt;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, song.duration]);

  // current lyric idx
  const currentIdx = useMemo(() => {
    const ls = song.lyrics;
    let idx = -1;
    for (let i = 0; i < ls.length; i++) {
      if (ls[i].t <= time) idx = i;
      else break;
    }
    return idx;
  }, [time, song.lyrics]);

  const handleWord = useCallback((raw, line) => {
    const entry = lookupWord(raw);
    if (!entry) {
      setToast({ msg: `No definition for "${raw}" yet`, kind: "info" });
      setTimeout(() => setToast(null), 1800);
      return;
    }
    setOpenWord({ entry, line, key: raw.toLowerCase().replace(/[^a-z']/g, "") });
  }, []);

  const handleSave = (e) => {
    if (!openWord) return;
    const k = openWord.key;
    if (saved.has(k)) {
      // unsave
      const ns = new Set(saved);
      ns.delete(k);
      setSaved(ns);
      setToast({ msg: "Removed from flashcards", kind: "info" });
      setTimeout(() => setToast(null), 1500);
      return;
    }
    const ns = new Set(saved);
    ns.add(k);
    setSaved(ns);
    const r = e.currentTarget.getBoundingClientRect();
    setConfetti({ x: r.left + r.width / 2, y: r.top + r.height / 2, key: Date.now() });
    setTimeout(() => setConfetti(null), 1100);
    setToast({ msg: `Saved "${openWord.entry.word}" to flashcards`, kind: "success" });
    setTimeout(() => setToast(null), 2200);
  };

  const songIdx = songs.findIndex((s) => s.id === song.id);
  const onPrev = () => {
    if (time > 3) return setTime(0);
    onChangeSong(songs[(songIdx - 1 + songs.length) % songs.length]);
  };
  const onNext = () => onChangeSong(songs[(songIdx + 1) % songs.length]);

  return (
    <div className="player">
      <div className="player-left">
        <AlbumArt song={song} playing={playing} big />
        <div className="now-meta">
          <div className="now-eyebrow">Now Playing · CEFR {song.level}</div>
          <h1 className="now-title">{song.title}</h1>
          <div className="now-artist">{song.artist} · {song.album} · {song.year}</div>
        </div>
        <Controls
          playing={playing}
          setPlaying={setPlaying}
          time={time}
          setTime={setTime}
          duration={song.duration}
          onPrev={onPrev}
          onNext={onNext}
        />
        <div className="song-stats">
          <div className="stat">
            <div className="stat-num">{song.lyrics.filter((l) => l.en).length}</div>
            <div className="stat-lbl">lines</div>
          </div>
          <div className="stat">
            <div className="stat-num">{
              new Set(
                song.lyrics
                  .flatMap((l) => (l.en || "").toLowerCase().match(/[a-z']+/g) || [])
              ).size
            }</div>
            <div className="stat-lbl">unique words</div>
          </div>
          <div className="stat">
            <div className="stat-num">{song.bpm}</div>
            <div className="stat-lbl">BPM</div>
          </div>
        </div>
      </div>

      <div className="player-right">
        <div className="lyrics-head">
          <div className="lyrics-eyebrow">Lyrics</div>
          <div className="lyrics-hint">Tap any word for a definition</div>
        </div>
        <LyricsPanel
          song={song}
          time={time}
          currentIdx={currentIdx}
          onWord={handleWord}
          showCN={tweaks.translation}
          karaoke={tweaks.karaoke}
        />
      </div>

      {openWord && (
        <>
          <div className="vocab-backdrop" onClick={() => setOpenWord(null)}></div>
          <VocabCard
            entry={openWord.entry}
            sourceLine={openWord.line}
            saved={saved.has(openWord.key)}
            onClose={() => setOpenWord(null)}
            onSave={handleSave}
          />
        </>
      )}

      {confetti && <Confetti key={confetti.key} x={confetti.x} y={confetti.y} color={song.color} />}

      {toast && <div className={`toast toast-${toast.kind}`}>{toast.msg}</div>}
    </div>
  );
}

window.Player = Player;
window.AlbumArt = AlbumArt;
window.formatTime = formatTime;
