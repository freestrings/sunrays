define(
    ['_', 'config', 'fabric', 'views/staff', 'views/cursor', 'views/note', 'views/measure', 'EventEmitter', 'views/keyevent'], 
    function(_, Config, fabric, Staff, Cursor, Note, Measure, EventEmitter, KeyEvent) {

    fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

    var measures = [];
    var measure;

    function NoteButton(id, beat) {
        this.id = id;
        this.beat = parseInt(beat, 10);
        this.initCanvas();
    }

    NoteButton.Event = {
        BEAT_SELECTED: 'beat-selected'
    };

    (function() {

        this.initCanvas = function() {
            this.canvas = new fabric.Canvas(this.id, { selection: false, defaultCursor: 'hand' });
            this.note = new Note({x: 15, beat: this.beat});
            this.note.add(this.canvas.height - this.note.getHeadHeight(), 0);
            this.note.scale(0.5)
            this.canvas.add(this.note);
        }

        this.getBeat = function() {
            return this.note.beat;
        }

    }).call(NoteButton.prototype);


    function Palette() {
        this.EE = new EventEmitter();
        this.buttons = [];
        this.initialize();
    }

    (function() {

        this._initButton = function() {
            _.forEach(document.querySelectorAll("#palette canvas"), _.bind(function(c) {
                this.buttons.push(new NoteButton(c.id, c.getAttribute("data-beat")));
            }, this));
        }

        this.initialize = function() {

            this.canvas = new fabric.Canvas("mainCanvas", Config.canvasOption);
            this.canvas.hoverCursor = this.canvas.moveCursor = 'default';

            this.inputStaff = new Staff({
                canvas: this.canvas,
                numLines: 5,
                type: Staff.Types.treble,
                readOnly: false
            });

            measure = new Measure({
                canvas: this.canvas,
                width: this.canvas.width,
                center: this.inputStaff.getCenterY()
            });

            this.EE.on(NoteButton.Event.BEAT_SELECTED, function(beat) {
                measure.onPaletteChanged({
                    beat: beat
                })
            });

            this._initButton();

            Cursor.connect(measure);
            Cursor.create(this.inputStaff.calcTop(), this.canvas);

            $('body').on('click', '#palette a', _.bind(function(e) {
                $("#palette .active").removeClass("active");
                var beat = $(e.target).closest('a').addClass("active").find("canvas[data-beat]").attr('data-beat');
                beat = parseInt(beat, 10);
                this.beatSelect(beat);
            }, this));

            $("#note4").parent().click();

            $("#download").on("click", function() {
                Cursor.visible(false);
                var data = palette.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
                window.location.href = data;
                Cursor.visible(true);
            });
        },

        this.getInputStaff = function() {
            return this.inputStaff;
        },

        this.beatSelect = function(beat) {
            this.EE.trigger(NoteButton.Event.BEAT_SELECTED, [beat]);
        }
        
    }).call(Palette.prototype);

    var palette;

    return {
        initialize: function() {
            palette = new Palette;
        }
    }
});

