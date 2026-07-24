/**
 * Extracts the 11-character YouTube video ID from any of the URL shapes
 * people actually paste: watch?v=, youtu.be/, /shorts/, /embed/.
 * Throws at build time on an unrecognized URL so a bad paste in the media
 * collection (or, later, the admin portal) fails loudly instead of shipping
 * a broken embed.
 */
export function extractYoutubeId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  throw new Error(`[youtube] Could not extract a video ID from URL: ${url}`);
}

/** True for /shorts/ URLs — used to pick a portrait vs landscape card layout. */
export function isShortUrl(url: string): boolean {
  return url.includes('/shorts/');
}
