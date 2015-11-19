'use strict';

/* global describe, it, beforeEach, afterEach */

require('should'); // extends Object with `should`

var cssInjector = require('../src/js/extend-me');

describe('`extend` that', function() {
    it('is a function', function() {
        cssInjector.should.be.a.Function();
    });
    it('more tests needed');
});
