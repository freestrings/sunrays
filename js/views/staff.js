define(['config', 'fabric', 'views/utils', 'views/clef'], 
    function(Config, fabric, Utils, Clef) {

    var THICKNESS = 1;

    /**
     * @parameter: {fabric.Canvas} canvas
     * @parameter: {integer} numLines The staff line count
     * @parameter: {Staff.Type} The clef's type
     **/
    function Staff(parameters) {
        parameters.readOnly = !parameters.readOnly !== false;
        this.parameters = parameters;
        this.lines = [];
        this.draw();
    };

    Staff.Types = Clef.Types;

    (function() {

        this.calcTop = function() {
            var p = this.parameters;
            return parseInt((p.canvas.height - p.numLines * Config.LINE_HEIGHT) / 2, 10);
        }

        this.getCenterY = function() {
            return this.calcTop() + (this.parameters.numLines * Config.LINE_HEIGHT)/2 - Config.LINE_HEIGHT/2;
        }

        this._setClef = function() {
            var p = this.parameters;

            this.clef = new Clef({
                clefType: p.type
            });

            var self = this;
            this.clef.setPositionProvider(function(line) {
                return {
                    x: 10,
                    y: self.getY(line, self.calcTop())
                };
            });
            
            p.canvas.add(this.clef);
        }

        this.destroy = function() {
            var canvas = this.parameters.canvas;
            if(this.lines.length > 0) {
                this.lines.forEach(function(line) {
                    canvas.remove(line);
                });
                this.lines = [];
            }
            if(this.clef) { canvas.remove(this.clef); }
        }

        this.getY = function(num, top) {
            return num * Config.LINE_HEIGHT + top;
        }

        this.draw = function() {
            var p = this.parameters;
            var canvas = p.canvas;
            var top = this.calcTop();

            this.destroy();

            var i, y, line;
            for(i = 0 ; i < p.numLines ; i++) {
                y = this.getY(i, top);
                line = new fabric.Line([0, y, canvas.width, y], {
                  fill: Config.LINE_FILLSTYLE,
                  stroke: Config.LINE_FILLSTYLE,
                  strokeWidth: THICKNESS,
                  selectable: false
                });
                this.lines.push(line);
                canvas.add(line);
            }

            this._setClef();
        }

    }).call(Staff.prototype);

    return Staff;
});

