/*
 * Some objects to make the display easier to work with.
 */

class Toggle {
  constructor(defval, ficon, ftext, ticon, ttext, cb) {
    this.ficon = ficon;
    this.ftext = ftext;
    this.ticon = ticon;
    this.ttext = ttext;

    var id = ficon + ticon;	// just generating a name
    createDiv().id(id).parent('controls').class('tooltip');

    var icon = (defval ? ticon : ficon);
    this.button = createButton('');
    this.button.parent(id).mousePressed(this.toggle.bind(this));

    this.textdiv = createElement('span', '');
    this.textdiv.parent(id).class('tooltiptext');

    this.cb = cb;

    this.setstate(defval);
  }

  value() {
    return (this.state);
  }

  setstate(state) {
    if (state) {
      this.button.html('<i class="fas fa-' + this.ficon + '"></i>');
      this.textdiv.html(this.ftext);
    } else {
      this.button.html('<i class="fas fa-' + this.ticon + '"></i>');
      this.textdiv.html(this.ttext);
    }

    if (this.cb !== undefined) {
      this.cb(state);
    }

    this.state = state;
  }

  toggle() {
    this.setstate(!this.state);
  }
}

/* ------------------------------------------------------------------ */

class Button {
  constructor(tttext, icon, cb) {
    var id = icon;	// just generating a name

    createDiv().id(id).parent('controls').class('tooltip');
    var b = createButton('<i class="fas ' + icon + '"></i>');
    b.parent(id).mousePressed(cb);
    createElement('span', tttext).parent(id).class('tooltiptext');
  }
}

/* ------------------------------------------------------------------ */

class Slider {
  constructor(bound, value, name) {
    var id = 'slider' + name;
    var d = createDiv().parent('sliders').id(id);
    var s = createElement('span', '').parent(id).class('slider');
    var sl = createSlider(-bound, bound, value, 0.01).parent(id);

    this.textspan = s;
    this.slider = sl;
    this.lockpos = value;

    this.name(name);
  }

  name(txt) {
    this.textspan.html('Rate of ' + txt);
  }

  adjvalue(dv) {
    this.lockpos += dv;
    this.slider.value(this.lockpos);
  }

  value() {
    return (this.slider.value());
  }

  setlocked(lock) {
    if (lock) {
      this.lockpos = this.slider.value();
    } else {
      this.lockpos = 0;
    }
  }

  lockdelta() {
    var dv = this.slider.value() - this.lockpos;
    if (abs(dv) < 0.00000001) {
      dv = 0;
    }
    return (dv);
  }

  delete() {
    this.slider.parent().remove();
  }
}

/* ------------------------------------------------------------------ */

class Sliders {
  constructor(nr, ratebound, reactionname) {
    this.nr = nr;
    this.ratebound = ratebound;
    this.sliders = [];
    this.reactionname = reactionname;

    for (var r = 0; r < nr; r++) {
      this.sliders.push(new Slider(ratebound, 0, reactionname(r, nr)));
    }
  }

  // Rename slider r.
  name(r) {
    this.sliders[r].name(this.reactionname(r, this.nr));
  }

  // Get the value of slider r.
  value(r) {
    return (this.sliders[r].value());
  }

  // Add a new slider.
  push() {
    var value = 0;
    for (var r = 0; r < this.nr; r++) {
      value += this.value(r);
    }
    value /= this.nr;

    this.nr++;

    this.sliders.push(new Slider(this.ratebound, value,
      this.reactionname(this.nr - 1, this.nr)));

    // Update the text of the previous slider.
    this.name(this.nr - 2);
  }

  // Remove the final slider.
  pop() {
    if (this.nr > 2) {
      this.nr--;

      // Remove the slider for the last reagent.
      this.sliders[this.nr].delete();
      this.sliders.pop();

      // Update the text of the newly final slider.
      this.name(this.nr - 1);

      return (true);
    }
    return (false);
  }

  lock(lock) {
    for (var r = 0; r < this.nr; r++) {
      this.sliders[r].setlocked(lock);
    }
  }

  adjustlocked() {
    for (var r = 0; r < this.nr; r++) {
      var dv = this.sliders[r].lockdelta();
      if (dv != 0) {
	for (var nr = 0; nr < this.nr; nr++) {
	  this.sliders[nr].adjvalue(dv);
	}
	return;
      }
    }
  }
}
