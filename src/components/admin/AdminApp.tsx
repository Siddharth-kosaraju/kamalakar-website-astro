import React, { useEffect, useState, useCallback } from 'react';
import * as auth from './cognito';
import type { AuthTokens } from './cognito';

const API_BASE = import.meta.env.PUBLIC_MEDIA_API_URL || '';
const CATEGORIES = ['Heart Tests Explained', 'Heart Attack & Emergency', 'Prevention & Lifestyle', 'Inside the Clinic'];
const LANGUAGES = ['English', 'Telugu'];
const TIERS: { value: string; label: string }[] = [
  { value: 'grid-only', label: 'Grid only (no dedicated page)' },
  { value: 'full', label: 'Full (gets its own /media/<slug>/ page)' },
  { value: 'featured', label: 'Featured (shown at the top of /media/)' },
];

interface VideoItem {
  slug: string;
  youtubeUrl: string;
  displayTitle: string;
  category: string;
  language: string;
  tier: string;
  description?: string;
  keyPoints?: string[];
  uploadDate?: string;
  relatedService?: string | null;
  relatedPost?: string | null;
  hidden?: boolean;
  updatedAt?: string;
  order?: number;
}

const emptyForm = {
  slug: '',
  youtubeUrl: '',
  displayTitle: '',
  category: CATEGORIES[0],
  language: 'English',
  tier: 'grid-only',
  description: '',
  keyPointsText: '',
  relatedService: '',
  relatedPost: '',
};

function apiFetch(path: string, idToken: string, opts: RequestInit = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: idToken, ...(opts.headers || {}) },
  });
}

