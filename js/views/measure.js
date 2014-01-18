define(['_', 'config', 'views/note', 'views/beam'], function(_, Config, Note, Beam) {

    function WidthHandler(width, base) {
        this.width = width;
        this.base = base || 55;
        this.onWidthChanged();
    }

    (function() {

        this.onWidthChanged = function() {
            this.max = {};
            for(var i = 2, j = 0; i <= 128 ; i*=2, j++) {
                this.max[i] = this.base - (j * 8) + j;
            }
        }

        this.getWidth = function(beat) {
            return this.max[beat];
        }

        this.setBase = function(base) {
            this.base = base;
            this.onWidthChanged();
        }

    }).call(WidthHandler.prototype);

    function NoteWrap(parameters) {
        this.parameters = parameters;
        this.x = parameters.x;
        this.note = new Note({
            x: this.x
        });
    }

    NoteWrap.X = 100;

    (function() {

        this.setX = function(x) {
            this.x = x;
            this.note.set('x', x);
            this.note.calcBound();
            this.redraw();
        }

        this.getX = function() {
            return this.x;
        }

        this.setInfo = function(info, x) {
            this.note.set('beat', info.beat);
            x = x || this.x;
            if(this.note.isEmpty()) {
                this.setX(x);
            }
            this.note.calcBound();
            this.redraw();
        }

        this.add = function(y, position, hintInfos) {
            this.note.add(y, position, hintInfos);
            this.redraw();
        }

        this.get = function() {
            return this.note;
        }

        this.isEmpty = function() {
            return this.note.isEmpty();
        }

        this.redraw = function() {
            var p = this.parameters;
            p.canvas.remove(this.note);
            if(this.note.isEmpty()) {
                return;
            }
            p.canvas.add(this.note);
        }

    }).call(NoteWrap.prototype);

    function Measure(parameters) {
        this.parameters = parameters;
        var canvas = parameters.canvas;
        this.active = new NoteWrap({
            x: NoteWrap.X,
            canvas: canvas
        });
        this.wraps = [this.active];
        this.widthHandler = new WidthHandler(canvas.width);
        this.beams = [];
    }

    (function() {

        this._removeBeams = function() {
            _.forEach(this.beams, _.bind(function(b) {
                b.markAsBeamed(false);
                this.parameters.canvas.remove(b);
            }, this));
        }

        this._drawBeams = function(beams) {
            _.forEach(beams, _.bind(function(stack) {
                if(!stack || stack.length === 0 ) {
                    return;
                }
                var beam = new Beam({
                    notes: stack,
                    center: this.parameters.center
                });
                this.beams.push(beam);
                this.parameters.canvas.add(beam);
            }, this))
        }

        this.buildBeam = function() {

            this._removeBeams();

            var wraps = this.wraps;
            var stack = [], beams = [];
            var wrap, note, beatRate;
            for(var i = 0; i < wraps.length ; i++) {
                wrap = wraps[i];
                note = wrap.get();
                beatRate = 4/note.beat;
                if(beatRate < 1) {
                    stack.push(note);
                } else {
                    if(stack.length > 1) {
                        beams.push(stack);
                    }
                    stack = [];
                }
                var sum = 0;
                _.forEach(stack, function(n) {
                    sum += 4/n.beat;
                });
                if(sum >= 1) {
                    beams.push(stack);
                    stack = [];
                }
            }

            if(stack.length > 1) {
                beams.push(stack);
            }

            this._drawBeams(beams);
        }

        this.add = function(y, position, hintInfos) {
            this.active.add(y, position, hintInfos);
            this.buildBeam();
        }

        this.adjustDistance = function() {
            // TODO
        }

        this._moveRight = function() {
            if(this.active.isEmpty()) {
                return;
            }
            var idx = _.indexOf(this.wraps, this.active);
            if(this.wraps.length - 1 !== idx) {
                this.active = this.wraps[idx + 1];
                return;
            }

            var x = this.active.getX() + this.widthHandler.getWidth(this.info.beat);

            // TODO adjustDistance
            if(x > 970) {
                return;
            }

            var nw = new NoteWrap({
                x: x,
                canvas: this.parameters.canvas
            });
            nw.setInfo(this.info);
            this.active = nw;
            this.wraps.push(this.active);

            if(this.active.x / this.widthHandler.width > 0.9) {
                this.adjustDistance();
            }
        }

        this._moveLeft = function() {
            var idx = _.indexOf(this.wraps, this.active);
            if(idx === 0) {
                return;
            }
            this.active = this.wraps[idx - 1];
        }

        this.changeActive = function(dir) {
            if(dir === 'right') {
                this._moveRight();
            }
            if(dir === 'left') {
                this._moveLeft();
            }
        }

        this.onPaletteChanged = function(info) {
            this.info = info;
            var idx = _.indexOf(this.wraps, this.active);
            if(idx === 0) {
                this.active.setInfo(info, NoteWrap.X);
            } else {
                var prevX = this.wraps[idx-1].getX();
                var beatWidth = this.widthHandler.getWidth(this.info.beat);
                this.active.setInfo(info, prevX + beatWidth);
                if(!this.active.isEmpty()) {
                    this.buildBeam();
                }
            }
        }

        this.receiveActiveXPosition = function() {
            var self = this;
            return function(position) {
                return self.active.isEmpty() ? self.active.getX() : self.active.get().findBy({'position': position}).left;
            }
        }

    }).call(Measure.prototype); 

    return Measure;

});