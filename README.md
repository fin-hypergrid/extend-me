# extend-me
Yet another Backbone-like class extender

**Version 2.0 has a breaking changes:**
1. `this.super` has been removed as it suffered the "grandchild" problem; use `YourBaseClass.prototype` instead.
2. The `.initializeOwn` method has been renamed to `.postInitialize`.

## Synopsis

```javascript
var Base = require('extend-me').Base;

var Parabola = Base.extend({
    initialize: function (a, b) {
        this.a = a;
        this.b = b;
    },
    calculate: function(x) {
        return this.a * Math.pow(x, 2) + (this.b * x);
    }
});

var ParabolaWithIntercept = Parabola.extend({
    initialize: function(a, b, c) {
        this.c = c;
    },
    calculate: function(x) {
        var y = Parabola.prototype.calculate.apply(this, arguments);
        return y + this.c;
    }
});

var parabola = new ParabolaWithIntercept(3, 2, 1),
    y = ParabolaWithIntercept(-3); // yields 22
```

### Constructors

The `initialize` methods at each level of inheritance are the constructors.
Instantiating a derived class will automatically call `initialize` on all ancestor
classes that implement it, starting with the most distant ancestor all the way to
and inclucing the derived class in question.

If you intend to instantiate the base class (`Parabola` in the above) directly
(_i.e.,_ it is not "abstract"), include the following in the constructor:

```javascript
function Parabola() {
    this.initialize.apply(this, arguments);
}
```

To add initialization code to be executed before or after this chain of `initialize`
calls, you an define methods `preInitialize` and `postInitialize`.

## API documentation

Detailed API docs can be found [here](http://openfin.github.io/extend-me/extend-me.html).

## Regarding the git submodule `jsdoc-template`

See the note [Regarding submodules](https://github.com/openfin/rectangular#regarding-submodules)
for important information on cloning this repo or re-purposing its build template.
