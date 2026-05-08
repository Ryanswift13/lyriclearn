// Main App — top nav, view switching, tweaks integration

const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "style": "calm",
  "karaoke": true,
  "translation": false,
  "level": "B1"
}/*EDITMODE-END*/;

function TopBar({ view, setView, tweaks }) {
  return (
    <header className="topbar">
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
          <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="3" fill="currentColor" />
          <path d="M16 4 L16 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 19 L16 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="brand-name">Verse</span>
        <span className="brand-tag">music · english</span>
      </div>
      <nav className="topnav">
        {[
          ["player", "Now Playing"],
          ["library", "Library"],
          ["profile", "Profile"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`navlink ${view === id ? "on" : ""}`}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="top-right">
        <div className="level-pill">
          <span className="level-dot"></span>
          Adapting · CEFR {tweaks.level}
        </div>
        <div className="streak-pill">
          <span className="streak-pill-flame">🔥</span>
          <span className="streak-pill-num">23</span>
        </div>
      </div>
    </header>
  );
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useStateA(() => localStorage.getItem("verse:view") || "player");
  const [songId, setSongId] = useStateA(() => localStorage.getItem("verse:song") || "late-night-light");
  const [savedCount, setSavedCount] = useStateA(window.INITIAL_SAVED.length);

  useEffectA(() => localStorage.setItem("verse:view", view), [view]);
  useEffectA(() => localStorage.setItem("verse:song", songId), [songId]);

  // sync style class to <html>
  useEffectA(() => {
    document.documentElement.dataset.style = tweaks.style;
  }, [tweaks.style]);

  const song = useMemoA(
    () => window.SONGS.find((s) => s.id === songId) || window.SONGS[0],
    [songId]
  );

  // restrict library to songs up to current level + 1
  const levelOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const maxLevelIdx = Math.min(levelOrder.length - 1, levelOrder.indexOf(tweaks.level) + 1);
  const visibleSongs = window.SONGS.filter(
    (s) => levelOrder.indexOf(s.level) <= maxLevelIdx
  );

  const onChangeSong = (s) => {
    setSongId(s.id);
    if (view !== "player") setView("player");
  };

  return (
    <div className="app">
      <TopBar view={view} setView={setView} tweaks={tweaks} />
      <main className="main">
        {view === "player" && (
          <Player
            song={song}
            songs={window.SONGS}
            onChangeSong={onChangeSong}
            tweaks={tweaks}
          />
        )}
        {view === "library" && (
          <LibraryScreen
            songs={visibleSongs}
            currentId={songId}
            onPick={onChangeSong}
          />
        )}
        {view === "profile" && <ProfileScreen savedCount={savedCount} />}
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Visual style">
          <TweakSelect
            label="Theme"
            value={tweaks.style}
            options={[
              { value: "calm", label: "Calm — warm cream + sage" },
              { value: "playful", label: "Playful — bright + bouncy" },
              { value: "dark", label: "Dark — immersive night" },
            ]}
            onChange={(v) => setTweak("style", v)}
          />
        </TweakSection>
        <TweakSection title="Lyrics">
          <TweakToggle
            label="Karaoke highlight"
            value={tweaks.karaoke}
            onChange={(v) => setTweak("karaoke", v)}
          />
          <TweakToggle
            label="Show 中文 translation"
            value={tweaks.translation}
            onChange={(v) => setTweak("translation", v)}
          />
        </TweakSection>
        <TweakSection title="Level">
          <TweakRadio
            value={tweaks.level}
            options={["A2", "B1", "B2"]}
            onChange={(v) => setTweak("level", v)}
          />
          <div className="tweak-note">Library hides songs above your level + 1.</div>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
