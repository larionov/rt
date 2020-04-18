/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// browser-independent way to schedule the next frame
const requestAnimFrame =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  ((callback) => window.setTimeout(callback, 1000 / 60));

$(document).ready(function () {
  // total framebuffer resolution
  let width = null;
  let height = null;

  // set the canvas size
  const framebuffer = document.getElementById("framebuffer");
  const context = framebuffer.getContext("2d");

  // resize handler
  $(window).resize(function () {
    width = $(window).innerWidth();
    height = $(window).innerHeight();
    framebuffer.width = width;
    framebuffer.height = height;
    window.device.width = width;
    window.device.height = height;
    $("#framebuffer").width($(window).innerWidth());
    $("#framebuffer").height($(window).innerHeight());
    return (window.camera.aspect = width / height);
  });
  $(window).resize();

  // keyboard input
  let key_w = false;
  let key_s = false;
  let key_a = false;
  let key_d = false;
  let key_q = false;
  let key_up = false;
  let key_down = false;
  let key_left = false;
  let key_right = false;
  $(window).keydown(function (e) {
    if (e.which === "W".charCodeAt(0)) {
      key_w = true;
    }
    if (e.which === "S".charCodeAt(0)) {
      key_s = true;
    }
    if (e.which === "A".charCodeAt(0)) {
      key_a = true;
    }
    if (e.which === "D".charCodeAt(0)) {
      key_d = true;
    }
    if (e.which === "Q".charCodeAt(0)) {
      key_q = true;
    }
    if (e.which === 38) {
      key_up = true;
    }
    if (e.which === 40) {
      key_down = true;
    }
    if (e.which === 37) {
      key_left = true;
    }
    if (e.which === 39) {
      return (key_right = true);
    }
  });
  $(window).keyup(function (e) {
    if (e.which === "W".charCodeAt(0)) {
      key_w = false;
    }
    if (e.which === "S".charCodeAt(0)) {
      key_s = false;
    }
    if (e.which === "A".charCodeAt(0)) {
      key_a = false;
    }
    if (e.which === "D".charCodeAt(0)) {
      key_d = false;
    }
    if (e.which === "Q".charCodeAt(0)) {
      key_q = false;
    }
    if (e.which === 38) {
      key_up = false;
    }
    if (e.which === 40) {
      key_down = false;
    }
    if (e.which === 37) {
      key_left = false;
    }
    if (e.which === 39) {
      return (key_right = false);
    }
  });

  // set up the scene
  device.context = context;
  camera.pos.z = 1;
  const ground_size = 5;
  const fence_height = 3;
  const sky_height = 10;
  scene_graph.push(
    new Plane(
      new Point(0, 0, sky_height),
      new Point(0, 0, -1),
      new Material(new Color(0, 0, 0), "sky.jpg", 0.05)
    )
  );
  scene_graph.push(
    new Rectangle(
      new Point(-4 * ground_size, 2.35 * ground_size, 0),
      new Point(4 * ground_size, 2.35 * ground_size, 0),
      new Point(4 * ground_size, -2.35 * ground_size, 0),
      new Point(-4 * ground_size, -2.35 * ground_size, 0),
      new Material(new Color(0, 0, 0), "court.jpg", 1)
    )
  );
  scene_graph.push(
    new Rectangle(
      new Point(-4 * ground_size, 2.35 * ground_size, fence_height),
      new Point(4 * ground_size, 2.35 * ground_size, fence_height),
      new Point(4 * ground_size, 2.35 * ground_size, 0),
      new Point(-4 * ground_size, 2.35 * ground_size, 0),
      new Material(new Color(0, 0, 0), "fence.jpg", 1)
    )
  );
  scene_graph.push(
    new Rectangle(
      new Point(4 * ground_size, -2.35 * ground_size, fence_height),
      new Point(-4 * ground_size, -2.35 * ground_size, fence_height),
      new Point(-4 * ground_size, -2.35 * ground_size, 0),
      new Point(4 * ground_size, -2.35 * ground_size, 0),
      new Material(new Color(0, 0, 0), "fence.jpg", 1)
    )
  );
  scene_graph.push(
    new Rectangle(
      new Point(-4 * ground_size, -2.35 * ground_size, fence_height),
      new Point(-4 * ground_size, 2.35 * ground_size, fence_height),
      new Point(-4 * ground_size, 2.35 * ground_size, 0),
      new Point(-4 * ground_size, -2.35 * ground_size, 0),
      new Material(new Color(0, 0, 0), "fence.jpg", 1)
    )
  );
  scene_graph.push(
    new Rectangle(
      new Point(4 * ground_size, 2.35 * ground_size, fence_height),
      new Point(4 * ground_size, -2.35 * ground_size, fence_height),
      new Point(4 * ground_size, -2.35 * ground_size, 0),
      new Point(4 * ground_size, 2.35 * ground_size, 0),
      new Material(new Color(0, 0, 0), "fence.jpg", 1)
    )
  );

  // camera state
  let theta = 0;
  const phi = 0;
  const acceleration_factor = 100;
  const decceleration_factor = 20;
  let velocity = new Point(0, 0, 0);
  const max_velocity = 16;

  // the time when the last frame was rendered
  let time = new Date().getTime() - 1000 / 30;

  // desired framerate
  const desired_fps = 25;

  // render
  var render_frame = function () {
    // calculate the time elapsed
    const new_time = new Date().getTime();
    const dt = Math.max(new_time - time, 1) * 0.001;
    time = new_time;

    // input
    let acceleration = new Point(0, 0, 0);
    if (key_w || key_up) {
      acceleration = acceleration.plus(
        new Point(Math.cos(theta), Math.sin(theta), 0)
          .times(max_velocity * 1.1)
          .minus(velocity)
          .normalized()
          .times(acceleration_factor)
      );
    }
    if (key_s || key_down) {
      acceleration = acceleration.plus(
        new Point(Math.cos(theta), Math.sin(theta), 0)
          .times(-max_velocity * 1.1)
          .minus(velocity)
          .normalized()
          .times(acceleration_factor)
      );
    }
    if (key_a) {
      acceleration = acceleration.plus(
        new Point(
          Math.cos(theta + Math.PI / 2),
          Math.sin(theta + Math.PI / 2),
          0
        )
          .times(max_velocity * 1.1)
          .minus(velocity)
          .normalized()
          .times(acceleration_factor)
      );
    }
    if (key_d) {
      acceleration = acceleration.plus(
        new Point(
          Math.cos(theta + Math.PI / 2),
          Math.sin(theta + Math.PI / 2),
          0
        )
          .times(-max_velocity * 1.1)
          .minus(velocity)
          .normalized()
          .times(acceleration_factor)
      );
    }
    if (acceleration.len() === 0) {
      if (velocity.len() < decceleration_factor * dt) {
        velocity = new Point(0, 0, 0);
      } else {
        velocity = velocity.plus(
          velocity.normalized().times(-decceleration_factor * dt)
        );
      }
    } else {
      velocity = velocity.plus(acceleration.times(dt));
    }
    if (velocity.len() > max_velocity) {
      velocity = velocity.normalized().times(max_velocity);
    }
    if (key_left) {
      theta += 1.5 * dt;
    }
    if (key_right) {
      theta -= 1.5 * dt;
    }

    // move the player
    camera.aim = new Point(
      Math.cos(theta) * Math.cos(phi),
      Math.sin(theta) * Math.cos(phi),
      Math.sin(phi)
    );
    camera.left = new Point(
      Math.cos(theta + Math.PI / 2),
      Math.sin(theta + Math.PI / 2),
      0
    );
    camera.up = new Point(
      Math.cos(theta) * Math.cos(phi + Math.PI / 2),
      Math.sin(theta) * Math.cos(phi + Math.PI / 2),
      Math.sin(phi + Math.PI / 2)
    );
    camera.pos = camera.pos.plus(velocity.times(dt));

    // restrict the player to the demo area
    if (camera.pos.x < -4 * ground_size * 0.95) {
      camera.pos.x = -4 * ground_size * 0.95;
    }
    if (camera.pos.x > 4 * ground_size * 0.95) {
      camera.pos.x = 4 * ground_size * 0.95;
    }
    if (camera.pos.y < -2.35 * ground_size * 0.95) {
      camera.pos.y = -2.35 * ground_size * 0.95;
    }
    if (camera.pos.y > 2.35 * ground_size * 0.95) {
      camera.pos.y = 2.35 * ground_size * 0.95;
    }

    // dynamically adjust the render quality to maintain constant framerate
    device.quality *=
      1 + Math.min(Math.max((1 / dt - desired_fps) * 0.01, -0.9), 0.9);
    device.quality = Math.min(Math.max(device.quality, 5), 100);

    // quality override
    if (key_q) {
      device.quality = 80;
    }

    // render the scene
    render();

    // ask the browser to render the next scene soon
    return requestAnimFrame(render_frame);
  };

  // render the first frame
  return render_frame();
});
