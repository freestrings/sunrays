define(['_', 'config', 'views/keyevent', 'fabric', 'EventEmitter'], 
    function(_, Config, KeyEvent, fabric, EventEmitter) {

    function onKeyEnter(e) {
        if(!cursor || e.alt) return;
        Config.keyevent.debug && console.log("enter");

        var hintInfo = _.map(hints, function(hint) {
            return { top: hint.top };
        });
        EE.trigger(Event.CREATE, [cursor.top, calcPosition(), hintInfo]);

        var y = cursor.get('top');
        var x = receiveActiveXPosition(calcPosition(y));
        move(x, y);
    }

    function onKeyLeft() {
        if(!cursor) return;
        Config.keyevent.debug && console.log("left");

        EE.trigger(Event.MOVE_LEFT);

        if(!receiveActiveXPosition || !changeActive) {
            return ;
        }
        changeActive('left');
        var y = cursor.get('top');
        var oldX = cursor.get('left');
        var x = receiveActiveXPosition(calcPosition(y));
        move(x, y);
        if(x !== oldX) {
            removeHints();
        }
    }

    function onKeyRight() {
        if(!cursor) return;
        Config.keyevent.debug && console.log("right");

        EE.trigger(Event.MOVE_RIGHT);

        if(!receiveActiveXPosition || !changeActive) {
            return ;
        }
        changeActive('right');
        var y = cursor.get('top');
        var oldX = cursor.get('left');
        var x = receiveActiveXPosition(calcPosition(y));
        move(x, y);
        if(x !== oldX) {
            removeHints();
        }
    }

    function onKeyUp() {
        if(!cursor) return;
        Config.keyevent.debug && console.log("top");
        EE.trigger(Event.MOVE_UP);

        if(!receiveActiveXPosition) {
            return ;
        }

        var y = cursor.get('top') - movement;
        var x = receiveActiveXPosition(calcPosition(y));

        if(y <= top) {
            drawHint(x, y, true);
        }
        if(y >= bottom - movement) {
            drawHint(x, y, false);
        }
        if(y < minTop) {
            drawHint(x, maxTop, false);
            move(x, maxTop);
        } else {
            move(x, y);
        }
    }

    function onKeyDown() {
        if(!cursor) return;
        Config.keyevent.debug && console.log("down");

        EE.trigger(Event.MOVE_DOWN);

        if(!receiveActiveXPosition) {
            return ;
        }

        var y = cursor.get('top') + movement;
        var x = receiveActiveXPosition(calcPosition(y));
console.log(y, bottom)
        if(y <= top) {
            drawHint(x, y, true);
        }
        if(y >= bottom) {
            drawHint(x, y, false);
        }
        if(y > maxTop) {
            drawHint(x, minTop, true);
            move(x, minTop);
        } else {
            move(x, y);
        }
    }

    function cursorRefresh() {
        var y = cursor.get('top');
        var x = receiveActiveXPosition(calcPosition(y));
        move(x, y);
    }

    function move(_left, _top) {
        cursor.set("top", _top);
        cursor.set("left", _left);
        canvas.renderAll();
    }

    function drawHintLine(x1, x2, y) {
        var line;
        if(y % Config.LINE_HEIGHT !== 0) {
            line = new fabric.Line([x1, y, x2, y], {
                stroke: Config.LINE_FILLSTYLE,
                strokeWidth: 1,
                selectable: false
            });
            canvas.add(line);
            hints.push(line);
        }
    }

    function removeHints() {
        hints.forEach(function(hint) {
            canvas.remove(hint);
        });
    }

    function drawHint(_left, _top, isAbove) {

        removeHints();

        hints = [];

        var left = cursor.get('left');
        var x1 = left - Config.LINE_HEIGHT;
        var x2 = left + Config.LINE_HEIGHT;
        if(isAbove) {
            for(var i = _top ; i < top ; i+= movement) { drawHintLine(x1, x2, i); }
        } else {
            for(var i = bottom ; i <= _top ; i+= movement) { drawHintLine(x1, x2, i); }
        }
    }

    function calcPosition(top) {
        var cursorY = top || cursor.top;
        var position = (maxTop - cursorY) / movement;
        Config.keyevent.debug && console.log('top', cursor.top, 'position', position);
        return position;
    }

    /*
     * bug fix 1.4.0
     *  - The right-top corner broken.
     */
    function fixStrokeBug(_cursor) {
        _cursor._stroke = function(ctx) {
            ctx.save();
            this._setStrokeStyles(ctx);
            ctx.beginPath();
            ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.closePath();
            ctx.restore();
        }
    }

    function createCursor() {
        cursor = new fabric.Rect({
            top: top + Config.LINE_HEIGHT * 3,
            left: receiveActiveXPosition(),
            width: Config.LINE_HEIGHT + 3,
            height: Config.LINE_HEIGHT - 1,
            selectable: false,
            stroke: '#000',
            fill: '#FF8000',
            opacity: 0.5
        });

        fixStrokeBug(cursor);
        return cursor;
    }

    KeyEvent.on('13', onKeyEnter);
    KeyEvent.on('37', onKeyLeft);
    KeyEvent.on('39', onKeyRight);
    KeyEvent.on('38', onKeyUp);
    KeyEvent.on('40', onKeyDown);

    var movement = Config.LINE_HEIGHT / 2;
    var numLines = 5; //TODO remove. 5-> line count 
    var Event = {
        CREATE: 'create',
        MOVE_RIGHT: 'move_right',
        MOVE_LEFT: 'move_left',
        MOVE_UP: 'move_up',
        MOVE_DOWN: 'move_down'
    }
    var EE = new EventEmitter();
    var hints = [];
    var cursor, canvas;
    var top, // The top position of a staff.
        bottom, // The bottom position of a staff.
        minTop, // The hightest position of a hint line.
        maxTop; // The lowest position of a hint line.

    var receiveActiveXPosition, // A provider that provide the active cusor position.
        changeActive, // It must be called to get the x-position of the cursor before cursor drawing.
        onCreate; // The event listener of enter-key.

    var publics = {
        visible: function(visible) {
            if(visible) {
                cursor.set('opacity', 0.5);
                canvas.renderAll();
            } else {
                cursor.set('opacity', 0);
                canvas.renderAll();
            }
        },
        connect: function(measure) {
            receiveActiveXPosition = measure.receiveActiveXPosition();
            changeActive = _.bind(measure.changeActive, measure);

            if(onCreate) {
                EE.off(Event.CREATE, onCreate);
            }
            onCreate = _.bind(measure.add, measure);
            EE.on(Event.CREATE, onCreate);
        },
        create: function(_top, _canvas) {
            if(cursor) return;

            top = _top;
            bottom = _top + Config.LINE_HEIGHT * numLines - movement;
            minTop = -(Config.LINE_HEIGHT * (10 - 1)) + _top - movement;
            maxTop = Config.LINE_HEIGHT * (3 + numLines - 1) + _top - movement; 

            canvas = _canvas;
            canvas.add(createCursor());
        },
        onPaletteChanged: function(info) {
            cursorRefresh();
        },
        remove: function() {
            if(cursor && canvas) {
                canvas.remove(cursor);    
            }
            canvas = cursor = null;
            top = bottom = minTop = maxTop = NaN;
        },
        on: function(evtName, listener) {
            EE.on(evtName, listener);
        },
        off: function(evtName, listener) {
            EE.off(evtName, listener);
        },
        Event: Event
    }

    return _.clone(publics);
});

