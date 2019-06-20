/*
 * A class for determining the average color of parts of a given image.
 */
class ImageSampler {
  constructor(photo) {
    this.photo = photo;
    this.gfx = createGraphics(photo.width, photo.height);
  }

  /*
   * Given a list of a polygon's vertices, calculate the average color
   * of the image within that polygon.
   */
  getcolor(vertices) {
    // Collect the minimum and maximum X and Y coordinates.
    let minx = photo.width;
    let miny = photo.height;
    let maxx = 0;
    let maxy = 0;

    // Draw the polygon in our internal graphics context.
    this.gfx.background(0, 0);
    this.gfx.fill(255, 255);
    this.gfx.beginShape();
    for (const [x, y] of vertices) {
      this.gfx.vertex(x, y);
      minx = min(floor(x), minx);
      miny = min(floor(y), miny);
      maxx = max(ceil(x), maxx);
      maxy = max(ceil(y), maxy);
    }
    /* this.gfx.endShape(); */	// see below for why this is commented out
    let dx = maxx - minx + 1;
    let dy = maxy - miny + 1;

    // Grab a copy of the original photo in the relevant rectangle.
    let masked = photo.get(minx, miny, dx, dy);
    masked.loadPixels();

    /*
     * Perform the masking operation.
     * 
     * On Chrome 71 and p5.js 0.7.2, this goes quite slow in some circumstances.
     * Specifically, in incremental mode, if we call this.gfx.endShape()
     * above (like we're supposed to), masked.mask() can take ~45 msec
     * even on small polygons.  Calling loadPixels() before masked.mask()
     * on the copy returned by this.gfx.get() causes all of the time to be
     * spent in loadPixels().
     *
     * So we ... just avoid calling endShape()?  Computers are terrible.
     */
    masked.mask(this.gfx.get(minx, miny, dx, dy));

    /*
     * Average the colors of the masked region.
     * The idea to square the pixel values comes from:
     * https://sighack.com/post/averaging-rgb-colors-the-right-way
     */
    var R = 0, G = 0, B = 0, A = 0;
    for (var y = 0; y < masked.height; y++) {
      for (var x = 0; x < masked.width; x++) {
        let idx = 4 * (y * masked.width + x);
        let r = masked.pixels[idx + 0];
        let g = masked.pixels[idx + 1];
        let b = masked.pixels[idx + 2];
        let a = masked.pixels[idx + 3];

        R += r * r * a;
        G += g * g * a;
        B += b * b * a;
        A += a;
      }
    }

    return (color(sqrt(R / A), sqrt(G / A), sqrt(B / A), 255));
  }
}
