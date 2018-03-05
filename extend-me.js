(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

window.Base = (function(){

var overrider = require('overrider');

/** @namespace extend-me **/

/** @summary Extends an existing constructor into a new constructor.
 *
 * @returns {Constructor} A new constructor, extended from the given context, possibly with some prototype additions.
 *
 * @desc Extends "objects" (constructors), with optional additional code, optional prototype additions, and optional prototype member aliases.
 *
 * > CAVEAT: Not to be confused with Underscore-style .extend() which is something else entirely. I've used the name "extend" here because other packages (like Backbone.js) use it this way. You are free to call it whatever you want when you "require" it, such as `var inherits = require('extend')`.
 *
 * Provide a constructor as the context and any prototype additions you require in the first argument.
 *
 * For example, if you wish to be able to extend `BaseConstructor` to a new constructor with prototype overrides and/or additions, basic usage is:
 *
 * ```javascript
 * var Base = require('extend-me').Base;
 * var BaseConstructor = Base.extend(basePrototype); // mixes in .extend
 * var ChildConstructor = BaseConstructor.extend(childPrototypeOverridesAndAdditions);
 * var GrandchildConstructor = ChildConstructor.extend(grandchildPrototypeOverridesAndAdditions);
 * ```
 *
 * This function (`extend()`) is added to the new extended object constructor as a property `.extend`, essentially making the object constructor itself easily "extendable." (Note: This is a property of each constructor and not a method of its prototype!)
 *
 * @this Base class being extended from (i.e., its constructor function object).
 *
 * @param {string} [extendedClassName] - This is simply added to the prototype as $$CLASS_NAME. Useful for debugging because all derived constructors appear to have the same name ("Constructor") in the debugger.
 *
 * @param {extendedPrototypeAdditionsObject} [prototypeAdditions] - Object with members to copy to new constructor's prototype.
 *
 * @property {boolean} [debug] - See parameter `extendedClassName` _(above)_.
 *
 * @property {object} Base - A convenient base class from which all other classes can be extended.
 *
 * @memberOf extend-me
 */
function extend(extendedClassName, prototypeAdditions) {
    switch (arguments.length) {
        case 0:
            prototypeAdditions = {};
            break;
        case 1:
            switch (typeof extendedClassName) {
                case 'object':
                    prototypeAdditions = extendedClassName;
                    extendedClassName = undefined;
                    break;
                case 'string':
                    prototypeAdditions = {};
                    break;
                default:
                    throw 'Single-parameter overload must be either string or object.';
            }
            break;
        case 2:
            if (typeof extendedClassName !== 'string' || typeof prototypeAdditions !== 'object') {
                throw 'Two-parameter overload must be string, object.';
            }
            break;
        default:
            throw 'Too many parameters';
    }

    /**
     * @class
     */
    function Constructor() {
        if (this.preInitialize) {
            this.preInitialize.apply(this, arguments);
        }

        initializePrototypeChain.apply(this, arguments);

        if (this.postInitialize) {
            this.postInitialize.apply(this, arguments);
        }
    }

    /**
     * @method
     * @see {@link extend-me.extend}
     * @desc Added to each returned extended class constructor.
     */

    Constructor.extend = extend;


    /**
     * @method
     * @param {string} [ancestorConstructorName] - If given, searches up the prototype chain for constructor with matching name.
     * @returns {function|null} Constructor of parent class; or ancestor class with matching name; or null
     */
    Constructor.parent = parentConstructor;

    var prototype = Constructor.prototype = Object.create(this.prototype);
    prototype.constructor = Constructor;

    extendedClassName = extendedClassName || prototype.$$CLASS_NAME || prototype.name;
    if (extendedClassName) {
        Object.defineProperty(Constructor, 'name', { value: extendedClassName, configurable: true });
        prototype.$$CLASS_NAME = extendedClassName;
    }

    overrider(prototype, prototypeAdditions);

    if (typeof this.postExtend === 'function') {
        this.postExtend(prototype);
    }

    return Constructor;
}

function Base() {}
Base.prototype = {

    constructor: Base.prototype.constructor,

    /**
     * Access a member of the super class.
     * @returns {Object}
     */
    get super() {
        return Object.getPrototypeOf(Object.getPrototypeOf(this));
    },

    /**
     * Find member on prototype chain beginning with super class.
     * @param {string} memberName
     * @returns {undefined|*} `undefined` if not found; value otherwise.
     */
    superMember: function(memberName) {
        var parent = this.super;
        do { parent = Object.getPrototypeOf(parent); } while (!parent.hasOwnProperty(memberName));
        return parent && parent[memberName];
    },

    /**
     * Find method on prototype chain beginning with super class.
     * @param {string} methodName
     * @returns {function}
     */
    superMethod: function(methodName) {
        var method = this.superMember(methodName);
        if (typeof method !== 'function') {
            throw new TypeError('this.' + methodName + ' is not a function');
        }
        return method;
    },

    /**
     * Find method on prototype chain beginning with super class and call it with remaining args.
     * @param {string} methodName
     * @returns {*}
     */
    callSuperMethod: function(methodName) {
        return this.superMethod(methodName).apply(this, Array.prototype.slice.call(arguments, 1));
    }
};
Base.extend = extend;
extend.Base = Base;

/**
 * Optional static method is called with new "class" (constructor) after extending.
 * This permits miscellaneous tweaking and cleanup of the new class.
 * @method postExtend
 * @param {object} prototype
 * @memberOf Base
 */

/** @typedef {function} extendedConstructor
 * @property prototype.super - A reference to the prototype this constructor was extended from.
 * @property [extend] - If `prototypeAdditions.extendable` was truthy, this will be a reference to {@link extend.extend|extend}.
 */

/** @typedef {object} extendedPrototypeAdditionsObject
 * @desc All members are copied to the new object. The following have special meaning.
 * @property {function} [initialize] - Additional constructor code for new object. This method is added to the new constructor's prototype. Gets passed new object as context + same args as constructor itself. Called on instantiation after similar function in all ancestors called with same signature.
 * @property {function} [preInitialize] - Called before the `initialize` cascade. Gets passed new object as context + same args as constructor itself. If not defined here, the top-most (and only the top-most) definition found on the prototype chain is called.
 * @property {function} [postInitialize] - Called after the `initialize` cascade. Gets passed new object as context + same args as constructor itself. If not defined here, the top-most (and only the top-most) definition found on the prototype chain is called.
 */

/** @summary Call all `initialize` methods found in prototype chain, beginning with the most senior ancestor's first.
 * @desc This recursive routine is called by the constructor.
 * 1. Walks back the prototype chain to `Object`'s prototype
 * 2. Walks forward to new object, calling any `initialize` methods it finds along the way with the same context and arguments with which the constructor was called.
 * @private
 * @memberOf extend-me
 */
function initializePrototypeChain() {
    var term = this,
        args = arguments;
    recur(term);

    function recur(obj) {
        var proto = Object.getPrototypeOf(obj);
        if (proto.constructor !== Object) {
            recur(proto);
            if (proto.hasOwnProperty('initialize')) {
                proto.initialize.apply(term, args);
            }
        }
    }
}

function parentConstructor(ancestorConstructorName) {
    var prototype = this.prototype;
    if (prototype) {
        do {
            prototype = Object.getPrototypeOf(prototype);
        } while (ancestorConstructorName && prototype && prototype.constructor.name !== ancestorConstructorName);
    }
    return prototype && prototype.constructor;
}

return extend;

})().Base;

},{"overrider":2}],2:[function(require,module,exports){
'use strict';

/** @module overrider */

/**
 * Mixes members of all `sources` into `target`, handling getters and setters properly.
 *
 * Any number of `sources` objects may be given and each is copied in turn.
 *
 * @example
 * var overrider = require('overrider');
 * var target = { a: 1 }, source1 = { b: 2 }, source2 = { c: 3 };
 * target === overrider(target, source1, source2); // true
 * // target object now has a, b, and c; source objects untouched
 *
 * @param {object} object - The target object to receive sources.
 * @param {...object} [sources] - Object(s) containing members to copy to `target`. (Omitting is a no-op.)
 * @returns {object} The target object (`target`)
 */
function overrider(target, sources) { // eslint-disable-line no-unused-vars
    for (var i = 1; i < arguments.length; ++i) {
        mixIn.call(target, arguments[i]);
    }

    return target;
}

/**
 * Mix `this` members into `target`.
 *
 * @example
 * // A. Simple usage (using .call):
 * var mixInTo = require('overrider').mixInTo;
 * var target = { a: 1 }, source = { b: 2 };
 * target === overrider.mixInTo.call(source, target); // true
 * // target object now has both a and b; source object untouched
 *
 * @example
 * // B. Semantic usage (when the source hosts the method):
 * var mixInTo = require('overrider').mixInTo;
 * var target = { a: 1 }, source = { b: 2, mixInTo: mixInTo };
 * target === source.mixInTo(target); // true
 * // target object now has both a and b; source object untouched
 *
 * @this {object} Target.
 * @param target
 * @returns {object} The target object (`target`)
 * @memberOf module:overrider
 */
function mixInTo(target) {
    var descriptor;
    for (var key in this) {
        if ((descriptor = Object.getOwnPropertyDescriptor(this, key))) {
            Object.defineProperty(target, key, descriptor);
        }
    }
    return target;
}

/**
 * Mix `source` members into `this`.
 *
 * @example
 * // A. Simple usage (using .call):
 * var mixIn = require('overrider').mixIn;
 * var target = { a: 1 }, source = { b: 2 };
 * target === overrider.mixIn.call(target, source) // true
 * // target object now has both a and b; source object untouched
 *
 * @example
 * // B. Semantic usage (when the target hosts the method):
 * var mixIn = require('overrider').mixIn;
 * var target = { a: 1, mixIn: mixIn }, source = { b: 2 };
 * target === target.mixIn(source) // true
 * // target now has both a and b (and mixIn); source untouched
 *
 * @param source
 * @returns {object} The target object (`this`)
 * @memberOf overrider
 * @memberOf module:overrider
 */
function mixIn(source) {
    var descriptor;
    for (var key in source) {
        if ((descriptor = Object.getOwnPropertyDescriptor(source, key))) {
            Object.defineProperty(this, key, descriptor);
        }
    }
    return this;
}

overrider.mixInTo = mixInTo;
overrider.mixIn = mixIn;

module.exports = overrider;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb25laXQvcmVwb3MvZXh0ZW5kLW1lL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvam9uZWl0L3JlcG9zL2V4dGVuZC1tZS9mYWtlXzYyZWQ3YmYzLmpzIiwiL1VzZXJzL2pvbmVpdC9yZXBvcy9leHRlbmQtbWUvbm9kZV9tb2R1bGVzL292ZXJyaWRlci9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuQmFzZSA9IChmdW5jdGlvbigpe1xuXG52YXIgb3ZlcnJpZGVyID0gcmVxdWlyZSgnb3ZlcnJpZGVyJyk7XG5cbi8qKiBAbmFtZXNwYWNlIGV4dGVuZC1tZSAqKi9cblxuLyoqIEBzdW1tYXJ5IEV4dGVuZHMgYW4gZXhpc3RpbmcgY29uc3RydWN0b3IgaW50byBhIG5ldyBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBAcmV0dXJucyB7Q29uc3RydWN0b3J9IEEgbmV3IGNvbnN0cnVjdG9yLCBleHRlbmRlZCBmcm9tIHRoZSBnaXZlbiBjb250ZXh0LCBwb3NzaWJseSB3aXRoIHNvbWUgcHJvdG90eXBlIGFkZGl0aW9ucy5cbiAqXG4gKiBAZGVzYyBFeHRlbmRzIFwib2JqZWN0c1wiIChjb25zdHJ1Y3RvcnMpLCB3aXRoIG9wdGlvbmFsIGFkZGl0aW9uYWwgY29kZSwgb3B0aW9uYWwgcHJvdG90eXBlIGFkZGl0aW9ucywgYW5kIG9wdGlvbmFsIHByb3RvdHlwZSBtZW1iZXIgYWxpYXNlcy5cbiAqXG4gKiA+IENBVkVBVDogTm90IHRvIGJlIGNvbmZ1c2VkIHdpdGggVW5kZXJzY29yZS1zdHlsZSAuZXh0ZW5kKCkgd2hpY2ggaXMgc29tZXRoaW5nIGVsc2UgZW50aXJlbHkuIEkndmUgdXNlZCB0aGUgbmFtZSBcImV4dGVuZFwiIGhlcmUgYmVjYXVzZSBvdGhlciBwYWNrYWdlcyAobGlrZSBCYWNrYm9uZS5qcykgdXNlIGl0IHRoaXMgd2F5LiBZb3UgYXJlIGZyZWUgdG8gY2FsbCBpdCB3aGF0ZXZlciB5b3Ugd2FudCB3aGVuIHlvdSBcInJlcXVpcmVcIiBpdCwgc3VjaCBhcyBgdmFyIGluaGVyaXRzID0gcmVxdWlyZSgnZXh0ZW5kJylgLlxuICpcbiAqIFByb3ZpZGUgYSBjb25zdHJ1Y3RvciBhcyB0aGUgY29udGV4dCBhbmQgYW55IHByb3RvdHlwZSBhZGRpdGlvbnMgeW91IHJlcXVpcmUgaW4gdGhlIGZpcnN0IGFyZ3VtZW50LlxuICpcbiAqIEZvciBleGFtcGxlLCBpZiB5b3Ugd2lzaCB0byBiZSBhYmxlIHRvIGV4dGVuZCBgQmFzZUNvbnN0cnVjdG9yYCB0byBhIG5ldyBjb25zdHJ1Y3RvciB3aXRoIHByb3RvdHlwZSBvdmVycmlkZXMgYW5kL29yIGFkZGl0aW9ucywgYmFzaWMgdXNhZ2UgaXM6XG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIEJhc2UgPSByZXF1aXJlKCdleHRlbmQtbWUnKS5CYXNlO1xuICogdmFyIEJhc2VDb25zdHJ1Y3RvciA9IEJhc2UuZXh0ZW5kKGJhc2VQcm90b3R5cGUpOyAvLyBtaXhlcyBpbiAuZXh0ZW5kXG4gKiB2YXIgQ2hpbGRDb25zdHJ1Y3RvciA9IEJhc2VDb25zdHJ1Y3Rvci5leHRlbmQoY2hpbGRQcm90b3R5cGVPdmVycmlkZXNBbmRBZGRpdGlvbnMpO1xuICogdmFyIEdyYW5kY2hpbGRDb25zdHJ1Y3RvciA9IENoaWxkQ29uc3RydWN0b3IuZXh0ZW5kKGdyYW5kY2hpbGRQcm90b3R5cGVPdmVycmlkZXNBbmRBZGRpdGlvbnMpO1xuICogYGBgXG4gKlxuICogVGhpcyBmdW5jdGlvbiAoYGV4dGVuZCgpYCkgaXMgYWRkZWQgdG8gdGhlIG5ldyBleHRlbmRlZCBvYmplY3QgY29uc3RydWN0b3IgYXMgYSBwcm9wZXJ0eSBgLmV4dGVuZGAsIGVzc2VudGlhbGx5IG1ha2luZyB0aGUgb2JqZWN0IGNvbnN0cnVjdG9yIGl0c2VsZiBlYXNpbHkgXCJleHRlbmRhYmxlLlwiIChOb3RlOiBUaGlzIGlzIGEgcHJvcGVydHkgb2YgZWFjaCBjb25zdHJ1Y3RvciBhbmQgbm90IGEgbWV0aG9kIG9mIGl0cyBwcm90b3R5cGUhKVxuICpcbiAqIEB0aGlzIEJhc2UgY2xhc3MgYmVpbmcgZXh0ZW5kZWQgZnJvbSAoaS5lLiwgaXRzIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIG9iamVjdCkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IFtleHRlbmRlZENsYXNzTmFtZV0gLSBUaGlzIGlzIHNpbXBseSBhZGRlZCB0byB0aGUgcHJvdG90eXBlIGFzICQkQ0xBU1NfTkFNRS4gVXNlZnVsIGZvciBkZWJ1Z2dpbmcgYmVjYXVzZSBhbGwgZGVyaXZlZCBjb25zdHJ1Y3RvcnMgYXBwZWFyIHRvIGhhdmUgdGhlIHNhbWUgbmFtZSAoXCJDb25zdHJ1Y3RvclwiKSBpbiB0aGUgZGVidWdnZXIuXG4gKlxuICogQHBhcmFtIHtleHRlbmRlZFByb3RvdHlwZUFkZGl0aW9uc09iamVjdH0gW3Byb3RvdHlwZUFkZGl0aW9uc10gLSBPYmplY3Qgd2l0aCBtZW1iZXJzIHRvIGNvcHkgdG8gbmV3IGNvbnN0cnVjdG9yJ3MgcHJvdG90eXBlLlxuICpcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2RlYnVnXSAtIFNlZSBwYXJhbWV0ZXIgYGV4dGVuZGVkQ2xhc3NOYW1lYCBfKGFib3ZlKV8uXG4gKlxuICogQHByb3BlcnR5IHtvYmplY3R9IEJhc2UgLSBBIGNvbnZlbmllbnQgYmFzZSBjbGFzcyBmcm9tIHdoaWNoIGFsbCBvdGhlciBjbGFzc2VzIGNhbiBiZSBleHRlbmRlZC5cbiAqXG4gKiBAbWVtYmVyT2YgZXh0ZW5kLW1lXG4gKi9cbmZ1bmN0aW9uIGV4dGVuZChleHRlbmRlZENsYXNzTmFtZSwgcHJvdG90eXBlQWRkaXRpb25zKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIHByb3RvdHlwZUFkZGl0aW9ucyA9IHt9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHN3aXRjaCAodHlwZW9mIGV4dGVuZGVkQ2xhc3NOYW1lKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgICAgICAgICAgICAgcHJvdG90eXBlQWRkaXRpb25zID0gZXh0ZW5kZWRDbGFzc05hbWU7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuZGVkQ2xhc3NOYW1lID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgICAgICAgICBwcm90b3R5cGVBZGRpdGlvbnMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ1NpbmdsZS1wYXJhbWV0ZXIgb3ZlcmxvYWQgbXVzdCBiZSBlaXRoZXIgc3RyaW5nIG9yIG9iamVjdC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXh0ZW5kZWRDbGFzc05hbWUgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBwcm90b3R5cGVBZGRpdGlvbnMgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ1R3by1wYXJhbWV0ZXIgb3ZlcmxvYWQgbXVzdCBiZSBzdHJpbmcsIG9iamVjdC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyAnVG9vIG1hbnkgcGFyYW1ldGVycyc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGNsYXNzXG4gICAgICovXG4gICAgZnVuY3Rpb24gQ29uc3RydWN0b3IoKSB7XG4gICAgICAgIGlmICh0aGlzLnByZUluaXRpYWxpemUpIHtcbiAgICAgICAgICAgIHRoaXMucHJlSW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5pdGlhbGl6ZVByb3RvdHlwZUNoYWluLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgaWYgKHRoaXMucG9zdEluaXRpYWxpemUpIHtcbiAgICAgICAgICAgIHRoaXMucG9zdEluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAc2VlIHtAbGluayBleHRlbmQtbWUuZXh0ZW5kfVxuICAgICAqIEBkZXNjIEFkZGVkIHRvIGVhY2ggcmV0dXJuZWQgZXh0ZW5kZWQgY2xhc3MgY29uc3RydWN0b3IuXG4gICAgICovXG5cbiAgICBDb25zdHJ1Y3Rvci5leHRlbmQgPSBleHRlbmQ7XG5cblxuICAgIC8qKlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2FuY2VzdG9yQ29uc3RydWN0b3JOYW1lXSAtIElmIGdpdmVuLCBzZWFyY2hlcyB1cCB0aGUgcHJvdG90eXBlIGNoYWluIGZvciBjb25zdHJ1Y3RvciB3aXRoIG1hdGNoaW5nIG5hbWUuXG4gICAgICogQHJldHVybnMge2Z1bmN0aW9ufG51bGx9IENvbnN0cnVjdG9yIG9mIHBhcmVudCBjbGFzczsgb3IgYW5jZXN0b3IgY2xhc3Mgd2l0aCBtYXRjaGluZyBuYW1lOyBvciBudWxsXG4gICAgICovXG4gICAgQ29uc3RydWN0b3IucGFyZW50ID0gcGFyZW50Q29uc3RydWN0b3I7XG5cbiAgICB2YXIgcHJvdG90eXBlID0gQ29uc3RydWN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSh0aGlzLnByb3RvdHlwZSk7XG4gICAgcHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ29uc3RydWN0b3I7XG5cbiAgICBleHRlbmRlZENsYXNzTmFtZSA9IGV4dGVuZGVkQ2xhc3NOYW1lIHx8IHByb3RvdHlwZS4kJENMQVNTX05BTUUgfHwgcHJvdG90eXBlLm5hbWU7XG4gICAgaWYgKGV4dGVuZGVkQ2xhc3NOYW1lKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb25zdHJ1Y3RvciwgJ25hbWUnLCB7IHZhbHVlOiBleHRlbmRlZENsYXNzTmFtZSwgY29uZmlndXJhYmxlOiB0cnVlIH0pO1xuICAgICAgICBwcm90b3R5cGUuJCRDTEFTU19OQU1FID0gZXh0ZW5kZWRDbGFzc05hbWU7XG4gICAgfVxuXG4gICAgb3ZlcnJpZGVyKHByb3RvdHlwZSwgcHJvdG90eXBlQWRkaXRpb25zKTtcblxuICAgIGlmICh0eXBlb2YgdGhpcy5wb3N0RXh0ZW5kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMucG9zdEV4dGVuZChwcm90b3R5cGUpO1xuICAgIH1cblxuICAgIHJldHVybiBDb25zdHJ1Y3Rvcjtcbn1cblxuZnVuY3Rpb24gQmFzZSgpIHt9XG5CYXNlLnByb3RvdHlwZSA9IHtcblxuICAgIGNvbnN0cnVjdG9yOiBCYXNlLnByb3RvdHlwZS5jb25zdHJ1Y3RvcixcblxuICAgIC8qKlxuICAgICAqIEFjY2VzcyBhIG1lbWJlciBvZiB0aGUgc3VwZXIgY2xhc3MuXG4gICAgICogQHJldHVybnMge09iamVjdH1cbiAgICAgKi9cbiAgICBnZXQgc3VwZXIoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmluZCBtZW1iZXIgb24gcHJvdG90eXBlIGNoYWluIGJlZ2lubmluZyB3aXRoIHN1cGVyIGNsYXNzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZW1iZXJOYW1lXG4gICAgICogQHJldHVybnMge3VuZGVmaW5lZHwqfSBgdW5kZWZpbmVkYCBpZiBub3QgZm91bmQ7IHZhbHVlIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBzdXBlck1lbWJlcjogZnVuY3Rpb24obWVtYmVyTmFtZSkge1xuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5zdXBlcjtcbiAgICAgICAgZG8geyBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocGFyZW50KTsgfSB3aGlsZSAoIXBhcmVudC5oYXNPd25Qcm9wZXJ0eShtZW1iZXJOYW1lKSk7XG4gICAgICAgIHJldHVybiBwYXJlbnQgJiYgcGFyZW50W21lbWJlck5hbWVdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIG1ldGhvZCBvbiBwcm90b3R5cGUgY2hhaW4gYmVnaW5uaW5nIHdpdGggc3VwZXIgY2xhc3MuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZE5hbWVcbiAgICAgKiBAcmV0dXJucyB7ZnVuY3Rpb259XG4gICAgICovXG4gICAgc3VwZXJNZXRob2Q6IGZ1bmN0aW9uKG1ldGhvZE5hbWUpIHtcbiAgICAgICAgdmFyIG1ldGhvZCA9IHRoaXMuc3VwZXJNZW1iZXIobWV0aG9kTmFtZSk7XG4gICAgICAgIGlmICh0eXBlb2YgbWV0aG9kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCd0aGlzLicgKyBtZXRob2ROYW1lICsgJyBpcyBub3QgYSBmdW5jdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtZXRob2Q7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpbmQgbWV0aG9kIG9uIHByb3RvdHlwZSBjaGFpbiBiZWdpbm5pbmcgd2l0aCBzdXBlciBjbGFzcyBhbmQgY2FsbCBpdCB3aXRoIHJlbWFpbmluZyBhcmdzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2ROYW1lXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICovXG4gICAgY2FsbFN1cGVyTWV0aG9kOiBmdW5jdGlvbihtZXRob2ROYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1cGVyTWV0aG9kKG1ldGhvZE5hbWUpLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIH1cbn07XG5CYXNlLmV4dGVuZCA9IGV4dGVuZDtcbmV4dGVuZC5CYXNlID0gQmFzZTtcblxuLyoqXG4gKiBPcHRpb25hbCBzdGF0aWMgbWV0aG9kIGlzIGNhbGxlZCB3aXRoIG5ldyBcImNsYXNzXCIgKGNvbnN0cnVjdG9yKSBhZnRlciBleHRlbmRpbmcuXG4gKiBUaGlzIHBlcm1pdHMgbWlzY2VsbGFuZW91cyB0d2Vha2luZyBhbmQgY2xlYW51cCBvZiB0aGUgbmV3IGNsYXNzLlxuICogQG1ldGhvZCBwb3N0RXh0ZW5kXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvdG90eXBlXG4gKiBAbWVtYmVyT2YgQmFzZVxuICovXG5cbi8qKiBAdHlwZWRlZiB7ZnVuY3Rpb259IGV4dGVuZGVkQ29uc3RydWN0b3JcbiAqIEBwcm9wZXJ0eSBwcm90b3R5cGUuc3VwZXIgLSBBIHJlZmVyZW5jZSB0byB0aGUgcHJvdG90eXBlIHRoaXMgY29uc3RydWN0b3Igd2FzIGV4dGVuZGVkIGZyb20uXG4gKiBAcHJvcGVydHkgW2V4dGVuZF0gLSBJZiBgcHJvdG90eXBlQWRkaXRpb25zLmV4dGVuZGFibGVgIHdhcyB0cnV0aHksIHRoaXMgd2lsbCBiZSBhIHJlZmVyZW5jZSB0byB7QGxpbmsgZXh0ZW5kLmV4dGVuZHxleHRlbmR9LlxuICovXG5cbi8qKiBAdHlwZWRlZiB7b2JqZWN0fSBleHRlbmRlZFByb3RvdHlwZUFkZGl0aW9uc09iamVjdFxuICogQGRlc2MgQWxsIG1lbWJlcnMgYXJlIGNvcGllZCB0byB0aGUgbmV3IG9iamVjdC4gVGhlIGZvbGxvd2luZyBoYXZlIHNwZWNpYWwgbWVhbmluZy5cbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IFtpbml0aWFsaXplXSAtIEFkZGl0aW9uYWwgY29uc3RydWN0b3IgY29kZSBmb3IgbmV3IG9iamVjdC4gVGhpcyBtZXRob2QgaXMgYWRkZWQgdG8gdGhlIG5ldyBjb25zdHJ1Y3RvcidzIHByb3RvdHlwZS4gR2V0cyBwYXNzZWQgbmV3IG9iamVjdCBhcyBjb250ZXh0ICsgc2FtZSBhcmdzIGFzIGNvbnN0cnVjdG9yIGl0c2VsZi4gQ2FsbGVkIG9uIGluc3RhbnRpYXRpb24gYWZ0ZXIgc2ltaWxhciBmdW5jdGlvbiBpbiBhbGwgYW5jZXN0b3JzIGNhbGxlZCB3aXRoIHNhbWUgc2lnbmF0dXJlLlxuICogQHByb3BlcnR5IHtmdW5jdGlvbn0gW3ByZUluaXRpYWxpemVdIC0gQ2FsbGVkIGJlZm9yZSB0aGUgYGluaXRpYWxpemVgIGNhc2NhZGUuIEdldHMgcGFzc2VkIG5ldyBvYmplY3QgYXMgY29udGV4dCArIHNhbWUgYXJncyBhcyBjb25zdHJ1Y3RvciBpdHNlbGYuIElmIG5vdCBkZWZpbmVkIGhlcmUsIHRoZSB0b3AtbW9zdCAoYW5kIG9ubHkgdGhlIHRvcC1tb3N0KSBkZWZpbml0aW9uIGZvdW5kIG9uIHRoZSBwcm90b3R5cGUgY2hhaW4gaXMgY2FsbGVkLlxuICogQHByb3BlcnR5IHtmdW5jdGlvbn0gW3Bvc3RJbml0aWFsaXplXSAtIENhbGxlZCBhZnRlciB0aGUgYGluaXRpYWxpemVgIGNhc2NhZGUuIEdldHMgcGFzc2VkIG5ldyBvYmplY3QgYXMgY29udGV4dCArIHNhbWUgYXJncyBhcyBjb25zdHJ1Y3RvciBpdHNlbGYuIElmIG5vdCBkZWZpbmVkIGhlcmUsIHRoZSB0b3AtbW9zdCAoYW5kIG9ubHkgdGhlIHRvcC1tb3N0KSBkZWZpbml0aW9uIGZvdW5kIG9uIHRoZSBwcm90b3R5cGUgY2hhaW4gaXMgY2FsbGVkLlxuICovXG5cbi8qKiBAc3VtbWFyeSBDYWxsIGFsbCBgaW5pdGlhbGl6ZWAgbWV0aG9kcyBmb3VuZCBpbiBwcm90b3R5cGUgY2hhaW4sIGJlZ2lubmluZyB3aXRoIHRoZSBtb3N0IHNlbmlvciBhbmNlc3RvcidzIGZpcnN0LlxuICogQGRlc2MgVGhpcyByZWN1cnNpdmUgcm91dGluZSBpcyBjYWxsZWQgYnkgdGhlIGNvbnN0cnVjdG9yLlxuICogMS4gV2Fsa3MgYmFjayB0aGUgcHJvdG90eXBlIGNoYWluIHRvIGBPYmplY3RgJ3MgcHJvdG90eXBlXG4gKiAyLiBXYWxrcyBmb3J3YXJkIHRvIG5ldyBvYmplY3QsIGNhbGxpbmcgYW55IGBpbml0aWFsaXplYCBtZXRob2RzIGl0IGZpbmRzIGFsb25nIHRoZSB3YXkgd2l0aCB0aGUgc2FtZSBjb250ZXh0IGFuZCBhcmd1bWVudHMgd2l0aCB3aGljaCB0aGUgY29uc3RydWN0b3Igd2FzIGNhbGxlZC5cbiAqIEBwcml2YXRlXG4gKiBAbWVtYmVyT2YgZXh0ZW5kLW1lXG4gKi9cbmZ1bmN0aW9uIGluaXRpYWxpemVQcm90b3R5cGVDaGFpbigpIHtcbiAgICB2YXIgdGVybSA9IHRoaXMsXG4gICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgcmVjdXIodGVybSk7XG5cbiAgICBmdW5jdGlvbiByZWN1cihvYmopIHtcbiAgICAgICAgdmFyIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaik7XG4gICAgICAgIGlmIChwcm90by5jb25zdHJ1Y3RvciAhPT0gT2JqZWN0KSB7XG4gICAgICAgICAgICByZWN1cihwcm90byk7XG4gICAgICAgICAgICBpZiAocHJvdG8uaGFzT3duUHJvcGVydHkoJ2luaXRpYWxpemUnKSkge1xuICAgICAgICAgICAgICAgIHByb3RvLmluaXRpYWxpemUuYXBwbHkodGVybSwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhcmVudENvbnN0cnVjdG9yKGFuY2VzdG9yQ29uc3RydWN0b3JOYW1lKSB7XG4gICAgdmFyIHByb3RvdHlwZSA9IHRoaXMucHJvdG90eXBlO1xuICAgIGlmIChwcm90b3R5cGUpIHtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgcHJvdG90eXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHByb3RvdHlwZSk7XG4gICAgICAgIH0gd2hpbGUgKGFuY2VzdG9yQ29uc3RydWN0b3JOYW1lICYmIHByb3RvdHlwZSAmJiBwcm90b3R5cGUuY29uc3RydWN0b3IubmFtZSAhPT0gYW5jZXN0b3JDb25zdHJ1Y3Rvck5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvdG90eXBlICYmIHByb3RvdHlwZS5jb25zdHJ1Y3Rvcjtcbn1cblxucmV0dXJuIGV4dGVuZDtcblxufSkoKS5CYXNlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiogQG1vZHVsZSBvdmVycmlkZXIgKi9cblxuLyoqXG4gKiBNaXhlcyBtZW1iZXJzIG9mIGFsbCBgc291cmNlc2AgaW50byBgdGFyZ2V0YCwgaGFuZGxpbmcgZ2V0dGVycyBhbmQgc2V0dGVycyBwcm9wZXJseS5cbiAqXG4gKiBBbnkgbnVtYmVyIG9mIGBzb3VyY2VzYCBvYmplY3RzIG1heSBiZSBnaXZlbiBhbmQgZWFjaCBpcyBjb3BpZWQgaW4gdHVybi5cbiAqXG4gKiBAZXhhbXBsZVxuICogdmFyIG92ZXJyaWRlciA9IHJlcXVpcmUoJ292ZXJyaWRlcicpO1xuICogdmFyIHRhcmdldCA9IHsgYTogMSB9LCBzb3VyY2UxID0geyBiOiAyIH0sIHNvdXJjZTIgPSB7IGM6IDMgfTtcbiAqIHRhcmdldCA9PT0gb3ZlcnJpZGVyKHRhcmdldCwgc291cmNlMSwgc291cmNlMik7IC8vIHRydWVcbiAqIC8vIHRhcmdldCBvYmplY3Qgbm93IGhhcyBhLCBiLCBhbmQgYzsgc291cmNlIG9iamVjdHMgdW50b3VjaGVkXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9iamVjdCAtIFRoZSB0YXJnZXQgb2JqZWN0IHRvIHJlY2VpdmUgc291cmNlcy5cbiAqIEBwYXJhbSB7Li4ub2JqZWN0fSBbc291cmNlc10gLSBPYmplY3QocykgY29udGFpbmluZyBtZW1iZXJzIHRvIGNvcHkgdG8gYHRhcmdldGAuIChPbWl0dGluZyBpcyBhIG5vLW9wLilcbiAqIEByZXR1cm5zIHtvYmplY3R9IFRoZSB0YXJnZXQgb2JqZWN0IChgdGFyZ2V0YClcbiAqL1xuZnVuY3Rpb24gb3ZlcnJpZGVyKHRhcmdldCwgc291cmNlcykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgbWl4SW4uY2FsbCh0YXJnZXQsIGFyZ3VtZW50c1tpXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldDtcbn1cblxuLyoqXG4gKiBNaXggYHRoaXNgIG1lbWJlcnMgaW50byBgdGFyZ2V0YC5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gQS4gU2ltcGxlIHVzYWdlICh1c2luZyAuY2FsbCk6XG4gKiB2YXIgbWl4SW5UbyA9IHJlcXVpcmUoJ292ZXJyaWRlcicpLm1peEluVG87XG4gKiB2YXIgdGFyZ2V0ID0geyBhOiAxIH0sIHNvdXJjZSA9IHsgYjogMiB9O1xuICogdGFyZ2V0ID09PSBvdmVycmlkZXIubWl4SW5Uby5jYWxsKHNvdXJjZSwgdGFyZ2V0KTsgLy8gdHJ1ZVxuICogLy8gdGFyZ2V0IG9iamVjdCBub3cgaGFzIGJvdGggYSBhbmQgYjsgc291cmNlIG9iamVjdCB1bnRvdWNoZWRcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gQi4gU2VtYW50aWMgdXNhZ2UgKHdoZW4gdGhlIHNvdXJjZSBob3N0cyB0aGUgbWV0aG9kKTpcbiAqIHZhciBtaXhJblRvID0gcmVxdWlyZSgnb3ZlcnJpZGVyJykubWl4SW5UbztcbiAqIHZhciB0YXJnZXQgPSB7IGE6IDEgfSwgc291cmNlID0geyBiOiAyLCBtaXhJblRvOiBtaXhJblRvIH07XG4gKiB0YXJnZXQgPT09IHNvdXJjZS5taXhJblRvKHRhcmdldCk7IC8vIHRydWVcbiAqIC8vIHRhcmdldCBvYmplY3Qgbm93IGhhcyBib3RoIGEgYW5kIGI7IHNvdXJjZSBvYmplY3QgdW50b3VjaGVkXG4gKlxuICogQHRoaXMge29iamVjdH0gVGFyZ2V0LlxuICogQHBhcmFtIHRhcmdldFxuICogQHJldHVybnMge29iamVjdH0gVGhlIHRhcmdldCBvYmplY3QgKGB0YXJnZXRgKVxuICogQG1lbWJlck9mIG1vZHVsZTpvdmVycmlkZXJcbiAqL1xuZnVuY3Rpb24gbWl4SW5Ubyh0YXJnZXQpIHtcbiAgICB2YXIgZGVzY3JpcHRvcjtcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcykge1xuICAgICAgICBpZiAoKGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRoaXMsIGtleSkpKSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIGRlc2NyaXB0b3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5cbi8qKlxuICogTWl4IGBzb3VyY2VgIG1lbWJlcnMgaW50byBgdGhpc2AuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIEEuIFNpbXBsZSB1c2FnZSAodXNpbmcgLmNhbGwpOlxuICogdmFyIG1peEluID0gcmVxdWlyZSgnb3ZlcnJpZGVyJykubWl4SW47XG4gKiB2YXIgdGFyZ2V0ID0geyBhOiAxIH0sIHNvdXJjZSA9IHsgYjogMiB9O1xuICogdGFyZ2V0ID09PSBvdmVycmlkZXIubWl4SW4uY2FsbCh0YXJnZXQsIHNvdXJjZSkgLy8gdHJ1ZVxuICogLy8gdGFyZ2V0IG9iamVjdCBub3cgaGFzIGJvdGggYSBhbmQgYjsgc291cmNlIG9iamVjdCB1bnRvdWNoZWRcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gQi4gU2VtYW50aWMgdXNhZ2UgKHdoZW4gdGhlIHRhcmdldCBob3N0cyB0aGUgbWV0aG9kKTpcbiAqIHZhciBtaXhJbiA9IHJlcXVpcmUoJ292ZXJyaWRlcicpLm1peEluO1xuICogdmFyIHRhcmdldCA9IHsgYTogMSwgbWl4SW46IG1peEluIH0sIHNvdXJjZSA9IHsgYjogMiB9O1xuICogdGFyZ2V0ID09PSB0YXJnZXQubWl4SW4oc291cmNlKSAvLyB0cnVlXG4gKiAvLyB0YXJnZXQgbm93IGhhcyBib3RoIGEgYW5kIGIgKGFuZCBtaXhJbik7IHNvdXJjZSB1bnRvdWNoZWRcbiAqXG4gKiBAcGFyYW0gc291cmNlXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBUaGUgdGFyZ2V0IG9iamVjdCAoYHRoaXNgKVxuICogQG1lbWJlck9mIG92ZXJyaWRlclxuICogQG1lbWJlck9mIG1vZHVsZTpvdmVycmlkZXJcbiAqL1xuZnVuY3Rpb24gbWl4SW4oc291cmNlKSB7XG4gICAgdmFyIGRlc2NyaXB0b3I7XG4gICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgICBpZiAoKGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHNvdXJjZSwga2V5KSkpIHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBrZXksIGRlc2NyaXB0b3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufVxuXG5vdmVycmlkZXIubWl4SW5UbyA9IG1peEluVG87XG5vdmVycmlkZXIubWl4SW4gPSBtaXhJbjtcblxubW9kdWxlLmV4cG9ydHMgPSBvdmVycmlkZXI7XG4iXX0=
