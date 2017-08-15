A class extender

### Update history

#### v2.5.0
* Added `parent(/*optional*/ancestorConstructorName)` to constructor to get the parent class's constructor or the named ancestor class's constructor.
* Now resets returned constructor's `name` to `extendedClassName` OR `prototypeAdditions.$$CLASS_NAME` in the prototype OR `prototypeAdditions.name`

#### v2.4.0
Previously, on instantiation, the `preInitialize` and `postInitialize` methods were called if and only if they were defined on the subclass's (extended object's) own prototype. This has been changed so that the "top" such methods on the prototype chain are now called, whether defined on the extended class or on an ancestor class. As before, these methods are called before and after the `initialize` cascade, respectively. Unlike `initialize`, however, there is no cascade; only the top most method is ever called.

This was an oversight and the workaround has been to forward the calls by redefining new methods with these names whose sole function was to forward the call to `this.super`. This change is backwards compatible with that workaround; it will simply call the forwarding method as before. However, it is now safe to remove the forwarding methods altogether and the call will be made for you.

This can be considered a breaking change because previously without the workarounds, such ancestor methods were not executed. If you were dependent on this unlikely scenario, you can restore that behavior by defining new methods with these names as no-ops.

### Require/include

Node.js / Browserify:

```javascript
var Base = require('extend-me').Base;
var newClass = Base.extend(extendedClassName, prototype);
```

Browsers:

```html
<script src="http://joneit.github.io/extend-me/extend-me.js"></script>
```
or:
```html
<script src="http://joneit.github.io/extend-me/extend-me.min.js"></script>
```

### Syntax

```javascript
var newClass = Base.extend(extendedClassName, prototypeAdditions);
```

* `Base` could also be any descendant class (previously extended in this way).
* `extendedClassName` _Optional._ This value if provided is copied to the prototype as `$$CLASS_NAME` and is useful in debugging to identify the derived class, the name of which is otherwise (unfortunately) not displayed by the debugger. Could also be useful in your code (something not easily available in standard JavaScript).
* `prototypeAdditions` _Required._ The members (properties and methods) of this object are added to the new constructor's prototype. Getter/setter literal syntax is not supported but you can use `defineProperty`'s {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty|descriptor objects}. These are recognized with duck-typing. See API doc for details.

### Usage

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
