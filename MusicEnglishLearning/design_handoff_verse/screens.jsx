// Library + Profile + Vocab screens

const { useState: useStateS } = React;

function LibraryScreen({ songs, currentId, onPick }) {
  const [filter, setFilter] = useStateS("All");
  const levels = ["All", "A1", "A2", "B1", "B2", "C1"];
  const filtered = filter === "All" ? songs : songs.filter((s) => s.level === filter);
  return (
    <div className="screen library">
      <div className="screen-head">
        <div>
          <div className="screen-eyebrow">Library</div>
          <h2 className="screen-title">Songs to learn</h2>
        </div>
        <div className="filter-row">
          {levels.map((l) => (
            <button
              key={l}
              className={`chip ${filter === l ? "on" : ""}`}
              onClick={() => setFilter(l)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="lib-grid">
        {filtered.map((s) => {
          const playing = s.id === currentId;
          return (
            <div
              key={s.id}
              className={`lib-card ${playing ? "playing" : ""}`}
              onClick={() => onPick(s)}
            >
              <div
                className="lib-cover"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${s.color} 0%, ${s.color2} 75%, #1a1a1a 100%)`,
                }}
              >
                <div className="lib-cover-grooves"></div>
                {playing && <div className="lib-playing-badge">Playing</div>}
              </div>
              <div className="lib-meta">
                <div className="lib-title">{s.title}</div>
                <div className="lib-artist">{s.artist}</div>
                <div className="lib-tags">
                  <span className="tag tag-level">CEFR {s.level}</span>
                  <span className="tag">{s.genre}</span>
                  <span className="tag">{window.formatTime(s.duration)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileScreen({ savedCount }) {
  const p = window.PROFILE;
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const max = Math.max(...p.weekProgress);
  return (
    <div className="screen profile">
      <div className="profile-grid">
        <div className="profile-hero card">
          <div className="profile-avatar">
            <div className="profile-avatar-inner">{p.name[0]}</div>
          </div>
          <div className="profile-name">{p.name}</div>
          <div className="profile-sub">Member since {p.joined} · CEFR {p.level}</div>
          <div className="profile-streak">
            <div className="streak-num">
              <span className="streak-flame">🔥</span>
              {p.streakDays}
            </div>
            <div className="streak-lbl">day streak</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="card-eyebrow">This week</div>
          <div className="week-bars">
            {p.weekProgress.map((m, i) => (
              <div key={i} className="week-col">
                <div className="week-bar" style={{ height: `${(m / max) * 100}%` }}>
                  <div className="week-bar-fill"></div>
                </div>
                <div className="week-day">{days[i]}</div>
              </div>
            ))}
          </div>
          <div className="card-foot">
            <span className="big">{p.weekProgress.reduce((a, b) => a + b, 0)} min</span>
            <span className="muted">listened this week</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="card-eyebrow">Lifetime</div>
          <div className="big-stats">
            <div>
              <div className="big">{Math.floor(p.totalMinutes / 60)}h</div>
              <div className="muted">total time</div>
            </div>
            <div>
              <div className="big">{p.songsLearned}</div>
              <div className="muted">songs</div>
            </div>
            <div>
              <div className="big">{p.wordsKnown}</div>
              <div className="muted">words known</div>
            </div>
            <div>
              <div className="big">{savedCount}</div>
              <div className="muted">flashcards</div>
            </div>
          </div>
        </div>

        <div className="card recent-card">
          <div className="card-eyebrow">Recent listening</div>
          <div className="recent-list">
            {p.recent.map((r, i) => (
              <div key={i} className="recent-row">
                <div className="recent-meta">
                  <div className="recent-song">{r.song}</div>
                  <div className="recent-artist">{r.artist}</div>
                </div>
                <div className="recent-stats">
                  <span className="recent-min">{r.minutes} min</span>
                  <span className="recent-date">{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card achievements-card">
          <div className="card-eyebrow">Recent achievements</div>
          <div className="ach-list">
            <div className="ach">
              <div className="ach-icon">⭐</div>
              <div>
                <div className="ach-title">First chorus learned</div>
                <div className="ach-sub">Sang along without peeking</div>
              </div>
            </div>
            <div className="ach">
              <div className="ach-icon">📚</div>
              <div>
                <div className="ach-title">50 words saved</div>
                <div className="ach-sub">Your flashcard deck is growing</div>
              </div>
            </div>
            <div className="ach">
              <div className="ach-icon">🎵</div>
              <div>
                <div className="ach-title">3 weeks consistent</div>
                <div className="ach-sub">Daily practice unlocked B1</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.LibraryScreen = LibraryScreen;
window.ProfileScreen = ProfileScreen;
