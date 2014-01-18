define(['config', 'EventEmitter'], function(Config, EventEmitter) {
    
    document.onkeydown = onKeyDown;

    var EE = new EventEmitter();

    function onKeyDown(e) {
        e = e || window.event;
        Config.keyevent.debug && console.log(e.keyCode);
        EE.trigger(e.keyCode, [{alt: e.altKey, ctrl: e.ctrlKey}]);
    }

    var listenerMap = {};

    return {
        on: function(key, listener) {
            EE.on(key, listener);
        },
        off: function(key, listener) {
            EE.off(key, listener);
        }
    }
});
