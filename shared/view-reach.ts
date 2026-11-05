/**
 * The furthest a co-op player on a touch screen or a tall window may see from the middle of
 * the view, along either axis. A phone held either way round gets the same long side, up to
 * this, and the corners of the widest view allowed still sit inside VIEWER_RANGE, so nobody
 * watches zombies pop in at the edge of what the server sends them.
 */
export const COOP_VIEW_REACH = 320;
