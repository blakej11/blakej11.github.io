/*
 * Starts and stops the stained glass process, and selects images.
 */
var photo;		// The original image.
var glass;		// The Glass object.
var paused = true;	// Whether we're paused or stepping forward.
var loaded = false;	// Whether an original image is loaded.

var scale = 1.0;	// Current complexity level for image.
var slider;		// Allows adjusting the complexity level.
var pausebutton;	// The DOM element for the play/pause button.
var finishbutton;	// The DOM element for the finish button.
var canvas;		// The canvas that images are drawn upon.

/* ------------------------------------------------------------------ */

// Sets "paused", and updates the play/pause icon.
function setpaused(pause) {
  paused = pause;

  if (pause) {
    pausebutton.html('<i class="fas fa-play"></i>');
  } else {
    pausebutton.html('<i class="fas fa-pause"></i>');
  }
}

// Called when a new base image has been successfully loaded.
function loadedPhoto(img) {
  pixelDensity(1.0);
  resizeCanvas(img.width, img.height);
  image(img, 0, 0);

  /*
   * This lets the CSS for the containing div set the size of the image,
   * which in turn allows it to resize with the size of the window.
   */
  canvas.style('width', '');
  canvas.style('height', '');

  photo = img;
  glass = new Glass(photo, scale);
  setpaused(true);
  loaded = true;
}

// Called when a new base image has been selected.
function loadPhoto(file) {
  if (file.type === 'image') {
    loaded = false;	// loadedPhoto() sets this to true when it's done.
    loadImage(file.data, loadedPhoto);
  }
}

// Display the original image.
function showOriginal() {
  if (loaded) {
    image(photo, 0, 0);
    glass = new Glass(photo, scale);
    setpaused(true);
  }
}

// Start the stained glass process afresh, showing one pane at a time.
function restart() {
  if (loaded) {
    glass = new Glass(photo, scale);
    setpaused(false);
  }
}

// Pause the stained glass process.
function togglepause() {
  if (loaded) {
    setpaused(!paused);
  }
}

// Finish rendering the current window as quickly as possible.
function finish() {
  if (loaded) {
    if (glass.finished()) {
      glass = new Glass(photo, scale);
    }
    // finishbutton.html('<i class="fas fa-spinner"></i>');
    glass.addPanes();
    // finishbutton.html('<i class="fas fa-forward"></i>');
    setpaused(true);
  }
}

// Save the current stained glass window.
function savePhoto() {
  if (loaded) {
    saveCanvas("glass.png");
  }
}

/* ------------------------------------------------------------------ */

// Main hook for Processing: called each time the window is refreshed.
function draw() {
  if (loaded) {
    let v = slider.value();
    if (v != scale) {
      scale = v;
      glass.rescale(scale);
    }
    if (!paused && !glass.finished()) {
      glass.addOnePane();
    }
  }
}

// Main hook for Processing: called at initialization.
function setup() {
  var b;

  canvas = createCanvas(1, 1);
  canvas.parent('sketch');

  loadImage("mona.jpg", loadedPhoto);

  /*
   * This lets the user select a file, without having the default file input
   * text: the actual file input element is hidden, while an adjacent button
   * triggers a virtual click of the file input.
   */
  b = createFileInput(loadPhoto);
  b.id('realinput');
  b.style('display: none;');
  b.parent('upload');
  b = createButton('<i class="fas fa-upload"></i>');
  b.attribute('onclick', "document.getElementById('realinput').click();");
  b.parent('upload');

  b = createButton('<i class="fas fa-image"></i>');
  b.mousePressed(showOriginal).parent('original');
  b = createButton('<i class="fas fa-backward"></i>');
  b.mousePressed(restart).parent('restart');
  b = createButton('<i class="fas fa-play"></i>');
  b.mousePressed(togglepause).parent('pause');
  pausebutton = b;
  b = createButton('<i class="fas fa-forward"></i>');
  b.mousePressed(finish).parent('finish');
  finishbutton = b;
  b = createButton('<i class="fas fa-download"></i>');
  b.mousePressed(savePhoto).parent('download');

  slider = createSlider(0.2, 2, 1, 0.01).parent('slider');
}
