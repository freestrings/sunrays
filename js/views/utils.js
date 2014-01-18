define(['config', '_', 'views/vex'], function(Config, _, Vex) {

    // http://jsfiddle.net/4VCVX/3/
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
        for(var i=0; i<41; i++) {
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

    function calcOutline(x_pos, y_pos, point, val, nocache) {

        var scale = point * 72.0 / (Vex.Flow.Font.resolution * 100.0);
        var metrics = Vex.Flow.Glyph.loadMetrics(Vex.Flow.Font, val, !nocache);
        var outline = metrics.outline;
        var outlineLength = outline.length;
        var rect = {
            x1: x_pos, y1: y_pos, x2: x_pos, y2: y_pos
        };
        var x, y, x1, y1, x2, y2, _r;
        for (var i = 0; i < outlineLength; ) {
            var action = outline[i++];
            switch(action) {
                case 'm':
                    x = x_pos + outline[i++] * scale;
                    y = y_pos + outline[i++] * -scale;
                    rect.x1 = Math.min(rect.x1, x);
                    rect.y1 = Math.min(rect.y1, y);
                    rect.x2 = Math.max(rect.x2, x);
                    rect.y2 = Math.max(rect.y2, y);
                    break;
                case 'l':
                    x = x_pos + outline[i++] * scale;
                    y = y_pos + outline[i++] * -scale;
                    rect.x1 = Math.min(rect.x1, x);
                    rect.y1 = Math.min(rect.y1, y);
                    rect.x2 = Math.max(rect.x2, x);
                    rect.y2 = Math.max(rect.y2, y);
                    break;
                // case 'q': //http://jsfiddle.net/CC5un/6/light/
                //   break;
                case 'b':
                    x = x_pos + outline[i++] * scale;
                    y = y_pos + outline[i++] * -scale;
                    x1 = x_pos + outline[i++] * scale;
                    y1 = y_pos + outline[i++] * -scale;
                    x2 = x_pos + outline[i++] * scale;
                    y2 = y_pos + outline[i++] * -scale;
                    _r = getCurveBounds(x_pos, y_pos, x1, y1, x2, y2,x, y);
                    rect.x1 = Math.min(rect.x1, _r.x);
                    rect.y1 = Math.min(rect.y1, _r.y);
                    rect.x2 = Math.max(rect.x2, _r.x + _r.width);
                    rect.y2 = Math.max(rect.y2, _r.y + _r.height);
                    break;
            }
        }
        return rect;
    }

    function calcRect() {

        var args = _.toArray(arguments);
        var x = args.shift();
        var y = args.shift();
        var rect = {
            x1: x, y1: y, x2: x, y2: y
        };

        _.forEach(args, function(obj) {
            if(!obj.x1) {
                return;
            }
            rect.x1 = min(rect.x1, obj.x1);
            rect.y1 = min(rect.y1, obj.y1);
            rect.x2 = max(rect.x2, obj.x2);
            rect.y2 = max(rect.y2, obj.y2);
        });
        return rect;
    }

    return {
        renderGlyph: Vex.Flow.renderGlyph,
        calcOutline: calcOutline,
        calcRect: calcRect
    };
});