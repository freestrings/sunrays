define(['config', 'views/utils', 'views/staff'], function(Config, Utils) {

    var Types = {
        treble: 1,
        bass: 2,
        alto: 3,
        tenor: 4,
        percussion: 5
    };

    var Clef = fabric.util.createClass(fabric.Object, {
        type: 'clef',
        initialize: function(options) {
            options = options || {};
            options.selectable = false;
            this.callSuper('initialize', options);
        },

        _calcBound: function() {
            switch(this.clefType) {
                case Types.treble:
                    this._initTreble();
                    break;
            }
        },

        _initTreble: function() {
            this._val = 'v83';
            this._startLine = 3;
            var position = this.positionProvider.call(null, this._startLine);
            var rect = Utils.calcOutline(position.x, position.y + Config.LINE_HEIGHT * 4, Config.SCALE, this._val, true);
            // this._set("_rect", rect);
            this._set("left", Math.round(rect.x1));
            this._set("top", Math.round(rect.y1));
            this._set("width", Math.round(rect.x2 - rect.x1));
            this._set("height", Math.round(rect.y2 - rect.y1));
        },

        _render: function(ctx) {
            ctx.save();
            ctx.fillStyle = "#000";
            Utils.renderGlyph(ctx, 0, 0, Config.SCALE, this._val, true);
            ctx.restore();
        },

        setPositionProvider: function(provider) {
            this.positionProvider = provider;
            this._calcBound();
        }
    });

    Clef.Types = Types;

    return Clef;
});