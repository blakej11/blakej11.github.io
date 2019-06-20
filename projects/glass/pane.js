/*
 * This class represents a single convex region of the window.
 * It operates in two modes:
 * - If a Pane has no children, it can be displayed with a color.
 * - If a Pane has children, it passes all of its operations to its children.
 */
class Pane {
  constructor() {
    this.children = []
    this.vertices = []
    this.length = 0;
  }

  // Internal method to iterate over all edges.
  // Calls fn(ox, oy, nx, ny);
  iterateEdges(fn) {
    var ox, oy, nx, ny;
    [ ox, oy ] = this.vertices[0];
    for ([ nx, ny ] of this.vertices.slice(1)) {
      fn(ox, oy, nx, ny);
      ox = nx;
      oy = ny;
    }
    [ nx, ny ] = this.vertices[0];
    fn(ox, oy, nx, ny);
  }

  // A new vertex for this Pane.
  addVertex(x, y) {
    this.vertices.push([x, y]);
  }

  // Call this after the last vertex has been added.
  lastVertex() {
    let length = 0;
    this.iterateEdges((ax, ay, bx, by) => {
      var dx = bx - ax;
      var dy = by - ay;
      length += sqrt(dx * dx + dy * dy);
    });
    this.length = length;
  }

  /*
   * Does this Pane contain the point (x, y)?
   * Code taken from https://www.openprocessing.org/sketch/65627/
   */
  contains(x, y) {
    let angle = 0;
    this.iterateEdges((ax, ay, bx, by) => {
      ax -= x; ay -= y;
      bx -= x; by -= y;
      let ang = atan2(-bx, -by) - atan2(ax, ay);
      if (ang < 0) {
        ang += PI;
      } else {
	ang -= PI;
      }
      angle += ang;
    });
    return (abs(abs(angle) - PI * 2) < 0.01);
  }

  // Render this Pane, using "sampler" to get color data.
  render(sampler) {
    if (this.children.length > 0) {
      this.children[0].render(sampler);
      this.children[1].render(sampler);
    } else {
      beginShape();
      stroke(0, 255);
      strokeWeight(0.5);
      fill(sampler.getcolor(this.vertices));
      for (const [x, y] of this.vertices) {
	vertex(x, y);
      }
      endShape(CLOSE);
    }
  }

  /*
   * Split this Pane with a line through (x, y) at angle theta.
   * If "sampler" is non-null, render the new panes.
   */
  split(sx, sy, theta, sampler) {
    var newlen;

    if (this.children.length > 0) {
      if (this.children[0].contains(sx, sy)) {
	newlen = this.children[0].split(sx, sy, theta, sampler);
      } else {
	newlen = this.children[1].split(sx, sy, theta, sampler);
      }
    } else {
      this.children.push(new Pane());
      this.children.push(new Pane());

      let current = 0;		// start adding to child 0
      let linex = 0, liney = 0;	// for measuring length of new line
      let st = sin(theta);
      let ct = cos(theta);
      let children = this.children;

      this.iterateEdges((ax, ay, bx, by) => {

        // First, add the first vertex to the current child.
	children[current].addVertex(ax, ay);

	/*
	 * Next, determine whether there is a collision between the line
	 * from <ax,ay> to <bx,by> and the line through <sx,sy> at angle theta.
	 *
	 * The collision is found by solving the following equations:
	 *
	 *    y = m * x + b
	 *        m = ((by - ay) / (bx - ax))
	 *        b = ((ay * bx) - (ax * by)) / (bx - ax)
	 *
	 * and:
	 *
	 *    x = sx + t cos theta
	 *    y = sy + t sin theta
	 */
	let dx = bx - ax;
	let dy = by - ay;
	let t = (sx * dy - sy * dx + ay * bx - ax * by) / (dx * st - dy * ct);
	let cx = sx + t * ct;	// the collision point
	let cy = sy + t * st;
        let eps = 1e-8;

        /*
         * There is a collision if each element of <cx,cy> is between the
         * corresponding elements of <ax,ay> amd <bx,by>.  In practice,
         * floating-point math makes that a bit delicate to calculate.
         */
        if ((abs(dx) < eps || (ax < cx && cx < bx) || (ax > cx && cx > bx)) &&
            (abs(dy) < eps || (ay < cy && cy < by) || (ay > cy && cy > by))) {

          /*
           * Got one! We should add it to both children, and then switch
           * which child we're adding to.
           */
          children[current].addVertex(cx, cy);
          current ^= 1;
          children[current].addVertex(cx, cy);
          if (current == 1) {
	    linex = cx;
	    liney = cy;
          } else {
	    linex -= cx;
	    liney -= cy;
          }
        }
      });
      this.children[0].lastVertex();
      this.children[1].lastVertex();

      // There should be exactly two intersections.
      if (current == 1) {
        throw "Didn't find both intersections!";
      }

      // This is the length of the newly added line.
      newlen = sqrt(linex * linex + liney * liney);

      // If we're rendering incrementally, do that now.
      if (sampler !== null) {
        this.render(sampler);
      }
    }

    this.length += newlen;
    return (newlen);
  }
}
