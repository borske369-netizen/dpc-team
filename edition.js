/* Which build this is. The team edition ships without the private deal tab. */
export const TEAM_EDITION = true;

/* The permanent public address of the team app. Every link the app hands out
   (invites, team link, a rep's numbers link) points here, so a link opened on
   any phone lands on the real app and never on a preview address. */
export const PUBLIC_URL = "https://borske369-netizen.github.io/dpc-team/";

export function appBase() {
  try {
    if (/\.pplx\.app$/.test(location.hostname) && !/^preview--/.test(location.hostname)) return location.origin + "/";
  } catch (_) {}
  if (PUBLIC_URL) return PUBLIC_URL;
  return location.origin + location.pathname;
}
