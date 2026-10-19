/*
 * ScreencastScene "motion" — there is none, and that is the point.
 *
 * The Remotion component had no interpolate() at all: the clip plays, the backdrop fills
 * the pillarbox, nothing animates. But a HyperFrames composition still needs a registered
 * timeline — "a composition without a script has no timeline and cannot participate in the
 * hierarchy" — and its LENGTH comes from that timeline, not from any attribute. So a
 * screencast scene needs exactly one thing: an empty timeline extended to the scene's
 * length. Without it the scene would collapse to zero and the six screencasts, which are
 * most of this video, would vanish.
 *
 * See src/blocks/title.js for the scene-local time and cold-seek rules.
 */
window.jitsuen = window.jitsuen || {};

/**
 * @param {string} id   the sub-composition's data-composition-id
 * @param {number} seconds  the scene's full length
 * @returns {gsap.core.Timeline}
 */
window.jitsuen.screencastMotion = function (id, seconds) {
  var tl = gsap.timeline({paused: true});
  tl.set({}, {}, seconds);
  return tl;
};
