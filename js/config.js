define([], function() {

    var debug = false;

    return {
        SCALE: 35,
        LINE_HEIGHT: 10,
        LINE_FILLSTYLE: "#999999",
        debug: debug,
        canvasOption: (function() {
            return debug ? {
                backgroundColor: "lightgray"
            } : {
                backgroundColor: "#fff"
            }
        })(),
        note: {
            debug: false
        }, 
        keyevent: {
            debug: false
        }
    }
});