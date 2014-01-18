define(['_', 'fabric'], function(_, fabric) {

    var MIN_STEM_HEIGHT = 35;
    var MAX_SLOPE = 0.15;
    var STEM_WIDTH = 2;

    function lineFunc(x, x1, y1, slope) {
        return (slope * (x - x1) + y1);
    }

    function shortLineFunc(x1, y1, slope) {
        return function(x) {
            return lineFunc(x, x1, y1, slope);
        };
    }

    function getSlope(min, max) {
        var s = (max.y - min.y)/(max.x - min.x);
        return isNaN(s) ? 0 : s > 0 ? Math.min(MAX_SLOPE, s) : Math.max(MAX_SLOPE * -1, s);
    }

    var reverseCompare = function(a, b) {
        if (a.x < b.x) return 1;
        if (b.x < a.x) return -1;
        return 0;
    }

    /**
     * notes {Note}
     */
    var Beam = fabric.util.createClass(fabric.Object, {
        type: 'beam',
        initialize: function(options) {
            options = options || {};
            this.callSuper('initialize', options);
            this.markAsBeamed(true);
            this.calcBound();
            var y1 = this.calcBeamBound('top');
            var y2 = this.calcBeamBound('bottom');
            var topDist = this.center - _.min(y1, 'y').y;
            var bottomDist = _.max(y2, 'y').y - this.center;
            this.isReverse = topDist > bottomDist;
            this.Y = this.isReverse ? y2 : y1;
        },
        markAsBeamed: function(value) {
            _.forEach(this.notes, function(note) {
                note.set('isBeamed', value);
            });
        },
        calcBound: function() {
            this.base = this._getNotePosition(0);
            this.set('left', this.base.x);
            this.set('top', this.base.y);
            this.set('width', 1);
            this.set('height', 1);
        },
        calcBeamBound: function(dir) {
            var nodes = _.map(this.notes, function(note) {
                return { 
                    y: dir === 'top' ? note.getTopNode().y : note.getRootNode().y, 
                    x: note.left,
                    beat: note.beat
                };
            });

            var reverseNodes = _.clone(nodes).sort(reverseCompare);
            var maxNode = _.max(reverseNodes, 'y');
            var slope = getSlope(_.min(reverseNodes, 'y'), maxNode);

            var Y = shortLineFunc(maxNode.x, maxNode.y - MIN_STEM_HEIGHT, slope);

            var minY = MIN_STEM_HEIGHT, value;
            _.forEach(nodes, _.bind(function(n) {
                value = dir === 'top' ? n.y - Y(n.x) : Y(n.x) - n.y;
                minY = Math.min(value, minY);
            }, this));
            
            var adjY = MIN_STEM_HEIGHT - minY;
            var ret = _.map(nodes, _.bind(function(n) {
                var x2 = n.x + 10;
                var x3 = n.x - 10;
                var r = {
                    x: n.x,
                    x2: x2,
                    x3: x3,
                    y1: n.y,
                    beat: n.beat
                }
                if(dir === 'top') {
                    r.y = Y(n.x) - adjY;
                    r.y2 = Y(x2) - adjY;
                    r.y3 = Y(x3) - adjY;
                } else {
                    r.y = Y(n.x) + adjY;
                    r.y2 = Y(x2) + adjY;
                    r.y3 = Y(x3) + adjY;
                }
                return r;
            }, this));

            return ret;
        },
        _getNotePosition: function(idx) {
            var note = this.notes[idx];
            var headWidth = note.getHeadWidth();
            var left = note.getHeadLeft(note.isNested, note.isReverse)*(note.isReverse ? 0 : -1);
            var top = note.getStemHeight();
            var x = note.left;
            var y = note.top;
            return {
                x: x, y: y
            };
        },
        _getNoteTransPosition: function(idx) {
            var p = this._getNotePosition(idx);
            return {
                x: p.x - this.base.x,
                y: p.y - this.base.y
            }
        },

        _drawBeam: function(ctx, idx, beamIdx, isHalf, isEndHalf) {
            ctx.beginPath();
            var w = STEM_WIDTH, hw = this.notes[0].getHeadWidth();
            var p = this.Y[idx];
            var x = p.x - this.base.x
            var y = p.y - this.base.y;
            var inc = beamIdx * 6;
            if(isEndHalf) {
                x += 2;
            }
            if(this.isReverse) {
                x -= hw/2;
                y -= inc;
            } else {
                x += hw/2 - w;
                y += inc;
            }
            ctx.moveTo(x, y);

            if(isEndHalf) {
                x = p.x3 - this.base.x;
                y = p.y3 - this.base.y;
            } else if(isHalf) {
                x = p.x2 - this.base.x;
                y = p.y2 - this.base.y;
            } else {
                p = this.Y[idx + 1];
                x = p.x - this.base.x;
                y = p.y - this.base.y;
            }

            if(this.isReverse) {
                x -= hw/2 - 2;
                y -= inc;
            } else {
                x += hw/2 - w + 2;
                y += inc;
            }
            ctx.lineTo(x, y);
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.closePath();
        },

        _drawBeams: function(ctx, idx, x, y) {

            if(this.Y[idx+1]) {
                var p1 = this.Y[idx];
                var p2 = this.Y[idx+1];
                var beat1 = p1.beat;
                var beat2 = p2.beat;
                var b = 8;
                var beamIdx = 0;
                while(b <= beat1) {
                    this._drawBeam(ctx, idx, beamIdx, !(b <= p2.beat));
                    b *= 2;
                    beamIdx++;
                }
            } else {
                var p1 = this.Y[idx];
                var p2 = this.Y[idx-1];
                var beat1 = p1.beat;
                var beat2 = p2.beat;
                var b = 8;
                var beamIdx = 0;
                while(b <= beat1) {
                    if(b > p2.beat) {
                        this._drawBeam(ctx, idx, beamIdx, null, true);
                    }
                    b *= 2;
                    beamIdx++;
                }
            }
        },

        _drawStem: function(ctx) {
            var x, y, p, h, w = STEM_WIDTH, hw = this.notes[0].getHeadWidth();
            for(var i = 0 ; i < this.Y.length ; i++) {
                ctx.beginPath();

                p = this.Y[i];
                x = p.x - this.base.x;
                y = p.y - this.base.y;
                h = p.y - p.y1;

                x = this.isReverse ? x - hw/2 : x + hw/2 - w;

                ctx.fillRect(x, y, STEM_WIDTH, h * -1);
                ctx.closePath();

                this._drawBeams(ctx, i, x, y);
            }
        },

        _render: function(ctx) {
            ctx.save();
            this._drawStem(ctx);
            ctx.restore();
        }
    });

    return Beam;
});