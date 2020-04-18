window.Sphere = class Sphere {
  // constructor
  constructor(pos, radius, material) {
    this.pos = pos;
    this.radius = radius;
    this.material = material;
  }

  // intersect the object with a ray, returns a Hit object or null
  intersect(ray) {
    let t;
    const discriminant = (Math.pow(ray.dir.dot(ray.origin.minus(this.pos)), 2) - ray.origin.minus(this.pos).len_sq()) + Math.pow(this.radius, 2);
    if (discriminant < 0) {
      return null;
    }
    const t1 = -ray.dir.dot(ray.origin.minus(this.pos)) - Math.sqrt(discriminant);
    const t2 = -ray.dir.dot(ray.origin.minus(this.pos)) + Math.sqrt(discriminant);
    if (t2 <= 0) {
      return null;
    }
    if (t1 > 0) {
      t = t1;
    } else {
      t = t2;
    }
    const p = ray.origin.plus(ray.dir.times(t)).minus(this.pos);
    return new Hit(t, 0.5 + ((Math.atan2(p.x, p.y) * 0.5) / Math.PI), 0.5 - (Math.asin(p.z / this.radius) / Math.PI), this.material);
  }
};

window.Plane = class Plane {
  // constructor
  constructor(pos, normal, material) {
    this.pos = pos;
    this.normal = normal;
    this.material = material;
  }

  // intersect the object with a ray, returns a Hit object or null
  intersect(ray) {
    let n1;
    const denom = ray.dir.dot(this.normal);
    if (denom === 0) {
      return null;
    }
    const t = this.pos.minus(ray.origin).dot(this.normal) / denom;
    if (t <= 0) {
      return null;
    }
    const p = ray.origin.plus(ray.dir.times(t));
    if ((this.normal.z > 0.9) || (this.normal.z < -0.9)) {
      n1 = this.normal.cross(new Point(0, 1, 0)).normalized();
    } else {
      n1 = this.normal.cross(new Point(0, 0, 1)).normalized();
    }
    const n2 = this.normal.cross(n1);
    const pp = p.minus(this.pos);
    const tx = pp.dot(n1);
    const ty = pp.dot(n2);
    return new Hit(t, tx, ty, this.material);
  }
};

window.Rectangle = class Rectangle {
  // constructor
  constructor(p1, p2, p3, p4, material) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
    this.material = material;
    this.normal = this.p4.minus(this.p1).cross(this.p2.minus(this.p1)).normalized();
  }

  // intersect the object with a ray, returns a Hit object or null
  intersect(ray) {
    // proceed as if the rectangle was a plane
    const denom = ray.dir.dot(this.normal);
    if (denom === 0) {
      return null;
    }
    const t = this.p1.minus(ray.origin).dot(this.normal) / denom;
    if (t <= 0) {
      return null;
    }

    // make sure the intersection point is in the rectangle
    const p = ray.origin.plus(ray.dir.times(t));
    if (p.minus(this.p1).dot(this.p4.minus(this.p1)) < 0) {
      return null;
    }
    if (p.minus(this.p2).dot(this.p1.minus(this.p2)) < 0) {
      return null;
    }
    if (p.minus(this.p3).dot(this.p2.minus(this.p3)) < 0) {
      return null;
    }
    if (p.minus(this.p4).dot(this.p3.minus(this.p4)) < 0) {
      return null;
    }

    // calculate the texture coordinates
    const n1 = this.p2.minus(this.p1).normalized();
    const n2 = this.p4.minus(this.p1).normalized();
    const pp = p.minus(this.p1);
    const tx = pp.dot(n1) / this.p2.minus(this.p1).dot(n1);
    const ty = pp.dot(n2) / this.p4.minus(this.p1).dot(n2);

    // return the hit
    return new Hit(t, tx, ty, this.material);
  }
};
