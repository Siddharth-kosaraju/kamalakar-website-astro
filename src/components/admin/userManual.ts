// Source of truth for the downloadable user manual, generated client-side
// from inside the authenticated admin app (see AdminApp.tsx's "Download
// User Manual" button) — deliberately NOT a public site route.
//
// {{EMAIL}} / {{PASSWORD}} are placeholders, NOT the real values — the real
// values live only in Secrets Manager and are fetched via the authenticated
// GET /manual-credentials Lambda route at download time (see cognito.ts /
// AdminApp.tsx), so this file (which does ship in the public JS bundle,
// login or not) never contains the actual password.
export function buildUserManualHtml(email: string, password: string): string {
  return USER_MANUAL_TEMPLATE.replace('{{EMAIL}}', email).replace('{{PASSWORD}}', password);
}

const USER_MANUAL_TEMPLATE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Media Admin User Manual — Kamalakar Heart Centre</title>
<meta name="robots" content="noindex, nofollow">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a2e; }
  h1 { font-size: 1.8rem; border-bottom: 3px solid #0f2557; padding-bottom: 10px; }
  h2 { font-size: 1.3rem; margin-top: 2.2em; color: #0f2557; }
  h3 { font-size: 1.05rem; margin-top: 1.5em; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f5f5f7; }
  code { background: #f0f0f3; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  .credentials { background: #fff8e6; border: 1px solid #e8c76a; border-radius: 8px; padding: 16px 20px; margin: 1em 0; }
  .warning { background: #fdecec; border-left: 4px solid #d9534f; padding: 12px 16px; margin: 1em 0; }
  a { color: #0f2557; }
  ul { padding-left: 1.3em; }
</style>
</head>
<body>

<h1>Media Admin User Manual</h1>
<p>How to add, update, delete, and reorder the videos shown on
<a href="https://kamalakarheartcentre.com/media/">kamalakarheartcentre.com/media/</a>,
using the admin portal.</p>

<h2>1. Access</h2>
<p><strong>Admin portal:</strong> <a href="https://kamalakarheartcentre.com/admin/">kamalakarheartcentre.com/admin/</a><br>
<strong>Live video page:</strong> <a href="https://kamalakarheartcentre.com/media/">kamalakarheartcentre.com/media/</a></p>

<h3>Login</h3>
<div class="credentials">
  <table>
    <tr><th>Email</th><td>{{EMAIL}}</td></tr>
    <tr><th>Password</th><td>{{PASSWORD}}</td></tr>
  </table>
</div>
<div class="warning">
  <strong>Keep this document private.</strong> Whoever has this password can add, edit, and
  delete every video on the site and trigger a live publish. Don't paste it into chat tools,
  tickets, or anywhere outside a secure location. There is no self-service "change password"
  screen yet — rotating it or adding a teammate's own login needs a short AWS-side step.
  A session stays signed in for about an hour, then you'll need to log in again — that's normal.
</div>

<h2>2. The golden rule: nothing is live until you click Publish</h2>
<p>Everything you do in the admin — add, edit, delete, reorder — only updates a working list
behind the scenes. <strong>The public /media/ page does not change until you click the Publish
button</strong> at the top of the admin screen.</p>
<ul>
  <li>Publish takes <strong>~2–3 minutes</strong> (it rebuilds and redeploys the whole site,
    running the same checks as every other deploy).</li>
  <li>You can keep adding/editing videos while a Publish is running — just remember to Publish
    again afterward to include those changes too.</li>
  <li>If you make a change and forget to publish, nothing breaks — it just sits un-published
    until the next time someone clicks Publish.</li>
</ul>

<h2>3. Adding a video</h2>
<ol>
  <li>Click <strong>+ Add Video</strong>.</li>
  <li>Paste the <strong>YouTube URL</strong> — <code>youtube.com/watch?v=...</code>,
    <code>youtube.com/shorts/...</code>, or <code>youtu.be/...</code> all work.</li>
  <li>Click <strong>Fetch title</strong> to auto-pull the real title from YouTube, then edit the
    <strong>Display Title</strong> to whatever reads best on the website (YouTube titles are
    often full of hashtags and emoji that don't belong on a medical site).</li>
  <li>Pick a <strong>Category</strong> (see the fixed list below).</li>
  <li>Pick the <strong>Language</strong> (English or Telugu) — a label on the video's own page,
    not a separate section.</li>
  <li>Pick a <strong>Tier</strong> — the most important decision, explained below.</li>
  <li>If Full or Featured, fill in the description/key points/related links.</li>
  <li>Click <strong>Save</strong>, then <strong>Publish</strong> when ready to go live.</li>
</ol>

<h2>4. Tier: Grid-only vs Full vs Featured</h2>

<h3>Grid-only (the default — use for most videos)</h3>
<p><strong>Needs:</strong> just URL, title, category, language.<br>
<strong>Does:</strong> shows as a card on /media/, playable there. No dedicated page — nothing
extra to write.<br>
<strong>Use for:</strong> brand/community content, "meet the doctor" clips, behind-the-scenes
moments, general awareness posts.</p>

<h3>Full</h3>
<p><strong>Needs, in addition:</strong></p>
<ul>
  <li><strong>Description</strong> — 2–4 sentences explaining the video as if for someone who
    can't watch it. This is what Google and AI assistants read and quote.</li>
  <li><strong>Key points</strong> — 2–4 short bullets, one per line.</li>
  <li><strong>Related service / guide</strong> (optional) — pick from the dropdowns, which only
    show real pages that exist on the site.</li>
</ul>
<p><strong>Does:</strong> gets its own page at
<code>kamalakarheartcentre.com/media/&lt;slug&gt;/</code> — a real, indexable page that can rank
in Google and get cited by AI search tools.<br>
<strong>Use for:</strong> genuine patient education — a test, condition, warning signs, a
procedure. If you'd be fine with a patient finding this video from a Google search alone, it's a
Full candidate.</p>

<h3>Featured</h3>
<p>Same requirements as Full, but shown large at the very top of /media/. <strong>Only one video
should be Featured at a time</strong> — pick your single strongest, most complete explainer.</p>

<h3>Quick decision guide</h3>
<table>
  <tr><th>If the video is...</th><th>Use</th></tr>
  <tr><td>A quick clip, brand moment, community/camp video, "meet the doctor"</td><td>Grid-only</td></tr>
  <tr><td>A real explainer worth writing 3 sentences for</td><td>Full</td></tr>
  <tr><td>Your single best explainer, the one visitors should see first</td><td>Featured</td></tr>
</table>

<h2>5. The 4 categories</h2>
<ul>
  <li><strong>Heart Tests Explained</strong> — ECG, 2D Echo, TMT, checkups, what tests mean</li>
  <li><strong>Heart Attack &amp; Emergency</strong> — warning signs, what to do, stents, urgent care</li>
  <li><strong>Prevention &amp; Lifestyle</strong> — diet, exercise, habits, medication adherence, recovery</li>
  <li><strong>Inside the Clinic</strong> — brand/community content, meet-the-doctor, camps, day-in-the-life</li>
</ul>
<p>There's no separate Telugu category — most content is in Telugu, so it's tracked with the
Language field instead. Pick whichever of the 4 categories fits the topic.</p>

<h2>6. Editing a video</h2>
<p>Find it in the admin list → <strong>Edit</strong> → change anything (including its Tier) →
<strong>Save</strong> → <strong>Publish</strong> to make it live.</p>

<h2>7. Deleting a video</h2>
<p><strong>Delete</strong> → confirm → <strong>Publish</strong>. This removes it from the admin
list and, after publishing, from the website — it does not delete the video from YouTube itself.</p>

<h2>8. Reordering videos</h2>
<p>The order in the admin list is the order videos appear on /media/ (Featured is always shown
separately at the top). Use <strong>↑ / ↓</strong> to move a video, then <strong>Publish</strong>
for the new order to go live.</p>

<h2>9. Troubleshooting</h2>
<ul>
  <li><strong>List looks empty after logging in:</strong> wait a couple seconds and refresh.</li>
  <li><strong>Publish stuck on "Publishing…":</strong> takes 2–3 minutes normally. If it's much
    longer or shows a failure, stop and flag it rather than repeatedly clicking Publish.</li>
  <li><strong>Login stopped working:</strong> sessions expire after ~1 hour — just log in again.</li>
  <li><strong>Forgot the password / need another teammate's account:</strong> not self-service
    yet — ask for it to be set up rather than trying to reset it yourself.</li>
</ul>

</body>
</html>
`;
