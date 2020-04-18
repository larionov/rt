/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// represents a point
window.Point = class Point {
  // constructor
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  // get the length squared
  len_sq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  // get the length
  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  // return the sum of this and another point
  plus(other) {
    return new Point(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  // return the difference of this and another point
  minus(other) {
    return new Point(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  // return the dot product of this and another point
  dot(other) {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  // return the cross product of this and another point
  cross(other) {
    return new Point(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x
    );
  }

  // return a times version of the vector
  times(s) {
    return new Point(this.x * s, this.y * s, this.z * s);
  }

  // normalize the vector
  normalized() {
    const len_inv = 1 / this.len();
    return new Point(this.x * len_inv, this.y * len_inv, this.z * len_inv);
  }
};

// represents a ray
window.Ray = class Ray {
  // constructor
  constructor(origin, dir) {
    this.origin = origin;
    this.dir = dir;
  }
};

// represents a color
window.Color = class Color {
  // constructor (component values must lie in range [0, 1])
  constructor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  // returns a CSS-compatible string
  to_str() {
    return (
      "rgb(" +
      String(Math.round(this.r * 255)) +
      ", " +
      String(Math.round(this.g * 255)) +
      ", " +
      String(Math.round(this.b * 255)) +
      ")"
    );
  }

  // return the sum of this and another color
  plus(other) {
    return new Color(
      Math.min(this.r + other.r, 1),
      Math.min(this.g + other.g, 1),
      Math.min(this.b + other.b, 1)
    );
  }

  // return a times version of the color
  times(s) {
    return new Color(
      Math.max(Math.min(this.r * s, 1), 0),
      Math.max(Math.min(this.g * s, 1), 0),
      Math.max(Math.min(this.b * s, 1), 0)
    );
  }
};

// represents the surface properties of an object
window.Material = class Material {
  // constructor
  constructor(color, texture_url, scale) {
    // load the texture if necessary
    this.color = color;
    this.texture_url = texture_url;
    this.scale = scale;
    this.texture_loaded = false;
    if (this.texture_url) {
      this.canvas = document.createElement("canvas");
      this.context = this.canvas.getContext("2d");
      this.image_data = null;
      const self = this;
      $("<img />")
        .attr("src", this.texture_url)
        .load(function () {
          if (
            this.complete &&
            typeof this.naturalWidth !== "undefined" &&
            this.naturalWidth !== 0
          ) {
            self.canvas.width = this.naturalWidth;
            self.canvas.height = this.naturalHeight;
            self.context.clearRect(0, 0, this.naturalWidth, this.naturalHeight);
            self.context.drawImage(this, 0, 0);
            self.image_data = self.context.getImageData(
              0,
              0,
              this.naturalWidth,
              this.naturalHeight
            );
            return (self.texture_loaded = true);
          }
        });
    }
  }

  // determine the surface color
  shade(tx, ty) {
    // sample the texture if necessary
    if (this.texture_loaded) {
      tx *= this.scale;
      ty *= this.scale;
      if (tx < 0) {
        tx = 1 + (tx % 1);
      } else {
        tx %= 1;
      }
      if (ty < 0) {
        ty = 1 + (ty % 1);
      } else {
        ty %= 1;
      }
      tx = Math.floor(tx * this.canvas.width);
      ty = Math.floor(ty * this.canvas.height);
      const offset = (ty * this.canvas.width + tx) * 4;
      return new Color(
        this.image_data.data[offset] / 255,
        this.image_data.data[offset + 1] / 255,
        this.image_data.data[offset + 2] / 255
      );
    }
    return this.color;
  }
};

// represents the result of an intersection
window.Hit = class Hit {
  // constructor
  constructor(t, tx, ty, material) {
    this.t = t;
    this.tx = tx;
    this.ty = ty;
    this.material = material;
  }
};

// a list of objects in the scene (see objects.js.coffee)
window.scene_graph = [];

// device information
window.device = {
  // the canvas context
  context: null,

  // the x position of the render region in the canvas
  x: 0,

  // the y position of the render region in the canvas
  y: 0,

  // the width of the render region in the canvas
  width: 100,

  // the height of the render region in the canvas
  height: 100,

  // the render quality (> 0)
  quality: 10,
};

// the camera
window.camera = {
  // the location of the camera in world-space
  pos: new Point(0, 0, 0),

  // a unit vector describing the forward direction of the camera
  aim: new Point(1, 0, 0),

  // a unit vector describing the left direction of the camera
  left: new Point(0, 1, 0),

  // a unit vector describing the up direction of the camera
  up: new Point(0, 0, 1),

  // horizontal field of view in radians
  fov: 1.57,

  // background color
  background_color: new Color(1, 1, 1),

  // fog settings
  fog_enabled: true,
  fog_distance: 50,
  fog_color: new Color(1, 1, 1),

  // aspect ratio (width/height)
  aspect: 1,
};

// sample the color at a point in screen space
const sample = function (x, y) {
  // compute which ray corresponds to this point
  const tmp = 2 * Math.tan(window.camera.fov * 0.5);
  const left = -(x / window.device.width - 0.5) * tmp;
  const up = (-(y / window.device.height - 0.5) * tmp) / window.camera.aspect;
  const dir = window.camera.aim
    .plus(window.camera.left.times(left))
    .plus(window.camera.up.times(up))
    .normalized();
  const ray = new Ray(window.camera.pos, dir);

  // intersect the ray with all the objects in the scene graph
  let hit = null;
  for (let item of window.scene_graph) {
    const test_hit = item.intersect(ray);
    if (test_hit !== null && (hit === null || test_hit.t < hit.t)) {
      hit = test_hit;
    }
  }

  // check if there was a hit
  if (hit === null) {
    return window.camera.background_color;
  } else {
    // perform shading
    let col = hit.material.shade(hit.tx, hit.ty);

    // apply fog
    if (window.camera.fog_enabled) {
      const fog_factor = Math.min(hit.t / window.camera.fog_distance, 1);
      col = col
        .times(1 - fog_factor)
        .plus(window.camera.fog_color.times(fog_factor));
    }

    // return the color
    return col;
  }
};

// render a piece of the scene
var render_block = function (x, y, width, height, samples, index) {
  // determine how many samples we need
  let s;
  const num_samples = Math.max(
    Math.min(
      Math.max(
        Math.round(((width * height) / 10000) * window.device.quality),
        3
      ),
      20
    ),
    samples.length
  );

  // determine if we need to collect more samples
  if (num_samples > samples.length) {
    const new_samples = num_samples - samples.length;
    const sample_area = (width * height) / new_samples;
    const columns = Math.round(width / Math.sqrt(sample_area));
    const rows = Math.ceil(new_samples / columns);
    const cell_width = width / columns;
    const cell_height = height / rows;

    // perform the sampling
    for (
      let i = 0, end = new_samples, asc = 0 <= end;
      asc ? i < end : i > end;
      asc ? i++ : i--
    ) {
      const the_x = x + ((i % columns) + 0.5) * cell_width;
      const the_y = y + (Math.floor(i / columns) + 0.5) * cell_height;
      const the_sample = sample(the_x, the_y).times(1);
      the_sample.x = the_x;
      the_sample.y = the_y;
      the_sample.index = index;
      samples.push(the_sample);
    }
  }

  // average the samples
  const average = new Color(0, 0, 0);
  for (s of samples) {
    average.r += s.r;
    average.g += s.g;
    average.b += s.b;
  }
  average.r /= num_samples;
  average.g /= num_samples;
  average.b /= num_samples;

  // compute the standard deviation
  let std_dev = 0;
  for (s of samples) {
    std_dev +=
      Math.pow(s.r - average.r, 2) +
      Math.pow(s.g - average.g, 2) +
      Math.pow(s.b - average.b, 2);
  }
  std_dev = Math.sqrt(std_dev / num_samples);

  // if the standard deviation is small, just draw a rectangle whose color is the mean above
  if (std_dev < 1 / window.device.quality || width * height <= 64) {
    window.device.context.fillStyle = average.to_str();
    return window.device.context.fillRect(
      x - 0.5,
      y - 0.5,
      width + 1,
      height + 1
    );
  } else {
    // split the rectangle in half and recurse on each half
    let threshold;
    if (width > height) {
      threshold = x + width * 0.5;
      render_block(
        x,
        y,
        width * 0.5,
        height,
        samples.filter((e) => e.x < threshold),
        index + 1
      );
      return render_block(
        x + width * 0.5,
        y,
        width * 0.5,
        height,
        samples.filter((e) => e.x >= threshold),
        index + 1
      );
    } else {
      threshold = y + height * 0.5;
      render_block(
        x,
        y,
        width,
        height * 0.5,
        samples.filter((e) => e.y < threshold),
        index + 1
      );
      return render_block(
        x,
        y + height * 0.5,
        width,
        height * 0.5,
        samples.filter((e) => e.y >= threshold),
        index + 1
      );
    }
  }
};

// render the scene
window.render = () =>
  // render the scene as a huge block
  render_block(device.x, device.y, device.width, device.height, [], 0);
