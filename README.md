# extend-me
Yet another Backbone-like class extender

## Synopsis

Node.js / Browserify:

```javascript
var Base = require('extend-me').Base;
```

Browsers:
 
_The client can download directly from the GitHub CDN with one or the other of the following `<script>` tags:

```html
<script src="http://joneit.github.io/extend-me/extend-me.js"></script>
<script src="http://joneit.github.io/extend-me/extend-me.min.js"></script>
```

Usage:

```javascript
var MyClass = Base.extend({
    initialize: function () { ... },
    member1: ...,
    member2: ...
};

var MyChildClass = MyClass.extend({
    preInitialize: function () { ... },  // called before base class's initialize() */
    initialize: function () { ... },     // called after base class's initialize() and before derived class's initialize() */
    postInitialize: function () { ... }, // called after this class's initialize() */
    member1: ..., // overrides base class's definition of member1
    member3: ...
};

var a = new MyClass(), b = new MyChildClass();
```

## Example

```javascript
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
        var y = this.super.calculate.apply(this, arguments);
        return y + this.c;
    }
});

var parabola = new ParabolaWithIntercept(3, 2, 1),
    y = parabola.calculate(-3); // yields 22
```

### Constructors

You may optionally supply an `initialize` method to be called as your constructor.
It will be called on object instantiation with the same parameters as passed to the actual constructor.
 
## Initialization Chain

There may be `initialize` methods at each level of inheritance.
Instantiating a derived class will automatically call `initialize` on all ancestor
classes that implement it, starting with the most distant ancestor all the way up to
and including the derived class in question. Each `initialize` method is called
with the same parameters as passed to the constructor.

In the example above, on instantiation (`var paraboloa = new ParabolaWithIntercept(3, 2, 1)`),
`Parabola.prototype.initialize` is called first; then `ParabolaWithIntercept.prototype.initialize`.

To add initialization code to be executed _before_ and/or _after_ this chain of `initialize`
calls, you an define methods `preInitialize` and/or `postInitialize`, respectively. These are _not_
part of the initialization chain. They are only called on the object being instantiated;
they are not called when a derived class is being instantiated.
For example, in the sample usage above, if `MyClass` had had a `preInitialize` method,
it would be called on `a`'s intantiation but not `b`'s.

## Super

You can reference the immediate ancestor in the prototype chain with the `super`
(a getter on `Base`'s prototype), as shown in the example above.


### API documentation

Detailed API docs can be found [here](http://joneit.github.io/extend-me/extend-me.html).

### Demo

A demo can be found [here](http://joneit.github.io/extend-me/demo.html).

### Submodules

See the note [Regarding submodules](https://github.com/openfin/rectangular#regarding-submodules)
for important information on cloning this repo or re-purposing its build template.
