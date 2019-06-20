/*
 * This class manages the top-level Pane and handles the interaction with the
 * ImageSampler.
 */
class Glass {
  constructor(photo, scale = 1.0) {
    this.width = photo.width;
    this.height = photo.height;

    /*
     * When I did the first version of this, in a circle, I found that a good
     * upper bound on the number of panes was reached when the total length of
     * all the line segments equalled the square of the radius.  I approximate
     * that here by taking the average of the image's width and height, and
     * dividing that by two, to get from something like a diameter to a radius.
     *
     * Providing a value for "scale" can change this amount.
     */
    const radius = (this.width + this.height) / 4;
    this.totalLength = (radius * radius);
    this.scale = scale;

    this.root = new Pane();
    this.root.addVertex(0, 0);
    this.root.addVertex(0, this.height);
    this.root.addVertex(this.width, this.height);
    this.root.addVertex(this.width, 0);
    this.root.lastVertex();

    this.sampler = new ImageSampler(photo);
  }

  // internal method
  addPane(sampler) {
    let x = random(this.width);
    let y = random(this.height);
    let theta = random(2 * PI);
    this.root.split(x, y, theta, sampler);
  }

  // Change the complexity scaling parameter. 1.0 is the default value.
  rescale(scale) {
    this.scale = scale;
  }

  // Returns true when the drawing is finished.
  finished() {
    return (this.root.length >= this.totalLength * this.scale);
  }

  /*
   * Add one new pane.  This is optimized for being called from draw(),
   * to see incremental progress.  Returns true when the drawing is done.
   */
  addOnePane() {
    if (!this.finished()) {
      this.addPane(this.sampler);
    }
    return (this.finished());
  }

  /*
   * Create all of the new panes, and then render them all.
   * This is optimized for minimal total time.
   */
  addPanes() {
    do {
      this.addPane(null);
    } while (!this.finished());
    this.root.render(this.sampler);
  }
}
