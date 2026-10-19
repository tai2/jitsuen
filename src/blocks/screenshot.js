/*
 * ScreenshotScene motion. See src/blocks/title.js for the scene-local time and cold-seek
 * rules that apply to every block in this directory.
 *
 * DEFERRED, deliberately: the original Ken Burns push used Remotion's
 * `output: 'perceptual-scale'`, which interpolates scale perceptually rather than
 * linearly, so a 1 -> 1.3 push spends more time near 1 than a linear tween does. This
 * block uses a LINEAR scale tween instead.
 *
 * It is deferred rather than solved because the current storyboard contains no screenshot
 * scenes — every visual is a screencast — so there is nothing to compare a CustomEase
 * approximation against. When a screenshot scene is first authored, reproduce the curve
 * with CustomEase and diff it against a Remotion still before trusting it.
 */
window.jitsuen = window.jitsuen || {};

/**
 * @param {string} id   the sub-composition's data-composition-id
 * @param {number} seconds  the scene's full length
 * @param {number} focusScale  end zoom scale
 * @returns {gsap.core.Timeline}
 */
window.jitsuen.screenshotMotion = function (id, seconds, focusScale) {
  var scope = '[data-composition-id="' + id + '"] ';
  var tl = gsap.timeline({paused: true});

  gsap.set(scope + '.scene-media', {opacity: 0, scale: 1});

  // interpolate(frame, [0, enterSeconds * fps], [0, 1]) on the fade.
  tl.to(scope + '.scene-media', {opacity: 1, duration: 0.5, ease: 'none'}, 0);

  // The slow push toward the focus point, across the whole scene. transform-origin is
  // authored on the element from focusX / focusY, not set here.
  tl.to(scope + '.scene-media', {scale: focusScale, duration: seconds, ease: 'none'}, 0);

  tl.set({}, {}, seconds);
  return tl;
};
