define(['_', 'fabric', 'views/utils', 'config'], function(_, fabric, Utils, Config) {

    var FILLSTYLE = "#000";
    var NOTESTEM_HEIGHT = 30;
    var STEM_WIDTH = 2;

    var round = Math.round;
    var min = Math.min;
    var max = Math.max;

    /**
     * x {number}
     * y {number}
     * isReverse {boolean} if the higher than 'B', stem is reversed
     * isNested {boolean}  nested head
     * isBeamed {boolean}
     * beat {integer} beat 4 ~ 128, default value is 4.
     */
    var Note = fabric.util.createClass(fabric.Object, {
        type: 'note',
        initialize: function(options) {
            options = options || {};
            options.selectable = false;
            options.beat = !options.beat ? 4 : ~~options.beat;
            this.callSuper('initialize', options);
            this.notes = [];
            this.headBound = Utils.calcOutline(0, 0, Config.SCALE, this.getHeadGlyphCode(), true);
        },

        calcBound: function(y) {
            this.tailBound = this.beat > 4 ? 
                Utils.calcOutline(0, 0, Config.SCALE, this.getTailGlyphCode(), true):
                {x1: 0, y1: 0, x2: 0, y2: NOTESTEM_HEIGHT};

            this.set("left", this.x);
            this.set("top", y || this.top);
            this.set("width", 1);
            this.set("height", 1);
        },

        getTopNode: function() {
            return this.notes[this.notes.length - 1];
        },

        getRootNode: function() {
            return this.notes[0];
        },

        getHeadWidth: function() {
            return this.headBound.x2 - this.headBound.x1;
        },

        getHeadHeight: function() {
            return this.headBound.y2 - this.headBound.y1;
        },

        getHeadLeft: function(isNested, isReverse) {
            var headWidth = this.getHeadWidth();
            var x;
            if(!isNested) {
                x = headWidth/2 * -1;
            } else if(!isReverse) {
                x = headWidth/2 - 1;
            } else {
                x = (headWidth + headWidth/2) * -1;
                x += 2;
            }
            return x;
        },

        _drawHead: function(ctx, y, isNested) {
            ctx.beginPath();
            y = y - this.top;
            var x = this.getHeadLeft(isNested);
            Utils.renderGlyph(ctx, x, y, Config.SCALE, this.getHeadGlyphCode(), true);
            ctx.closePath();
        },

        _drawStem: function(ctx) {
            ctx.beginPath();
            var headWidth = this.getHeadWidth();

            var x, y, w = STEM_WIDTH, h = this.getStemHeight();
            if(!this.isReverse) {
                x = headWidth/2 - STEM_WIDTH;
                y = 0;
            } else {
                x = headWidth/2 * -1;
                y = this.getNoteDistance() * -1;
            }
            ctx.fillRect(x, y, w, h);
            ctx.closePath();
        },

        getNoteDistance: function() {
            return this.getRootNode().y - this.getTopNode().y;
        },

        getStemHeight: function() {
            var tailHeight = this.getTailGylphHeight();
            var noteDistance = this.getNoteDistance();
            noteDistance += 8;
            return !this.isReverse ? (noteDistance + tailHeight) * -1 : noteDistance + tailHeight;
        },

        getTailGylphHeight: function() {
            return (this.tailBound.y2 - this.tailBound.y1);
        },

        _drawTail: function(ctx) {
            ctx.beginPath();
            var code = this.getTailGlyphCode();
            if(!code) {
                return ;
            }
            var headWidth = this.getHeadWidth();
            var x = headWidth/2, y = this.getStemHeight();
            if(this.isReverse) {
                x = -x + STEM_WIDTH;
                y = y - this.getNoteDistance();
            }
            Utils.renderGlyph(ctx, x, y, Config.SCALE, code, true);
            ctx.closePath();
        },

        _drawHint: function(ctx, isNested, hints) {
            var x = this.getHeadLeft(isNested);
            var y, moveX = this.getHeadWidth();
            _.forEach(hints, _.bind(function(hint) {
                ctx.beginPath();
                y = hint.top - this.top;
                ctx.moveTo(x - moveX/2 + 2, y);
                ctx.lineTo(x + moveX + moveX/2 - 2, y);
                ctx.stroke();
                ctx.closePath();
            }, this));
        },

        _render: function(ctx) {
            ctx.save();
            ctx.fillStyle = FILLSTYLE;
            _.forEach(this.notes, _.bind(function(note) {
                this._drawHead(ctx, note.y, note.isNested);
                this._drawHint(ctx, note.isNested, note.hints);
            }, this));
            if(!this.isBeamed) {
                this._drawStem(ctx);
                this._drawTail(ctx);   
            }
            ctx.restore();
        },

        _adjustNested: function(nestedCount, i) {
            if(nestedCount <= 1) {
                return;
            }
            var isReverse = (!isReverse || nestedCount % 2 == 0) ? this.isReverse : !isReverse;
            for(var j = i - nestedCount ; j < i ; j++) {
                this.notes[j].isNested = isReverse;
                isReverse = !isReverse;
            }
        },

        _setReverse: function() {
            this.isReverse = this.getRootNode().position >= 9;
        },

        add: function(y, position, hintInfos) {
            if (_.find(this.notes, {position: position})) {
                return ;
            };

            this.notes.push({
                y: y, 
                position: position, 
                hints: hintInfos
            });

            this.notes = _.sortBy(this.notes, 'position');
            this._setReverse();
            this.calcBound(this.notes[0].y);

            var nestedCount = 1, curr, prev;
            for(var i = 1 ; i < this.notes.length ; i++) {
                curr = this.notes[i];
                prev = this.notes[i - 1];
                if(prev.position === curr.position - 1) {
                    nestedCount++;
                    continue;
                }
                this._adjustNested(nestedCount, i);
                nestedCount = 1;
            }
            this._adjustNested(nestedCount, i);
        },

        getHeadGlyphCode: function() {
            return 'vb';
        },

        getTailGlyphCode: function() {
            var code;
            switch(this.beat) {
                case 8: code = this.isReverse ? 'v9a' : 'v54'; break;
                case 16: code = this.isReverse ? 'v8f' : 'v3f'; break;
                case 32: code = this.isReverse ? 'v2a' : 'v47'; break;
                case 64: code = this.isReverse ? 'v58' : 'va9'; break;
                case 128: code = this.isReverse ? 'v30' : 'v9b'; break;
            }
            return code;
        },

        findBy: function(obj) {
            var n = _.clone(_.find(this.notes, obj) || {});
            n.left = this.x + this.getHeadLeft(n.isNested, this.isReverse) + this.getHeadWidth()/2;
            return n;
        },

        isEmpty: function() {
            return this.notes.length === 0;
        }
    });

    return Note;
});