function LoginScreen({ onLogin }: { onLogin: (t: AuthTokens) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const tokens = await auth.login(email, password);
      onLogin(tokens);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-24 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
      <h1 className="text-xl font-bold text-primary dark:text-white mb-6">Media Admin Login</h1>
      {!auth.isConfigured() && (
        <p className="text-sm text-red-600 mb-4">
          Admin portal isn't configured yet — PUBLIC_COGNITO_REGION / PUBLIC_COGNITO_CLIENT_ID / PUBLIC_MEDIA_API_URL are missing from the build.
        </p>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !auth.isConfigured()}
          className="w-full bg-primary text-white py-2.5 rounded-lg font-bold disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

function VideoForm({
  initial,
  onSave,
  onCancel,
  idToken,
}: {
  initial?: VideoItem;
  onSave: (item: VideoItem) => void;
  onCancel: () => void;
  idToken: string;
}) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          slug: initial.slug,
          youtubeUrl: initial.youtubeUrl,
          displayTitle: initial.displayTitle,
          category: initial.category,
          language: initial.language,
          tier: initial.tier,
          description: initial.description || '',
          keyPointsText: (initial.keyPoints || []).join('\n'),
          relatedService: initial.relatedService || '',
          relatedPost: initial.relatedPost || '',
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState('');
  const [relatedOptions, setRelatedOptions] = useState<{ services: { slug: string; title: string }[]; posts: { slug: string; title: string }[] }>({ services: [], posts: [] });

  useEffect(() => {
    fetch('/media-admin-data.json')
      .then((r) => r.json())
      .then(setRelatedOptions)
      .catch(() => {}); // dropdowns just stay empty if this fails — not fatal
  }, []);

  const lookupTitle = async () => {
    if (!form.youtubeUrl) return;
    setLooking(true);
    setError('');
    try {
      const res = await apiFetch('/oembed', idToken, { method: 'POST', body: JSON.stringify({ youtubeUrl: form.youtubeUrl }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lookup failed');
      setForm((f) => ({ ...f, displayTitle: f.displayTitle || data.suggestedTitle }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLooking(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        slug: form.slug,
        youtubeUrl: form.youtubeUrl.trim(),
        displayTitle: form.displayTitle.trim(),
        category: form.category,
        language: form.language,
        tier: form.tier,
        description: form.description.trim(),
        keyPoints: form.keyPointsText.split('\n').map((s) => s.trim()).filter(Boolean),
        relatedService: form.relatedService.trim() || null,
        relatedPost: form.relatedPost.trim() || null,
      };
      const res = initial
        ? await apiFetch(`/videos/${initial.slug}`, idToken, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiFetch('/videos', idToken, { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error((data.errors || [data.error]).join(', '));
      onSave(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <h2 className="font-bold text-primary dark:text-white">{initial ? 'Edit Video' : 'Add Video'}</h2>

      <div className="flex gap-2">
        <input
          type="url"
          required
          placeholder="https://www.youtube.com/watch?v=... or /shorts/..."
          value={form.youtubeUrl}
          onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
        />
        <button type="button" onClick={lookupTitle} disabled={looking} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-semibold whitespace-nowrap">
          {looking ? 'Looking up…' : 'Fetch title'}
        </button>
      </div>

      <input
        type="text"
        required
        placeholder="Display title (shown on the site)"
        value={form.displayTitle}
        onChange={(e) => setForm({ ...form, displayTitle: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={form.language}
          onChange={(e) => setForm({ ...form, language: e.target.value })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select
          value={form.tier}
          onChange={(e) => setForm({ ...form, tier: e.target.value })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
        >
          {TIERS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {form.tier !== 'grid-only' && (
        <>
          <textarea
            placeholder="Description (shown on the video page and used for SEO)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
          <textarea
            placeholder="Key points, one per line"
            value={form.keyPointsText}
            onChange={(e) => setForm({ ...form, keyPointsText: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.relatedService}
              onChange={(e) => setForm({ ...form, relatedService: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="">No related service</option>
              {relatedOptions.services.map((s) => (
                <option key={s.slug} value={s.slug}>{s.title}</option>
              ))}
            </select>
            <select
              value={form.relatedPost}
              onChange={(e) => setForm({ ...form, relatedPost: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="">No related guide</option>
              {relatedOptions.posts.map((p) => (
                <option key={p.slug} value={p.slug}>{p.title}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="bg-primary text-white px-5 py-2 rounded-lg font-bold text-sm disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2 rounded-lg font-bold text-sm bg-gray-100 dark:bg-gray-700">
          Cancel
        </button>
      </div>
    </form>
  );
}

function PublishBar({ idToken }: { idToken: string }) {
  const [status, setStatus] = useState<'idle' | 'starting' | 'building' | 'succeeded' | 'failed'>('idle');
  const [buildId, setBuildId] = useState('');

  useEffect(() => {
    if (status !== 'building' || !buildId) return;
    const interval = setInterval(async () => {
      const res = await apiFetch(`/publish/${buildId}`, idToken);
      const data = await res.json();
      if (data.buildStatus === 'SUCCEEDED') { setStatus('succeeded'); clearInterval(interval); }
      else if (data.buildStatus && data.buildStatus !== 'IN_PROGRESS') { setStatus('failed'); clearInterval(interval); }
    }, 8000);
    return () => clearInterval(interval);
  }, [status, buildId, idToken]);

  const publish = async () => {
    setStatus('starting');
    try {
      const res = await apiFetch('/publish', idToken, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBuildId(data.buildId);
      setStatus('building');
    } catch {
      setStatus('failed');
    }
  };

  const labels: Record<string, string> = {
    idle: 'Publish changes to the live site',
    starting: 'Starting build…',
    building: 'Building & deploying… (usually 2–3 minutes)',
    succeeded: 'Published! Changes are live.',
    failed: 'Publish failed — check the CodeBuild logs.',
  };

  return (
    <div className="flex items-center justify-between bg-primary dark:bg-primary-light rounded-2xl px-6 py-4 mb-8">
      <p className="text-white text-sm font-semibold">{labels[status]}</p>
      <button
        onClick={publish}
        disabled={status === 'starting' || status === 'building'}
        className="bg-white text-primary px-5 py-2 rounded-lg font-bold text-sm disabled:opacity-60"
      >
        {status === 'building' ? 'Publishing…' : 'Publish'}
      </button>
    </div>
  );
}

export default function AdminApp() {
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [videos, setVideos] = useState<VideoItem[] | null>(null);
  const [editing, setEditing] = useState<VideoItem | 'new' | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const stored = auth.loadStoredTokens();
    if (stored) setTokens(stored);
  }, []);

  const refreshList = useCallback(async (idToken: string) => {
    setLoadError('');
    try {
      const res = await apiFetch('/videos', idToken);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load videos');
      setVideos(data.items);
    } catch (err: any) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    if (!tokens) return;
    auth.getValidIdToken(tokens).then(({ idToken, tokens: fresh }) => {
      if (fresh !== tokens) setTokens(fresh);
      refreshList(idToken);
    }).catch(() => {
      auth.logout();
      setTokens(null);
    });
  }, [tokens, refreshList]);

  if (!tokens) return <LoginScreen onLogin={setTokens} />;

  const idToken = tokens.idToken;

  const handleDelete = async (slug: string) => {
    if (!confirm('Delete this video? This removes it from the list — publish afterward to take it off the live site.')) return;
    await apiFetch(`/videos/${slug}`, idToken, { method: 'DELETE' });
    refreshList(idToken);
  };

  const handleReorder = async (slugA: string, slugB: string) => {
    await apiFetch('/videos/reorder', idToken, { method: 'POST', body: JSON.stringify({ slugA, slugB }) });
    refreshList(idToken);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary dark:text-white">Media Admin</h1>
        <button
          onClick={() => { auth.logout(); setTokens(null); }}
          className="text-sm font-semibold text-gray-500 hover:text-primary dark:hover:text-white"
        >
          Sign out
        </button>
      </div>

      <PublishBar idToken={idToken} />

      {editing && (
        <div className="mb-8">
          <VideoForm
            initial={editing === 'new' ? undefined : editing}
            idToken={idToken}
            onCancel={() => setEditing(null)}
            onSave={() => { setEditing(null); refreshList(idToken); }}
          />
        </div>
      )}

      {!editing && (
        <button
          onClick={() => setEditing('new')}
          className="mb-6 bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm"
        >
          + Add Video
        </button>
      )}

      {loadError && <p className="text-sm text-red-600 mb-4">{loadError}</p>}

      {videos === null && !loadError && <p className="text-gray-500">Loading…</p>}

      {videos && videos.length > 0 && (
        <p className="text-xs text-gray-500 mb-3">
          This is the display order on /media/ — use ↑↓ to rearrange. Publish afterward for it to take effect on the live site.
        </p>
      )}

      {videos && (
        <div className="space-y-3">
          {videos.map((v, i) => (
            <div key={v.slug} className="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  onClick={() => handleReorder(v.slug, videos[i - 1].slug)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleReorder(v.slug, videos[i + 1].slug)}
                  disabled={i === videos.length - 1}
                  aria-label="Move down"
                  className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ↓
                </button>
              </div>
              <img
                src={`https://img.youtube.com/vi/${(v.youtubeUrl.match(/[\w-]{11}(?=[^\w-]|$)/) || [''])[0]}/default.jpg`}
                alt=""
                className="w-16 h-12 object-cover rounded flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary dark:text-white truncate">{v.displayTitle}</p>
                <p className="text-xs text-gray-500">{v.category} · {v.language} · {v.tier}{v.hidden ? ' · HIDDEN' : ''}</p>
              </div>
              <button onClick={() => setEditing(v)} className="text-sm font-semibold text-primary dark:text-accent-light">Edit</button>
              <button onClick={() => handleDelete(v.slug)} className="text-sm font-semibold text-red-600">Delete</button>
            </div>
          ))}
          {videos.length === 0 && <p className="text-gray-500">No videos yet — add one above.</p>}
        </div>
      )}
    </div>
  );
}
