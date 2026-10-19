/*
 * TitleScene motion. Translated from the Remotion component's interpolate() calls.
 *
 * Time here is SCENE-LOCAL: each scene is its own sub-composition, so its timeline starts
 * at 0 and the framework nests it at the host's data-start. Nothing in this file may read
 * an absolute time, a frame number or an fps — the only numbers are the authored offsets
 * below, which came straight from the original component.
 *
 * Cold-seek safe by construction: initial state is set with a bare gsap.set() before any
 * tween is added, every tween names its destination explicitly, and there is no fromTo, no
 * relative value ("+=") and no geometry read in a callback. A render seeks to an arbitrary
 * frame in a fresh tab, so a tween that infers its start from whatever happens to be on
 * screen produces a different picture depending on where the seek landed.
 *
 * This file must never construct an asset path: it is loaded as a separate <script src>,
 * so it has no composition to resolve a relative URL against. All media lives in the
 * authored composition's attributes.
 */
window.jitsuen = window.jitsuen || {};

/**
 * @param {string} id   the sub-composition's data-composition-id
 * @param {number} seconds  the scene's full length, so the timeline is not short-changed
 * @returns {gsap.core.Timeline} paused, ready to register on window.__timelines
 */
window.jitsuen.titleMotion = function (id, seconds) {
  var scope = '[data-composition-id="' + id + '"] ';
  var tl = gsap.timeline({paused: true});

  // One orchestrated entrance: the marker draws, then the words arrive under it.
  gsap.set(scope + '.title-marker', {scaleY: 0});
  gsap.set(scope + '.display', {opacity: 0, y: 28});
  gsap.set(scope + '.sub', {opacity: 0});

  // interpolate(frame, [0, 0.45 * fps], [0, 1]) on the marker's vertical scale.
  tl.to(scope + '.title-marker', {scaleY: 1, duration: 0.45, ease: 'none'}, 0);

  // interpolate(frame, [0.2 * fps, 0.75 * fps], ...) on the headline's rise and fade.
  tl.to(scope + '.display', {opacity: 1, y: 0, duration: 0.55, ease: 'none'}, 0.2);

  // interpolate(frame, [0.45 * fps, 1 * fps], [0, 1]) on the sub-headline's fade.
  tl.to(scope + '.sub', {opacity: 1, duration: 0.55, ease: 'none'}, 0.45);

  // A composition's length is its timeline's length — there is no data-duration on a
  // composition. Without this the scene would end at its last tween and the video would
  // be short. pnpm check re-derives this literal.
  tl.set({}, {}, seconds);
  return tl;
};
