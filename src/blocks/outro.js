/*
 * OutroScene motion. See src/blocks/title.js for the scene-local time and cold-seek
 * rules that apply to every block in this directory.
 */
window.jitsuen = window.jitsuen || {};

/**
 * @param {string} id   the sub-composition's data-composition-id
 * @param {number} seconds  the scene's full length
 * @returns {gsap.core.Timeline}
 */
window.jitsuen.outroMotion = function (id, seconds) {
  var scope = '[data-composition-id="' + id + '"] ';
  var tl = gsap.timeline({paused: true});

  // The whole stack fades in together — the original put one opacity interpolate on the
  // flex container rather than animating the message and the URL separately.
  // interpolate(frame, [0, enterSeconds * fps], [0, 1]).
  gsap.set(scope + '.outro-stack', {opacity: 0});
  tl.to(scope + '.outro-stack', {opacity: 1, duration: 0.5, ease: 'none'}, 0);

  tl.set({}, {}, seconds);
  return tl;
};
