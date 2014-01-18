requirejs.config({
    baseUrl: '/js',
    paths : {
        'EventEmitter': 'vendor/EventEmitter',
        '_': 'http://cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.min',
        'fabric' : "http://cdnjs.cloudflare.com/ajax/libs/fabric.js/1.4.0/fabric.min",
        '_vex': 'vendor/vex/vex',
        '_flow': 'vendor/vex/flow',
        '_glyph': 'vendor/vex/glyph',
        '_vex_gonville_all': 'vendor/vex/fonts/gonville_all'
    },
    shim: {
        'fabric': {
            exports: 'fabric'
        },
        '_vex': {
            exports: 'Vex'
        },
        '_flow': {
            deps: ['_vex'],
            exports: 'Vex'
        },
        '_vex_gonville_all': {
            deps: ['_flow'],
            exports: 'Vex'
        },
        '_glyph': {
            deps: ['_flow'],
            exports: 'Vex'
        }
    },
    urlArgs: "v=" + Date.now()
});

requirejs(['views/sunrays'], function(sunraysView) {
    sunraysView.initialize();
});

