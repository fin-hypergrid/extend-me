'use strict';

/* global describe, it, beforeEach, afterEach */

require('should'); // extends Object with `should`

var extendMe = require('../');

describe('`extend` that', function() {
    it('is a function', function() {
        extendMe.should.be.a.Function();
    });
    it('more tests needed');
});
