
## Turing clouds - background and how it works

Since this system is built on top of several other ideas, it takes a while
to cross all of the [inferential
distance](https://wiki.lesswrong.com/wiki/Inferential_distance) when I'm
talking about it in person.  So this is my attempt to explain it in more
depth for those who want to understand how it works.

It all starts with a paper that Alan Turing wrote in 1952.

### Turing's original model

After Turing had established the foundations of computer science and
[helped break the German Enigma
cipher](https://en.wikipedia.org/wiki/Cryptanalysis_of_the_Enigma) during
World War II, his interest turned to biology.  One of his last published
papers was titled [The chemical basis of
morphogenesis](https://doi.org/10.1098/rstb.1952.0012) (PDF
[here](http://www.dna.caltech.edu/courses/cs191/paperscs191/turing.pdf)).
This paper proposed a model for biological systems might develop striped or
spotted patterns, such as on a zebra or a leopard.

To get the basic intuition behind Turing's model, imagine a flat surface
with two chemicals, an "activator" and an "inhibitor", diffusing through
across it at different rates.  (You can imagine this taking place in the
real world across the skin of an animal.)  In locations where there is more
of the activator than the inhibitor, the activator creates more of itself
as well as more of the inhibitor, and it creates a different color (such as
a black spot or stripe).  In locations where there is more of the inhibitor
than the activator, some of each is destroyed, and no color change happens.
Turing showed that this leads to regularly spaced patterns, with the
details of the patterns depending on the exact diffusion rates.  As of
2019, it hasn't been demonstrated that this is actually the model at work
in any biological system, but it has been shown to work in a chemical
system.

### Jonathan McCabe's multi-scale patterns

In 2010, Jonathan McCabe wrote a
[paper](http://www.jonathanmccabe.com/Cyclic_Symmetric_Multi-Scale_Turing_Patterns.pdf)
describing a simple way to simulate Turing's model on a computer, and a
tweak to that model that led to startling visual patterns.

The simulation follows the general format of a [reaction-diffusion
system](https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system).
Create a grid of numbers, where each entry in the grid has a value between
-1 and 1.  The value indicates the difference between the amount of
activator and inhibitor chemical at that grid location.  The system evolves
by simulating the diffusion, and then modeling the reaction of the diffused
chemicals.  To simulate diffusion, take the average value of all grid
locations within a fixed radius of a given cell; larger radii correspond to
faster diffusion rates, because a cell's value is affecting a broader range
of other cells.  In the Turing reaction, activators and inhibitors diffuse
at different rates, which corresponds to taking averages over different
radii.  To simulate the reaction, compare those two averages; if the result
is positive, increase the current cell's value slightly, and if it's
negative, decrease the cell's value slightly.  Finally, color each pixel
based on the corresponding cell's new value: a value of -1 yields a black
pixel, +1 yields a white one, and anything in between uses the
corresponding greyscale value.

The following images are a few examples of this kind of system:

| | | |
|:---:|:---:|:---:|
| ![](images/intro/bw-2scale-1.png) | ![](images/intro/bw-2scale-2.png) | ![](images/intro/bw-2scale-3.png) |

McCabe also pointed out that instead of just looking at the results from a
pair of radii, he proposed looking at more than one pair at once.  By
running multiple virtual reactions on the same system (using different
radii for each reaction), and adding the results together, you can get
patterns that look like stripes made of spots.

But the more interesting observation comes from a different way of
combining the results of multiple reactions. Instead of simply adding
the results together, his system updates the value of the cell based on
which pair of radii has the smallest difference. In practice, this seems to
constantly add instability to the system, and it yields images with
fractal-like detail and a strong biological character.  Here's a
characteristic example:

![](images/intro/bw-multiscale.png#center)

### Adding color by using vectors

I was captivated when I discovered this system a couple years ago.  As with
the [Mandelbrot set](https://en.wikipedia.org/wiki/Mandelbrot_set) back in
the day, I found it amazing that such a simple system could generate such
visual complexity.  But this system would have been unusably slow to
implement back in the days of
[Fractint](https://en.wikipedia.org/wiki/Fractint). A single timestep takes
O(W * H * R^2) time to calculate, using a naive implementation, and the
radius R can be a substantial fraction of the image's width W or height H.

Even on a modern computer, this isn't a fast operation. The first
implementation I found, in the reaction-diffusion modeling system
[Ready](https://github.com/GollyGang/ready), only generated a few 512x512
images per second. It takes quite a while to see how the system evolves
when it's going at that rate. So that got me to start writing my own
implementation, first as a multi-threaded CPU operation, then once again as
a GPU client using OpenCL.

Once I had my own version to play with, I started wondering what this
system would look like if it were colored - or, for that matter, what it
would even mean to try to add color to it.  One of the early attempts was
vaguely reminiscent of a lava lamp:

![](images/intro/color-lava.png#center)

<iframe src="https://player.vimeo.com/video/356914126" width="640" height="360" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>

and that was fun, but ultimately not that satisfying.  Eventually, the
[ghost of Claude Shannon](https://en.wikipedia.org/wiki/Information_theory)
tapped me on the shoulder and pointed out that I wasn't likely to get
the full range of colors in a [three-dimensional color
system](https://en.wikipedia.org/wiki/Munsell_color_system) if I only had
one value per pixel.

Jason Rampe
[wrote](https://softologyblog.wordpress.com/2016/11/17/more-experiments-with-coupled-cellular-automata/)
about an approach he'd taken to colorizing multi-scale Turing patterns, but
he pointed out that it's suited for single-frame images rather than movies
because it changes drastically from frame to frame.  Since I had already
been aiming at creating an implementation that could create movies quickly,
I decided that wasn't the approach for me.

I decided to aim for a very straightforward extension of the multi-scale
algorithm, by letting each cell have a vector of data rather than just a
scalar, and reinterpreting the multi-scale algorithm to use vector
arithmetic.  This gave me a three-dimensional vector, contained within the
unit sphere, that I could try to turn into a color.  To my surprise, I
couldn't find a way to make those values look good, even after converting 
out of spherical coordinates.  The radius, which is basically the only
component in the black-and-white Turing patterns, was too visually dominant
in the vector version to be useful.  And if I just discarded it, I would
only have two values to work with.

So I tried four-dimensional vectors.  Although that gave me plenty of data
to work with, I was reluctant to discard the radius, since without it the
images looked totally unlike the black-and-white multi-scale patterns that
I started with.  Ultimately I decided that what I found was more compelling
than a colorized version of the original pattern, and it stuck.  Here's an
example:

![](images/intro/color-render.png#center)

### Visualizing the data directly

As I was playing with different ways to turn a vector into a color, I had
several occasions where I wanted to look more directly at the data.  Simple
histograms of each axis weren't very elucidating, so I made a 2-D "heatmap"
by projecting the 4-D data onto a plane, and using the pixel color to
represent how many 4-D data points mapped onto a given point in the plane.
Not only was this a useful debugging tool, it quickly became clear that the
heatmap was at least as visually interesting as the color rendering itself.  
The 4-D object that it shows bears some resemblance to a [strange
attractor](https://en.wikipedia.org/wiki/Attractor), but it also shifts
around in space as the system evolves.  The shifting, complex shape of
these objects inspired the name "Turing Clouds".

Here's what the previous image looks like in heatmap mode:

![](images/intro/color-render.png#center)

The ravioli-like shapes from the color rendition are visible as films
within the overall cloud of data.

### Interacting with the data

During the development of my GPU-based implementation, I came across a
paper by Aubrey Jaffer titled [Oseen Flow in Ink
Marbling](https://arxiv.org/pdf/1702.02106v1.pdf).  It describes the
dynamics of a system where a finite stroke is made within a liquid with
some viscosity, such as what you might do when creating [ink marbling
patterns](https://en.wikipedia.org/wiki/Paper_marbling).  This seemed like
a fun way to interact with my visualization, so I added support for it.
It treats mouse movements as strokes, and the result can wind up feeling
like finger painting using very surprising colors.  Here's an example,
created by just drawing a few spiral strokes in an existing image:

![](images/50/stroke/0024517.png#center)

There is also support for capturing an image using a connected camera, and
letting the system evolve starting at that image.  The results can be a bit
uncomfortable to look at!

There are several tunable parameters involved in generating an image.  They
can each be controlled by individual keystrokes, but there is also an
"autopilot" mode running by default which tunes the parameters occasionally
to keep the display interesting.

### Speed

As mentioned above, I had a goal of making this operate fast enough that I
could interact with it in real time.  A combination of lots of software
optimization plus modern graphics hardware has made that possible.  This
software can render full HD (1920x1080) at 15 fps on an AMD Radeon 570, and
at 20 fps (very nearly 30 fps) on an NVidia 1060; these are both fast
enough to be fun to interact with.  A 2016 MacBook Pro can get around 5 fps
running full-screen with just the built-in graphics hardware, which is just
fine for development and experimenting.
