// Vex Flow
// Mohit Muthanna <mohit@muthanna.com>
//
// Copyright Mohit Muthanna 2010
//
// Requires a glyph font to be loaded and Vex.Flow.Font to be set.

/**
 * A quick and dirty static glyph renderer. Renders glyphs from the default
 * font defined in Vex.Flow.Font.
 *
 * @param {!Object} ctx The canvas context.
 * @param {number} x_pos X coordinate.
 * @param {number} y_pos Y coordinate.
 * @param {number} point The point size to use.
 * @param {string} val The glyph code in Vex.Flow.Font.
 * @param {boolean} nocache If set, disables caching of font outline.
 */
Vex.Flow.renderGlyph = function(ctx, x_pos, y_pos, point, val, nocache) {
  var scale = point * 72.0 / (Vex.Flow.Font.resolution * 100.0);
  var metrics = Vex.Flow.Glyph.loadMetrics(Vex.Flow.Font, val, !nocache);
  return Vex.Flow.Glyph.renderOutline(ctx, metrics.outline, scale, x_pos, y_pos);
};

/**
 * @constructor
 */
Vex.Flow.Glyph = (function() {
  function Glyph(code, point, options) {
    this.code = code;
    this.point = point;
    this.context = null;
    this.options = {
      cache: true,
      font: Vex.Flow.Font
    };

    this.width = null;
    this.metrics = null;
    this.x_shift = 0;
    this.y_shift = 0;

    if (options) this.setOptions(options); else this.reset();
  }

  Glyph.prototype = {
    setOptions: function(options) {
      Vex.Merge(this.options, options);
      this.reset();
    },

    setStave: function(stave) { this.stave = stave; return this; },
    setXShift: function(x_shift) { this.x_shift = x_shift; return this; },
    setYShift: function(y_shift) { this.y_shift = y_shift; return this; },
    setContext: function(context) { this.context = context; return this; },
    getContext: function() { return this.context; },

    reset: function() {
      this.metrics = Vex.Flow.Glyph.loadMetrics(this.options.font, this.code,
          this.options.cache);
      this.scale = this.point * 72 / (this.options.font.resolution * 100);
    },

    getMetrics: function() {
      if (!this.metrics) throw new Vex.RuntimeError("BadGlyph", "Glyph " +
          this.code + " is not initialized.");
      return {
        x_min: this.metrics.x_min * this.scale,
        x_max: this.metrics.x_max * this.scale,
        width: (this.metrics.x_max - this.metrics.x_min) * this.scale
      };
    },

    render: function(ctx, x_pos, y_pos) {
      if (!this.metrics) throw new Vex.RuntimeError("BadGlyph", "Glyph " +
          this.code + " is not initialized.");

      var outline = this.metrics.outline;
      var scale = this.scale;

      Glyph.renderOutline(ctx, outline, scale, x_pos, y_pos);
    },

    renderToStave: function(x) {
      if (!this.metrics) throw new Vex.RuntimeError("BadGlyph", "Glyph " +
          this.code + " is not initialized.");
      if (!this.stave) throw new Vex.RuntimeError("GlyphError", "No valid stave");
      if (!this.context) throw new Vex.RERR("GlyphError", "No valid context");

      var outline = this.metrics.outline;
      var scale = this.scale;

      Glyph.renderOutline(this.context, outline, scale,
          x + this.x_shift, this.stave.getYForGlyphs() + this.y_shift);
    }
  };

  /* Static methods used to implement loading / unloading of glyphs */
  Glyph.loadMetrics = function(font, code, cache) {
    var glyph = font.glyphs[code];
    if (!glyph) throw new Vex.RuntimeError("BadGlyph", "Glyph " + code +
        " does not exist in font.");

    var x_min = glyph.x_min;
    var x_max = glyph.x_max;

    var outline;

    if (glyph.o) {
      if (cache) {
        if (glyph.cached_outline) {
          outline = glyph.cached_outline;
        } else {
          outline = glyph.o.split(' ');
          glyph.cached_outline = outline;
        }
      } else {
        if (glyph.cached_outline) delete glyph.cached_outline;
        outline = glyph.o.split(' ');
      }

      return {
        x_min: x_min,
        x_max: x_max,
        outline: outline
      };
    } else {
      throw new Vex.RuntimeError("BadGlyph", "Glyph " + this.code +
          " has no outline defined.");
    }
  };

  function getCurveBounds(ax, ay, bx, by, cx, cy, dx, dy) {
      var px, py, qx, qy, rx, ry, sx, sy, tx, ty,
          tobx, toby, tocx, tocy, todx, tody, toqx, toqy, torx, tory, totx, toty;
      var x, y, minx, miny, maxx, maxy;
      
      minx = miny = Number.POSITIVE_INFINITY;
      maxx = maxy = Number.NEGATIVE_INFINITY;
      
      tobx = bx - ax;  toby = by - ay;  // directions
      tocx = cx - bx;  tocy = cy - by;
      todx = dx - cx;  tody = dy - cy;
      step = 1/40;
      for(var i=0; i<41; i++)
      {
          var d = i*step;
          px = ax +d*tobx;  py = ay +d*toby;
          qx = bx +d*tocx;  qy = by +d*tocy;
          rx = cx +d*todx;  ry = cy +d*tody;
          toqx = qx - px;      toqy = qy - py;
          torx = rx - qx;      tory = ry - qy;
          
          sx = px +d*toqx;  sy = py +d*toqy;
          tx = qx +d*torx;  ty = qy +d*tory;
          totx = tx - sx;   toty = ty - sy;

          x = sx + d*totx;  y = sy + d*toty;
          
          minx = Math.min(minx, x); miny = Math.min(miny, y);
          maxx = Math.max(maxx, x); maxy = Math.max(maxy, y);
      }        
      return {x:minx, y:miny, width:maxx-minx, height:maxy-miny};
  }

  Glyph.renderOutline = function(ctx, outline, scale, x_pos, y_pos) {
    var outlineLength = outline.length;

    ctx.beginPath();

    ctx.moveTo(x_pos, y_pos);

    var rect = {
      x1: x_pos, y1: y_pos, x2: x_pos, y2: y_pos
    };

    for (var i = 0; i < outlineLength; ) {
      var action = outline[i++];

      switch(action) {
        case 'm':

          var x = x_pos + outline[i++] * scale;
          var y = y_pos + outline[i++] * -scale;

          ctx.moveTo(x, y);

          console.log(x_pos, x);
          rect.x1 = Math.min(rect.x1, x);
          rect.y1 = Math.min(rect.y1, y);
          rect.x2 = Math.max(rect.x2, x);
          rect.y2 = Math.max(rect.y2, y);

          break;
        case 'l':

          var x = x_pos + outline[i++] * scale;
          var y = y_pos + outline[i++] * -scale;

          ctx.lineTo(x, y);

          rect.x1 = Math.min(rect.x1, x);
          rect.y1 = Math.min(rect.y1, y);
          rect.x2 = Math.max(rect.x2, x);
          rect.y2 = Math.max(rect.y2, y);
          
          break;

        // case 'q':
        //   var cpx = x_pos + outline[i++] * scale;
        //   var cpy = y_pos + outline[i++] * -scale;

        //   ctx.quadraticCurveTo(
        //       x_pos + outline[i++] * scale,
        //       y_pos + outline[i++] * -scale, cpx, cpy);
        //   break;

        case 'b':
          var x = x_pos + outline[i++] * scale;
          var y = y_pos + outline[i++] * -scale;
          var x1 = x_pos + outline[i++] * scale;
          var y1 = y_pos + outline[i++] * -scale;
          var x2 = x_pos + outline[i++] * scale;
          var y2 = y_pos + outline[i++] * -scale;

          ctx.bezierCurveTo(x1, y1, x2, y2, x, y);

          var _r = getCurveBounds(x_pos, y_pos, x1, y1, x2, y2,x, y);

          rect.x1 = Math.min(rect.x1, _r.x);
          rect.y1 = Math.min(rect.y1, _r.y);
          rect.x2 = Math.max(rect.x2, _r.x + _r.width);
          rect.y2 = Math.max(rect.y2, _r.y + _r.height);

          break;
      }
    }
    ctx.fill();
    return rect;
  };

  return Glyph;
}());
