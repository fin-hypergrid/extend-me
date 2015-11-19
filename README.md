# extend-me
Yet another Backbone-like class extender

## Synopsis

```javascript
var extend = require('extend-me');

function Parabola() {}

Parabola.extend = extend;

Parabola.initialize = function (a, b) { this.a = a; this.b = b; };
Parabola.prototype.func = function(x) { return this.a * Math.pow(x, 2) + (this.b * x); };

var ParabolaWithIntercept = Parabola.extend({
    initialize: function(a, b, c) {
        this.c = c;
    },
    func: function(x) {
        return this.super.pow.apply(this, arguments) + this.c;
    }
}

```

\[See the note [Regarding submodules](https://github.com/openfin/rectangular#regarding-submodules)
for important information on cloning this repo or re-purposing its build template.\]

## API documentation

Detailed API docs can be found [here](http://openfin.github.io/extend-me/extend-me.html).
