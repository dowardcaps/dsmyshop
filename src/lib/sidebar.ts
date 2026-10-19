/** Cookie that remembers the desktop sidebar state. A cookie (not localStorage) so the server renders it right the first time, with no flash. */
export const SIDEBAR_COOKIE = "ds-sidebar";
export const SIDEBAR_COLLAPSED = "collapsed";

/** The `document.cookie` string that stores the sidebar state for one year. */
export const sidebarCookie = (collapsed: boolean): string =>
  `${SIDEBAR_COOKIE}=${collapsed ? SIDEBAR_COLLAPSED : "open"}; path=/; max-age=31536000; SameSite=Lax`;
