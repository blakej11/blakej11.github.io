/*
 * A simulation of a Belousov-Zhabotinsky reaction.
 *
 * This model comes from Alasdair Turner's paper "A Simple Model of the
 * Belousov-Zhabotinsky Reaction from First Principles".  It starts with the
 * model:
 * 
 *	A + B -> 2A  (proceeds at rate a)
 *	B + C -> 2B  (proceeds at rate b)
 *	C + A -> 2C  (proceeds at rate c)
 * 
 * and converts that into a time-step model:
 * 
 *	A_(t+1) = A_t + A_t * (a * B_t - c * C_t)
 *	B_(t+1) = B_t + B_t * (b * C_t - a * A_t)
 *	C_(t+1) = C_t + C_t * (c * A_t - b * B_t)
 * 
 * The quantity of A at time t+1 is increased according to the amount of B
 * present, but is decreased according to the amount of C present.
 */

var Copies = 2;			// How many copies of the image to keep.
var Width = 400;		// Width of the image.
var Height = 400;		// Height of the image.
var Reagents = 3;		// Initial number of reagents.

var Boxrad = 1;			// Radius for box blur, in pixels.
var Ratebound = 7;      	// Bound for reaction rate. Higher = wider.

/* ------------------------------------------------------------------ */

var Data = [ [], [] ];		// [Copies][H][W][Reagents]

function data_init() {
  for (var w = 0; w < Copies; w++) {
    Data[w] = new Array(Height);
    for (y = 0; y < Height; y++) {
      Data[w][y] = new Array(Width);
      for (x = 0; x < Width; x++) {
	Data[w][y][x] = new Array(Reagents);
      }
    }
  }
}

function data_push(fn) {
  for (var w = 0; w < Copies; w++) {
    for (y = 0; y < Height; y++) {
      for (x = 0; x < Width; x++) {
	Data[w][y][x].push(fn());
      }
    }
  }
  Reagents++;
}

function data_pop() {
  Reagents--;
  for (var w = 0; w < Copies; w++) {
    for (y = 0; y < Height; y++) {
      for (x = 0; x < Width; x++) {
	Data[w][y][x].pop();
      }
    }
  }
}

function data_set(fn) {
  for (var w = 0; w < Copies; w++) {
    for (var y = 0; y < Height; y++) {
      for (var x = 0; x < Width; x++) {
	for (var r = 0; r < Reagents; r++) {
	  var d = Data[w][y][x][r];
	  Data[w][y][x][r] = fn(d);
	}
      }
    }
  }
}

/* ------------------------------------------------------------------ */

var Rates;			// Sliders for reaction rates.
var Paused;			// Toggle for pause button.
var Locked;			// Toggle for lock button.
var Frames;			// How many frames have rendered.

function setup() {
  createCanvas(Width, Height).parent('sketch');

  // Create the data arrays, and initialize them with noise.
  data_init();
  data_set((d) => { return (random(0.0, 1.0)); });

  // Create the reaction rate sliders.
  Rates = new Sliders(Reagents, Ratebound, (r, nr) => {
    function agent(r) { return (char('A'.charCodeAt() + r)); }
    var a = agent(r), b = agent((r + 1) % nr);
    return (a + ' + ' + b + ' -> 2' + b);
  });

  // Create the control buttons.
  new Button('Randomize image', 'fa-random', () => {
    data_set((d) => { return (random(0.0, 1.0)); });
  });

  Paused = new Toggle(false, 'pause', 'Pause', 'play', 'Continue');

  Locked = new Toggle(false,
    'lock-open', 'Rates unlocked<br/>(click to lock together)',
    'lock', 'Rates locked together<br/>(click to unlock)',
    Rates.lock.bind(Rates));

  new Button('Add reagent', 'fa-plus-circle', () => {
    Rates.push();
    data_push(() => { return (random(0.0, 1.0)); });
  });

  new Button('Remove reagent', 'fa-minus-circle', () => {
    if (Rates.pop()) {
      data_pop();
    }
  });

  new Button('What\'s going on here?', 'fa-question', () => {
    window.open("README.html");
  });

  // Prepare to draw.
  Frames = 0;
  background(0);
  colorMode(RGB, 1.0);
}


function draw() {
  var oldframe = Frames % Copies;	// which frame to read old data from
  Frames++;
  var newframe = Frames % Copies;	// which frame to write data into

  if (Locked.value()) {
    Rates.adjustlocked();
  }
  if (Paused.value()) {
    return;
  }

  var tune = new Array(Reagents);	// current values of tunable parameters
  var o = new Array(Reagents);		// average of old data points
  var n = new Array(Reagents);		// new data points
  var r;				// loop index over reagents
  var boxsize = float((2 * Boxrad + 1) * (2 * Boxrad + 1));

  // Get the current values of the reaction rates.
  for (r = 0; r < Reagents; r++) {
    tune[r] = pow(1.4, Rates.value(r));
  }

  // For each pixel...
  for (var y = 0; y < Height; y++) {
    for (var x = 0; x < Width; x++) {

      // Average across the surrounding data points.
      for (r = 0; r < Reagents; r++) {
        o[r] = 0;
      }
      for (var j = y - Boxrad; j <= y + Boxrad; j++) {
	var h = (j + Height) % Height;
	for (var i = x - Boxrad; i <= x + Boxrad; i++) {
          var w = (i + Width) % Width;
          for (r = 0; r < Reagents; r++) {
            o[r] += Data[oldframe][h][w][r];
          }
        }
      }
      for (r = 0; r < Reagents; r++) {
        o[r] /= boxsize;
      }

      // Take the next BZ step.
      for (r = 0; r < Reagents; r++) {
        n[r] = o[r] + o[r] *
            (tune[(r+0) % Reagents] * o[(r+1) % Reagents] -
             tune[(r+1) % Reagents] * o[(r+2) % Reagents]);
        n[r] = constrain(n[r], 0, 1);
        Data[newframe][y][x][r] = n[r];
      }

      // Set the pixel's color based on the levels of the first three reagents.
      set(x, y, color(n[0], n[1], n[2]));
    }
  }

  updatePixels();
}
