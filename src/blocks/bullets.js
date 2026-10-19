/*
 * BulletsScene motion. See src/blocks/title.js for the scene-local time and cold-seek
 * rules that apply to every block in this directory.
 */
window.jitsuen = window.jitsuen || {};

/**
 * @param {string} id   the sub-composition's data-composition-id
 * @param {number} seconds  the scene's full length
 * @returns {gsap.core.Timeline}
 */
window.jitsuen.bulletsMotion = function (id, seconds) {
  var scope = '[data-composition-id="' + id + '"] ';
  var tl = gsap.timeline({paused: true});

  gsap.set(scope + '.hairline', {scaleX: 0});
  // The original moved bullets on X, not Y — they slide in from the right, they do not
  // rise. Keep it that way; it is what distinguishes this scene from the title.
  gsap.set(scope + '.bullet', {opacity: 0, x: 28});

  // interpolate(frame, [0, 0.5 * fps], [0, 1]) on the hairline's horizontal scale.
  tl.to(scope + '.hairline', {scaleX: 1, duration: 0.5, ease: 'none'}, 0);

  // The original staggered by INDEX, not wall-clock:
  //   [(0.5 + i * staggerSeconds) * fps, (1 + i * staggerSeconds) * fps]
  // which is a 0.5 s fade per bullet, starting at 0.5 s, 0.3 s apart. GSAP's stagger is
  // the same thing expressed once, and gsap.utils.toArray keeps it a real per-element
  // tween rather than one tween over a group.
  tl.to(
    gsap.utils.toArray(scope + '.bullet'),
    {opacity: 1, x: 0, duration: 0.5, ease: 'none', stagger: 0.3},
    0.5,
  );

  tl.set({}, {}, seconds);
  return tl;
};
