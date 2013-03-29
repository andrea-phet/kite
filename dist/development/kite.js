(function() {

;(function(g){

    // summary: A simple feature detection function/framework.
    //
    // name: String
    //      The name of the feature to detect, as defined by the overall `has` tests.
    //      Tests can be registered via `has.add(testname, testfunction)`.
    //
    // example:
    //      mylibrary.bind = has("native-bind") ? function(fn, context){
    //          return fn.bind(context);
    //      } : function(fn, context){
    //          return function(){
    //              fn.apply(context, arguments);
    //          }
    //      }

    var NON_HOST_TYPES = { "boolean": 1, "number": 1, "string": 1, "undefined": 1 },
        VENDOR_PREFIXES = ["Webkit", "Moz", "O", "ms", "Khtml"],
        d = isHostType(g, "document") && g.document,
        el = d && isHostType(d, "createElement") && d.createElement("DiV"),
        freeExports = typeof exports == "object" && exports,
        freeModule = typeof module == "object" && module,
        testCache = {}
    ;

    function has(/* String */name){
        if(typeof testCache[name] == "function"){
            testCache[name] = testCache[name](g, d, el);
        }
        return testCache[name]; // Boolean
    }

    function add(/* String */name, /* Function */test, /* Boolean? */now){
        // summary: Register a new feature detection test for some named feature
        //
        // name: String
        //      The name of the feature to test.
        //
        // test: Function
        //      A test function to register. If a function, queued for testing until actually
        //      needed. The test function should return a boolean indicating
        //      the presence of a feature or bug.
        //
        // now: Boolean?
        //      Optional. Omit if `test` is not a function. Provides a way to immediately
        //      run the test and cache the result.
        // example:
        //      A redundant test, testFn with immediate execution:
        //  |       has.add("javascript", function(){ return true; }, true);
        //
        // example:
        //      Again with the redundantness. You can do this in your tests, but we should
        //      not be doing this in any internal has.js tests
        //  |       has.add("javascript", true);
        //
        // example:
        //      Three things are passed to the testFunction. `global`, `document`, and a generic element
        //      from which to work your test should the need arise.
        //  |       has.add("bug-byid", function(g, d, el){
        //  |           // g  == global, typically window, yadda yadda
        //  |           // d  == document object
        //  |           // el == the generic element. a `has` element.
        //  |           return false; // fake test, byid-when-form-has-name-matching-an-id is slightly longer
        //  |       });
        testCache[name] = now ? test(g, d, el) : test;
    }

    // cssprop adapted from http://gist.github.com/598008 (thanks, ^pi)
    function cssprop(name, el){
        var supported = false,
            capitalized = name.charAt(0).toUpperCase() + name.slice(1),
            length = VENDOR_PREFIXES.length,
            style = el.style;

        if(typeof style[name] == "string"){
            supported = true;
        }else{
            while(length--){
                if(typeof style[VENDOR_PREFIXES[length] + capitalized] == "string"){
                    supported = true;
                    break;
                }
            }
        }
        return supported;
    }

    function clearElement(el){
        if(el){
            while(el.lastChild){
                el.removeChild(el.lastChild);
            }
        }
        return el;
    }

    // Host objects can return type values that are different from their actual
    // data type. The objects we are concerned with usually return non-primitive
    // types of object, function, or unknown.
    function isHostType(object, property){
        var type = typeof object[property];
        return type == "object" ? !!object[property] : !NON_HOST_TYPES[type];
    }

        has.add = add;
    has.clearElement = clearElement;
    has.cssprop = cssprop;
    has.isHostType = isHostType;
    has._tests = testCache;

    has.add("dom", function(g, d, el){
        return d && el && isHostType(g, "location") && isHostType(d, "documentElement") &&
            isHostType(d, "getElementById") && isHostType(d, "getElementsByName") &&
            isHostType(d, "getElementsByTagName") && isHostType(d, "createComment") &&
            isHostType(d, "createElement") && isHostType(d, "createTextNode") &&
            isHostType(el, "appendChild") && isHostType(el, "insertBefore") &&
            isHostType(el, "removeChild") && isHostType(el, "getAttribute") &&
            isHostType(el, "setAttribute") && isHostType(el, "removeAttribute") &&
            isHostType(el, "style") && typeof el.style.cssText == "string";
    });

    // Stop repeat background-image requests and reduce memory consumption in IE6 SP1
    // http://misterpixel.blogspot.com/2006/09/forensic-analysis-of-ie6.html
    // http://blogs.msdn.com/b/cwilso/archive/2006/11/07/ie-re-downloading-background-images.aspx?PageIndex=1
    // http://support.microsoft.com/kb/823727
    try{
        document.execCommand("BackgroundImageCache", false, true);
    }catch(e){}

    // Expose has()
    // some AMD build optimizers, like r.js, check for specific condition patterns like the following:
    if(typeof define == "function" && typeof define.amd == "object" && define.amd){
        define("has", function(){
            return has;
        });
    }
    // check for `exports` after `define` in case a build optimizer adds an `exports` object
    else if(freeExports){
        // in Node.js or RingoJS v0.8.0+
        if(freeModule && freeModule.exports == freeExports){
          (freeModule.exports = has).has = has;
        }
        // in Narwhal or RingoJS v0.7.0-
        else{
          freeExports.has = has;
        }
    }
    // in a browser or Rhino
    else{
        // use square bracket notation so Closure Compiler won't munge `has`
        // http://code.google.com/closure/compiler/docs/api-tutorial3.html#export
        g["has"] = has;
    }
})(this);

/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});

// Copyright 2002-2012, University of Colorado

/**
 * The main 'kite' namespace object for the exported (non-Require.js) API. Used internally
 * since it prevents Require.js issues with circular dependencies.
 *
 * The returned kite object namespace may be incomplete if not all modules are listed as
 * dependencies. Please use the 'main' module for that purpose if all of Kite is desired.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/kite',['require'], function( require ) {
  // will be filled in by other modules
  return {};
} );

// Copyright 2002-2012, University of Colorado

/*
 * Usage:
 * var assert = require( '<assert>' )( 'flagName' );
 *
 * assert && assert( <simple value or big computation>, "<message here>" );
 *
 * TODO: decide on usages and viability, and if so document further
 *
 * NOTE: for changing build, add has.js tests for 'assert.' + flagName
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('ASSERT/assert',['require'], function( require ) {
  var assert = function( name, excludeByDefault ) {
    var hasName = 'assert.' + name;
    
    var flagDefined = window.has && window.has( hasName ) !== undefined;
    var skipAssert = flagDefined ? !window.has( hasName ) : excludeByDefault;
    
    if ( skipAssert ) {
      return null;
    } else {
      return function( predicate, message ) {
        var result = typeof predicate === 'function' ? predicate() : predicate;
        
        if ( !result ) {
          // TODO: custom error?
          throw new Error( 'Assertion failed: ' + message );
        }
      };
    }
  };
  
  return assert;
} );


define('DOT/dot',['require'], function( require ) {
  // will be filled in by other modules
  return {};
} );

// Copyright 2002-2012, University of Colorado

/**
 * Utility functions for Dot, placed into the dot.X namespace.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/Util',['require','ASSERT/assert','DOT/dot'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'dot' );
  
  var dot = require( 'DOT/dot' );
  // require( 'DOT/Vector2' ); // Require.js doesn't like the circular reference
  
  dot.Util = {
    testAssert: function() {
      return 'assert.dot: ' + ( assert ? 'true' : 'false' );
    },
    
    clamp: function( value, min, max ) {
      if ( value < min ) {
        return min;
      }
      else if ( value > max ) {
        return max;
      }
      else {
        return value;
      }
    },
    
    // Returns an array of integers from A to B (including both A to B)
    rangeInclusive: function( a, b ) {
      if ( b < a ) {
        return [];
      }
      var result = new Array( b - a + 1 );
      for ( var i = a; i <= b; i++ ) {
        result[i-a] = i;
      }
      return result;
    },
    
    // Returns an array of integers between A and B (excluding both A to B)
    rangeExclusive: function( a, b ) {
      return Util.rangeInclusive( a + 1, b - 1 );
    },
    
    toRadians: function( degrees ) {
      return Math.PI * degrees / 180;
    },
    
    toDegrees: function( radians ) {
      return 180 * radians / Math.PI;
    },
    
    // intersection between the line from p1-p2 and the line from p3-p4
    lineLineIntersection: function( p1, p2, p3, p4 ) {
      return new dot.Vector2(
        ( ( p1.x * p2.y - p1.y * p2.x ) * ( p3.x - p4.x ) - ( p1.x - p2.x ) * ( p3.x * p4.y - p3.y * p4.x ) ) / ( ( p1.x - p2.x ) * ( p3.y - p4.y ) - ( p1.y - p2.y ) * ( p3.x - p4.x ) ),
        ( ( p1.x * p2.y - p1.y * p2.x ) * ( p3.y - p4.y ) - ( p1.y - p2.y ) * ( p3.x * p4.y - p3.y * p4.x ) ) / ( ( p1.x - p2.x ) * ( p3.y - p4.y ) - ( p1.y - p2.y ) * ( p3.x - p4.x ) )
      );
    },
    
    // return an array of real roots of ax^2 + bx + c = 0
    solveQuadraticRootsReal: function( a, b, c ) {
      var discriminant = b * b - 4 * a * c;
      if ( discriminant < 0 ) {
        return [];
      }
      var sqrt = Math.sqrt( discriminant );
      // TODO: how to handle if discriminant is 0? give unique root or double it?
      // TODO: probably just use Complex for the future
      return [
        ( -b - sqrt ) / ( 2 * a ),
        ( -b + sqrt ) / ( 2 * a )
      ];
    },
    
    // return an array of real roots of ax^3 + bx^2 + cx + d = 0
    solveCubicRootsReal: function( a, b, c, d ) {
      // TODO: a Complex type!
      if ( a === 0 ) {
        return Util.solveQuadraticRootsReal( b, c, d );
      }
      if ( d === 0 ) {
        return Util.solveQuadraticRootsReal( a, b, c );
      }
      
      b /= a;
      c /= a;
      d /= a;
      
      var s, t;
      var q = ( 3.0 * c - ( b * b ) ) / 9;
      var r = ( -(27 * d) + b * (9 * c - 2 * (b * b)) ) / 54;
      var discriminant = q  * q  * q + r  * r;
      var b3 = b / 3;
      
      if ( discriminant > 0 ) {
        // a single real root
        var dsqrt = Math.sqrt( discriminant );
        return [ Util.cubeRoot( r + dsqrt ) + Util.cubeRoot( r - dsqrt ) - b3 ];
      }
      
      // three real roots
      if ( discriminant === 0 ) {
        // contains a double root
        var rsqrt = Util.cubeRoot( r );
        var doubleRoot = b3 - rsqrt;
        return [ -b3 + 2 * rsqrt, doubleRoot, doubleRoot ];
      } else {
        // all unique
        var qX = -q * q * q;
        qX = Math.acos( r / Math.sqrt( qX ) );
        var rr = 2 * Math.sqrt( -q );
        return [
          -b3 + rr * Math.cos( qX / 3 ),
          -b3 + rr * Math.cos( ( qX + 2 * Math.PI ) / 3 ),
          -b3 + rr * Math.cos( ( qX + 4 * Math.PI ) / 3 )
        ];
      }
    },
    
    cubeRoot: function( x ) {
      return x >= 0 ? Math.pow( x, 1/3 ) : -Math.pow( -x, 1/3 );
    },

    //Linearly interpolate two points and evaluate the line equation for a third point
    //Arguments are in the form x1=>y1, x2=>y2, x3=> ???
    linear: function( x1, y1, x2, y2, x3 ) {
      return (y2 - y1) / (x2 - x1) * (x3 - x1 ) + y1;
    }
  };
  var Util = dot.Util;
  
  // make these available in the main namespace directly (for now)
  dot.testAssert = Util.testAssert;
  dot.clamp = Util.clamp;
  dot.rangeInclusive = Util.rangeInclusive;
  dot.rangeExclusive = Util.rangeExclusive;
  dot.toRadians = Util.toRadians;
  dot.toDegrees = Util.toDegrees;
  
  return Util;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Basic 2-dimensional vector
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/Vector2',['require','ASSERT/assert','DOT/dot','DOT/Util'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'dot' );
  
  var dot = require( 'DOT/dot' );
  
  require( 'DOT/Util' );
  // require( 'DOT/Vector3' ); // commented out since Require.js complains about the circular dependency
  
  dot.Vector2 = function( x, y ) {
    // allow optional parameters
    this.x = x || 0;
    this.y = y || 0;
  };
  var Vector2 = dot.Vector2;
  
  Vector2.createPolar = function( magnitude, angle ) {
    return new Vector2( Math.cos( angle ), Math.sin( angle ) ).timesScalar( magnitude );
  };
  
  Vector2.prototype = {
    constructor: Vector2,
    
    isVector2: true,
    
    dimension: 2,
    
    magnitude: function() {
      return Math.sqrt( this.magnitudeSquared() );
    },
    
    magnitudeSquared: function() {
      return this.dot( this );
    },
    
    // the distance between this vector (treated as a point) and another point
    distance: function( point ) {
      return this.minus( point ).magnitude();
    },
    
    // the squared distance between this vector (treated as a point) and another point
    distanceSquared: function( point ) {
      return this.minus( point ).magnitudeSquared();
    },
    
    dot: function( v ) {
      return this.x * v.x + this.y * v.y;
    },
    
    equals: function( other ) {
      return this.x === other.x && this.y === other.y;
    },
    
    equalsEpsilon: function( other, epsilon ) {
      if ( !epsilon ) {
        epsilon = 0;
      }
      return Math.abs( this.x - other.x ) + Math.abs( this.y - other.y ) <= epsilon;
    },
    
    isFinite: function() {
      return isFinite( this.x ) && isFinite( this.y );
    },
    
    /*---------------------------------------------------------------------------*
     * Immutables
     *----------------------------------------------------------------------------*/
    
    copy: function() {
      return new Vector2( this.x, this.y );
    },
    
    // z component of the equivalent 3-dimensional cross product (this.x, this.y,0) x (v.x, v.y, 0)
    crossScalar: function( v ) {
      return this.x * v.y  - this.y * v.x;
    },
    
    normalized: function() {
      var mag = this.magnitude();
      if ( mag === 0 ) {
        throw new Error( "Cannot normalize a zero-magnitude vector" );
      }
      else {
        return new Vector2( this.x / mag, this.y / mag );
      }
    },
    
    timesScalar: function( scalar ) {
      return new Vector2( this.x * scalar, this.y * scalar );
    },
    
    times: function( scalar ) {
      // make sure it's not a vector!
      assert && assert( scalar.dimension === undefined );
      return this.timesScalar( scalar );
    },
    
    componentTimes: function( v ) {
      return new Vector2( this.x * v.x, this.y * v.y );
    },
    
    plus: function( v ) {
      return new Vector2( this.x + v.x, this.y + v.y );
    },
    
    plusScalar: function( scalar ) {
      return new Vector2( this.x + scalar, this.y + scalar );
    },
    
    minus: function( v ) {
      return new Vector2( this.x - v.x, this.y - v.y );
    },
    
    minusScalar: function( scalar ) {
      return new Vector2( this.x - scalar, this.y - scalar );
    },
    
    dividedScalar: function( scalar ) {
      return new Vector2( this.x / scalar, this.y / scalar );
    },
    
    negated: function() {
      return new Vector2( -this.x, -this.y );
    },
    
    angle: function() {
      return Math.atan2( this.y, this.x );
    },
    
    // equivalent to a -PI/2 rotation (right hand rotation)
    perpendicular: function() {
      return new Vector2( this.y, -this.x );
    },
    
    angleBetween: function( v ) {
      return Math.acos( dot.clamp( this.normalized().dot( v.normalized() ), -1, 1 ) );
    },
    
    rotated: function( angle ) {
      return Vector2.createPolar( this.magnitude(), this.angle() + angle );
    },
      
    // linear interpolation from this (ratio=0) to vector (ratio=1)
    blend: function( vector, ratio ) {
      return this.plus( vector.minus( this ).times( ratio ) );
    },
    
    toString: function() {
      return "Vector2(" + this.x + ", " + this.y + ")";
    },
    
    toVector3: function() {
      return new dot.Vector3( this.x, this.y );
    },
    
    /*---------------------------------------------------------------------------*
     * Mutables
     *----------------------------------------------------------------------------*/
     
    set: function( x, y ) {
      this.x = x;
      this.y = y;
      return this;
    },
    
    setX: function( x ) {
      this.x = x;
      return this;
    },
    
    setY: function( y ) {
      this.y = y;
      return this;
    },
    
    add: function( v ) {
      this.x += v.x;
      this.y += v.y;
      return this;
    },
    
    addScalar: function( scalar ) {
      this.x += scalar;
      this.y += scalar;
      return this;
    },
    
    subtract: function( v ) {
      this.x -= v.x;
      this.y -= v.y;
      return this;
    },
    
    subtractScalar: function( scalar ) {
      this.x -= scalar;
      this.y -= scalar;
      return this;
    },
    
    componentMultiply: function( v ) {
      this.x *= v.x;
      this.y *= v.y;
      return this;
    },
    
    divideScalar: function( scalar ) {
      this.x /= scalar;
      this.y /= scalar;
      return this;
    },
    
    negate: function() {
      this.x = -this.x;
      this.y = -this.y;
      return this;
    }
    
  };
  
  /*---------------------------------------------------------------------------*
   * Immutable Vector form
   *----------------------------------------------------------------------------*/
  Vector2.Immutable = function( x, y ) {
    this.x = x || 0;
    this.y = y || 0;
  };
  var Immutable = Vector2.Immutable;
  
  Immutable.prototype = new Vector2();
  Immutable.prototype.constructor = Immutable;
  
  // throw errors whenever a mutable method is called on our immutable vector
  Immutable.mutableOverrideHelper = function( mutableFunctionName ) {
    Immutable.prototype[mutableFunctionName] = function() {
      throw new Error( "Cannot call mutable method '" + mutableFunctionName + "' on immutable Vector2" );
    };
  };
  
  // TODO: better way to handle this list?
  Immutable.mutableOverrideHelper( 'set' );
  Immutable.mutableOverrideHelper( 'setX' );
  Immutable.mutableOverrideHelper( 'setY' );
  Immutable.mutableOverrideHelper( 'copy' );
  Immutable.mutableOverrideHelper( 'add' );
  Immutable.mutableOverrideHelper( 'addScalar' );
  Immutable.mutableOverrideHelper( 'subtract' );
  Immutable.mutableOverrideHelper( 'subtractScalar' );
  Immutable.mutableOverrideHelper( 'componentMultiply' );
  Immutable.mutableOverrideHelper( 'divideScalar' );
  Immutable.mutableOverrideHelper( 'negate' );
  
  // helpful immutable constants
  Vector2.ZERO = new Immutable( 0, 0 );
  Vector2.X_UNIT = new Immutable( 1, 0 );
  Vector2.Y_UNIT = new Immutable( 0, 1 );
  
  return Vector2;
} );

// Copyright 2002-2012, University of Colorado

/**
 * A 2D rectangle-shaped bounded area (bounding box)
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/Bounds2',['require','ASSERT/assert','DOT/dot','DOT/Vector2'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'dot' );
  
  var dot = require( 'DOT/dot' );
  
  require( 'DOT/Vector2' );
  
  // not using x,y,width,height so that it can handle infinity-based cases in a better way
  dot.Bounds2 = function( minX, minY, maxX, maxY ) {
    assert && assert( maxY !== undefined, 'Bounds2 requires 4 parameters' );
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  };
  var Bounds2 = dot.Bounds2;

  Bounds2.prototype = {
    constructor: Bounds2,
    
    /*---------------------------------------------------------------------------*
    * Properties
    *----------------------------------------------------------------------------*/
    
    getWidth: function() { return this.maxX - this.minX; },
    get width() { return this.getWidth(); },
    
    getHeight: function() { return this.maxY - this.minY; },
    get height() { return this.getHeight(); },
    
    getX: function() { return this.minX; },
    get x() { return this.getX(); },
    
    getY: function() { return this.minY; },
    get y() { return this.getY(); },
    
    getCenterX: function() { return ( this.maxX + this.minX ) / 2; },
    get centerX() { return this.getCenterX(); },
    
    getCenterY: function() { return ( this.maxY + this.minY ) / 2; },
    get centerY() { return this.getCenterY(); },
    
    getMinX: function() { return this.minX; },
    getMinY: function() { return this.minY; },
    getMaxX: function() { return this.maxX; },
    getMaxY: function() { return this.maxY; },
    
    isEmpty: function() { return this.getWidth() < 0 || this.getHeight() < 0; },
    
    isFinite: function() {
      return isFinite( this.minX ) && isFinite( this.minY ) && isFinite( this.maxX ) && isFinite( this.maxY );
    },
    
    isValid: function() {
      return !this.isEmpty() && this.isFinite();
    },
    
    // whether the coordinates are inside the bounding box (or on the boundary)
    containsCoordinates: function( x, y ) {
      return this.minX <= x && x <= this.maxX && this.minY <= y && y <= this.maxY;
    },
    
    // whether the point is inside the bounding box (or on the boundary)
    containsPoint: function( point ) {
      return this.containsCoordinates( point.x, point.y );
    },
    
    // whether this bounding box completely contains the argument bounding box
    containsBounds: function( bounds ) {
      return this.minX <= bounds.minX && this.maxX >= bounds.maxX && this.minY <= bounds.minY && this.maxY >= bounds.maxY;
    },
    
    // whether the intersection is non-empty (if they share any part of a boundary, this will be true)
    intersectsBounds: function( bounds ) {
      // TODO: more efficient way of doing this?
      return !this.intersection( bounds ).isEmpty();
    },
    
    toString: function() {
      return '[x:(' + this.minX + ',' + this.maxX + '),y:(' + this.minY + ',' + this.maxY + ')]';
    },

    equals: function( other ) {
      return this.minX === other.minX && this.minY === other.minY && this.maxX === other.maxX && this.maxY === other.maxY;
    },
    
    /*---------------------------------------------------------------------------*
    * Immutable operations
    *----------------------------------------------------------------------------*/
    
    copy: function() {
      return new Bounds2( this.minX, this.minY, this.maxX, this.maxY );
    },
    
    // immutable operations (bounding-box style handling, so that the relevant bounds contain everything)
    union: function( bounds ) {
      return new Bounds2(
        Math.min( this.minX, bounds.minX ),
        Math.min( this.minY, bounds.minY ),
        Math.max( this.maxX, bounds.maxX ),
        Math.max( this.maxY, bounds.maxY )
      );
    },
    intersection: function( bounds ) {
      return new Bounds2(
        Math.max( this.minX, bounds.minX ),
        Math.max( this.minY, bounds.minY ),
        Math.min( this.maxX, bounds.maxX ),
        Math.min( this.maxY, bounds.maxY )
      );
    },
    // TODO: difference should be well-defined, but more logic is needed to compute
    
    withCoordinates: function( x, y ) {
      return new Bounds2(
        Math.min( this.minX, x ),
        Math.min( this.minY, y ),
        Math.max( this.maxX, x ),
        Math.max( this.maxY, y )
      );
    },
    
    // like a union with a point-sized bounding box
    withPoint: function( point ) {
      return this.withCoordinates( point.x, point.y );
    },
    
    withMinX: function( minX ) { return new Bounds2( minX, this.minY, this.maxX, this.maxY ); },
    withMinY: function( minY ) { return new Bounds2( this.minX, minY, this.maxX, this.maxY ); },
    withMaxX: function( maxX ) { return new Bounds2( this.minX, this.minY, maxX, this.maxY ); },
    withMaxY: function( maxY ) { return new Bounds2( this.minX, this.minY, this.maxX, maxY ); },
    
    // copy rounded to integral values, expanding where necessary
    roundedOut: function() {
      return new Bounds2(
        Math.floor( this.minX ),
        Math.floor( this.minY ),
        Math.ceil( this.maxX ),
        Math.ceil( this.maxY )
      );
    },
    
    // copy rounded to integral values, contracting where necessary
    roundedIn: function() {
      return new Bounds2(
        Math.ceil( this.minX ),
        Math.ceil( this.minY ),
        Math.floor( this.maxX ),
        Math.floor( this.maxY )
      );
    },
    
    // transform a bounding box.
    // NOTE that box.transformed( matrix ).transformed( inverse ) may be larger than the original box
    transformed: function( matrix ) {
      return this.copy().transform( matrix );
    },
    
    // returns copy expanded on all sides by length d
    dilated: function( d ) {
      return new Bounds2( this.minX - d, this.minY - d, this.maxX + d, this.maxY + d );
    },
    
    // returns copy contracted on all sides by length d
    eroded: function( d ) {
      return this.dilated( -d );
    },
    
    shiftedX: function( x ) {
      return new Bounds2( this.minX + x, this.minY, this.maxX + x, this.maxY );
    },
    
    shiftedY: function( y ) {
      return new Bounds2( this.minX, this.minY + y, this.maxX, this.maxY + y );
    },
    
    shifted: function( x, y ) {
      return new Bounds2( this.minX + x, this.minY + y, this.maxX + x, this.maxY + y );
    },
    
    /*---------------------------------------------------------------------------*
    * Mutable operations
    *----------------------------------------------------------------------------*/
    
    set: function( minX, minY, maxX, maxY ) {
      this.minX = minX;
      this.minY = minY;
      this.maxX = maxX;
      this.maxY = maxY;
      return this;
    },
    
    setBounds: function( bounds ) {
      return this.set( bounds.minX, bounds.minY, bounds.maxX, bounds.maxY );
    },
    
    // mutable union
    includeBounds: function( bounds ) {
      this.minX = Math.min( this.minX, bounds.minX );
      this.minY = Math.min( this.minY, bounds.minY );
      this.maxX = Math.max( this.maxX, bounds.maxX );
      this.maxY = Math.max( this.maxY, bounds.maxY );
      return this;
    },
    
    // mutable intersection
    constrainBounds: function( bounds ) {
      this.minX = Math.max( this.minX, bounds.minX );
      this.minY = Math.max( this.minY, bounds.minY );
      this.maxX = Math.min( this.maxX, bounds.maxX );
      this.maxY = Math.min( this.maxY, bounds.maxY );
      return this;
    },
    
    addCoordinates: function( x, y ) {
      this.minX = Math.min( this.minX, x );
      this.minY = Math.min( this.minY, y );
      this.maxX = Math.max( this.maxX, x );
      this.maxY = Math.max( this.maxY, y );
      return this;
    },
    
    addPoint: function( point ) {
      return this.addCoordinates( point.x, point.y );
    },
    
    setMinX: function( minX ) { this.minX = minX; return this; },
    setMinY: function( minY ) { this.minY = minY; return this; },
    setMaxX: function( maxX ) { this.maxX = maxX; return this; },
    setMaxY: function( maxY ) { this.maxY = maxY; return this; },
    
    // round to integral values, expanding where necessary
    roundOut: function() {
      this.minX = Math.floor( this.minX );
      this.minY = Math.floor( this.minY );
      this.maxX = Math.ceil( this.maxX );
      this.maxY = Math.ceil( this.maxY );
      return this;
    },
    
    // round to integral values, contracting where necessary
    roundIn: function() {
      this.minX = Math.ceil( this.minX );
      this.minY = Math.ceil( this.minY );
      this.maxX = Math.floor( this.maxX );
      this.maxY = Math.floor( this.maxY );
      return this;
    },
    
    // transform a bounding box.
    // NOTE that box.transformed( matrix ).transformed( inverse ) may be larger than the original box
    transform: function( matrix ) {
      // do nothing
      if ( this.isEmpty() ) {
        return this;
      }
      var minX = this.minX;
      var minY = this.minY;
      var maxX = this.maxX;
      var maxY = this.maxY;
      
      // using mutable vector so we don't create excessive instances of Vector2 during this
      // make sure all 4 corners are inside this transformed bounding box
      var vector = new dot.Vector2();
      this.setBounds( Bounds2.NOTHING );
      this.addPoint( matrix.multiplyVector2( vector.set( minX, minY ) ) );
      this.addPoint( matrix.multiplyVector2( vector.set( minX, maxY ) ) );
      this.addPoint( matrix.multiplyVector2( vector.set( maxX, minY ) ) );
      this.addPoint( matrix.multiplyVector2( vector.set( maxX, maxY ) ) );
      return this;
    },
    
    // expands on all sides by length d
    dilate: function( d ) {
      return this.set( this.minX - d, this.minY - d, this.maxX + d, this.maxY + d );
    },
    
    // contracts on all sides by length d
    erode: function( d ) {
      return this.dilate( -d );
    },
    
    shiftX: function( x ) {
      return this.setMinX( this.minX + x ).setMaxX( this.maxX + x );
    },
    
    shiftY: function( y ) {
      return this.setMinY( this.minY + y ).setMaxY( this.maxY + y );
    },
    
    shift: function( x, y ) {
      return this.shiftX( x ).shiftY( y );
    }
  };
  
  // specific bounds useful for operations
  Bounds2.EVERYTHING = new Bounds2( Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY );
  Bounds2.NOTHING = new Bounds2( Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY );
  
  return Bounds2;
} );

// Copyright 2002-2012, University of Colorado

/**
 * 2-dimensional ray
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/Ray2',['require','ASSERT/assert','DOT/dot'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'dot' );
  
  var dot = require( 'DOT/dot' );

  dot.Ray2 = function( pos, dir ) {
    this.pos = pos;
    this.dir = dir;
    
    assert && assert( Math.abs( dir.magnitude() - 1 ) < 0.01 );
  };
  var Ray2 = dot.Ray2;

  Ray2.prototype = {
    constructor: Ray2,

    shifted: function( distance ) {
      return new Ray2( this.pointAtDistance( distance ), this.dir );
    },

    pointAtDistance: function( distance ) {
      return this.pos.plus( this.dir.timesScalar( distance ) );
    },

    toString: function() {
      return this.pos.toString() + " => " + this.dir.toString();
    }
  };
  
  return Ray2;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Basic 4-dimensional vector
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/Vector4',['require','ASSERT/assert','DOT/dot','DOT/Util'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'dot' );
  
  var dot = require( 'DOT/dot' );
  
  require( 'DOT/Util' );
  // require( 'DOT/Vector3' ); // commented out so Require.js doesn't complain about the circular dependency
  
  dot.Vector4 = function( x, y, z, w ) {
    // allow optional parameters
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.w = w !== undefined ? w : 1; // since w could be zero!
  };
  var Vector4 = dot.Vector4;
  
  Vector4.prototype = {
    constructor: Vector4,

    magnitude: function() {
      return Math.sqrt( this.magnitudeSquared() );
    },

    magnitudeSquared: function() {
      this.dot( this );
    },
    
    // the distance between this vector (treated as a point) and another point
    distance: function( point ) {
      return this.minus( point ).magnitude();
    },
    
    // the squared distance between this vector (treated as a point) and another point
    distanceSquared: function( point ) {
      return this.minus( point ).magnitudeSquared();
    },

    dot: function( v ) {
      return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    },
    
    isFinite: function() {
      return isFinite( this.x ) && isFinite( this.y ) && isFinite( this.z ) && isFinite( this.w );
    },

    /*---------------------------------------------------------------------------*
     * Immutables
     *----------------------------------------------------------------------------*/

    normalized: function() {
      var mag = this.magnitude();
      if ( mag === 0 ) {
        throw new Error( "Cannot normalize a zero-magnitude vector" );
      }
      else {
        return new Vector4( this.x / mag, this.y / mag, this.z / mag, this.w / mag );
      }
    },

    timesScalar: function( scalar ) {
      return new Vector4( this.x * scalar, this.y * scalar, this.z * scalar, this.w * scalar );
    },

    times: function( scalar ) {
      // make sure it's not a vector!
      assert && assert( scalar.dimension === undefined );
      return this.timesScalar( scalar );
    },

    componentTimes: function( v ) {
      return new Vector4( this.x * v.x, this.y * v.y, this.z * v.z, this.w * v.w );
    },

    plus: function( v ) {
      return new Vector4( this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w );
    },

    plusScalar: function( scalar ) {
      return new Vector4( this.x + scalar, this.y + scalar, this.z + scalar, this.w + scalar );
    },

    minus: function( v ) {
      return new Vector4( this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w );
    },

    minusScalar: function( scalar ) {
      return new Vector4( this.x - scalar, this.y - scalar, this.z - scalar, this.w - scalar );
    },

    dividedScalar: function( scalar ) {
      return new Vector4( this.x / scalar, this.y / scalar, this.z / scalar, this.w / scalar );
    },

    negated: function() {
      return new Vector4( -this.x, -this.y, -this.z, -this.w );
    },

    angleBetween: function( v ) {
      return Math.acos( dot.clamp( this.normalized().dot( v.normalized() ), -1, 1 ) );
    },
    
    // linear interpolation from this (ratio=0) to vector (ratio=1)
    blend: function( vector, ratio ) {
      return this.plus( vector.minus( this ).times( ratio ) );
    },

    toString: function() {
      return "Vector4(" + this.x + ", " + this.y + ", " + this.z + ", " + this.w + ")";
    },

    toVector3: function() {
      return new dot.Vector3( this.x, this.y, this.z );
    },

    /*---------------------------------------------------------------------------*
     * Mutables
     *----------------------------------------------------------------------------*/

    set: function( x, y, z, w ) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    },

    setX: function( x ) {
      this.x = x;
    },

    setY: function( y ) {
      this.y = y;
    },

    setZ: function( z ) {
      this.z = z;
    },

    setW: function( w ) {
      this.w = w;
    },

    copy: function( v ) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      this.w = v.w;
    },

    add: function( v ) {
      this.x += v.x;
      this.y += v.y;
      this.z += v.z;
      this.w += v.w;
    },

    addScalar: function( scalar ) {
      this.x += scalar;
      this.y += scalar;
      this.z += scalar;
      this.w += scalar;
    },

    subtract: function( v ) {
      this.x -= v.x;
      this.y -= v.y;
      this.z -= v.z;
      this.w -= v.w;
    },

    subtractScalar: function( scalar ) {
      this.x -= scalar;
      this.y -= scalar;
      this.z -= scalar;
      this.w -= scalar;
    },

    componentMultiply: function( v ) {
      this.x *= v.x;
      this.y *= v.y;
      this.z *= v.z;
      this.w *= v.w;
    },

    divideScalar: function( scalar ) {
      this.x /= scalar;
      this.y /= scalar;
      this.z /= scalar;
      this.w /= scalar;
    },

    negate: function() {
      this.x = -this.x;
      this.y = -this.y;
      this.z = -this.z;
      this.w = -this.w;
    },
    
    equals: function( other ) {
      return this.x === other.x && this.y === other.y && this.z === other.z && this.w === other.w;
    },
    
    equalsEpsilon: function( other, epsilon ) {
      if ( !epsilon ) {
        epsilon = 0;
      }
      return Math.abs( this.x - other.x ) + Math.abs( this.y - other.y ) + Math.abs( this.z - other.z ) + Math.abs( this.w - other.w ) <= epsilon;
    },

    isVector4: true,

    dimension: 4

  };

  /*---------------------------------------------------------------------------*
   * Immutable Vector form
   *----------------------------------------------------------------------------*/
  Vector4.Immutable = function( x, y, z, w ) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.w = w !== undefined ? w : 1;
  };
  var Immutable = Vector4.Immutable;

  Immutable.prototype = new Vector4();
  Immutable.prototype.constructor = Immutable;

  // throw errors whenever a mutable method is called on our immutable vector
  Immutable.mutableOverrideHelper = function( mutableFunctionName ) {
    Immutable.prototype[mutableFunctionName] = function() {
      throw new Error( "Cannot call mutable method '" + mutableFunctionName + "' on immutable Vector4" );
    };
  };

  // TODO: better way to handle this list?
  Immutable.mutableOverrideHelper( 'set' );
  Immutable.mutableOverrideHelper( 'setX' );
  Immutable.mutableOverrideHelper( 'setY' );
  Immutable.mutableOverrideHelper( 'setZ' );
  Immutable.mutableOverrideHelper( 'setW' );
  Immutable.mutableOverrideHelper( 'copy' );
  Immutable.mutableOverrideHelper( 'add' );
  Immutable.mutableOverrideHelper( 'addScalar' );
  Immutable.mutableOverrideHelper( 'subtract' );
  Immutable.mutableOverrideHelper( 'subtractScalar' );
  Immutable.mutableOverrideHelper( 'componentMultiply' );
  Immutable.mutableOverrideHelper( 'divideScalar' );
  Immutable.mutableOverrideHelper( 'negate' );

  // helpful immutable constants
  Vector4.ZERO = new Immutable( 0, 0, 0, 0 );
  Vector4.X_UNIT = new Immutable( 1, 0, 0, 0 );
  Vector4.Y_UNIT = new Immutable( 0, 1, 0, 0 );
  Vector4.Z_UNIT = new Immutable( 0, 0, 1, 0 );
  Vector4.W_UNIT = new Immutable( 0, 0, 0, 1 );
  
  return Vector4;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Basic 3-dimensional vector
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/Vector3',['require','ASSERT/assert','DOT/dot','DOT/Util','DOT/Vector2','DOT/Vector4'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'dot' );
  
  var dot = require( 'DOT/dot' );
  
  require( 'DOT/Util' );
  require( 'DOT/Vector2' );
  require( 'DOT/Vector4' );

  dot.Vector3 = function( x, y, z ) {
    // allow optional parameters
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
  };
  var Vector3 = dot.Vector3;

  Vector3.prototype = {
    constructor: Vector3,

    magnitude: function() {
      return Math.sqrt( this.magnitudeSquared() );
    },

    magnitudeSquared: function() {
      return this.dot( this );
    },
    
    // the distance between this vector (treated as a point) and another point
    distance: function( point ) {
      return this.minus( point ).magnitude();
    },
    
    // the squared distance between this vector (treated as a point) and another point
    distanceSquared: function( point ) {
      return this.minus( point ).magnitudeSquared();
    },

    dot: function( v ) {
      return this.x * v.x + this.y * v.y + this.z * v.z;
    },
    
    isFinite: function() {
      return isFinite( this.x ) && isFinite( this.y ) && isFinite( this.z );
    },

    /*---------------------------------------------------------------------------*
     * Immutables
     *----------------------------------------------------------------------------*/

    cross: function( v ) {
      return new Vector3(
          this.y * v.z - this.z * v.y,
          this.z * v.x - this.x * v.z,
          this.x * v.y - this.y * v.x
      );
    },

    normalized: function() {
      var mag = this.magnitude();
      if ( mag === 0 ) {
        throw new Error( "Cannot normalize a zero-magnitude vector" );
      }
      else {
        return new Vector3( this.x / mag, this.y / mag, this.z / mag );
      }
    },

    timesScalar: function( scalar ) {
      return new Vector3( this.x * scalar, this.y * scalar, this.z * scalar );
    },

    times: function( scalar ) {
      // make sure it's not a vector!
      assert && assert( scalar.dimension === undefined );
      return this.timesScalar( scalar );
    },

    componentTimes: function( v ) {
      return new Vector3( this.x * v.x, this.y * v.y, this.z * v.z );
    },

    plus: function( v ) {
      return new Vector3( this.x + v.x, this.y + v.y, this.z + v.z );
    },

    plusScalar: function( scalar ) {
      return new Vector3( this.x + scalar, this.y + scalar, this.z + scalar );
    },

    minus: function( v ) {
      return new Vector3( this.x - v.x, this.y - v.y, this.z - v.z );
    },

    minusScalar: function( scalar ) {
      return new Vector3( this.x - scalar, this.y - scalar, this.z - scalar );
    },

    dividedScalar: function( scalar ) {
      return new Vector3( this.x / scalar, this.y / scalar, this.z / scalar );
    },

    negated: function() {
      return new Vector3( -this.x, -this.y, -this.z );
    },

    angleBetween: function( v ) {
      return Math.acos( dot.clamp( this.normalized().dot( v.normalized() ), -1, 1 ) );
    },
    
    // linear interpolation from this (ratio=0) to vector (ratio=1)
    blend: function( vector, ratio ) {
      return this.plus( vector.minus( this ).times( ratio ) );
    },

    toString: function() {
      return "Vector3(" + this.x + ", " + this.y + ", " + this.z + ")";
    },

    toVector2: function() {
      return new dot.Vector2( this.x, this.y );
    },

    toVector4: function() {
      return new dot.Vector4( this.x, this.y, this.z );
    },

    /*---------------------------------------------------------------------------*
     * Mutables
     *----------------------------------------------------------------------------*/

    set: function( x, y, z ) {
      this.x = x;
      this.y = y;
      this.z = z;
    },

    setX: function( x ) {
      this.x = x;
    },

    setY: function( y ) {
      this.y = y;
    },

    setZ: function( z ) {
      this.z = z;
    },

    copy: function( v ) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
    },

    add: function( v ) {
      this.x += v.x;
      this.y += v.y;
      this.z += v.z;
    },

    addScalar: function( scalar ) {
      this.x += scalar;
      this.y += scalar;
      this.z += scalar;
    },

    subtract: function( v ) {
      this.x -= v.x;
      this.y -= v.y;
      this.z -= v.z;
    },

    subtractScalar: function( scalar ) {
      this.x -= scalar;
      this.y -= scalar;
      this.z -= scalar;
    },

    componentMultiply: function( v ) {
      this.x *= v.x;
      this.y *= v.y;
      this.z *= v.z;
    },

    divideScalar: function( scalar ) {
      this.x /= scalar;
      this.y /= scalar;
      this.z /= scalar;
    },

    negate: function() {
      this.x = -this.x;
      this.y = -this.y;
      this.z = -this.z;
    },
    
    equals: function( other ) {
      return this.x === other.x && this.y === other.y && this.z === other.z;
    },
    
    equalsEpsilon: function( other, epsilon ) {
      if ( !epsilon ) {
        epsilon = 0;
      }
      return Math.abs( this.x - other.x ) + Math.abs( this.y - other.y ) + Math.abs( this.z - other.z ) <= epsilon;
    },

    isVector3: true,

    dimension: 3

  };

  /*---------------------------------------------------------------------------*
   * Immutable Vector form
   *----------------------------------------------------------------------------*/
  Vector3.Immutable = function( x, y, z ) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
  };
  var Immutable = Vector3.Immutable;

  Immutable.prototype = new Vector3();
  Immutable.prototype.constructor = Immutable;

  // throw errors whenever a mutable method is called on our immutable vector
  Immutable.mutableOverrideHelper = function( mutableFunctionName ) {
    Immutable.prototype[mutableFunctionName] = function() {
      throw new Error( "Cannot call mutable method '" + mutableFunctionName + "' on immutable Vector3" );
    };
  };

  // TODO: better way to handle this list?
  Immutable.mutableOverrideHelper( 'set' );
  Immutable.mutableOverrideHelper( 'setX' );
  Immutable.mutableOverrideHelper( 'setY' );
  Immutable.mutableOverrideHelper( 'setZ' );
  Immutable.mutableOverrideHelper( 'copy' );
  Immutable.mutableOverrideHelper( 'add' );
  Immutable.mutableOverrideHelper( 'addScalar' );
  Immutable.mutableOverrideHelper( 'subtract' );
  Immutable.mutableOverrideHelper( 'subtractScalar' );
  Immutable.mutableOverrideHelper( 'componentMultiply' );
  Immutable.mutableOverrideHelper( 'divideScalar' );
  Immutable.mutableOverrideHelper( 'negate' );

  // helpful immutable constants
  Vector3.ZERO = new Immutable( 0, 0, 0 );
  Vector3.X_UNIT = new Immutable( 1, 0, 0 );
  Vector3.Y_UNIT = new Immutable( 0, 1, 0 );
  Vector3.Z_UNIT = new Immutable( 0, 0, 1 );
  
  return Vector3;
} );

// Copyright 2002-2012, University of Colorado

/**
 * 4-dimensional Matrix
 *
 * TODO: consider adding affine flag if it will help performance (a la Matrix3)
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/Matrix4',['require','DOT/dot','DOT/Vector3','DOT/Vector4'], function( require ) {
  
  
  var dot = require( 'DOT/dot' );
  
  require( 'DOT/Vector3' );
  require( 'DOT/Vector4' );
  
  var Float32Array = window.Float32Array || Array;
  
  dot.Matrix4 = function( v00, v01, v02, v03, v10, v11, v12, v13, v20, v21, v22, v23, v30, v31, v32, v33, type ) {

    // entries stored in column-major format
    this.entries = new Float32Array( 16 );

    this.rowMajor( v00 === undefined ? 1 : v00, v01 || 0, v02 || 0, v03 || 0,
             v10 || 0, v11 === undefined ? 1 : v11, v12 || 0, v13 || 0,
             v20 || 0, v21 || 0, v22 === undefined ? 1 : v22, v23 || 0,
             v30 || 0, v31 || 0, v32 || 0, v33 === undefined ? 1 : v33,
             type );
  };
  var Matrix4 = dot.Matrix4;

  Matrix4.Types = {
    OTHER: 0, // default
    IDENTITY: 1,
    TRANSLATION_3D: 2,
    SCALING: 3

    // TODO: possibly add rotations
  };

  var Types = Matrix4.Types;

  Matrix4.identity = function() {
    return new Matrix4( 1, 0, 0, 0,
              0, 1, 0, 0,
              0, 0, 1, 0,
              0, 0, 0, 1,
              Types.IDENTITY );
  };

  Matrix4.translation = function( x, y, z ) {
    return new Matrix4( 1, 0, 0, x,
              0, 1, 0, y,
              0, 0, 1, z,
              0, 0, 0, 1,
              Types.TRANSLATION_3D );
  };

  Matrix4.translationFromVector = function( v ) { return Matrix4.translation( v.x, v.y, v.z ); };

  Matrix4.scaling = function( x, y, z ) {
    // allow using one parameter to scale everything
    y = y === undefined ? x : y;
    z = z === undefined ? x : z;

    return new Matrix4( x, 0, 0, 0,
              0, y, 0, 0,
              0, 0, z, 0,
              0, 0, 0, 1,
              Types.SCALING );
  };

  // axis is a normalized Vector3, angle in radians.
  Matrix4.rotationAxisAngle = function( axis, angle ) {
    var c = Math.cos( angle );
    var s = Math.sin( angle );
    var C = 1 - c;

    return new Matrix4( axis.x * axis.x * C + c, axis.x * axis.y * C - axis.z * s, axis.x * axis.z * C + axis.y * s, 0,
              axis.y * axis.x * C + axis.z * s, axis.y * axis.y * C + c, axis.y * axis.z * C - axis.x * s, 0,
              axis.z * axis.x * C - axis.y * s, axis.z * axis.y * C + axis.x * s, axis.z * axis.z * C + c, 0,
              0, 0, 0, 1,
              Types.OTHER );
  };

  // TODO: add in rotation from quaternion, and from quat + translation

  Matrix4.rotationX = function( angle ) {
    var c = Math.cos( angle );
    var s = Math.sin( angle );

    return new Matrix4( 1, 0, 0, 0,
              0, c, -s, 0,
              0, s, c, 0,
              0, 0, 0, 1,
              Types.OTHER );
  };

  Matrix4.rotationY = function( angle ) {
    var c = Math.cos( angle );
    var s = Math.sin( angle );

    return new Matrix4( c, 0, s, 0,
              0, 1, 0, 0,
              -s, 0, c, 0,
              0, 0, 0, 1,
              Types.OTHER );
  };

  Matrix4.rotationZ = function( angle ) {
    var c = Math.cos( angle );
    var s = Math.sin( angle );

    return new Matrix4( c, -s, 0, 0,
              s, c, 0, 0,
              0, 0, 1, 0,
              0, 0, 0, 1,
              Types.OTHER );
  };

  // aspect === width / height
  Matrix4.gluPerspective = function( fovYRadians, aspect, zNear, zFar ) {
    var cotangent = Math.cos( fovYRadians ) / Math.sin( fovYRadians );

    return new Matrix4( cotangent / aspect, 0, 0, 0,
              0, cotangent, 0, 0,
              0, 0, ( zFar + zNear ) / ( zNear - zFar ), ( 2 * zFar * zNear ) / ( zNear - zFar ),
              0, 0, -1, 0 );
  };

  Matrix4.prototype = {
    constructor: Matrix4,

    rowMajor: function( v00, v01, v02, v03, v10, v11, v12, v13, v20, v21, v22, v23, v30, v31, v32, v33, type ) {
      this.entries[0] = v00;
      this.entries[1] = v10;
      this.entries[2] = v20;
      this.entries[3] = v30;
      this.entries[4] = v01;
      this.entries[5] = v11;
      this.entries[6] = v21;
      this.entries[7] = v31;
      this.entries[8] = v02;
      this.entries[9] = v12;
      this.entries[10] = v22;
      this.entries[11] = v32;
      this.entries[12] = v03;
      this.entries[13] = v13;
      this.entries[14] = v23;
      this.entries[15] = v33;
      this.type = type === undefined ? Types.OTHER : type;
    },

    columnMajor: function( v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33, type ) {
      this.rowMajor( v00, v01, v02, v03, v10, v11, v12, v13, v20, v21, v22, v23, v30, v31, v32, v33, type );
    },

    // convenience getters. inline usages of these when performance is critical? TODO: test performance of inlining these, with / without closure compiler
    m00: function() { return this.entries[0]; },
    m01: function() { return this.entries[4]; },
    m02: function() { return this.entries[8]; },
    m03: function() { return this.entries[12]; },
    m10: function() { return this.entries[1]; },
    m11: function() { return this.entries[5]; },
    m12: function() { return this.entries[9]; },
    m13: function() { return this.entries[13]; },
    m20: function() { return this.entries[2]; },
    m21: function() { return this.entries[6]; },
    m22: function() { return this.entries[10]; },
    m23: function() { return this.entries[14]; },
    m30: function() { return this.entries[3]; },
    m31: function() { return this.entries[7]; },
    m32: function() { return this.entries[11]; },
    m33: function() { return this.entries[15]; },

    plus: function( m ) {
      return new Matrix4(
          this.m00() + m.m00(), this.m01() + m.m01(), this.m02() + m.m02(), this.m03() + m.m03(),
          this.m10() + m.m10(), this.m11() + m.m11(), this.m12() + m.m12(), this.m13() + m.m13(),
          this.m20() + m.m20(), this.m21() + m.m21(), this.m22() + m.m22(), this.m23() + m.m23(),
          this.m30() + m.m30(), this.m31() + m.m31(), this.m32() + m.m32(), this.m33() + m.m33()
      );
    },

    minus: function( m ) {
      return new Matrix4(
          this.m00() - m.m00(), this.m01() - m.m01(), this.m02() - m.m02(), this.m03() - m.m03(),
          this.m10() - m.m10(), this.m11() - m.m11(), this.m12() - m.m12(), this.m13() - m.m13(),
          this.m20() - m.m20(), this.m21() - m.m21(), this.m22() - m.m22(), this.m23() - m.m23(),
          this.m30() - m.m30(), this.m31() - m.m31(), this.m32() - m.m32(), this.m33() - m.m33()
      );
    },

    transposed: function() {
      return new Matrix4( this.m00(), this.m10(), this.m20(), this.m30(),
                this.m01(), this.m11(), this.m21(), this.m31(),
                this.m02(), this.m12(), this.m22(), this.m32(),
                this.m03(), this.m13(), this.m23(), this.m33() );
    },

    negated: function() {
      return new Matrix4( -this.m00(), -this.m01(), -this.m02(), -this.m03(),
                -this.m10(), -this.m11(), -this.m12(), -this.m13(),
                -this.m20(), -this.m21(), -this.m22(), -this.m23(),
                -this.m30(), -this.m31(), -this.m32(), -this.m33() );
    },

    inverted: function() {
      // TODO: optimizations for matrix types (like identity)

      var det = this.determinant();

      if ( det !== 0 ) {
        return new Matrix4(
            ( -this.m31() * this.m22() * this.m13() + this.m21() * this.m32() * this.m13() + this.m31() * this.m12() * this.m23() - this.m11() * this.m32() * this.m23() - this.m21() * this.m12() * this.m33() + this.m11() * this.m22() * this.m33() ) / det,
            ( this.m31() * this.m22() * this.m03() - this.m21() * this.m32() * this.m03() - this.m31() * this.m02() * this.m23() + this.m01() * this.m32() * this.m23() + this.m21() * this.m02() * this.m33() - this.m01() * this.m22() * this.m33() ) / det,
            ( -this.m31() * this.m12() * this.m03() + this.m11() * this.m32() * this.m03() + this.m31() * this.m02() * this.m13() - this.m01() * this.m32() * this.m13() - this.m11() * this.m02() * this.m33() + this.m01() * this.m12() * this.m33() ) / det,
            ( this.m21() * this.m12() * this.m03() - this.m11() * this.m22() * this.m03() - this.m21() * this.m02() * this.m13() + this.m01() * this.m22() * this.m13() + this.m11() * this.m02() * this.m23() - this.m01() * this.m12() * this.m23() ) / det,
            ( this.m30() * this.m22() * this.m13() - this.m20() * this.m32() * this.m13() - this.m30() * this.m12() * this.m23() + this.m10() * this.m32() * this.m23() + this.m20() * this.m12() * this.m33() - this.m10() * this.m22() * this.m33() ) / det,
            ( -this.m30() * this.m22() * this.m03() + this.m20() * this.m32() * this.m03() + this.m30() * this.m02() * this.m23() - this.m00() * this.m32() * this.m23() - this.m20() * this.m02() * this.m33() + this.m00() * this.m22() * this.m33() ) / det,
            ( this.m30() * this.m12() * this.m03() - this.m10() * this.m32() * this.m03() - this.m30() * this.m02() * this.m13() + this.m00() * this.m32() * this.m13() + this.m10() * this.m02() * this.m33() - this.m00() * this.m12() * this.m33() ) / det,
            ( -this.m20() * this.m12() * this.m03() + this.m10() * this.m22() * this.m03() + this.m20() * this.m02() * this.m13() - this.m00() * this.m22() * this.m13() - this.m10() * this.m02() * this.m23() + this.m00() * this.m12() * this.m23() ) / det,
            ( -this.m30() * this.m21() * this.m13() + this.m20() * this.m31() * this.m13() + this.m30() * this.m11() * this.m23() - this.m10() * this.m31() * this.m23() - this.m20() * this.m11() * this.m33() + this.m10() * this.m21() * this.m33() ) / det,
            ( this.m30() * this.m21() * this.m03() - this.m20() * this.m31() * this.m03() - this.m30() * this.m01() * this.m23() + this.m00() * this.m31() * this.m23() + this.m20() * this.m01() * this.m33() - this.m00() * this.m21() * this.m33() ) / det,
            ( -this.m30() * this.m11() * this.m03() + this.m10() * this.m31() * this.m03() + this.m30() * this.m01() * this.m13() - this.m00() * this.m31() * this.m13() - this.m10() * this.m01() * this.m33() + this.m00() * this.m11() * this.m33() ) / det,
            ( this.m20() * this.m11() * this.m03() - this.m10() * this.m21() * this.m03() - this.m20() * this.m01() * this.m13() + this.m00() * this.m21() * this.m13() + this.m10() * this.m01() * this.m23() - this.m00() * this.m11() * this.m23() ) / det,
            ( this.m30() * this.m21() * this.m12() - this.m20() * this.m31() * this.m12() - this.m30() * this.m11() * this.m22() + this.m10() * this.m31() * this.m22() + this.m20() * this.m11() * this.m32() - this.m10() * this.m21() * this.m32() ) / det,
            ( -this.m30() * this.m21() * this.m02() + this.m20() * this.m31() * this.m02() + this.m30() * this.m01() * this.m22() - this.m00() * this.m31() * this.m22() - this.m20() * this.m01() * this.m32() + this.m00() * this.m21() * this.m32() ) / det,
            ( this.m30() * this.m11() * this.m02() - this.m10() * this.m31() * this.m02() - this.m30() * this.m01() * this.m12() + this.m00() * this.m31() * this.m12() + this.m10() * this.m01() * this.m32() - this.m00() * this.m11() * this.m32() ) / det,
            ( -this.m20() * this.m11() * this.m02() + this.m10() * this.m21() * this.m02() + this.m20() * this.m01() * this.m12() - this.m00() * this.m21() * this.m12() - this.m10() * this.m01() * this.m22() + this.m00() * this.m11() * this.m22() ) / det
        );
      }
      else {
        throw new Error( "Matrix could not be inverted, determinant === 0" );
      }
    },

    timesMatrix: function( m ) {
      var newType = Types.OTHER;
      if ( this.type === Types.TRANSLATION_3D && m.type === Types.TRANSLATION_3D ) {
        newType = Types.TRANSLATION_3D;
      }
      if ( this.type === Types.SCALING && m.type === Types.SCALING ) {
        newType = Types.SCALING;
      }
      if ( this.type === Types.IDENTITY ) {
        newType = m.type;
      }
      if ( m.type === Types.IDENTITY ) {
        newType = this.type;
      }
      return new Matrix4( this.m00() * m.m00() + this.m01() * m.m10() + this.m02() * m.m20() + this.m03() * m.m30(),
                this.m00() * m.m01() + this.m01() * m.m11() + this.m02() * m.m21() + this.m03() * m.m31(),
                this.m00() * m.m02() + this.m01() * m.m12() + this.m02() * m.m22() + this.m03() * m.m32(),
                this.m00() * m.m03() + this.m01() * m.m13() + this.m02() * m.m23() + this.m03() * m.m33(),
                this.m10() * m.m00() + this.m11() * m.m10() + this.m12() * m.m20() + this.m13() * m.m30(),
                this.m10() * m.m01() + this.m11() * m.m11() + this.m12() * m.m21() + this.m13() * m.m31(),
                this.m10() * m.m02() + this.m11() * m.m12() + this.m12() * m.m22() + this.m13() * m.m32(),
                this.m10() * m.m03() + this.m11() * m.m13() + this.m12() * m.m23() + this.m13() * m.m33(),
                this.m20() * m.m00() + this.m21() * m.m10() + this.m22() * m.m20() + this.m23() * m.m30(),
                this.m20() * m.m01() + this.m21() * m.m11() + this.m22() * m.m21() + this.m23() * m.m31(),
                this.m20() * m.m02() + this.m21() * m.m12() + this.m22() * m.m22() + this.m23() * m.m32(),
                this.m20() * m.m03() + this.m21() * m.m13() + this.m22() * m.m23() + this.m23() * m.m33(),
                this.m30() * m.m00() + this.m31() * m.m10() + this.m32() * m.m20() + this.m33() * m.m30(),
                this.m30() * m.m01() + this.m31() * m.m11() + this.m32() * m.m21() + this.m33() * m.m31(),
                this.m30() * m.m02() + this.m31() * m.m12() + this.m32() * m.m22() + this.m33() * m.m32(),
                this.m30() * m.m03() + this.m31() * m.m13() + this.m32() * m.m23() + this.m33() * m.m33(),
                newType );
    },

    timesVector4: function( v ) {
      var x = this.m00() * v.x + this.m01() * v.y + this.m02() * v.z + this.m03() * v.w;
      var y = this.m10() * v.x + this.m11() * v.y + this.m12() * v.z + this.m13() * v.w;
      var z = this.m20() * v.x + this.m21() * v.y + this.m22() * v.z + this.m23() * v.w;
      var w = this.m30() * v.x + this.m31() * v.y + this.m32() * v.z + this.m33() * v.w;
      return new dot.Vector4( x, y, z, w );
    },

    timesVector3: function( v ) {
      return this.timesVector4( v.toVector4() ).toVector3();
    },

    timesTransposeVector4: function( v ) {
      var x = this.m00() * v.x + this.m10() * v.y + this.m20() * v.z + this.m30() * v.w;
      var y = this.m01() * v.x + this.m11() * v.y + this.m21() * v.z + this.m31() * v.w;
      var z = this.m02() * v.x + this.m12() * v.y + this.m22() * v.z + this.m32() * v.w;
      var w = this.m03() * v.x + this.m13() * v.y + this.m23() * v.z + this.m33() * v.w;
      return new dot.Vector4( x, y, z, w );
    },

    timesTransposeVector3: function( v ) {
      return this.timesTransposeVector4( v.toVector4() ).toVector3();
    },

    timesRelativeVector3: function( v ) {
      var x = this.m00() * v.x + this.m10() * v.y + this.m20() * v.z;
      var y = this.m01() * v.y + this.m11() * v.y + this.m21() * v.z;
      var z = this.m02() * v.z + this.m12() * v.y + this.m22() * v.z;
      return new dot.Vector3( x, y, z );
    },

    determinant: function() {
      return this.m03() * this.m12() * this.m21() * this.m30() -
          this.m02() * this.m13() * this.m21() * this.m30() -
          this.m03() * this.m11() * this.m22() * this.m30() +
          this.m01() * this.m13() * this.m22() * this.m30() +
          this.m02() * this.m11() * this.m23() * this.m30() -
          this.m01() * this.m12() * this.m23() * this.m30() -
          this.m03() * this.m12() * this.m20() * this.m31() +
          this.m02() * this.m13() * this.m20() * this.m31() +
          this.m03() * this.m10() * this.m22() * this.m31() -
          this.m00() * this.m13() * this.m22() * this.m31() -
          this.m02() * this.m10() * this.m23() * this.m31() +
          this.m00() * this.m12() * this.m23() * this.m31() +
          this.m03() * this.m11() * this.m20() * this.m32() -
          this.m01() * this.m13() * this.m20() * this.m32() -
          this.m03() * this.m10() * this.m21() * this.m32() +
          this.m00() * this.m13() * this.m21() * this.m32() +
          this.m01() * this.m10() * this.m23() * this.m32() -
          this.m00() * this.m11() * this.m23() * this.m32() -
          this.m02() * this.m11() * this.m20() * this.m33() +
          this.m01() * this.m12() * this.m20() * this.m33() +
          this.m02() * this.m10() * this.m21() * this.m33() -
          this.m00() * this.m12() * this.m21() * this.m33() -
          this.m01() * this.m10() * this.m22() * this.m33() +
          this.m00() * this.m11() * this.m22() * this.m33();
    },

    toString: function() {
      return this.m00() + " " + this.m01() + " " + this.m02() + " " + this.m03() + "\n" +
           this.m10() + " " + this.m11() + " " + this.m12() + " " + this.m13() + "\n" +
           this.m20() + " " + this.m21() + " " + this.m22() + " " + this.m23() + "\n" +
           this.m30() + " " + this.m31() + " " + this.m32() + " " + this.m33();
    },

    translation: function() { return new dot.Vector3( this.m03(), this.m13(), this.m23() ); },
    scaling: function() { return new dot.Vector3( this.m00(), this.m11(), this.m22() );},

    makeImmutable: function() {
      this.rowMajor = function() {
        throw new Error( "Cannot modify immutable matrix" );
      };
    }
  };

  // create an immutable
  Matrix4.IDENTITY = new Matrix4();
  Matrix4.IDENTITY.makeImmutable();
  
  return Matrix4;
} );

// Copyright 2002-2012, University of Colorado

/**
 * 3-dimensional Matrix
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/Matrix3',['require','DOT/dot','DOT/Vector2','DOT/Vector3','DOT/Matrix4'], function( require ) {
  
  
  var dot = require( 'DOT/dot' );
  
  require( 'DOT/Vector2' );
  require( 'DOT/Vector3' );
  require( 'DOT/Matrix4' );
  
  dot.Matrix3 = function( v00, v01, v02, v10, v11, v12, v20, v21, v22, type ) {

    // entries stored in column-major format
    this.entries = new Array( 9 );

    this.rowMajor( v00 === undefined ? 1 : v00, v01 || 0, v02 || 0,
                   v10 || 0, v11 === undefined ? 1 : v11, v12 || 0,
                   v20 || 0, v21 || 0, v22 === undefined ? 1 : v22,
                   type );
  };
  var Matrix3 = dot.Matrix3;

  Matrix3.Types = {
    // NOTE: if an inverted matrix of a type is not that type, change inverted()!
    // NOTE: if two matrices with identical types are multiplied, the result should have the same type. if not, changed timesMatrix()!
    // NOTE: on adding a type, exaustively check all type usage
    OTHER: 0, // default
    IDENTITY: 1,
    TRANSLATION_2D: 2,
    SCALING: 3,
    AFFINE: 4

    // TODO: possibly add rotations
  };

  var Types = Matrix3.Types;

  Matrix3.identity = function() {
    return new Matrix3( 1, 0, 0,
                        0, 1, 0,
                        0, 0, 1,
                        Types.IDENTITY );
  };

  Matrix3.translation = function( x, y ) {
    return new Matrix3( 1, 0, x,
                        0, 1, y,
                        0, 0, 1,
                        Types.TRANSLATION_2D );
  };

  Matrix3.translationFromVector = function( v ) { return Matrix3.translation( v.x, v.y ); };

  Matrix3.scaling = function( x, y ) {
    // allow using one parameter to scale everything
    y = y === undefined ? x : y;

    return new Matrix3( x, 0, 0,
                        0, y, 0,
                        0, 0, 1,
                        Types.SCALING );
  };
  Matrix3.scale = Matrix3.scaling;

  // axis is a normalized Vector3, angle in radians.
  Matrix3.rotationAxisAngle = function( axis, angle ) {
    var c = Math.cos( angle );
    var s = Math.sin( angle );
    var C = 1 - c;

    return new Matrix3( axis.x * axis.x * C + c, axis.x * axis.y * C - axis.z * s, axis.x * axis.z * C + axis.y * s,
                        axis.y * axis.x * C + axis.z * s, axis.y * axis.y * C + c, axis.y * axis.z * C - axis.x * s,
                        axis.z * axis.x * C - axis.y * s, axis.z * axis.y * C + axis.x * s, axis.z * axis.z * C + c,
                        Types.OTHER );
  };

  // TODO: add in rotation from quaternion, and from quat + translation

  Matrix3.rotationX = function( angle ) {
    var c = Math.cos( angle );
    var s = Math.sin( angle );

    return new Matrix3( 1, 0, 0,
                        0, c, -s,
                        0, s, c,
                        Types.OTHER );
  };

  Matrix3.rotationY = function( angle ) {
    var c = Math.cos( angle );
    var s = Math.sin( angle );

    return new Matrix3( c, 0, s,
                        0, 1, 0,
                        -s, 0, c,
                        Types.OTHER );
  };

  Matrix3.rotationZ = function( angle ) {
    var c = Math.cos( angle );
    var s = Math.sin( angle );

    return new Matrix3( c, -s, 0,
                        s, c, 0,
                        0, 0, 1,
                        Types.AFFINE );
  };
  
  // standard 2d rotation
  Matrix3.rotation2 = Matrix3.rotationZ;
  
  Matrix3.fromSVGMatrix = function( svgMatrix ) {
    return new Matrix3( svgMatrix.a, svgMatrix.c, svgMatrix.e,
                        svgMatrix.b, svgMatrix.d, svgMatrix.f,
                        0, 0, 1,
                        Types.AFFINE );
  };

  // a rotation matrix that rotates A to B, by rotating about the axis A.cross( B ) -- Shortest path. ideally should be unit vectors
  Matrix3.rotateAToB = function( a, b ) {
    // see http://graphics.cs.brown.edu/~jfh/papers/Moller-EBA-1999/paper.pdf for information on this implementation
    var start = a;
    var end = b;

    var epsilon = 0.0001;

    var e, h, f;

    var v = start.cross( end );
    e = start.dot( end );
    f = ( e < 0 ) ? -e : e;

    // if "from" and "to" vectors are nearly parallel
    if ( f > 1.0 - epsilon ) {
      var c1, c2, c3;
      /* coefficients for later use */
      var i, j;

      var x = new dot.Vector3(
        ( start.x > 0.0 ) ? start.x : -start.x,
        ( start.y > 0.0 ) ? start.y : -start.y,
        ( start.z > 0.0 ) ? start.z : -start.z
      );

      if ( x.x < x.y ) {
        if ( x.x < x.z ) {
          x = dot.Vector3.X_UNIT;
        }
        else {
          x = dot.Vector3.Z_UNIT;
        }
      }
      else {
        if ( x.y < x.z ) {
          x = dot.Vector3.Y_UNIT;
        }
        else {
          x = dot.Vector3.Z_UNIT;
        }
      }

      var u = x.minus( start );
      v = x.minus( end );

      c1 = 2.0 / u.dot( u );
      c2 = 2.0 / v.dot( v );
      c3 = c1 * c2 * u.dot( v );

      return Matrix3.IDENTITY.plus( Matrix3.rowMajor(
        -c1 * u.x * u.x - c2 * v.x * v.x + c3 * v.x * u.x,
        -c1 * u.x * u.y - c2 * v.x * v.y + c3 * v.x * u.y,
        -c1 * u.x * u.z - c2 * v.x * v.z + c3 * v.x * u.z,
        -c1 * u.y * u.x - c2 * v.y * v.x + c3 * v.y * u.x,
        -c1 * u.y * u.y - c2 * v.y * v.y + c3 * v.y * u.y,
        -c1 * u.y * u.z - c2 * v.y * v.z + c3 * v.y * u.z,
        -c1 * u.z * u.x - c2 * v.z * v.x + c3 * v.z * u.x,
        -c1 * u.z * u.y - c2 * v.z * v.y + c3 * v.z * u.y,
        -c1 * u.z * u.z - c2 * v.z * v.z + c3 * v.z * u.z
      ) );
    }
    else {
      // the most common case, unless "start"="end", or "start"=-"end"
      var hvx, hvz, hvxy, hvxz, hvyz;
      h = 1.0 / ( 1.0 + e );
      hvx = h * v.x;
      hvz = h * v.z;
      hvxy = hvx * v.y;
      hvxz = hvx * v.z;
      hvyz = hvz * v.y;

      return Matrix3.rowMajor(
        e + hvx * v.x, hvxy - v.z, hvxz + v.y,
        hvxy + v.z, e + h * v.y * v.y, hvyz - v.x,
        hvxz - v.y, hvyz + v.x, e + hvz * v.z
      );
    }
  };

  Matrix3.prototype = {
    constructor: Matrix3,
    
    /*---------------------------------------------------------------------------*
    * "Properties"
    *----------------------------------------------------------------------------*/
    
    // convenience getters. inline usages of these when performance is critical? TODO: test performance of inlining these, with / without closure compiler
    m00: function() { return this.entries[0]; },
    m01: function() { return this.entries[3]; },
    m02: function() { return this.entries[6]; },
    m10: function() { return this.entries[1]; },
    m11: function() { return this.entries[4]; },
    m12: function() { return this.entries[7]; },
    m20: function() { return this.entries[2]; },
    m21: function() { return this.entries[5]; },
    m22: function() { return this.entries[8]; },
    
    isAffine: function() {
      return this.type === Types.AFFINE || ( this.m20() === 0 && this.m21() === 0 && this.m22() === 1 );
    },
    
    getDeterminant: function() {
      return this.m00() * this.m11() * this.m22() + this.m01() * this.m12() * this.m20() + this.m02() * this.m10() * this.m21() - this.m02() * this.m11() * this.m20() - this.m01() * this.m10() * this.m22() - this.m00() * this.m12() * this.m21();
    },
    get determinant() { return this.getDeterminant(); },
    
    getTranslation: function() {
      return new dot.Vector2( this.m02(), this.m12() );
    },
    get translation() { return this.getTranslation(); },
    
    // returns a vector that is equivalent to ( T(1,0).magnitude(), T(0,1).magnitude() ) where T is a relative transform
    getScaleVector: function() {
      return new dot.Vector2( Math.sqrt( this.m00() * this.m00() + this.m10() * this.m10() ),
                              Math.sqrt( this.m01() * this.m01() + this.m11() * this.m11() ) );
    },
    get scaleVector() { return this.getScaleVector(); },
    
    // angle in radians for the 2d rotation from this matrix, between pi, -pi
    getRotation: function() {
      var transformedVector = this.timesVector2( dot.Vector2.X_UNIT ).minus( this.timesVector2( dot.Vector2.ZERO ) );
      return Math.atan2( transformedVector.y, transformedVector.x );
    },
    get rotation() { return this.getRotation(); },
    
    toMatrix4: function() {
      return new dot.Matrix4( this.m00(), this.m01(), this.m02(), 0,
                              this.m10(), this.m11(), this.m12(), 0,
                              this.m20(), this.m21(), this.m22(), 0,
                              0, 0, 0, 1 );
    },
    
    toString: function() {
      return this.m00() + ' ' + this.m01() + ' ' + this.m02() + '\n' +
             this.m10() + ' ' + this.m11() + ' ' + this.m12() + '\n' +
             this.m20() + ' ' + this.m21() + ' ' + this.m22();
    },
    
    toSVGMatrix: function() {
      var result = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' ).createSVGMatrix();
      
      // top two rows
      result.a = this.m00();
      result.b = this.m10();
      result.c = this.m01();
      result.d = this.m11();
      result.e = this.m02();
      result.f = this.m12();
      
      return result;
    },
    
    getCSSTransform: function() {
      // See http://www.w3.org/TR/css3-transforms/, particularly Section 13 that discusses the SVG compatibility
      
      // we need to prevent the numbers from being in an exponential toString form, since the CSS transform does not support that
      function cssNumber( number ) {
        // largest guaranteed number of digits according to https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Number/toFixed
        return number.toFixed( 20 );
      }
      // the inner part of a CSS3 transform, but remember to add the browser-specific parts!
      return 'matrix(' + cssNumber( this.entries[0] ) + ',' + cssNumber( this.entries[1] ) + ',' + cssNumber( this.entries[3] ) + ',' + cssNumber( this.entries[4] ) + ',' + cssNumber( this.entries[6] ) + ',' + cssNumber( this.entries[7] ) + ')';
    },
    get cssTransform() { return this.getCSSTransform(); },
    
    getSVGTransform: function() {
      // SVG transform presentation attribute. See http://www.w3.org/TR/SVG/coords.html#TransformAttribute
      
      // we need to prevent the numbers from being in an exponential toString form, since the CSS transform does not support that
      function svgNumber( number ) {
        // largest guaranteed number of digits according to https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Number/toFixed
        return number.toFixed( 20 );
      }
      
      switch( this.type ) {
        case Types.IDENTITY:
          return '';
        case Types.TRANSLATION_2D:
          return 'translate(' + svgNumber( this.entries[6] ) + ',' + this.entries[7] + ')';
        case Types.SCALING:
          return 'scale(' + svgNumber( this.entries[0] ) + ( this.entries[0] === this.entries[4] ? '' : ',' + svgNumber( this.entries[4] ) ) + ')';
        default:
          return 'matrix(' + svgNumber( this.entries[0] ) + ',' + svgNumber( this.entries[1] ) + ',' + svgNumber( this.entries[3] ) + ',' + svgNumber( this.entries[4] ) + ',' + svgNumber( this.entries[6] ) + ',' + svgNumber( this.entries[7] ) + ')';
      }
    },
    get svgTransform() { return this.getSVGTransform(); },
    
    // returns a parameter object suitable for use with jQuery's .css()
    getCSSTransformStyles: function() {
      var transformCSS = this.getCSSTransform();
      
      // notes on triggering hardware acceleration: http://creativejs.com/2011/12/day-2-gpu-accelerate-your-dom-elements/
      return {
        // force iOS hardware acceleration
        '-webkit-perspective': 1000,
        '-webkit-backface-visibility': 'hidden',
        
        '-webkit-transform': transformCSS + ' translateZ(0)', // trigger hardware acceleration if possible
        '-moz-transform': transformCSS + ' translateZ(0)', // trigger hardware acceleration if possible
        '-ms-transform': transformCSS,
        '-o-transform': transformCSS,
        'transform': transformCSS,
        'transform-origin': 'top left', // at the origin of the component. consider 0px 0px instead. Critical, since otherwise this defaults to 50% 50%!!! see https://developer.mozilla.org/en-US/docs/CSS/transform-origin
        '-ms-transform-origin': 'top left' // TODO: do we need other platform-specific transform-origin styles?
      };
    },
    get cssTransformStyles() { return this.getCSSTransformStyles(); },
    
    // exact equality
    equals: function( m ) {
      return this.m00() === m.m00() && this.m01() === m.m01() && this.m02() === m.m02() &&
             this.m10() === m.m10() && this.m11() === m.m11() && this.m12() === m.m12() &&
             this.m20() === m.m20() && this.m21() === m.m21() && this.m22() === m.m22();
    },
    
    // equality within a margin of error
    equalsEpsilon: function( m, epsilon ) {
      return Math.abs( this.m00() - m.m00() ) < epsilon && Math.abs( this.m01() - m.m01() ) < epsilon && Math.abs( this.m02() - m.m02() ) < epsilon &&
             Math.abs( this.m10() - m.m10() ) < epsilon && Math.abs( this.m11() - m.m11() ) < epsilon && Math.abs( this.m12() - m.m12() ) < epsilon &&
             Math.abs( this.m20() - m.m20() ) < epsilon && Math.abs( this.m21() - m.m21() ) < epsilon && Math.abs( this.m22() - m.m22() ) < epsilon;
    },
    
    /*---------------------------------------------------------------------------*
    * Immutable operations (returns a new matrix)
    *----------------------------------------------------------------------------*/
    
    copy: function() {
      return new Matrix3(
        this.m00(), this.m01(), this.m02(),
        this.m10(), this.m11(), this.m12(),
        this.m20(), this.m21(), this.m22(),
        this.type
      );
    },
    
    plus: function( m ) {
      return new Matrix3(
        this.m00() + m.m00(), this.m01() + m.m01(), this.m02() + m.m02(),
        this.m10() + m.m10(), this.m11() + m.m11(), this.m12() + m.m12(),
        this.m20() + m.m20(), this.m21() + m.m21(), this.m22() + m.m22()
      );
    },
    
    minus: function( m ) {
      return new Matrix3(
        this.m00() - m.m00(), this.m01() - m.m01(), this.m02() - m.m02(),
        this.m10() - m.m10(), this.m11() - m.m11(), this.m12() - m.m12(),
        this.m20() - m.m20(), this.m21() - m.m21(), this.m22() - m.m22()
      );
    },
    
    transposed: function() {
      return new Matrix3(
        this.m00(), this.m10(), this.m20(),
        this.m01(), this.m11(), this.m21(),
        this.m02(), this.m12(), this.m22(), ( this.type === Types.IDENTITY || this.type === Types.SCALING ) ? this.type : undefined
      );
    },
    
    negated: function() {
      return new Matrix3(
        -this.m00(), -this.m01(), -this.m02(),
        -this.m10(), -this.m11(), -this.m12(),
        -this.m20(), -this.m21(), -this.m22()
      );
    },
    
    inverted: function() {
      var det;
      
      switch ( this.type ) {
        case Types.IDENTITY:
          return this;
        case Types.TRANSLATION_2D:
          return new Matrix3( 1, 0, -this.m02(),
                              0, 1, -this.m12(),
                              0, 0, 1, Types.TRANSLATION_2D );
        case Types.SCALING:
          return new Matrix3( 1 / this.m00(), 0, 0,
                              0, 1 / this.m11(), 0,
                              0, 0, 1 / this.m22(), Types.SCALING );
        case Types.AFFINE:
          det = this.getDeterminant();
          if ( det !== 0 ) {
            return new Matrix3(
              ( -this.m12() * this.m21() + this.m11() * this.m22() ) / det,
              ( this.m02() * this.m21() - this.m01() * this.m22() ) / det,
              ( -this.m02() * this.m11() + this.m01() * this.m12() ) / det,
              ( this.m12() * this.m20() - this.m10() * this.m22() ) / det,
              ( -this.m02() * this.m20() + this.m00() * this.m22() ) / det,
              ( this.m02() * this.m10() - this.m00() * this.m12() ) / det,
              0, 0, 1, Types.AFFINE
            );
          } else {
            throw new Error( 'Matrix could not be inverted, determinant === 0' );
          }
          break; // because JSHint totally can't tell that this can't be reached
        case Types.OTHER:
          det = this.getDeterminant();
          if ( det !== 0 ) {
            return new Matrix3(
              ( -this.m12() * this.m21() + this.m11() * this.m22() ) / det,
              ( this.m02() * this.m21() - this.m01() * this.m22() ) / det,
              ( -this.m02() * this.m11() + this.m01() * this.m12() ) / det,
              ( this.m12() * this.m20() - this.m10() * this.m22() ) / det,
              ( -this.m02() * this.m20() + this.m00() * this.m22() ) / det,
              ( this.m02() * this.m10() - this.m00() * this.m12() ) / det,
              ( -this.m11() * this.m20() + this.m10() * this.m21() ) / det,
              ( this.m01() * this.m20() - this.m00() * this.m21() ) / det,
              ( -this.m01() * this.m10() + this.m00() * this.m11() ) / det,
              Types.OTHER
            );
          } else {
            throw new Error( 'Matrix could not be inverted, determinant === 0' );
          }
          break; // because JSHint totally can't tell that this can't be reached
        default:
          throw new Error( 'Matrix3.inverted with unknown type: ' + this.type );
      }
    },
    
    timesMatrix: function( m ) {
      // I * M === M * I === I (the identity)
      if( this.type === Types.IDENTITY || m.type === Types.IDENTITY ) {
        return this.type === Types.IDENTITY ? m : this;
      }
      
      if ( this.type === m.type ) {
        // currently two matrices of the same type will result in the same result type
        if ( this.type === Types.TRANSLATION_2D ) {
          // faster combination of translations
          return new Matrix3( 1, 0, this.m02() + m.m02(),
                              0, 1, this.m12() + m.m12(),
                              0, 0, 1, Types.TRANSLATION_2D );
        } else if ( this.type === Types.SCALING ) {
          // faster combination of scaling
          return new Matrix3( this.m00() * m.m00(), 0, 0,
                              0, this.m11() * m.m11(), 0,
                              0, 0, 1, Types.SCALING );
        }
      }
      
      if ( this.type !== Types.OTHER && m.type !== Types.OTHER ) {
        // currently two matrices that are anything but "other" are technically affine, and the result will be affine
        
        // affine case
        return new Matrix3( this.m00() * m.m00() + this.m01() * m.m10(),
                            this.m00() * m.m01() + this.m01() * m.m11(),
                            this.m00() * m.m02() + this.m01() * m.m12() + this.m02(),
                            this.m10() * m.m00() + this.m11() * m.m10(),
                            this.m10() * m.m01() + this.m11() * m.m11(),
                            this.m10() * m.m02() + this.m11() * m.m12() + this.m12(),
                            0, 0, 1, Types.AFFINE );
      }
      
      // general case
      return new Matrix3( this.m00() * m.m00() + this.m01() * m.m10() + this.m02() * m.m20(),
                          this.m00() * m.m01() + this.m01() * m.m11() + this.m02() * m.m21(),
                          this.m00() * m.m02() + this.m01() * m.m12() + this.m02() * m.m22(),
                          this.m10() * m.m00() + this.m11() * m.m10() + this.m12() * m.m20(),
                          this.m10() * m.m01() + this.m11() * m.m11() + this.m12() * m.m21(),
                          this.m10() * m.m02() + this.m11() * m.m12() + this.m12() * m.m22(),
                          this.m20() * m.m00() + this.m21() * m.m10() + this.m22() * m.m20(),
                          this.m20() * m.m01() + this.m21() * m.m11() + this.m22() * m.m21(),
                          this.m20() * m.m02() + this.m21() * m.m12() + this.m22() * m.m22() );
    },
    
    /*---------------------------------------------------------------------------*
    * Immutable operations (returns new form of a parameter)
    *----------------------------------------------------------------------------*/
    
    timesVector2: function( v ) {
      var x = this.m00() * v.x + this.m01() * v.y + this.m02();
      var y = this.m10() * v.x + this.m11() * v.y + this.m12();
      return new dot.Vector2( x, y );
    },
    
    timesVector3: function( v ) {
      var x = this.m00() * v.x + this.m01() * v.y + this.m02() * v.z;
      var y = this.m10() * v.x + this.m11() * v.y + this.m12() * v.z;
      var z = this.m20() * v.x + this.m21() * v.y + this.m22() * v.z;
      return new dot.Vector3( x, y, z );
    },
    
    timesTransposeVector2: function( v ) {
      var x = this.m00() * v.x + this.m10() * v.y;
      var y = this.m01() * v.x + this.m11() * v.y;
      return new dot.Vector2( x, y );
    },
    
    timesRelativeVector2: function( v ) {
      var x = this.m00() * v.x + this.m01() * v.y;
      var y = this.m10() * v.y + this.m11() * v.y;
      return new dot.Vector2( x, y );
    },
    
    /*---------------------------------------------------------------------------*
    * Mutable operations (changes this matrix)
    *----------------------------------------------------------------------------*/
    
    makeImmutable: function() {
      this.rowMajor = function() {
        throw new Error( 'Cannot modify immutable matrix' );
      };
      return this;
    },
    
    rowMajor: function( v00, v01, v02, v10, v11, v12, v20, v21, v22, type ) {
      this.entries[0] = v00;
      this.entries[1] = v10;
      this.entries[2] = v20;
      this.entries[3] = v01;
      this.entries[4] = v11;
      this.entries[5] = v21;
      this.entries[6] = v02;
      this.entries[7] = v12;
      this.entries[8] = v22;
      
      // TODO: consider performance of the affine check here
      this.type = type === undefined ? ( ( v20 === 0 && v21 === 0 && v22 === 1 ) ? Types.AFFINE : Types.OTHER ) : type;
      return this;
    },
    
    columnMajor: function( v00, v10, v20, v01, v11, v21, v02, v12, v22, type ) {
      return this.rowMajor( v00, v01, v02, v10, v11, v12, v20, v21, v22, type );
    },
    
    add: function( m ) {
      return this.rowMajor(
        this.m00() + m.m00(), this.m01() + m.m01(), this.m02() + m.m02(),
        this.m10() + m.m10(), this.m11() + m.m11(), this.m12() + m.m12(),
        this.m20() + m.m20(), this.m21() + m.m21(), this.m22() + m.m22()
      );
    },
    
    subtract: function( m ) {
      return this.rowMajor(
        this.m00() - m.m00(), this.m01() - m.m01(), this.m02() - m.m02(),
        this.m10() - m.m10(), this.m11() - m.m11(), this.m12() - m.m12(),
        this.m20() - m.m20(), this.m21() - m.m21(), this.m22() - m.m22()
      );
    },
    
    transpose: function() {
      return this.rowMajor(
        this.m00(), this.m10(), this.m20(),
        this.m01(), this.m11(), this.m21(),
        this.m02(), this.m12(), this.m22(),
        ( this.type === Types.IDENTITY || this.type === Types.SCALING ) ? this.type : undefined
      );
    },
    
    negate: function() {
      return this.rowMajor(
        -this.m00(), -this.m01(), -this.m02(),
        -this.m10(), -this.m11(), -this.m12(),
        -this.m20(), -this.m21(), -this.m22()
      );
    },
    
    invert: function() {
      var det;
      
      switch ( this.type ) {
        case Types.IDENTITY:
          return this;
        case Types.TRANSLATION_2D:
          return this.rowMajor( 1, 0, -this.m02(),
                                0, 1, -this.m12(),
                                0, 0, 1, Types.TRANSLATION_2D );
        case Types.SCALING:
          return this.rowMajor( 1 / this.m00(), 0, 0,
                                0, 1 / this.m11(), 0,
                                0, 0, 1 / this.m22(), Types.SCALING );
        case Types.AFFINE:
          det = this.getDeterminant();
          if ( det !== 0 ) {
            return this.rowMajor(
              ( -this.m12() * this.m21() + this.m11() * this.m22() ) / det,
              ( this.m02() * this.m21() - this.m01() * this.m22() ) / det,
              ( -this.m02() * this.m11() + this.m01() * this.m12() ) / det,
              ( this.m12() * this.m20() - this.m10() * this.m22() ) / det,
              ( -this.m02() * this.m20() + this.m00() * this.m22() ) / det,
              ( this.m02() * this.m10() - this.m00() * this.m12() ) / det,
              0, 0, 1, Types.AFFINE
            );
          } else {
            throw new Error( 'Matrix could not be inverted, determinant === 0' );
          }
          break; // because JSHint totally can't tell that this can't be reached
        case Types.OTHER:
          det = this.getDeterminant();
          if ( det !== 0 ) {
            return this.rowMajor(
              ( -this.m12() * this.m21() + this.m11() * this.m22() ) / det,
              ( this.m02() * this.m21() - this.m01() * this.m22() ) / det,
              ( -this.m02() * this.m11() + this.m01() * this.m12() ) / det,
              ( this.m12() * this.m20() - this.m10() * this.m22() ) / det,
              ( -this.m02() * this.m20() + this.m00() * this.m22() ) / det,
              ( this.m02() * this.m10() - this.m00() * this.m12() ) / det,
              ( -this.m11() * this.m20() + this.m10() * this.m21() ) / det,
              ( this.m01() * this.m20() - this.m00() * this.m21() ) / det,
              ( -this.m01() * this.m10() + this.m00() * this.m11() ) / det,
              Types.OTHER
            );
          } else {
            throw new Error( 'Matrix could not be inverted, determinant === 0' );
          }
          break; // because JSHint totally can't tell that this can't be reached
        default:
          throw new Error( 'Matrix3.inverted with unknown type: ' + this.type );
      }
    },
    
    multiplyMatrix: function( m ) {
      // I * M === M * I === I (the identity)
      if( this.type === Types.IDENTITY || m.type === Types.IDENTITY ) {
        return this.type === Types.IDENTITY ? m : this;
      }
      
      if ( this.type === m.type ) {
        // currently two matrices of the same type will result in the same result type
        if ( this.type === Types.TRANSLATION_2D ) {
          // faster combination of translations
          return this.rowMajor( 1, 0, this.m02() + m.m02(),
                                0, 1, this.m12() + m.m12(),
                                0, 0, 1, Types.TRANSLATION_2D );
        } else if ( this.type === Types.SCALING ) {
          // faster combination of scaling
          return this.rowMajor( this.m00() * m.m00(), 0, 0,
                                0, this.m11() * m.m11(), 0,
                                0, 0, 1, Types.SCALING );
        }
      }
      
      if ( this.type !== Types.OTHER && m.type !== Types.OTHER ) {
        // currently two matrices that are anything but "other" are technically affine, and the result will be affine
        
        // affine case
        return this.rowMajor( this.m00() * m.m00() + this.m01() * m.m10(),
                              this.m00() * m.m01() + this.m01() * m.m11(),
                              this.m00() * m.m02() + this.m01() * m.m12() + this.m02(),
                              this.m10() * m.m00() + this.m11() * m.m10(),
                              this.m10() * m.m01() + this.m11() * m.m11(),
                              this.m10() * m.m02() + this.m11() * m.m12() + this.m12(),
                              0, 0, 1, Types.AFFINE );
      }
      
      // general case
      return this.rowMajor( this.m00() * m.m00() + this.m01() * m.m10() + this.m02() * m.m20(),
                            this.m00() * m.m01() + this.m01() * m.m11() + this.m02() * m.m21(),
                            this.m00() * m.m02() + this.m01() * m.m12() + this.m02() * m.m22(),
                            this.m10() * m.m00() + this.m11() * m.m10() + this.m12() * m.m20(),
                            this.m10() * m.m01() + this.m11() * m.m11() + this.m12() * m.m21(),
                            this.m10() * m.m02() + this.m11() * m.m12() + this.m12() * m.m22(),
                            this.m20() * m.m00() + this.m21() * m.m10() + this.m22() * m.m20(),
                            this.m20() * m.m01() + this.m21() * m.m11() + this.m22() * m.m21(),
                            this.m20() * m.m02() + this.m21() * m.m12() + this.m22() * m.m22() );
    },
    
    /*---------------------------------------------------------------------------*
    * Mutable operations (changes the parameter)
    *----------------------------------------------------------------------------*/
    
    multiplyVector2: function( v ) {
      var x = this.m00() * v.x + this.m01() * v.y + this.m02();
      var y = this.m10() * v.x + this.m11() * v.y + this.m12();
      v.setX( x );
      v.setY( y );
      return v;
    },
    
    multiplyVector3: function( v ) {
      var x = this.m00() * v.x + this.m01() * v.y + this.m02() * v.z;
      var y = this.m10() * v.x + this.m11() * v.y + this.m12() * v.z;
      var z = this.m20() * v.x + this.m21() * v.y + this.m22() * v.z;
      v.setX( x );
      v.setY( y );
      v.setZ( z );
      return v;
    },
    
    multiplyTransposeVector2: function( v ) {
      var x = this.m00() * v.x + this.m10() * v.y;
      var y = this.m01() * v.x + this.m11() * v.y;
      v.setX( x );
      v.setY( y );
      return v;
    },
    
    multiplyRelativeVector2: function( v ) {
      var x = this.m00() * v.x + this.m01() * v.y;
      var y = this.m10() * v.y + this.m11() * v.y;
      v.setX( x );
      v.setY( y );
      return v;
    },
    
    // sets the transform of a Canvas 2D rendering context to the affine part of this matrix
    canvasSetTransform: function( context ) {
      context.setTransform(
        // inlined array entries
        this.entries[0],
        this.entries[1],
        this.entries[3],
        this.entries[4],
        this.entries[6],
        this.entries[7]
      );
    },
    
    // appends the affine part of this matrix to the Canvas 2D rendering context
    canvasAppendTransform: function( context ) {
      context.transform(
        // inlined array entries
        this.entries[0],
        this.entries[1],
        this.entries[3],
        this.entries[4],
        this.entries[6],
        this.entries[7]
      );
    }
  };

  // create an immutable
  Matrix3.IDENTITY = new Matrix3( 1, 0, 0,
                                  0, 1, 0,
                                  0, 0, 1,
                                  Types.IDENTITY );
  Matrix3.IDENTITY.makeImmutable();
  
  Matrix3.X_REFLECTION = new Matrix3( -1, 0, 0,
                                       0, 1, 0,
                                       0, 0, 1,
                                       Types.AFFINE );
  Matrix3.X_REFLECTION.makeImmutable();
  
  Matrix3.Y_REFLECTION = new Matrix3( 1,  0, 0,
                                      0, -1, 0,
                                      0,  0, 1,
                                      Types.AFFINE );
  Matrix3.Y_REFLECTION.makeImmutable();
  
  Matrix3.printer = {
    print: function( matrix ) {
      console.log( matrix.toString() );
    }
  };
  
  return Matrix3;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Forward and inverse transforms with 3x3 matrices
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/Transform3',['require','ASSERT/assert','DOT/dot','DOT/Matrix3','DOT/Vector2','DOT/Ray2'], function( require ) {
  

  var assert = require( 'ASSERT/assert' )( 'dot' );
  
  var dot = require( 'DOT/dot' );
  
  require( 'DOT/Matrix3' );
  require( 'DOT/Vector2' );
  require( 'DOT/Ray2' );

  // takes a 4x4 matrix
  dot.Transform3 = function( matrix ) {
    this.listeners = [];
    
    // using immutable version for now. change it to the mutable identity copy if we need mutable operations on the matrices
    this.set( matrix === undefined ? dot.Matrix3.IDENTITY : matrix );
  };
  var Transform3 = dot.Transform3;

  Transform3.prototype = {
    constructor: Transform3,
    
    /*---------------------------------------------------------------------------*
    * mutators
    *----------------------------------------------------------------------------*/
    
    set: function( matrix ) {
      assert && assert( matrix instanceof dot.Matrix3 );
      
      var oldMatrix = this.matrix;
      var length = this.listeners.length;
      var i;
      
      // notify listeners before the change
      for ( i = 0; i < length; i++ ) {
        this.listeners[i].before( matrix, oldMatrix );
      }
      
      this.matrix = matrix;
      
      // compute these lazily
      this.inverse = null;
      this.matrixTransposed = null;
      this.inverseTransposed = null;
      
      // notify listeners after the change
      for ( i = 0; i < length; i++ ) {
        this.listeners[i].after( matrix, oldMatrix );
      }
    },
    
    prepend: function( matrix ) {
      this.set( matrix.timesMatrix( this.matrix ) );
    },

    append: function( matrix ) {
      this.set( this.matrix.timesMatrix( matrix ) );
    },

    prependTransform: function( transform ) {
      this.prepend( transform.matrix );
    },

    appendTransform: function( transform ) {
      this.append( transform.matrix );
    },

    applyToCanvasContext: function( context ) {
      context.setTransform( this.matrix.m00(), this.matrix.m10(), this.matrix.m01(), this.matrix.m11(), this.matrix.m02(), this.matrix.m12() );
    },
    
    /*---------------------------------------------------------------------------*
    * getters
    *----------------------------------------------------------------------------*/
    
    // uses the same matrices, for use cases where the matrices are considered immutable
    copy: function() {
      var transform = new Transform3( this.matrix );
      transform.inverse = this.inverse;
      transform.matrixTransposed = this.matrixTransposed;
      transform.inverseTransposed = this.inverseTransposed;
    },
    
    // copies matrices, for use cases where the matrices are considered mutable
    deepCopy: function() {
      var transform = new Transform3( this.matrix.copy() );
      transform.inverse = this.inverse ? this.inverse.copy() : null;
      transform.matrixTransposed = this.matrixTransposed ? this.matrixTransposed.copy() : null;
      transform.inverseTransposed = this.inverseTransposed ? this.inverseTransposed.copy() : null;
    },
    
    getMatrix: function() {
      return this.matrix;
    },
    
    getInverse: function() {
      if ( this.inverse === null ) {
        this.inverse = this.matrix.inverted();
      }
      return this.inverse;
    },
    
    getMatrixTransposed: function() {
      if ( this.matrixTransposed === null ) {
        this.matrixTransposed = this.matrix.transposed();
      }
      return this.matrixTransposed;
    },
    
    getInverseTransposed: function() {
      if ( this.inverseTransposed === null ) {
        this.inverseTransposed = this.getInverse().transposed();
      }
      return this.inverseTransposed;
    },
    
    isIdentity: function() {
      return this.matrix.type === dot.Matrix3.Types.IDENTITY;
    },

    /*---------------------------------------------------------------------------*
     * forward transforms (for Vector2 or scalar)
     *----------------------------------------------------------------------------*/

    // transform a position (includes translation)
    transformPosition2: function( vec2 ) {
      return this.matrix.timesVector2( vec2 );
    },

    // transform a vector (exclude translation)
    transformDelta2: function( vec2 ) {
      return this.matrix.timesRelativeVector2( vec2 );
    },

    // transform a normal vector (different than a normal vector)
    transformNormal2: function( vec2 ) {
      return this.getInverse().timesTransposeVector2( vec2 );
    },

    transformDeltaX: function( x ) {
      return this.transformDelta2( new dot.Vector2( x, 0 ) ).x;
    },

    transformDeltaY: function( y ) {
      return this.transformDelta2( new dot.Vector2( 0, y ) ).y;
    },
    
    transformBounds2: function( bounds2 ) {
      return bounds2.transformed( this.matrix );
    },
    
    transformShape: function( shape ) {
      return shape.transformed( this.matrix );
    },
    
    transformRay2: function( ray ) {
      return new dot.Ray2( this.transformPosition2( ray.pos ), this.transformDelta2( ray.dir ).normalized() );
    },

    /*---------------------------------------------------------------------------*
     * inverse transforms (for Vector2 or scalar)
     *----------------------------------------------------------------------------*/

    inversePosition2: function( vec2 ) {
      return this.getInverse().timesVector2( vec2 );
    },

    inverseDelta2: function( vec2 ) {
      // inverse actually has the translation rolled into the other coefficients, so we have to make this longer
      return this.inversePosition2( vec2 ).minus( this.inversePosition2( dot.Vector2.ZERO ) );
    },

    inverseNormal2: function( vec2 ) {
      return this.matrix.timesTransposeVector2( vec2 );
    },

    inverseDeltaX: function( x ) {
      return this.inverseDelta2( new dot.Vector2( x, 0 ) ).x;
    },

    inverseDeltaY: function( y ) {
      return this.inverseDelta2( new dot.Vector2( 0, y ) ).y;
    },
    
    inverseBounds2: function( bounds2 ) {
      return bounds2.transformed( this.getInverse() );
    },
    
    inverseShape: function( shape ) {
      return shape.transformed( this.getInverse() );
    },
    
    inverseRay2: function( ray ) {
      return new dot.Ray2( this.inversePosition2( ray.pos ), this.inverseDelta2( ray.dir ).normalized() );
    },
    
    /*---------------------------------------------------------------------------*
    * listeners
    *----------------------------------------------------------------------------*/
    
    // note: listener.before( matrix, oldMatrix ) will be called before the change, listener.after( matrix, oldMatrix ) will be called after
    addTransformListener: function( listener ) {
      assert && assert( !_.contains( this.listeners, listener ) );
      this.listeners.push( listener );
    },
    
    removeTransformListener: function( listener ) {
      assert && assert( _.contains( this.listeners, listener ) );
      this.listeners.splice( _.indexOf( this.listeners, listener ), 1 );
    }
  };
  
  return Transform3;
} );

// Copyright 2002-2012, University of Colorado

/**
 * A segment represents a specific curve with a start and end.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/segments/Segment',['require','ASSERT/assert','KITE/kite'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );

  var kite = require( 'KITE/kite' );
  
  kite.Segment = {
    /*
     * Will contain (for segments):
     * properties:
     * start        - start point of this segment
     * end          - end point of this segment
     * startTangent - the tangent vector (normalized) to the segment at the start, pointing in the direction of motion (from start to end)
     * endTangent   - the tangent vector (normalized) to the segment at the end, pointing in the direction of motion (from start to end)
     * bounds       - the bounding box for the segment
     *
     * methods:
     * positionAt( t )          - returns the position parametrically, with 0 <= t <= 1. this does NOT guarantee a constant magnitude tangent... don't feel like adding elliptical functions yet!
     * tangentAt( t )           - returns the non-normalized tangent (dx/dt, dy/dt) parametrically, with 0 <= t <= 1.
     * curvatureAt( t )         - returns the signed curvature (positive for visual clockwise - mathematical counterclockwise)
     * toPieces                 - returns an array of pieces that are equivalent to this segment, assuming start points are preserved
     *                              TODO: is toPieces that valuable? it doesn't seem to have a strict guarantee on checking what the last segment did right now
     * getSVGPathFragment       - returns a string containing the SVG path. assumes that the start point is already provided, so anything that calls this needs to put the M calls first
     * strokeLeft( lineWidth )  - returns an array of pieces that will draw an offset curve on the logical left side
     * strokeRight( lineWidth ) - returns an array of pieces that will draw an offset curve on the logical right side
     * intersectsBounds         - whether this segment intersects the specified bounding box (not just the segment's bounding box, but the actual segment)
     * windingIntersection      - returns the winding number for intersection with a ray
     */
  };
  var Segment = kite.Segment;
  
  return Segment;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Represents a higher-level command for Shape, and generally mimics the Canvas drawing api.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/pieces/Piece',['require','ASSERT/assert','KITE/kite'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );
  
  var kite = require( 'KITE/kite' );
  
  kite.Piece = {
    /*
     * Will contain (for pieces):
     * methods:
     * writeToContext( context ) - Executes this drawing command directly on a Canvas context
     * transformed( matrix )     - Returns a transformed copy of this piece
     * applyPiece( shape )       - Applies this piece to a shape, essentially internally executing the Canvas api and creating subpaths and segments.
     *                             This is necessary, since pieces like Rect can actually contain many more than one segment, and drawing pieces depends
     *                             on context / subpath state.
     */
  };
  var Piece = kite.Piece;
  
  return Piece;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Linear segment
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/segments/Line',['require','ASSERT/assert','KITE/kite','DOT/Bounds2','DOT/Util','KITE/segments/Segment','KITE/pieces/Piece'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );

  var kite = require( 'KITE/kite' );
  
  var Bounds2 = require( 'DOT/Bounds2' );
  var lineLineIntersection = require( 'DOT/Util' ).lineLineIntersection;
  
  var Segment = require( 'KITE/segments/Segment' );
  var Piece = require( 'KITE/pieces/Piece' );

  Segment.Line = function( start, end ) {
    this.start = start;
    this.end = end;
    
    if ( start.equals( end, 0 ) ) {
      this.invalid = true;
      return;
    }
    
    this.startTangent = end.minus( start ).normalized();
    this.endTangent = this.startTangent;
    
    // acceleration for intersection
    this.bounds = Bounds2.NOTHING.withPoint( start ).withPoint( end );
  };
  Segment.Line.prototype = {
    constructor: Segment.Line,
    
    positionAt: function( t ) {
      return this.start.plus( this.end.minus( this.start ).times( t ) );
    },
    
    tangentAt: function( t ) {
      // tangent always the same, just use the start tanget
      return this.startTangent;
    },
    
    curvatureAt: function( t ) {
      return 0; // no curvature on a straight line segment
    },
    
    toPieces: function() {
      return [ new Piece.LineTo( this.end ) ];
    },
    
    getSVGPathFragment: function() {
      return 'L ' + this.end.x + ' ' + this.end.y;
    },
    
    strokeLeft: function( lineWidth ) {
      return [ new Piece.LineTo( this.end.plus( this.endTangent.perpendicular().negated().times( lineWidth / 2 ) ) ) ];
    },
    
    strokeRight: function( lineWidth ) {
      return [ new Piece.LineTo( this.start.plus( this.startTangent.perpendicular().times( lineWidth / 2 ) ) ) ];
    },
    
    intersectsBounds: function( bounds ) {
      throw new Error( 'Segment.Line.intersectsBounds unimplemented' ); // TODO: implement
    },
    
    intersection: function( ray ) {
      var result = [];
      
      var start = this.start;
      var end = this.end;
      
      var intersection = lineLineIntersection( start, end, ray.pos, ray.pos.plus( ray.dir ) );
      
      if ( !isFinite( intersection.x ) || !isFinite( intersection.y ) ) {
        // lines must be parallel
        return result;
      }
      
      // check to make sure our point is in our line segment (specifically, in the bounds (start,end], not including the start point so we don't double-count intersections)
      if ( start.x !== end.x && ( start.x > end.x ? ( intersection.x >= start.x || intersection.x < end.x ) : ( intersection.x <= start.x || intersection.x > end.x ) ) ) {
        return result;
      }
      if ( start.y !== end.y && ( start.y > end.y ? ( intersection.y >= start.y || intersection.y < end.y ) : ( intersection.y <= start.y || intersection.y > end.y ) ) ) {
        return result;
      }
      
      // make sure the intersection is not behind the ray
      var t = intersection.minus( ray.pos ).dot( ray.dir );
      if ( t < 0 ) {
        return result;
      }
      
      // return the proper winding direction depending on what way our line intersection is "pointed"
      var diff = end.minus( start );
      var perp = diff.perpendicular();
      result.push( {
        distance: t,
        point: ray.pointAtDistance( t ),
        normal: perp.dot( ray.dir ) > 0 ? perp.negated() : perp,
        wind: ray.dir.perpendicular().dot( diff ) < 0 ? 1 : -1
      } );
      return result;
    },
    
    // returns the resultant winding number of this ray intersecting this segment.
    windingIntersection: function( ray ) {
      var hits = this.intersection( ray );
      if ( hits.length ) {
        return hits[0].wind;
      } else {
        return 0;
      }
    }
  };
  
  return Segment.Line;
} );

// Copyright 2002-2012, University of Colorado

/**
 * A Canvas-style stateful (mutable) subpath, which tracks segments in addition to the points.
 *
 * See http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#concept-path
 * for the path / subpath Canvas concept.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/util/Subpath',['require','ASSERT/assert','KITE/kite','KITE/segments/Line'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );
  
  var kite = require( 'KITE/kite' );
  
  require( 'KITE/segments/Line' );
  
  kite.Subpath = function() {
    this.points = [];
    this.segments = [];
    this.closed = false;
  };
  var Subpath = kite.Subpath;
  Subpath.prototype = {
    addPoint: function( point ) {
      this.points.push( point );
    },
    
    addSegment: function( segment ) {
      if ( !segment.invalid ) {
        assert && assert( segment.start.isFinite(), 'Segment start is infinite' );
        assert && assert( segment.end.isFinite(), 'Segment end is infinite' );
        assert && assert( segment.startTangent.isFinite(), 'Segment startTangent is infinite' );
        assert && assert( segment.endTangent.isFinite(), 'Segment endTangent is infinite' );
        assert && assert( segment.bounds.isEmpty() || segment.bounds.isFinite(), 'Segment bounds is infinite and non-empty' );
        this.segments.push( segment );
      }
    },
    
    close: function() {
      this.closed = true;
    },
    
    getLength: function() {
      return this.points.length;
    },
    
    getFirstPoint: function() {
      return _.first( this.points );
    },
    
    getLastPoint: function() {
      return _.last( this.points );
    },
    
    getFirstSegment: function() {
      return _.first( this.segments );
    },
    
    getLastSegment: function() {
      return _.last( this.segments );
    },
    
    isDrawable: function() {
      return this.segments.length > 0;
    },
    
    isClosed: function() {
      return this.closed;
    },
    
    hasClosingSegment: function() {
      return !this.getFirstPoint().equalsEpsilon( this.getLastPoint(), 0.000000001 );
    },
    
    getClosingSegment: function() {
      assert && assert( this.hasClosingSegment(), 'Implicit closing segment unnecessary on a fully closed path' );
      return new kite.Segment.Line( this.getLastPoint(), this.getFirstPoint() );
    }
  };
  
  return kite.Subpath;
} );

//jshint -W018
// Copyright 2002-2012, University of Colorado

/**
 * Styles needed to determine a stroked line shape.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/util/LineStyles',['require','ASSERT/assert','KITE/kite'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );
  
  var kite = require( 'KITE/kite' );
  
  kite.LineStyles = function( args ) {
    if ( args === undefined ) {
      args = {};
    }
    this.lineWidth = args.lineWidth !== undefined ? args.lineWidth : 1;
    this.lineCap = args.lineCap !== undefined ? args.lineCap : 'butt'; // butt, round, square
    this.lineJoin = args.lineJoin !== undefined ? args.lineJoin : 'miter'; // miter, round, bevel
    this.lineDash = args.lineDash !== undefined ? args.lineDash : null; // null is default, otherwise an array of numbers
    this.miterLimit = args.miterLimit !== undefined ? args.miterLimit : 10; // see https://svgwg.org/svg2-draft/painting.html for miterLimit computations
  };
  var LineStyles = kite.LineStyles;
  LineStyles.prototype = {
    constructor: LineStyles,
    
    equals: function( other ) {
      var typical = this.lineWidth === other.lineWidth && this.lineCap === other.lineCap && this.lineJoin === other.lineJoin && this.miterLimit === other.miterLimit;
      if ( !typical ) {
        return false;
      }
      
      // now we need to compare the line dashes
      /* jshint -W018 */
      //jshint -W018
      if ( !this.lineDash !== !other.lineDash ) {
        // one is defined, the other is not
        return false;
      }
      
      if ( this.lineDash ) {
        if ( this.lineDash.length !== other.lineDash.length ) {
          return false;
        }
        for ( var i = 0; i < this.lineDash.length; i++ ) {
          if ( this.lineDash[i] !== other.lineDash[i] ) {
            return false;
          }
        }
        return true;
      } else {
        // both have no line dash, so they are equal
        return true;
      }
    }
  };
  
  return kite.LineStyles;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Elliptical arc segment
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/segments/EllipticalArc',['require','ASSERT/assert','KITE/kite','DOT/Vector2','DOT/Bounds2','DOT/Matrix3','DOT/Transform3','DOT/Util','KITE/segments/Segment','KITE/pieces/Piece','KITE/util/Subpath'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );

  var kite = require( 'KITE/kite' );
  
  var Vector2 = require( 'DOT/Vector2' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Matrix3 = require( 'DOT/Matrix3' );
  var Transform3 = require( 'DOT/Transform3' );
  var toDegrees = require( 'DOT/Util' ).toDegrees;

  var Segment = require( 'KITE/segments/Segment' );
  var Piece = require( 'KITE/pieces/Piece' );
  require( 'KITE/util/Subpath' );

  // TODO: notes at http://www.w3.org/TR/SVG/implnote.html#PathElementImplementationNotes
  // Canvas notes at http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-ellipse
  Segment.EllipticalArc = function( center, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise ) {
    this.center = center;
    this.radiusX = radiusX;
    this.radiusY = radiusY;
    this.rotation = rotation;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.anticlockwise = anticlockwise;
    
    this.unitTransform = Segment.EllipticalArc.computeUnitTransform( center, radiusX, radiusY, rotation );
    
    this.start = this.positionAtAngle( startAngle );
    this.end = this.positionAtAngle( endAngle );
    this.startTangent = this.tangentAtAngle( startAngle ).normalized();
    this.endTangent = this.tangentAtAngle( endAngle ).normalized();
    
    if ( radiusX === 0 || radiusY === 0 || startAngle === endAngle ) {
      this.invalid = true;
      return;
    }
    
    if ( radiusX < radiusY ) {
      // TODO: check this
      throw new Error( 'Not verified to work if radiusX < radiusY' );
    }
    
    // constraints shared with Segment.Arc
    assert && assert( !( ( !anticlockwise && endAngle - startAngle <= -Math.PI * 2 ) || ( anticlockwise && startAngle - endAngle <= -Math.PI * 2 ) ), 'Not handling elliptical arcs with start/end angles that show differences in-between browser handling' );
    assert && assert( !( ( !anticlockwise && endAngle - startAngle > Math.PI * 2 ) || ( anticlockwise && startAngle - endAngle > Math.PI * 2 ) ), 'Not handling elliptical arcs with start/end angles that show differences in-between browser handling' );
    
    var isFullPerimeter = ( !anticlockwise && endAngle - startAngle >= Math.PI * 2 ) || ( anticlockwise && startAngle - endAngle >= Math.PI * 2 );
    
    // compute an angle difference that represents how "much" of the circle our arc covers
    this.angleDifference = this.anticlockwise ? this.startAngle - this.endAngle : this.endAngle - this.startAngle;
    if ( this.angleDifference < 0 ) {
      this.angleDifference += Math.PI * 2;
    }
    assert && assert( this.angleDifference >= 0 ); // now it should always be zero or positive
    
    // a unit arg segment that we can map to our ellipse. useful for hit testing and such.
    this.unitArcSegment = new Segment.Arc( center, 1, startAngle, endAngle, anticlockwise );
    
    this.bounds = Bounds2.NOTHING;
    this.bounds = this.bounds.withPoint( this.start );
    this.bounds = this.bounds.withPoint( this.end );
    
    // for bounds computations
    var that = this;
    function boundsAtAngle( angle ) {
      if ( that.containsAngle( angle ) ) {
        // the boundary point is in the arc
        that.bounds = that.bounds.withPoint( that.positionAtAngle( angle ) );
      }
    }
    
    // if the angles are different, check extrema points
    if ( startAngle !== endAngle ) {
      // solve the mapping from the unit circle, find locations where a coordinate of the gradient is zero.
      // we find one extrema point for both x and y, since the other two are just rotated by pi from them.
      var xAngle = Math.atan( -( radiusY / radiusX ) * Math.tan( rotation ) );
      var yAngle = Math.atan( ( radiusY / radiusX ) / Math.tan( rotation ) );
      
      // check all of the extrema points
      boundsAtAngle( xAngle );
      boundsAtAngle( xAngle + Math.PI );
      boundsAtAngle( yAngle );
      boundsAtAngle( yAngle + Math.PI );
    }
  };
  Segment.EllipticalArc.prototype = {
    constructor: Segment.EllipticalArc,
    
    angleAt: function( t ) {
      if ( this.anticlockwise ) {
        // angle is 'decreasing'
        // -2pi <= end - start < 2pi
        if ( this.startAngle > this.endAngle ) {
          return this.startAngle + ( this.endAngle - this.startAngle ) * t;
        } else if ( this.startAngle < this.endAngle ) {
          return this.startAngle + ( -Math.PI * 2 + this.endAngle - this.startAngle ) * t;
        } else {
          // equal
          return this.startAngle;
        }
      } else {
        // angle is 'increasing'
        // -2pi < end - start <= 2pi
        if ( this.startAngle < this.endAngle ) {
          return this.startAngle + ( this.endAngle - this.startAngle ) * t;
        } else if ( this.startAngle > this.endAngle ) {
          return this.startAngle + ( Math.PI * 2 + this.endAngle - this.startAngle ) * t;
        } else {
          // equal
          return this.startAngle;
        }
      }
    },
    
    positionAt: function( t ) {
      return this.positionAtAngle( this.angleAt( t ) );
    },
    
    tangentAt: function( t ) {
      return this.tangentAtAngle( this.angleAt( t ) );
    },
    
    curvatureAt: function( t ) {
      // see http://mathworld.wolfram.com/Ellipse.html (59)
      var angle = this.angleAt( t );
      var aq = this.radiusX * Math.sin( angle );
      var bq = this.radiusY * Math.cos( angle );
      var denominator = Math.pow( bq * bq + aq * aq, 3/2 );
      return ( this.anticlockwise ? -1 : 1 ) * this.radiusX * this.radiusY / denominator;
    },
    
    positionAtAngle: function( angle ) {
      return this.unitTransform.transformPosition2( Vector2.createPolar( 1, angle ) );
    },
    
    tangentAtAngle: function( angle ) {
      var normal = this.unitTransform.transformNormal2( Vector2.createPolar( 1, angle ) );
      
      return this.anticlockwise ? normal.perpendicular() : normal.perpendicular().negated();
    },
    
    // TODO: refactor? exact same as Segment.Arc
    containsAngle: function( angle ) {
      // transform the angle into the appropriate coordinate form
      // TODO: check anticlockwise version!
      var normalizedAngle = this.anticlockwise ? angle - this.endAngle : angle - this.startAngle;
      
      // get the angle between 0 and 2pi
      var positiveMinAngle = normalizedAngle % ( Math.PI * 2 );
      // check this because modular arithmetic with negative numbers reveal a negative number
      if ( positiveMinAngle < 0 ) {
        positiveMinAngle += Math.PI * 2;
      }
      
      return positiveMinAngle <= this.angleDifference;
    },
    
    toPieces: function() {
      return [ new Piece.EllipticalArc( this.center, this.radiusX, this.radiusY, this.rotation, this.startAngle, this.endAngle, this.anticlockwise ) ];
    },
    
    // discretizes the elliptical arc and returns an offset curve as a list of lineTos
    offsetTo: function( r, reverse ) {
      // how many segments to create (possibly make this more adaptive?)
      var quantity = 32;
      
      var result = [];
      for ( var i = 1; i < quantity; i++ ) {
        var ratio = i / ( quantity - 1 );
        if ( reverse ) {
          ratio = 1 - ratio;
        }
        var angle = this.angleAt( ratio );
        
        var point = this.positionAtAngle( angle ).plus( this.tangentAtAngle( angle ).perpendicular().normalized().times( r ) );
        result.push( new Piece.LineTo( point ) );
      }
      
      return result;
    },
    
    getSVGPathFragment: function() {
      // see http://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands for more info
      // rx ry x-axis-rotation large-arc-flag sweep-flag x y
      var epsilon = 0.01; // allow some leeway to render things as 'almost circles'
      var sweepFlag = this.anticlockwise ? '0' : '1';
      var largeArcFlag;
      var degreesRotation = toDegrees( this.rotation ); // bleh, degrees?
      if ( this.angleDifference < Math.PI * 2 - epsilon ) {
        largeArcFlag = this.angleDifference < Math.PI ? '0' : '1';
        return 'A ' + this.radiusX + ' ' + this.radiusY + ' ' + degreesRotation + ' ' + largeArcFlag + ' ' + sweepFlag + ' ' + this.end.x + ' ' + this.end.y;
      } else {
        // ellipse (or almost-ellipse) case needs to be handled differently
        // since SVG will not be able to draw (or know how to draw) the correct circle if we just have a start and end, we need to split it into two circular arcs
        
        // get the angle that is between and opposite of both of the points
        var splitOppositeAngle = ( this.startAngle + this.endAngle ) / 2; // this _should_ work for the modular case?
        var splitPoint = this.positionAtAngle( splitOppositeAngle );
        
        largeArcFlag = '0'; // since we split it in 2, it's always the small arc
        
        var firstArc = 'A ' + this.radiusX + ' ' + this.radiusY + ' ' + degreesRotation + ' ' + largeArcFlag + ' ' + sweepFlag + ' ' + splitPoint.x + ' ' + splitPoint.y;
        var secondArc = 'A ' + this.radiusX + ' ' + this.radiusY + ' ' + degreesRotation + ' ' + largeArcFlag + ' ' + sweepFlag + ' ' + this.end.x + ' ' + this.end.y;
        
        return firstArc + ' ' + secondArc;
      }
    },
    
    strokeLeft: function( lineWidth ) {
      return this.offsetTo( -lineWidth / 2, false );
    },
    
    strokeRight: function( lineWidth ) {
      return this.offsetTo( lineWidth / 2, true );
    },
    
    intersectsBounds: function( bounds ) {
      throw new Error( 'Segment.EllipticalArc.intersectsBounds unimplemented' );
    },
    
    intersection: function( ray ) {
      // be lazy. transform it into the space of a non-elliptical arc.
      var unitTransform = this.unitTransform;
      var rayInUnitCircleSpace = unitTransform.inverseRay2( ray );
      var hits = this.unitArcSegment.intersection( rayInUnitCircleSpace );
      
      return _.map( hits, function( hit ) {
        var transformedPoint = unitTransform.transformPosition2( hit.point );
        return {
          distance: ray.pos.distance( transformedPoint ),
          point: transformedPoint,
          normal: unitTransform.inverseNormal2( hit.normal ),
          wind: hit.wind
        };
      } );
    },
    
    // returns the resultant winding number of this ray intersecting this segment.
    windingIntersection: function( ray ) {
      // be lazy. transform it into the space of a non-elliptical arc.
      var rayInUnitCircleSpace = this.unitTransform.inverseRay2( ray );
      return this.unitArcSegment.windingIntersection( rayInUnitCircleSpace );
    }
  };
  
  // adapted from http://www.w3.org/TR/SVG/implnote.html#PathElementImplementationNotes
  // transforms the unit circle onto our ellipse
  Segment.EllipticalArc.computeUnitTransform = function( center, radiusX, radiusY, rotation ) {
    return new Transform3( Matrix3.translation( center.x, center.y ) // TODO: convert to Matrix3.translation( this.center) when available
                                  .timesMatrix( Matrix3.rotation2( rotation ) )
                                  .timesMatrix( Matrix3.scaling( radiusX, radiusY ) ) );
  };
  
  return Segment.EllipticalArc;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Elliptical arc piece
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/pieces/EllipticalArc',['require','ASSERT/assert','ASSERT/assert','KITE/kite','DOT/Vector2','DOT/Bounds2','DOT/Ray2','DOT/Matrix3','DOT/Transform3','KITE/pieces/Piece','KITE/segments/EllipticalArc','KITE/segments/Line','KITE/util/Subpath'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );
  var assertExtra = require( 'ASSERT/assert' )( 'kite.extra', true );
  
  var kite = require( 'KITE/kite' );
  
  var Vector2 = require( 'DOT/Vector2' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Ray2 = require( 'DOT/Ray2' );
  var Matrix3 = require( 'DOT/Matrix3' );
  var Transform3 = require( 'DOT/Transform3' );

  var Piece = require( 'KITE/pieces/Piece' );
  require( 'KITE/segments/EllipticalArc' );
  require( 'KITE/segments/Line' );
  require( 'KITE/util/Subpath' );
  
  Piece.EllipticalArc = function( center, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise ) {
    if ( radiusX < 0 ) {
      // support this case since we might actually need to handle it inside of strokes?
      radiusX = -radiusX;
      startAngle = Math.PI - startAngle;
      endAngle = Math.PI - endAngle;
      anticlockwise = !anticlockwise;
    }
    if ( radiusY < 0 ) {
      // support this case since we might actually need to handle it inside of strokes?
      radiusY = -radiusY;
      startAngle = -startAngle;
      endAngle = -endAngle;
      anticlockwise = !anticlockwise;
    }
    if ( radiusX < radiusY ) {
      // swap radiusX and radiusY internally for consistent Canvas / SVG output
      rotation += Math.PI / 2;
      startAngle -= Math.PI / 2;
      endAngle -= Math.PI / 2;
      
      // swap radiusX and radiusY
      var tmpR = radiusX;
      radiusX = radiusY;
      radiusY = tmpR;
    }
    this.center = center;
    this.radiusX = radiusX;
    this.radiusY = radiusY;
    this.rotation = rotation;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.anticlockwise = anticlockwise;
    
    this.unitTransform = kite.Segment.EllipticalArc.computeUnitTransform( center, radiusX, radiusY, rotation );
  };
  Piece.EllipticalArc.prototype = {
    constructor: Piece.EllipticalArc,
    
    writeToContext: function( context ) {
      if ( context.ellipse ) {
        context.ellipse( this.center.x, this.center.y, this.radiusX, this.radiusY, this.rotation, this.startAngle, this.endAngle, this.anticlockwise );
      } else {
        // fake the ellipse call by using transforms
        this.unitTransform.getMatrix().canvasAppendTransform( context );
        context.arc( 0, 0, 1, this.startAngle, this.endAngle, this.anticlockwise );
        this.unitTransform.getInverse().canvasAppendTransform( context );
      }
    },
    
    // TODO: test various transform types, especially rotations, scaling, shears, etc.
    transformed: function( matrix ) {
      var transformedSemiMajorAxis = matrix.timesVector2( Vector2.createPolar( this.radiusX, this.rotation ) ).minus( matrix.timesVector2( Vector2.ZERO ) );
      var transformedSemiMinorAxis = matrix.timesVector2( Vector2.createPolar( this.radiusY, this.rotation + Math.PI / 2 ) ).minus( matrix.timesVector2( Vector2.ZERO ) );
      var rotation = transformedSemiMajorAxis.angle();
      var radiusX = transformedSemiMajorAxis.magnitude();
      var radiusY = transformedSemiMinorAxis.magnitude();
      
      var reflected = matrix.getDeterminant() < 0;
      
      // reverse the 'clockwiseness' if our transform includes a reflection
      // TODO: check reflections. swapping angle signs should fix clockwiseness
      var anticlockwise = reflected ? !this.anticlockwise : this.anticlockwise;
      var startAngle = reflected ? -this.startAngle : this.startAngle;
      var endAngle = reflected ? -this.endAngle : this.endAngle;
      
      return [new Piece.EllipticalArc( matrix.timesVector2( this.center ), radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise )];
    },
    
    applyPiece: function( shape ) {
      // see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-arc
      
      var ellipticalArc = new kite.Segment.EllipticalArc( this.center, this.radiusX, this.radiusY, this.rotation, this.startAngle, this.endAngle, this.anticlockwise );
      
      // we are assuming that the normal conditions were already met (or exceptioned out) so that these actually work with canvas
      var startPoint = ellipticalArc.start;
      var endPoint = ellipticalArc.end;
      
      // if there is already a point on the subpath, and it is different than our starting point, draw a line between them
      if ( shape.hasSubpaths() && shape.getLastSubpath().getLength() > 0 && !startPoint.equals( shape.getLastSubpath().getLastPoint(), 0 ) ) {
        shape.getLastSubpath().addSegment( new kite.Segment.Line( shape.getLastSubpath().getLastPoint(), startPoint ) );
      }
      
      if ( !shape.hasSubpaths() ) {
        shape.addSubpath( new kite.Subpath() );
      }
      
      shape.getLastSubpath().addSegment( ellipticalArc );
      
      // technically the Canvas spec says to add the start point, so we do this even though it is probably completely unnecessary (there is no conditional)
      shape.getLastSubpath().addPoint( startPoint );
      shape.getLastSubpath().addPoint( endPoint );
      
      // and update the bounds
      if ( !ellipticalArc.invalid ) {
        shape.bounds = shape.bounds.union( ellipticalArc.bounds );
      }
    }
  };
  
  return Piece.EllipticalArc;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Arc segment
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/segments/Arc',['require','ASSERT/assert','KITE/kite','DOT/Vector2','DOT/Bounds2','KITE/segments/Segment','KITE/pieces/Piece'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );

  var kite = require( 'KITE/kite' );
  
  var Vector2 = require( 'DOT/Vector2' );
  var Bounds2 = require( 'DOT/Bounds2' );

  var Segment = require( 'KITE/segments/Segment' );
  var Piece = require( 'KITE/pieces/Piece' );

  Segment.Arc = function( center, radius, startAngle, endAngle, anticlockwise ) {
    this.center = center;
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.anticlockwise = anticlockwise;
    
    this.start = this.positionAtAngle( startAngle );
    this.end = this.positionAtAngle( endAngle );
    this.startTangent = this.tangentAtAngle( startAngle );
    this.endTangent = this.tangentAtAngle( endAngle );
    
    if ( radius <= 0 || startAngle === endAngle ) {
      this.invalid = true;
      return;
    }
    // constraints
    assert && assert( !( ( !anticlockwise && endAngle - startAngle <= -Math.PI * 2 ) || ( anticlockwise && startAngle - endAngle <= -Math.PI * 2 ) ), 'Not handling arcs with start/end angles that show differences in-between browser handling' );
    assert && assert( !( ( !anticlockwise && endAngle - startAngle > Math.PI * 2 ) || ( anticlockwise && startAngle - endAngle > Math.PI * 2 ) ), 'Not handling arcs with start/end angles that show differences in-between browser handling' );
    
    var isFullPerimeter = ( !anticlockwise && endAngle - startAngle >= Math.PI * 2 ) || ( anticlockwise && startAngle - endAngle >= Math.PI * 2 );
    
    // compute an angle difference that represents how "much" of the circle our arc covers
    this.angleDifference = this.anticlockwise ? this.startAngle - this.endAngle : this.endAngle - this.startAngle;
    if ( this.angleDifference < 0 ) {
      this.angleDifference += Math.PI * 2;
    }
    assert && assert( this.angleDifference >= 0 ); // now it should always be zero or positive
    
    // acceleration for intersection
    this.bounds = Bounds2.NOTHING;
    this.bounds = this.bounds.withPoint( this.start );
    this.bounds = this.bounds.withPoint( this.end );
    
    // for bounds computations
    var that = this;
    function boundsAtAngle( angle ) {
      if ( that.containsAngle( angle ) ) {
        // the boundary point is in the arc
        that.bounds = that.bounds.withPoint( center.plus( Vector2.createPolar( radius, angle ) ) );
      }
    }
    
    // if the angles are different, check extrema points
    if ( startAngle !== endAngle ) {
      // check all of the extrema points
      boundsAtAngle( 0 );
      boundsAtAngle( Math.PI / 2 );
      boundsAtAngle( Math.PI );
      boundsAtAngle( 3 * Math.PI / 2 );
    }
  };
  Segment.Arc.prototype = {
    constructor: Segment.Arc,
    
    angleAt: function( t ) {
      if ( this.anticlockwise ) {
        // angle is 'decreasing'
        // -2pi <= end - start < 2pi
        if ( this.startAngle > this.endAngle ) {
          return this.startAngle + ( this.endAngle - this.startAngle ) * t;
        } else if ( this.startAngle < this.endAngle ) {
          return this.startAngle + ( -Math.PI * 2 + this.endAngle - this.startAngle ) * t;
        } else {
          // equal
          return this.startAngle;
        }
      } else {
        // angle is 'increasing'
        // -2pi < end - start <= 2pi
        if ( this.startAngle < this.endAngle ) {
          return this.startAngle + ( this.endAngle - this.startAngle ) * t;
        } else if ( this.startAngle > this.endAngle ) {
          return this.startAngle + ( Math.PI * 2 + this.endAngle - this.startAngle ) * t;
        } else {
          // equal
          return this.startAngle;
        }
      }
    },
    
    positionAt: function( t ) {
      return this.positionAtAngle( this.angleAt( t ) );
    },
    
    tangentAt: function( t ) {
      return this.tangentAtAngle( this.angleAt( t ) );
    },
    
    curvatureAt: function( t ) {
      return ( this.anticlockwise ? -1 : 1 ) / this.radius;
    },
    
    positionAtAngle: function( angle ) {
      return this.center.plus( Vector2.createPolar( this.radius, angle ) );
    },
    
    tangentAtAngle: function( angle ) {
      var normal = Vector2.createPolar( 1, angle );
      
      return this.anticlockwise ? normal.perpendicular() : normal.perpendicular().negated();
    },
    
    // TODO: refactor? shared with Segment.EllipticalArc
    containsAngle: function( angle ) {
      // transform the angle into the appropriate coordinate form
      // TODO: check anticlockwise version!
      var normalizedAngle = this.anticlockwise ? angle - this.endAngle : angle - this.startAngle;
      
      // get the angle between 0 and 2pi
      var positiveMinAngle = normalizedAngle % ( Math.PI * 2 );
      // check this because modular arithmetic with negative numbers reveal a negative number
      if ( positiveMinAngle < 0 ) {
        positiveMinAngle += Math.PI * 2;
      }
      
      return positiveMinAngle <= this.angleDifference;
    },
    
    toPieces: function() {
      return [ new Piece.Arc( this.center, this.radius, this.startAngle, this.endAngle, this.anticlockwise ) ];
    },
    
    getSVGPathFragment: function() {
      // see http://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands for more info
      // rx ry x-axis-rotation large-arc-flag sweep-flag x y
      
      var epsilon = 0.01; // allow some leeway to render things as 'almost circles'
      var sweepFlag = this.anticlockwise ? '0' : '1';
      var largeArcFlag;
      if ( this.angleDifference < Math.PI * 2 - epsilon ) {
        largeArcFlag = this.angleDifference < Math.PI ? '0' : '1';
        return 'A ' + this.radius + ' ' + this.radius + ' 0 ' + largeArcFlag + ' ' + sweepFlag + ' ' + this.end.x + ' ' + this.end.y;
      } else {
        // circle (or almost-circle) case needs to be handled differently
        // since SVG will not be able to draw (or know how to draw) the correct circle if we just have a start and end, we need to split it into two circular arcs
        
        // get the angle that is between and opposite of both of the points
        var splitOppositeAngle = ( this.startAngle + this.endAngle ) / 2; // this _should_ work for the modular case?
        var splitPoint = this.center.plus( Vector2.createPolar( this.radius, splitOppositeAngle ) );
        
        largeArcFlag = '0'; // since we split it in 2, it's always the small arc
        
        var firstArc = 'A ' + this.radius + ' ' + this.radius + ' 0 ' + largeArcFlag + ' ' + sweepFlag + ' ' + splitPoint.x + ' ' + splitPoint.y;
        var secondArc = 'A ' + this.radius + ' ' + this.radius + ' 0 ' + largeArcFlag + ' ' + sweepFlag + ' ' + this.end.x + ' ' + this.end.y;
        
        return firstArc + ' ' + secondArc;
      }
    },
    
    strokeLeft: function( lineWidth ) {
      return [ new Piece.Arc( this.center, this.radius + ( this.anticlockwise ? 1 : -1 ) * lineWidth / 2, this.startAngle, this.endAngle, this.anticlockwise ) ];
    },
    
    strokeRight: function( lineWidth ) {
      return [ new Piece.Arc( this.center, this.radius + ( this.anticlockwise ? -1 : 1 ) * lineWidth / 2, this.endAngle, this.startAngle, !this.anticlockwise ) ];
    },
    
    intersectsBounds: function( bounds ) {
      throw new Error( 'Segment.intersectsBounds unimplemented!' );
    },
    
    intersection: function( ray ) {
      var result = []; // hits in order
      
      // left here, if in the future we want to better-handle boundary points
      var epsilon = 0;
      
      // Run a general circle-intersection routine, then we can test the angles later.
      // Solves for the two solutions t such that ray.pos + ray.dir * t is on the circle.
      // Then we check whether the angle at each possible hit point is in our arc.
      var centerToRay = ray.pos.minus( this.center );
      var tmp = ray.dir.dot( centerToRay );
      var centerToRayDistSq = centerToRay.magnitudeSquared();
      var discriminant = 4 * tmp * tmp - 4 * ( centerToRayDistSq - this.radius * this.radius );
      if ( discriminant < epsilon ) {
        // ray misses circle entirely
        return result;
      }
      var base = ray.dir.dot( this.center ) - ray.dir.dot( ray.pos );
      var sqt = Math.sqrt( discriminant ) / 2;
      var ta = base - sqt;
      var tb = base + sqt;
      
      if ( tb < epsilon ) {
        // circle is behind ray
        return result;
      }
      
      var pointB = ray.pointAtDistance( tb );
      var normalB = pointB.minus( this.center ).normalized();
      
      if ( ta < epsilon ) {
        // we are inside the circle, so only one intersection is possible
        if ( this.containsAngle( normalB.angle() ) ) {
          result.push( {
            distance: tb,
            point: pointB,
            normal: normalB.negated(), // normal is towards the ray
            wind: this.anticlockwise ? -1 : 1 // since we are inside, wind this way
          } );
        }
      }
      else {
        // two possible hits (outside circle)
        var pointA = ray.pointAtDistance( ta );
        var normalA = pointA.minus( this.center ).normalized();
        
        if ( this.containsAngle( normalA.angle() ) ) {
          result.push( {
            distance: ta,
            point: pointA,
            normal: normalA,
            wind: this.anticlockwise ? 1 : -1 // hit from outside
          } );
        }
        if ( this.containsAngle( normalB.angle() ) ) {
          result.push( {
            distance: tb,
            point: pointB,
            normal: normalB.negated(),
            wind: this.anticlockwise ? -1 : 1 // this is the far hit, which winds the opposite way
          } );
        }
      }
      
      return result;
    },
    
    // returns the resultant winding number of this ray intersecting this segment.
    windingIntersection: function( ray ) {
      var wind = 0;
      var hits = this.intersection( ray );
      _.each( hits, function( hit ) {
        wind += hit.wind;
      } );
      return wind;
    }
  };
  
  return Segment.Arc;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Draws an arc.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/pieces/Arc',['require','ASSERT/assert','KITE/kite','DOT/Vector2','KITE/pieces/Piece','KITE/pieces/EllipticalArc','KITE/segments/Line','KITE/segments/Arc','KITE/util/Subpath'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );
  
  var kite = require( 'KITE/kite' );
  
  var Vector2 = require( 'DOT/Vector2' );
  
  var Piece = require( 'KITE/pieces/Piece' );
  require( 'KITE/pieces/EllipticalArc' );
  require( 'KITE/segments/Line' );
  require( 'KITE/segments/Arc' );
  require( 'KITE/util/Subpath' );
  
  Piece.Arc = function( center, radius, startAngle, endAngle, anticlockwise ) {
    if ( radius < 0 ) {
      // support this case since we might actually need to handle it inside of strokes?
      radius = -radius;
      startAngle += Math.PI;
      endAngle += Math.PI;
    }
    this.center = center;
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.anticlockwise = anticlockwise;
  };
  Piece.Arc.prototype = {
    constructor: Piece.Arc,
    
    writeToContext: function( context ) {
      context.arc( this.center.x, this.center.y, this.radius, this.startAngle, this.endAngle, this.anticlockwise );
    },
    
    // TODO: test various transform types, especially rotations, scaling, shears, etc.
    transformed: function( matrix ) {
      // so we can handle reflections in the transform, we do the general case handling for start/end angles
      var startAngle = matrix.timesVector2( Vector2.createPolar( 1, this.startAngle ) ).minus( matrix.timesVector2( Vector2.ZERO ) ).angle();
      var endAngle = matrix.timesVector2( Vector2.createPolar( 1, this.endAngle ) ).minus( matrix.timesVector2( Vector2.ZERO ) ).angle();
      
      // reverse the 'clockwiseness' if our transform includes a reflection
      var anticlockwise = matrix.getDeterminant() >= 0 ? this.anticlockwise : !this.anticlockwise;

      var scaleVector = matrix.getScaleVector();
      if ( scaleVector.x !== scaleVector.y ) {
        var radiusX = scaleVector.x * this.radius;
        var radiusY = scaleVector.y * this.radius;
        return [new Piece.EllipticalArc( matrix.timesVector2( this.center ), radiusX, radiusY, 0, startAngle, endAngle, anticlockwise )];
      } else {
        var radius = scaleVector.x * this.radius;
        return [new Piece.Arc( matrix.timesVector2( this.center ), radius, startAngle, endAngle, anticlockwise )];
      }
    },
    
    applyPiece: function( shape ) {
      // see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-arc
      
      var arc = new kite.Segment.Arc( this.center, this.radius, this.startAngle, this.endAngle, this.anticlockwise );
      
      // we are assuming that the normal conditions were already met (or exceptioned out) so that these actually work with canvas
      var startPoint = arc.start;
      var endPoint = arc.end;
      
      // if there is already a point on the subpath, and it is different than our starting point, draw a line between them
      if ( shape.hasSubpaths() && shape.getLastSubpath().getLength() > 0 && !startPoint.equals( shape.getLastSubpath().getLastPoint(), 0 ) ) {
        shape.getLastSubpath().addSegment( new kite.Segment.Line( shape.getLastSubpath().getLastPoint(), startPoint ) );
      }
      
      if ( !shape.hasSubpaths() ) {
        shape.addSubpath( new kite.Subpath() );
      }
      
      shape.getLastSubpath().addSegment( arc );
      
      // technically the Canvas spec says to add the start point, so we do this even though it is probably completely unnecessary (there is no conditional)
      shape.getLastSubpath().addPoint( startPoint );
      shape.getLastSubpath().addPoint( endPoint );
      
      // and update the bounds
      if ( !arc.invalid ) {
        shape.bounds = shape.bounds.union( arc.bounds );
      }
    }
  };
  
  return Piece.Arc;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Closes a subpath
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/pieces/Close',['require','ASSERT/assert','KITE/kite','KITE/pieces/Piece','KITE/util/Subpath'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );
  
  var kite = require( 'KITE/kite' );
  
  var Piece = require( 'KITE/pieces/Piece' );
  require( 'KITE/util/Subpath' );
  
  Piece.Close = function() {};
  Piece.Close.prototype = {
    constructor: Piece.Close,
    
    writeToContext: function( context ) {
      context.closePath();
    },
    
    transformed: function( matrix ) {
      return [this];
    },
    
    applyPiece: function( shape ) {
      if ( shape.hasSubpaths() ) {
        var previousPath = shape.getLastSubpath();
        var nextPath = new kite.Subpath();
        
        previousPath.close();
        shape.addSubpath( nextPath );
        nextPath.addPoint( previousPath.getFirstPoint() );
      }
    }
  };
  
  return Piece.Close;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Quadratic Bezier segment
 *
 * Good reference: http://cagd.cs.byu.edu/~557/text/ch2.pdf
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/segments/Quadratic',['require','ASSERT/assert','KITE/kite','DOT/Bounds2','DOT/Matrix3','DOT/Util','KITE/segments/Segment','KITE/pieces/Piece'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );

  var kite = require( 'KITE/kite' );
  
  var Bounds2 = require( 'DOT/Bounds2' );
  var Matrix3 = require( 'DOT/Matrix3' );
  var solveQuadraticRootsReal = require( 'DOT/Util' ).solveQuadraticRootsReal;

  var Segment = require( 'KITE/segments/Segment' );
  var Piece = require( 'KITE/pieces/Piece' );

  Segment.Quadratic = function( start, control, end, skipComputations ) {
    this.start = start;
    this.control = control;
    this.end = end;
    
    if ( start.equals( end, 0 ) && start.equals( control, 0 ) ) {
      this.invalid = true;
      return;
    }
    
    var t;
    
    // allows us to skip unnecessary computation in the subdivision steps
    if ( skipComputations ) {
      return;
    }
    
    var controlIsStart = start.equals( control );
    var controlIsEnd = end.equals( control );
    // ensure the points are distinct
    assert && assert( !controlIsStart || !controlIsEnd );
    
    // allow either the start or end point to be the same as the control point (necessary if you do a quadraticCurveTo on an empty path)
    // tangents go through the control point, which simplifies things
    this.startTangent = controlIsStart ? end.minus( start ).normalized() : control.minus( start ).normalized();
    this.endTangent = controlIsEnd ? end.minus( start ).normalized() : end.minus( control ).normalized();
    
    // calculate our temporary guaranteed lower bounds based on the end points
    this.bounds = new Bounds2( Math.min( start.x, end.x ), Math.min( start.y, end.y ), Math.max( start.x, end.x ), Math.max( start.y, end.y ) );
    
    // compute x and y where the derivative is 0, so we can include this in the bounds
    var divisorX = 2 * ( end.x - 2 * control.x + start.x );
    if ( divisorX !== 0 ) {
      t = -2 * ( control.x - start.x ) / divisorX;
      
      if ( t > 0 && t < 1 ) {
        this.bounds = this.bounds.withPoint( this.positionAt( t ) );
      }
    }
    var divisorY = 2 * ( end.y - 2 * control.y + start.y );
    if ( divisorY !== 0 ) {
      t = -2 * ( control.y - start.y ) / divisorY;
      
      if ( t > 0 && t < 1 ) {
        this.bounds = this.bounds.withPoint( this.positionAt( t ) );
      }
    }
  };
  Segment.Quadratic.prototype = {
    constructor: Segment.Quadratic,
    
    degree: 2,
    
    // can be described from t=[0,1] as: (1-t)^2 start + 2(1-t)t control + t^2 end
    positionAt: function( t ) {
      var mt = 1 - t;
      return this.start.times( mt * mt ).plus( this.control.times( 2 * mt * t ) ).plus( this.end.times( t * t ) );
    },
    
    // derivative: 2(1-t)( control - start ) + 2t( end - control )
    tangentAt: function( t ) {
      return this.control.minus( this.start ).times( 2 * ( 1 - t ) ).plus( this.end.minus( this.control ).times( 2 * t ) );
    },
    
    curvatureAt: function( t ) {
      // see http://cagd.cs.byu.edu/~557/text/ch2.pdf p31
      // TODO: remove code duplication with Cubic
      var epsilon = 0.0000001;
      if ( Math.abs( t - 0.5 ) > 0.5 - epsilon ) {
        var isZero = t < 0.5;
        var p0 = isZero ? this.start : this.end;
        var p1 = this.control;
        var p2 = isZero ? this.end : this.start;
        var d10 = p1.minus( p0 );
        var a = d10.magnitude();
        var h = ( isZero ? -1 : 1 ) * d10.perpendicular().normalized().dot( p2.minus( p1 ) );
        return ( h * ( this.degree - 1 ) ) / ( this.degree * a * a );
      } else {
        return this.subdivided( t, true )[0].curvatureAt( 1 );
      }
    },
    
    // see http://www.visgraf.impa.br/sibgrapi96/trabs/pdf/a14.pdf
    // and http://math.stackexchange.com/questions/12186/arc-length-of-bezier-curves for curvature / arc length
    
    offsetTo: function( r, reverse ) {
      // TODO: implement more accurate method at http://www.antigrain.com/research/adaptive_bezier/index.html
      // TODO: or more recently (and relevantly): http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf
      var curves = [this];
      
      // subdivide this curve
      var depth = 5; // generates 2^depth curves
      for ( var i = 0; i < depth; i++ ) {
        curves = _.flatten( _.map( curves, function( curve ) {
          return curve.subdivided( 0.5, true );
        } ));
      }
      
      var offsetCurves = _.map( curves, function( curve ) { return curve.approximateOffset( r ); } );
      
      if ( reverse ) {
        offsetCurves.reverse();
        offsetCurves = _.map( offsetCurves, function( curve ) { return curve.reversed( true ); } );
      }
      
      var result = _.map( offsetCurves, function( curve ) {
        return new Piece.QuadraticCurveTo( curve.control, curve.end );
      } );
      
      return result;
    },
    
    subdivided: function( t, skipComputations ) {
      // de Casteljau method
      var leftMid = this.start.blend( this.control, t );
      var rightMid = this.control.blend( this.end, t );
      var mid = leftMid.blend( rightMid, t );
      return [
        new Segment.Quadratic( this.start, leftMid, mid, skipComputations ),
        new Segment.Quadratic( mid, rightMid, this.end, skipComputations )
      ];
    },
    
    reversed: function( skipComputations ) {
      return new Segment.Quadratic( this.end, this.control, this.start );
    },
    
    approximateOffset: function( r ) {
      return new Segment.Quadratic(
        this.start.plus( ( this.start.equals( this.control ) ? this.end.minus( this.start ) : this.control.minus( this.start ) ).perpendicular().normalized().times( r ) ),
        this.control.plus( this.end.minus( this.start ).perpendicular().normalized().times( r ) ),
        this.end.plus( ( this.end.equals( this.control ) ? this.end.minus( this.start ) : this.end.minus( this.control ) ).perpendicular().normalized().times( r ) )
      );
    },
    
    toPieces: function() {
      return [ new Piece.QuadraticCurveTo( this.control, this.end ) ];
    },
    
    getSVGPathFragment: function() {
      return 'Q ' + this.control.x + ' ' + this.control.y + ' ' + this.end.x + ' ' + this.end.y;
    },
    
    strokeLeft: function( lineWidth ) {
      return this.offsetTo( -lineWidth / 2, false );
    },
    
    strokeRight: function( lineWidth ) {
      return this.offsetTo( lineWidth / 2, true );
    },
    
    intersectsBounds: function( bounds ) {
      throw new Error( 'Segment.Quadratic.intersectsBounds unimplemented' ); // TODO: implement
    },
    
    // returns the resultant winding number of this ray intersecting this segment.
    intersection: function( ray ) {
      var self = this;
      var result = [];
      
      // find the rotation that will put our ray in the direction of the x-axis so we can only solve for y=0 for intersections
      var inverseMatrix = Matrix3.rotation2( -ray.dir.angle() ).timesMatrix( Matrix3.translation( -ray.pos.x, -ray.pos.y ) );
      
      var p0 = inverseMatrix.timesVector2( this.start );
      var p1 = inverseMatrix.timesVector2( this.control );
      var p2 = inverseMatrix.timesVector2( this.end );
      
      //(1-t)^2 start + 2(1-t)t control + t^2 end
      var a = p0.y - 2 * p1.y + p2.y;
      var b = -2 * p0.y + 2 * p1.y;
      var c = p0.y;
      
      var ts = solveQuadraticRootsReal( a, b, c );
      
      _.each( ts, function( t ) {
        if ( t >= 0 && t <= 1 ) {
          var hitPoint = self.positionAt( t );
          var unitTangent = self.tangentAt( t ).normalized();
          var perp = unitTangent.perpendicular();
          var toHit = hitPoint.minus( ray.pos );
          
          // make sure it's not behind the ray
          if ( toHit.dot( ray.dir ) > 0 ) {
            result.push( {
              distance: toHit.magnitude(),
              point: hitPoint,
              normal: perp.dot( ray.dir ) > 0 ? perp.negated() : perp,
              wind: ray.dir.perpendicular().dot( unitTangent ) < 0 ? 1 : -1
            } );
          }
        }
      } );
      return result;
    },
    
    windingIntersection: function( ray ) {
      var wind = 0;
      var hits = this.intersection( ray );
      _.each( hits, function( hit ) {
        wind += hit.wind;
      } );
      return wind;
    }
  };
  
  return Segment.Quadratic;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Cubic Bezier segment.
 *
 * See http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf for info
 *
 * Good reference: http://cagd.cs.byu.edu/~557/text/ch2.pdf
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/segments/Cubic',['require','ASSERT/assert','KITE/kite','DOT/Bounds2','DOT/Vector2','DOT/Matrix3','DOT/Util','DOT/Util','KITE/segments/Segment','KITE/pieces/Piece','KITE/segments/Quadratic'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );

  var kite = require( 'KITE/kite' );
  
  var Bounds2 = require( 'DOT/Bounds2' );
  var Vector2 = require( 'DOT/Vector2' );
  var Matrix3 = require( 'DOT/Matrix3' );
  var solveQuadraticRootsReal = require( 'DOT/Util' ).solveQuadraticRootsReal;
  var solveCubicRootsReal = require( 'DOT/Util' ).solveCubicRootsReal;
  
  var Segment = require( 'KITE/segments/Segment' );
  var Piece = require( 'KITE/pieces/Piece' );
  require( 'KITE/segments/Quadratic' );

  Segment.Cubic = function( start, control1, control2, end, skipComputations ) {
    this.start = start;
    this.control1 = control1;
    this.control2 = control2;
    this.end = end;
    
    // allows us to skip unnecessary computation in the subdivision steps
    if ( skipComputations ) {
      return;
    }
    
    this.startTangent = this.tangentAt( 0 ).normalized();
    this.endTangent = this.tangentAt( 1 ).normalized();
    
    if ( start.equals( end, 0 ) && start.equals( control1, 0 ) && start.equals( control2, 0 ) ) {
      this.invalid = true;
      return;
    }
    
    // from http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf
    this.r = control1.minus( start ).normalized();
    this.s = this.r.perpendicular();
    
    var a = start.times( -1 ).plus( control1.times( 3 ) ).plus( control2.times( -3 ) ).plus( end );
    var b = start.times( 3 ).plus( control1.times( -6 ) ).plus( control2.times( 3 ) );
    var c = start.times( -3 ).plus( control1.times( 3 ) );
    var d = start;
    
    var aPerp = a.perpendicular();
    var bPerp = b.perpendicular();
    var aPerpDotB = aPerp.dot( b );
    
    this.tCusp = -0.5 * ( aPerp.dot( c ) / aPerpDotB );
    this.tDeterminant = this.tCusp * this.tCusp - ( 1 / 3 ) * ( bPerp.dot( c ) / aPerpDotB );
    if ( this.tDeterminant >= 0 ) {
      var sqrtDet = Math.sqrt( this.tDeterminant );
      this.tInflection1 = this.tCusp - sqrtDet;
      this.tInflection2 = this.tCusp + sqrtDet;
    }
    
    if ( this.hasCusp() ) {
      // if there is a cusp, we'll split at the cusp into two quadratic bezier curves.
      // see http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.94.8088&rep=rep1&type=pdf (Singularities of rational Bezier curves - J Monterde, 2001)
      var subdividedAtCusp = this.subdivided( this.tCusp, true );
      this.startQuadratic = new Segment.Quadratic( subdividedAtCusp[0].start, subdividedAtCusp[0].control1, subdividedAtCusp[0].end, false );
      this.endQuadratic = new Segment.Quadratic( subdividedAtCusp[1].start, subdividedAtCusp[1].control2, subdividedAtCusp[1].end, false );
    }
    
    this.bounds = Bounds2.NOTHING;
    this.bounds = this.bounds.withPoint( this.start );
    this.bounds = this.bounds.withPoint( this.end );
    
    /*---------------------------------------------------------------------------*
    * Bounds
    *----------------------------------------------------------------------------*/
    
    // finds what t values the cubic extrema are at (if any).
    function extremaT( v0, v1, v2, v3 ) {
      // coefficients of derivative
      var a = -3 * v0 + 9 * v1 -9 * v2 + 3 * v3;
      var b =  6 * v0 - 12 * v1 + 6 * v2;
      var c = -3 * v0 + 3 * v1;
      
      return solveQuadraticRootsReal( a, b, c );
    }
    
    var cubic = this;
    _.each( extremaT( this.start.x, this.control1.x, this.control2.x, this.end.x ), function( t ) {
      if ( t >= 0 && t <= 1 ) {
        cubic.bounds = cubic.bounds.withPoint( cubic.positionAt( t ) );
      }
    } );
    _.each( extremaT( this.start.y, this.control1.y, this.control2.y, this.end.y ), function( t ) {
      if ( t >= 0 && t <= 1 ) {
        cubic.bounds = cubic.bounds.withPoint( cubic.positionAt( t ) );
      }
    } );
    
    if ( this.hasCusp() ) {
      this.bounds = this.bounds.withPoint( this.positionAt( this.tCusp ) );
    }
  };
  Segment.Cubic.prototype = {
    constructor: Segment.Cubic,
    
    degree: 3,
    
    hasCusp: function() {
      var epsilon = 0.000001; // TODO: make this available to change?
      return this.tangentAt( this.tCusp ).magnitude() < epsilon && this.tCusp >= 0 && this.tCusp <= 1;
    },
    
    // position: (1 - t)^3*start + 3*(1 - t)^2*t*control1 + 3*(1 - t) t^2*control2 + t^3*end
    positionAt: function( t ) {
      var mt = 1 - t;
      return this.start.times( mt * mt * mt ).plus( this.control1.times( 3 * mt * mt * t ) ).plus( this.control2.times( 3 * mt * t * t ) ).plus( this.end.times( t * t * t ) );
    },
    
    // derivative: -3 p0 (1 - t)^2 + 3 p1 (1 - t)^2 - 6 p1 (1 - t) t + 6 p2 (1 - t) t - 3 p2 t^2 + 3 p3 t^2
    tangentAt: function( t ) {
      var mt = 1 - t;
      return this.start.times( -3 * mt * mt ).plus( this.control1.times( 3 * mt * mt - 6 * mt * t ) ).plus( this.control2.times( 6 * mt * t - 3 * t * t ) ).plus( this.end.times( 3 * t * t ) );
    },
    
    curvatureAt: function( t ) {
      // see http://cagd.cs.byu.edu/~557/text/ch2.pdf p31
      // TODO: remove code duplication with Quadratic
      var epsilon = 0.0000001;
      if ( Math.abs( t - 0.5 ) > 0.5 - epsilon ) {
        var isZero = t < 0.5;
        var p0 = isZero ? this.start : this.end;
        var p1 = isZero ? this.control1 : this.control2;
        var p2 = isZero ? this.control2 : this.control1;
        var d10 = p1.minus( p0 );
        var a = d10.magnitude();
        var h = ( isZero ? -1 : 1 ) * d10.perpendicular().normalized().dot( p2.minus( p1 ) );
        return ( h * ( this.degree - 1 ) ) / ( this.degree * a * a );
      } else {
        return this.subdivided( t, true )[0].curvatureAt( 1 );
      }
    },
    
    toRS: function( point ) {
      var firstVector = point.minus( this.start );
      return new Vector2( firstVector.dot( this.r ), firstVector.dot( this.s ) );
    },
    
    subdivided: function( t, skipComputations ) {
      // de Casteljau method
      // TODO: add a 'bisect' or 'between' method for vectors?
      var left = this.start.blend( this.control1, t );
      var right = this.control2.blend( this.end, t );
      var middle = this.control1.blend( this.control2, t );
      var leftMid = left.blend( middle, t );
      var rightMid = middle.blend( right, t );
      var mid = leftMid.blend( rightMid, t );
      return [
        new Segment.Cubic( this.start, left, leftMid, mid, skipComputations ),
        new Segment.Cubic( mid, rightMid, right, this.end, skipComputations )
      ];
    },
    
    offsetTo: function( r, reverse ) {
      // TODO: implement more accurate method at http://www.antigrain.com/research/adaptive_bezier/index.html
      // TODO: or more recently (and relevantly): http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf
      
      // how many segments to create (possibly make this more adaptive?)
      var quantity = 32;
      
      var result = [];
      for ( var i = 1; i < quantity; i++ ) {
        var t = i / ( quantity - 1 );
        if ( reverse ) {
          t = 1 - t;
        }
        
        var point = this.positionAt( t ).plus( this.tangentAt( t ).perpendicular().normalized().times( r ) );
        result.push( new Piece.LineTo( point ) );
      }
      
      return result;
    },
    
    toPieces: function() {
      return [ new Piece.CubicCurveTo( this.control1, this.control2, this.end ) ];
    },
    
    getSVGPathFragment: function() {
      return 'C ' + this.control1.x + ' ' + this.control1.y + ' ' + this.control2.x + ' ' + this.control2.y + ' ' + this.end.x + ' ' + this.end.y;
    },
    
    strokeLeft: function( lineWidth ) {
      return this.offsetTo( -lineWidth / 2, false );
    },
    
    strokeRight: function( lineWidth ) {
      return this.offsetTo( lineWidth / 2, true );
    },
    
    intersectsBounds: function( bounds ) {
      throw new Error( 'Segment.Cubic.intersectsBounds unimplemented' ); // TODO: implement
    },
    
    // returns the resultant winding number of this ray intersecting this segment.
    intersection: function( ray ) {
      var self = this;
      var result = [];
      
      // find the rotation that will put our ray in the direction of the x-axis so we can only solve for y=0 for intersections
      var inverseMatrix = Matrix3.rotation2( -ray.dir.angle() ).timesMatrix( Matrix3.translation( -ray.pos.x, -ray.pos.y ) );
      
      var p0 = inverseMatrix.timesVector2( this.start );
      var p1 = inverseMatrix.timesVector2( this.control1 );
      var p2 = inverseMatrix.timesVector2( this.control2 );
      var p3 = inverseMatrix.timesVector2( this.end );
      
      // polynomial form of cubic: start + (3 control1 - 3 start) t + (-6 control1 + 3 control2 + 3 start) t^2 + (3 control1 - 3 control2 + end - start) t^3
      var a = -p0.y + 3 * p1.y - 3 * p2.y + p3.y;
      var b = 3 * p0.y - 6 * p1.y + 3 * p2.y;
      var c = -3 * p0.y + 3 * p1.y;
      var d = p0.y;
      
      var ts = solveCubicRootsReal( a, b, c, d );
      
      _.each( ts, function( t ) {
        if ( t >= 0 && t <= 1 ) {
          var hitPoint = self.positionAt( t );
          var unitTangent = self.tangentAt( t ).normalized();
          var perp = unitTangent.perpendicular();
          var toHit = hitPoint.minus( ray.pos );
          
          // make sure it's not behind the ray
          if ( toHit.dot( ray.dir ) > 0 ) {
            result.push( {
              distance: toHit.magnitude(),
              point: hitPoint,
              normal: perp.dot( ray.dir ) > 0 ? perp.negated() : perp,
              wind: ray.dir.perpendicular().dot( unitTangent ) < 0 ? 1 : -1
            } );
          }
        }
      } );
      return result;
    },
    
    windingIntersection: function( ray ) {
      var wind = 0;
      var hits = this.intersection( ray );
      _.each( hits, function( hit ) {
        wind += hit.wind;
      } );
      return wind;
    }
    
    // returns the resultant winding number of this ray intersecting this segment.
    // windingIntersection: function( ray ) {
    //   // find the rotation that will put our ray in the direction of the x-axis so we can only solve for y=0 for intersections
    //   var inverseMatrix = Matrix3.rotation2( -ray.dir.angle() );
    //   assert && assert( inverseMatrix.timesVector2( ray.dir ).x > 0.99 ); // verify that we transform the unit vector to the x-unit
      
    //   var y0 = inverseMatrix.timesVector2( this.start ).y;
    //   var y1 = inverseMatrix.timesVector2( this.control1 ).y;
    //   var y2 = inverseMatrix.timesVector2( this.control2 ).y;
    //   var y3 = inverseMatrix.timesVector2( this.end ).y;
      
    //   // polynomial form of cubic: start + (3 control1 - 3 start) t + (-6 control1 + 3 control2 + 3 start) t^2 + (3 control1 - 3 control2 + end - start) t^3
    //   var a = -y0 + 3 * y1 - 3 * y2 + y3;
    //   var b = 3 * y0 - 6 * y1 + 3 * y2;
    //   var c = -3 * y0 + 3 * y1;
    //   var d = y0;
      
    //   // solve cubic roots
    //   var ts = solveCubicRootsReal( a, b, c, d );
      
    //   var result = 0;
      
    //   // for each hit
    //   _.each( ts, function( t ) {
    //     if ( t >= 0 && t <= 1 ) {
    //       result += ray.dir.perpendicular().dot( this.tangentAt( t ) ) < 0 ? 1 : -1;
    //     }
    //   } );
      
    //   return result;
    // }
  };
  
  return Segment.Cubic;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Draws a cubic bezier curve
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/pieces/CubicCurveTo',['require','ASSERT/assert','KITE/kite','KITE/pieces/Piece','KITE/segments/Cubic'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );
  
  var kite = require( 'KITE/kite' );
  
  var Piece = require( 'KITE/pieces/Piece' );
  require( 'KITE/segments/Cubic' );
  
  Piece.CubicCurveTo = function( control1, control2, point ) {
    this.control1 = control1;
    this.control2 = control2;
    this.point = point;
  };
  Piece.CubicCurveTo.prototype = {
    constructor: Piece.CubicCurveTo,
    
    writeToContext: function( context ) {
      context.bezierCurveTo( this.control1.x, this.control1.y, this.control2.x, this.control2.y, this.point.x, this.point.y );
    },
    
    transformed: function( matrix ) {
      return [new Piece.CubicCurveTo( matrix.timesVector2( this.control1 ), matrix.timesVector2( this.control2 ), matrix.timesVector2( this.point ) )];
    },
    
    applyPiece: function( shape ) {
      // see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-quadraticcurveto
      shape.ensure( this.controlPoint );
      var start = shape.getLastSubpath().getLastPoint();
      var cubic = new kite.Segment.Cubic( start, this.control1, this.control2, this.point );
      
      // if there is a cusp, we add the two (split) quadratic segments instead so that stroking treats the 'join' between them with the proper lineJoin
      if ( cubic.hasCusp() ) {
        shape.getLastSubpath().addSegment( cubic.startQuadratic );
        shape.getLastSubpath().addSegment( cubic.endQuadratic );
      } else {
        shape.getLastSubpath().addSegment( cubic );
      }
      shape.getLastSubpath().addPoint( this.point );
      if ( !cubic.invalid ) {
        shape.bounds = shape.bounds.union( cubic.bounds );
      }
    }
  };
  
  return Piece.CubicCurveTo;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Creates a line from the previous point
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/pieces/LineTo',['require','ASSERT/assert','KITE/kite','KITE/pieces/Piece','KITE/segments/Line'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );
  
  var kite = require( 'KITE/kite' );
  
  var Piece = require( 'KITE/pieces/Piece' );
  require( 'KITE/segments/Line' );
  
  Piece.LineTo = function( point ) {
    this.point = point;
  };
  Piece.LineTo.prototype = {
    constructor: Piece.LineTo,
    
    writeToContext: function( context ) {
      context.lineTo( this.point.x, this.point.y );
    },
    
    transformed: function( matrix ) {
      return [new Piece.LineTo( matrix.timesVector2( this.point ) )];
    },
    
    applyPiece: function( shape ) {
      // see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-lineto
      if ( shape.hasSubpaths() ) {
        var start = shape.getLastSubpath().getLastPoint();
        var end = this.point;
        var line = new kite.Segment.Line( start, end );
        shape.getLastSubpath().addSegment( line );
        shape.getLastSubpath().addPoint( end );
        shape.bounds = shape.bounds.withPoint( start ).withPoint( end );
        assert && assert( !isNaN( shape.bounds.getX() ) );
      } else {
        shape.ensure( this.point );
      }
    }
  };
  
  return Piece.LineTo;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Creates a new subpath starting at the specified point
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/pieces/MoveTo',['require','ASSERT/assert','KITE/kite','KITE/pieces/Piece','KITE/util/Subpath'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );
  
  var kite = require( 'KITE/kite' );
  
  var Piece = require( 'KITE/pieces/Piece' );
  require( 'KITE/util/Subpath' );
  
  Piece.MoveTo = function( point ) {
    this.point = point;
  };
  Piece.MoveTo.prototype = {
    constructor: Piece.MoveTo,
    
    writeToContext: function( context ) {
      context.moveTo( this.point.x, this.point.y );
    },
    
    transformed: function( matrix ) {
      return [new Piece.MoveTo( matrix.timesVector2( this.point ) )];
    },
    
    applyPiece: function( shape ) {
      var subpath = new kite.Subpath();
      subpath.addPoint( this.point );
      shape.addSubpath( subpath );
    }
  };
  
  return Piece.MoveTo;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Draws a quadratic bezier curve
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/pieces/QuadraticCurveTo',['require','ASSERT/assert','KITE/kite','KITE/pieces/Piece','KITE/segments/Quadratic'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );
  
  var kite = require( 'KITE/kite' );
  
  var Piece = require( 'KITE/pieces/Piece' );
  require( 'KITE/segments/Quadratic' );
  
  Piece.QuadraticCurveTo = function( controlPoint, point ) {
    this.controlPoint = controlPoint;
    this.point = point;
  };
  Piece.QuadraticCurveTo.prototype = {
    constructor: Piece.QuadraticCurveTo,
    
    writeToContext: function( context ) {
      context.quadraticCurveTo( this.controlPoint.x, this.controlPoint.y, this.point.x, this.point.y );
    },
    
    transformed: function( matrix ) {
      return [new Piece.QuadraticCurveTo( matrix.timesVector2( this.controlPoint ), matrix.timesVector2( this.point ) )];
    },
    
    applyPiece: function( shape ) {
      // see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-quadraticcurveto
      shape.ensure( this.controlPoint );
      var start = shape.getLastSubpath().getLastPoint();
      var quadratic = new kite.Segment.Quadratic( start, this.controlPoint, this.point );
      shape.getLastSubpath().addSegment( quadratic );
      shape.getLastSubpath().addPoint( this.point );
      if ( !quadratic.invalid ) {
        shape.bounds = shape.bounds.union( quadratic.bounds );
      }
    }
  };
  
  return Piece.QuadraticCurveTo;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Draws a rectangle.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/pieces/Rect',['require','ASSERT/assert','KITE/kite','DOT/Vector2','KITE/pieces/Piece','KITE/pieces/MoveTo','KITE/pieces/Close','KITE/util/Subpath','KITE/segments/Line'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );
  
  var kite = require( 'KITE/kite' );
  
  var Vector2 = require( 'DOT/Vector2' );
  
  var Piece = require( 'KITE/pieces/Piece' );
  require( 'KITE/pieces/MoveTo' );
  require( 'KITE/pieces/Close' );
  require( 'KITE/util/Subpath' );
  require( 'KITE/segments/Line' );
  
  // for brevity
  function p( x,y ) { return new Vector2( x, y ); }
  
  Piece.Rect = function( x, y, width, height ) {
    assert && assert( x !== undefined && y !== undefined && width !== undefined && height !== undefined, 'Undefined argument for Piece.Rect' );
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  };
  Piece.Rect.prototype = {
    constructor: Piece.Rect,
    
    writeToContext: function( context ) {
      context.rect( this.x, this.y, this.width, this.height );
    },
    
    transformed: function( matrix ) {
      var a = matrix.timesVector2( p( this.x, this.y ) );
      var b = matrix.timesVector2( p( this.x + this.width, this.y ) );
      var c = matrix.timesVector2( p( this.x + this.width, this.y + this.height ) );
      var d = matrix.timesVector2( p( this.x, this.y + this.height ) );
      return [new Piece.MoveTo( a ), new Piece.LineTo( b ), new Piece.LineTo( c ), new Piece.LineTo( d ), new Piece.Close(), new Piece.MoveTo( a )];
    },
    
    applyPiece: function( shape ) {
      var subpath = new kite.Subpath();
      shape.addSubpath( subpath );
      subpath.addPoint( p( this.x, this.y ) );
      subpath.addPoint( p( this.x + this.width, this.y ) );
      subpath.addPoint( p( this.x + this.width, this.y + this.height ) );
      subpath.addPoint( p( this.x, this.y + this.height ) );
      subpath.addSegment( new kite.Segment.Line( subpath.points[0], subpath.points[1] ) );
      subpath.addSegment( new kite.Segment.Line( subpath.points[1], subpath.points[2] ) );
      subpath.addSegment( new kite.Segment.Line( subpath.points[2], subpath.points[3] ) );
      subpath.close();
      shape.addSubpath( new kite.Subpath() );
      shape.getLastSubpath().addPoint( p( this.x, this.y ) );
      shape.bounds = shape.bounds.withCoordinates( this.x, this.y ).withCoordinates( this.x + this.width, this.y + this.height );
      assert && assert( !isNaN( shape.bounds.getX() ) );
    }
  };
  
  return Piece.Rect;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Shape handling
 *
 * Shapes are internally made up of pieces (generally individual Canvas calls),
 * which for simplicity of stroking and hit testing are then broken up into
 * individual segments stored in subpaths. Familiarity with how Canvas handles
 * subpaths is helpful for understanding this code.
 *
 * Canvas spec: http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html
 * SVG spec: http://www.w3.org/TR/SVG/expanded-toc.html
 *           http://www.w3.org/TR/SVG/paths.html#PathData (for paths)
 * Notes for elliptical arcs: http://www.w3.org/TR/SVG/implnote.html#PathElementImplementationNotes
 * Notes for painting strokes: https://svgwg.org/svg2-draft/painting.html
 *
 * TODO: add nonzero / evenodd support when browsers support it
 * TODO: docs
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('KITE/Shape',['require','ASSERT/assert','ASSERT/assert','KITE/kite','DOT/Vector2','DOT/Bounds2','DOT/Ray2','DOT/Matrix3','DOT/Transform3','DOT/Util','DOT/Util','KITE/util/Subpath','KITE/pieces/Piece','KITE/util/LineStyles','KITE/pieces/Arc','KITE/pieces/Close','KITE/pieces/CubicCurveTo','KITE/pieces/EllipticalArc','KITE/pieces/LineTo','KITE/pieces/MoveTo','KITE/pieces/QuadraticCurveTo','KITE/pieces/Rect','KITE/segments/Line'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'kite' );
  var assertExtra = require( 'ASSERT/assert' )( 'kite.extra', true );
  
  var kite = require( 'KITE/kite' );
  
  var Vector2 = require( 'DOT/Vector2' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Ray2 = require( 'DOT/Ray2' );
  var Matrix3 = require( 'DOT/Matrix3' );
  var Transform3 = require( 'DOT/Transform3' );
  var toDegrees = require( 'DOT/Util' ).toDegrees;
  var lineLineIntersection = require( 'DOT/Util' ).lineLineIntersection;
  
  var Subpath = require( 'KITE/util/Subpath' );
  var Piece = require( 'KITE/pieces/Piece' );
  require( 'KITE/util/LineStyles' );
  require( 'KITE/pieces/Arc' );
  require( 'KITE/pieces/Close' );
  require( 'KITE/pieces/CubicCurveTo' );
  require( 'KITE/pieces/EllipticalArc' );
  require( 'KITE/pieces/LineTo' );
  require( 'KITE/pieces/MoveTo' );
  require( 'KITE/pieces/QuadraticCurveTo' );
  require( 'KITE/pieces/Rect' );
  require( 'KITE/segments/Line' );
  
  // for brevity
  function p( x,y ) { return new Vector2( x, y ); }
  
  // a normalized vector for non-zero winding checks
  // var weirdDir = p( Math.PI, 22 / 7 );
  
  kite.Shape = function( pieces, optionalClose ) {
    // higher-level Canvas-esque drawing commands
    this.pieces = [];
    
    // lower-level piecewise mathematical description using segments
    this.subpaths = [];
    
    // computed bounds for all pieces added so far
    this.bounds = Bounds2.NOTHING;
    
    // cached stroked shape (so hit testing can be done quickly on stroked shapes)
    this._strokedShape = null;
    this._strokedShapeComputed = false;
    this._strokedShapeStyles = null;
    
    var that = this;
    // initialize with pieces passed in
    if ( pieces !== undefined ) {
      _.each( pieces, function( piece ) {
        that.addPiece( piece );
      } );
    }
    if ( optionalClose ) {
      this.addPiece( new Piece.Close() );
    }
  };
  var Shape = kite.Shape;
  
  Shape.prototype = {
    constructor: Shape,
    
    moveTo: function( x, y ) {
      // moveTo( point )
      if ( y === undefined && typeof x === 'object' ) {
        // wrap it in a Vector2 if the class doesn't match
        var point = x instanceof Vector2 ? x : new Vector2( x.x, x.y );
        this.addPiece( new Piece.MoveTo( point ) );
      } else { // moveTo( x, y )
        this.addPiece( new Piece.MoveTo( p( x, y ) ) );
      }
      return this;
    },
    
    lineTo: function( x, y ) {
      // lineTo( point )
      if ( y === undefined && typeof x === 'object' ) {
        // wrap it in a Vector2 if the class doesn't match
        var point = x instanceof Vector2 ? x : new Vector2( x.x, x.y );
        this.addPiece( new Piece.LineTo( point ) );
      } else { // lineTo( x, y )
        this.addPiece( new Piece.LineTo( p( x, y ) ) );
      }
      return this;
    },
    
    quadraticCurveTo: function( cpx, cpy, x, y ) {
      // quadraticCurveTo( control, point )
      if ( x === undefined && typeof cpx === 'object' ) {
        // wrap it in a Vector2 if the class doesn't match
        var controlPoint = cpx instanceof Vector2 ? cpx : new Vector2( cpx.x, cpx.y );
        var point = cpy instanceof Vector2 ? cpy : new Vector2( cpy.x, cpy.y );
        this.addPiece( new Piece.QuadraticCurveTo( controlPoint, point ) );
      } else { // quadraticCurveTo( cpx, cpy, x, y )
        this.addPiece( new Piece.QuadraticCurveTo( p( cpx, cpy ), p( x, y ) ) );
      }
      return this;
    },
    
    cubicCurveTo: function( cp1x, cp1y, cp2x, cp2y, x, y ) {
      // cubicCurveTo( cp1, cp2, end )
      if ( cp2y === undefined && typeof cp1x === 'object' ) {
        // wrap it in a Vector2 if the class doesn't match
        var control1 = cp1x instanceof Vector2 ? cp1x : new Vector2( cp1x.x, cp1x.y );
        var control2 = cp1y instanceof Vector2 ? cp1y : new Vector2( cp1y.x, cp1y.y );
        var end = cp2x instanceof Vector2 ? cp2x : new Vector2( cp2x.x, cp2x.y );
        this.addPiece( new Piece.CubicCurveTo( control1, control2, end ) );
      } else { // cubicCurveTo( cp1x, cp1y, cp2x, cp2y, x, y )
        this.addPiece( new Piece.CubicCurveTo( p( cp1x, cp1y ), p( cp2x, cp2y ), p( x, y ) ) );
      }
      return this;
    },
    
    /*
     * Draws a circle using the arc() call with the following parameters:
     * circle( center, radius ) // center is a Vector2
     * circle( centerX, centerY, radius )
     */
    circle: function( centerX, centerY, radius ) {
      if ( typeof centerX === 'object' ) {
        // circle( center, radius )
        var center = centerX;
        radius = centerY;
        return this.arc( center, radius, 0, Math.PI * 2, false );
      } else {
        // circle( centerX, centerY, radius )
        return this.arc( p( centerX, centerY ), radius, 0, Math.PI * 2, false );
      }
    },
    
    /*
     * Draws an ellipse using the ellipticalArc() call with the following parameters:
     * ellipse( center, radiusX, radiusY, rotation ) // center is a Vector2
     * ellipse( centerX, centerY, radiusX, radiusY, rotation )
     */
    ellipse: function( centerX, centerY, radiusX, radiusY, rotation ) {
      // TODO: Ellipse/EllipticalArc has a mess of parameters. Consider parameter object, or double-check parameter handling
      if ( typeof centerX === 'object' ) {
        // ellipse( center, radiusX, radiusY, rotation )
        var center = centerX;
        rotation = radiusY;
        radiusY = radiusX;
        radiusX = centerY;
        return this.ellipticalArc( center, radiusX, radiusY, rotation || 0, 0, Math.PI * 2, false );
      } else {
        // ellipse( centerX, centerY, radiusX, radiusY, rotation )
        return this.ellipticalArc( p( centerX, centerY ), radiusX, radiusY, rotation || 0, 0, Math.PI * 2, false );
      }
    },
    
    /*
     * Draws an arc using the Canvas 2D semantics, with the following parameters:
     * arc( center, radius, startAngle, endAngle, anticlockwise )
     * arc( centerX, centerY, radius, startAngle, endAngle, anticlockwise )
     */
    arc: function( centerX, centerY, radius, startAngle, endAngle, anticlockwise ) {
      if ( typeof centerX === 'object' ) {
        // arc( center, radius, startAngle, endAngle, anticlockwise )
        anticlockwise = endAngle;
        endAngle = startAngle;
        startAngle = radius;
        radius = centerY;
        var center = centerX;
        this.addPiece( new Piece.Arc( center, radius, startAngle, endAngle, anticlockwise ) );
      } else {
        // arc( centerX, centerY, radius, startAngle, endAngle, anticlockwise )
        this.addPiece( new Piece.Arc( p( centerX, centerY ), radius, startAngle, endAngle, anticlockwise ) );
      }
      return this;
    },
    
    /*
     * Draws an elliptical arc using the Canvas 2D semantics, with the following parameters:
     * ellipticalArc( center, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise )
     * ellipticalArc( centerX, centerY, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise )
     */
    ellipticalArc: function( centerX, centerY, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise ) {
      // TODO: Ellipse/EllipticalArc has a mess of parameters. Consider parameter object, or double-check parameter handling
      if ( typeof centerX === 'object' ) {
        // ellipticalArc( center, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise )
        anticlockwise = endAngle;
        endAngle = startAngle;
        startAngle = rotation;
        rotation = radiusY;
        radiusY = radiusX;
        radiusX = centerY;
        var center = centerX;
        this.addPiece( new Piece.EllipticalArc( center, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise ) );
      } else {
        // ellipticalArc( centerX, centerY, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise )
        this.addPiece( new Piece.EllipticalArc( p( centerX, centerY ), radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise ) );
      }
      return this;
    },
    
    rect: function( x, y, width, height ) {
      this.addPiece( new Piece.Rect( x, y, width, height ) );
      return this;
    },

    //Create a round rectangle. All arguments are number.
    //Rounding is currently using quadraticCurveTo.  Please note, future versions may use arcTo
    //TODO: rewrite with arcTo?
    roundRect: function( x, y, width, height, arcw, arch ) {
      this.moveTo( x + arcw, y ).
          lineTo( x + width - arcw, y ).
          quadraticCurveTo( x + width, y, x + width, y + arch ).
          lineTo( x + width, y + height - arch ).
          quadraticCurveTo( x + width, y + height, x + width - arcw, y + height ).
          lineTo( x + arcw, y + height ).
          quadraticCurveTo( x, y + height, x, y + height - arch ).
          lineTo( x, y + arch ).
          quadraticCurveTo( x, y, x + arcw, y );
      return this;
    },
    
    close: function() {
      this.addPiece( new Piece.Close() );
      return this;
    },
    
    addPiece: function( piece ) {
      this.pieces.push( piece );
      piece.applyPiece( this );
      this.invalidate();
      assert && assert( this.bounds.isEmpty() || this.bounds.isFinite(), 'shape bounds infinite after adding piece: ' + piece );
      return this; // allow for chaining
    },
    
    // write out this shape's path to a canvas 2d context. does NOT include the beginPath()!
    writeToContext: function( context ) {
      _.each( this.pieces, function( piece ) {
        piece.writeToContext( context );
      } );
    },
    
    // returns something like "M150 0 L75 200 L225 200 Z" for a triangle
    getSVGPath: function() {
      var subpathStrings = [];
      _.each( this.subpaths, function( subpath ) {
        if( subpath.isDrawable() ) {
          // since the commands after this are relative to the previous 'point', we need to specify a move to the initial point
          var startPoint = subpath.getFirstSegment().start;
          assert && assert( startPoint.equals( subpath.getFirstPoint(), 0.00001 ) ); // sanity check
          var string = 'M ' + startPoint.x + ' ' + startPoint.y + ' ';
          
          string += _.map( subpath.segments, function( segment ) { return segment.getSVGPathFragment(); } ).join( ' ' );
          
          if ( subpath.isClosed() ) {
            string += ' Z';
          }
          subpathStrings.push( string );
        }
      } );
      return subpathStrings.join( ' ' );
    },
    
    // return a new Shape that is transformed by the associated matrix
    transformed: function( matrix ) {
      return new Shape( _.flatten( _.map( this.pieces, function( piece ) { return piece.transformed( matrix ); } ), true ) );
    },
    
    // returns the bounds. if lineStyles exists, include the stroke in the bounds
    // TODO: consider renaming to getBounds()?
    computeBounds: function( lineStyles ) {
      if ( lineStyles ) {
        return this.bounds.union( this.getStrokedShape( lineStyles ).bounds );
      } else {
        return this.bounds;
      }
    },
    
    containsPoint: function( point ) {
      // we pick a ray, and determine the winding number over that ray. if the number of segments crossing it CCW == number of segments crossing it CW, then the point is contained in the shape
      var ray = new Ray2( point, p( 1, 0 ) );
      
      return this.windingIntersection( ray ) !== 0;
    },
    
    intersection: function( ray ) {
      var hits = [];
      _.each( this.subpaths, function( subpath ) {
        if ( subpath.isDrawable() ) {
          _.each( subpath.segments, function( segment ) {
            _.each( segment.intersection( ray ), function( hit ) {
              hits.push( hit );
            } );
          } );
          
          if ( subpath.hasClosingSegment() ) {
            _.each( subpath.getClosingSegment().intersection( ray ), function( hit ) {
              hits.push( hit );
            } );
          }
        }
      } );
      return _.sortBy( hits, function( hit ) { return hit.distance; } );
    },
    
    windingIntersection: function( ray ) {
      var wind = 0;
      
      _.each( this.subpaths, function( subpath ) {
        if ( subpath.isDrawable() ) {
          _.each( subpath.segments, function( segment ) {
            wind += segment.windingIntersection( ray );
          } );
          
          // handle the implicit closing line segment
          if ( subpath.hasClosingSegment() ) {
            wind += subpath.getClosingSegment().windingIntersection( ray );
          }
        }
      } );
      
      return wind;
    },
    
    intersectsBounds: function( bounds ) {
      var intersects = false;
      // TODO: break-out-early optimizations
      _.each( this.subpaths, function( subpath ) {
        if ( subpath.isDrawable() ) {
          _.each( subpath.segments, function( segment ) {
            intersects = intersects && segment.intersectsBounds( bounds );
          } );
          
          // handle the implicit closing line segment
          if ( subpath.hasClosingSegment() ) {
            intersects = intersects && subpath.getClosingSegment().intersectsBounds( bounds );
          }
        }
      } );
      return intersects;
    },
    
    invalidate: function() {
      this._strokedShapeComputed = false;
    },
    
    // returns a new Shape that is an outline of the stroked path of this current Shape. currently not intended to be nested (doesn't do intersection computations yet)
    getStrokedShape: function( lineStyles ) {
      
      if ( lineStyles === undefined ) {
        lineStyles = new kite.LineStyles();
      }
      
      // return a cached version if possible
      if ( this._strokedShapeComputed && this._strokedShapeStyles.equals( lineStyles ) ) {
        return this._strokedShape;
      }
      
      // filter out subpaths where nothing would be drawn
      var subpaths = _.filter( this.subpaths, function( subpath ) { return subpath.isDrawable(); } );
      
      var shape = new Shape();
      
      var lineWidth = lineStyles.lineWidth;
      
      // joins two segments together on the logical "left" side, at 'center' (where they meet), and normalized tangent vectors in the direction of the stroking
      // to join on the "right" side, switch the tangent order and negate them
      function join( center, fromTangent, toTangent ) {
        // where our join path starts and ends
        var fromPoint = center.plus( fromTangent.perpendicular().negated().times( lineWidth / 2 ) );
        var toPoint = center.plus( toTangent.perpendicular().negated().times( lineWidth / 2 ) );
        
        // only insert a join on the non-acute-angle side
        if ( fromTangent.perpendicular().dot( toTangent ) > 0 ) {
          switch( lineStyles.lineJoin ) {
            case 'round':
              var fromAngle = fromTangent.angle() + Math.PI / 2;
              var toAngle = toTangent.angle() + Math.PI / 2;
              shape.addPiece( new Piece.Arc( center, lineWidth / 2, fromAngle, toAngle, true ) );
              break;
            case 'miter':
              var theta = fromTangent.angleBetween( toTangent.negated() );
              var notStraight = theta < Math.PI - 0.00001; // if fromTangent is approximately equal to toTangent, just bevel. it will be indistinguishable
              if ( 1 / Math.sin( theta / 2 ) <= lineStyles.miterLimit && theta < Math.PI - 0.00001 ) {
                // draw the miter
                var miterPoint = lineLineIntersection( fromPoint, fromPoint.plus( fromTangent ), toPoint, toPoint.plus( toTangent ) );
                shape.addPiece( new Piece.LineTo( miterPoint ) );
                shape.addPiece( new Piece.LineTo( toPoint ) );
              } else {
                // angle too steep, use bevel instead. same as below, but copied for linter
                shape.addPiece( new Piece.LineTo( toPoint ) );
              }
              break;
            case 'bevel':
              shape.addPiece( new Piece.LineTo( toPoint ) );
              break;
          }
        } else {
          // no join necessary here since we have the acute angle. just simple lineTo for now so that the next segment starts from the right place
          // TODO: can we prevent self-intersection here?
          if ( !fromPoint.equals( toPoint ) ) {
            shape.addPiece( new Piece.LineTo( toPoint ) );
          }
        }
      }
      
      // draws the necessary line cap from the endpoint 'center' in the direction of the tangent
      function cap( center, tangent ) {
        switch( lineStyles.lineCap ) {
          case 'butt':
            shape.addPiece( new Piece.LineTo( center.plus( tangent.perpendicular().times( lineWidth / 2 ) ) ) );
            break;
          case 'round':
            var tangentAngle = tangent.angle();
            shape.addPiece( new Piece.Arc( center, lineWidth / 2, tangentAngle + Math.PI / 2, tangentAngle - Math.PI / 2, true ) );
            break;
          case 'square':
            var toLeft = tangent.perpendicular().negated().times( lineWidth / 2 );
            var toRight = tangent.perpendicular().times( lineWidth / 2 );
            var toFront = tangent.times( lineWidth / 2 );
            shape.addPiece( new Piece.LineTo( center.plus( toLeft ).plus( toFront ) ) );
            shape.addPiece( new Piece.LineTo( center.plus( toRight ).plus( toFront ) ) );
            shape.addPiece( new Piece.LineTo( center.plus( toRight ) ) );
            break;
        }
      }
      
      _.each( subpaths, function( subpath ) {
        var i;
        var segments = subpath.segments;
        
        // TODO: shortcuts for _.first( segments ) and _.last( segments ),
        
        // we don't need to insert an implicit closing segment if the start and end points are the same
        var alreadyClosed = _.last( segments ).end.equals( _.first( segments ).start );
        // if there is an implicit closing segment
        var closingSegment = alreadyClosed ? null : new kite.Segment.Line( segments[segments.length-1].end, segments[0].start );
        
        // move to the first point in our stroked path
        shape.addPiece( new Piece.MoveTo( segmentStartLeft( _.first( segments ), lineWidth ) ) );
        
        // stroke the logical "left" side of our path
        for ( i = 0; i < segments.length; i++ ) {
          if ( i > 0 ) {
            join( segments[i].start, segments[i-1].endTangent, segments[i].startTangent, true );
          }
          _.each( segments[i].strokeLeft( lineWidth ), function( piece ) {
            shape.addPiece( piece );
          } );
        }
        
        // handle the "endpoint"
        if ( subpath.closed ) {
          if ( alreadyClosed ) {
            join( _.last( segments ).end, _.last( segments ).endTangent, _.first( segments ).startTangent );
            shape.addPiece( new Piece.Close() );
            shape.addPiece( new Piece.MoveTo( segmentStartRight( _.first( segments ), lineWidth ) ) );
            join( _.last( segments ).end, _.first( segments ).startTangent.negated(), _.last( segments ).endTangent.negated() );
          } else {
            // logical "left" stroke on the implicit closing segment
            join( closingSegment.start, _.last( segments ).endTangent, closingSegment.startTangent );
            _.each( closingSegment.strokeLeft( lineWidth ), function( piece ) {
              shape.addPiece( piece );
            } );
            
            // TODO: similar here to other block of if.
            join( closingSegment.end, closingSegment.endTangent, _.first( segments ).startTangent );
            shape.addPiece( new Piece.Close() );
            shape.addPiece( new Piece.MoveTo( segmentStartRight( _.first( segments ), lineWidth ) ) );
            join( closingSegment.end, _.first( segments ).startTangent.negated(), closingSegment.endTangent.negated() );
            
            // logical "right" stroke on the implicit closing segment
            _.each( closingSegment.strokeRight( lineWidth ), function( piece ) {
              shape.addPiece( piece );
            } );
            join( closingSegment.start, closingSegment.startTangent.negated(), _.last( segments ).endTangent.negated() );
          }
        } else {
          cap( _.last( segments ).end, _.last( segments ).endTangent );
        }
        
        // stroke the logical "right" side of our path
        for ( i = segments.length - 1; i >= 0; i-- ) {
          if ( i < segments.length - 1 ) {
            join( segments[i].end, segments[i+1].startTangent.negated(), segments[i].endTangent.negated(), false );
          }
          _.each( segments[i].strokeRight( lineWidth ), function( piece ) {
            shape.addPiece( piece );
          } );
        }
        
        // handle the start point
        if ( subpath.closed ) {
          // we already did the joins, just close the 'right' side
          shape.addPiece( new Piece.Close() );
        } else {
          cap( _.first( segments ).start, _.first( segments ).startTangent.negated() );
          shape.addPiece( new Piece.Close() );
        }
      } );
      
      this._strokedShape = shape;
      this._strokedShapeComputed = true;
      this._strokedShapeStyles = new kite.LineStyles( lineStyles ); // shallow copy, since we consider linestyles to be mutable
      
      return shape;
    },
    
    /*---------------------------------------------------------------------------*
    * Internal subpath computations
    *----------------------------------------------------------------------------*/
    
    ensure: function( point ) {
      if ( !this.hasSubpaths() ) {
        this.addSubpath( new Subpath() );
        this.getLastSubpath().addPoint( point );
      }
    },
    
    addSubpath: function( subpath ) {
      this.subpaths.push( subpath );
    },
    
    hasSubpaths: function() {
      return this.subpaths.length > 0;
    },
    
    getLastSubpath: function() {
      return _.last( this.subpaths );
    }
  };
  
  /*---------------------------------------------------------------------------*
  * Shape shortcuts
  *----------------------------------------------------------------------------*/
  
  Shape.rectangle = function( x, y, width, height ) {
    return new Shape().rect( x, y, width, height );
  };
  Shape.rect = Shape.rectangle;

  //Create a round rectangle. All arguments are number.
  //Rounding is currently using quadraticCurveTo.  Please note, future versions may use arcTo
  //TODO: rewrite with arcTo?
  Shape.roundRect = function( x, y, width, height, arcw, arch ) {
    return new Shape().roundRect( x, y, width, height, arcw, arch );
  };
  Shape.roundRectangle = Shape.roundRect;
  
  Shape.bounds = function( bounds ) {
    return new Shape().rect( bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY );
  };

  //Create a line segment, using either (x1,y1,x2,y2) or ({x1,y1},{x2,y2}) arguments
  Shape.lineSegment = function( a, b, c, d ) {
    // TODO: add type assertions?
    if ( typeof a === 'number' ) {
      return new Shape().moveTo( a, b ).lineTo( c, d );
    }
    else {
      return new Shape().moveTo( a ).lineTo( b );
    }
  };
  
  Shape.regularPolygon = function( sides, radius ) {
    var first = true;
    return new Shape( _.map( _.range( sides ), function( k ) {
      var theta = 2 * Math.PI * k / sides;
      if ( first ) {
        first = false;
        // first segment should be a moveTo
        return new Piece.MoveTo( p( radius * Math.cos( theta ), radius * Math.sin( theta ) ) );
      } else {
        return new Piece.LineTo( p( radius * Math.cos( theta ), radius * Math.sin( theta ) ) );
      }
    } ), true );
  };
  
  // supports both circle( centerX, centerY, radius ), circle( center, radius ), and circle( radius ) with the center default to 0,0
  Shape.circle = function( centerX, centerY, radius ) {
    if ( centerY === undefined ) {
      // circle( radius ), center = 0,0
      return new Shape().circle( 0, 0, centerX );
    }
    return new Shape().circle( centerX, centerY, radius ).close();
  };
  
  /*
   * Supports ellipse( centerX, centerY, radiusX, radiusY ), ellipse( center, radiusX, radiusY ), and ellipse( radiusX, radiusY )
   * with the center default to 0,0 and rotation of 0
   */
  Shape.ellipse = function( centerX, centerY, radiusX, radiusY ) {
    // TODO: Ellipse/EllipticalArc has a mess of parameters. Consider parameter object, or double-check parameter handling
    if ( radiusX === undefined ) {
      // ellipse( radiusX, radiusY ), center = 0,0
      return new Shape().ellipse( 0, 0, centerX, centerY );
    }
    return new Shape().ellipse( centerX, centerY, radiusX, radiusY ).close();
  };
  
  // supports both arc( centerX, centerY, radius, startAngle, endAngle, anticlockwise ) and arc( center, radius, startAngle, endAngle, anticlockwise )
  Shape.arc = function( centerX, centerY, radius, startAngle, endAngle, anticlockwise ) {
    return new Shape().arc( centerX, centerY, radius, startAngle, endAngle, anticlockwise );
  };
  
  
  // TODO: performance / cleanliness to have these as methods instead?
  function segmentStartLeft( segment, lineWidth ) {
    assert && assert( lineWidth !== undefined );
    return segment.start.plus( segment.startTangent.perpendicular().negated().times( lineWidth / 2 ) );
  }
  
  function segmentEndLeft( segment, lineWidth ) {
    assert && assert( lineWidth !== undefined );
    return segment.end.plus( segment.endTangent.perpendicular().negated().times( lineWidth / 2 ) );
  }
  
  function segmentStartRight( segment, lineWidth ) {
    assert && assert( lineWidth !== undefined );
    return segment.start.plus( segment.startTangent.perpendicular().times( lineWidth / 2 ) );
  }
  
  function segmentEndRight( segment, lineWidth ) {
    assert && assert( lineWidth !== undefined );
    return segment.end.plus( segment.endTangent.perpendicular().times( lineWidth / 2 ) );
  }
  
  return Shape;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Module that includes all Kite dependencies, so that requiring this module will return an object
 * that consists of the entire exported 'kite' namespace API.
 *
 * The API is actually generated by the 'kite' module, so if this module (or all other modules) are
 * not included, the 'kite' namespace may not be complete.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('main', [
    'KITE/kite',
    
    'KITE/Shape',
    'KITE/pieces/Arc',
    'KITE/pieces/Close',
    'KITE/pieces/CubicCurveTo',
    'KITE/pieces/EllipticalArc',
    'KITE/pieces/LineTo',
    'KITE/pieces/MoveTo',
    'KITE/pieces/Piece',
    'KITE/pieces/QuadraticCurveTo',
    'KITE/pieces/Rect',
    'KITE/segments/Arc',
    'KITE/segments/Cubic',
    'KITE/segments/EllipticalArc',
    'KITE/segments/Line',
    'KITE/segments/Quadratic',
    'KITE/segments/Segment',
    'KITE/util/LineStyles',
    'KITE/util/Subpath'
  ], function(
    kite // note: we don't need any of the other parts, we just need to specify them as dependencies so they fill in the kite namespace
  ) {
  
  return kite;
} );

// Copyright 2002-2012, University of Colorado

/**
 * 2D convex hulls
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/ConvexHull2',['require','ASSERT/assert','DOT/dot'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'dot' );
  
  var dot = require( 'DOT/dot' );
  
  // counter-clockwise turn if > 0, clockwise turn if < 0, collinear if === 0.
  function ccw( p1, p2, p3 ) {
    return p2.minus( p1 ).crossScalar( p3.minus( p1 ) );
  }
  
  dot.ConvexHull2 = {
    // test: all collinear, multiple ways of having same angle, etc.
    
    // points is an array of Vector2 instances. see http://en.wikipedia.org/wiki/Graham_scan
    grahamScan: function( points, includeCollinear ) {
      if ( points.length <= 2 ) {
        return points;
      }
      
      // find the point 'p' with the lowest y value
      var minY = Number.POSITIVE_INFINITY;
      var p = null;
      _.each( points, function( point ) {
        if ( point.y <= minY ) {
          // if two points have the same y value, take the one with the lowest x
          if ( point.y === minY && p ) {
            if ( point.x < p.x ) {
              p = point;
            }
          } else {
            minY = point.y;
            p = point;
          }
        }
      } );
      
      // sorts the points by their angle. Between 0 and PI
      points = _.sortBy( points, function( point ) {
        return point.minus( p ).angle();
      } );
      
      // remove p from points (relies on the above statement making a defensive copy)
      points.splice( _.indexOf( points, p ), 1 );
      
      // our result array
      var result = [p];
      
      _.each( points, function( point ) {
        // ignore points equal to our starting point
        if ( p.x === point.x && p.y === point.y ) { return; }
        
        function isRightTurn() {
          if ( result.length < 2 ) {
            return false;
          }
          var cross = ccw( result[result.length-2], result[result.length-1], point );
          return includeCollinear ? ( cross < 0 ) : ( cross <= 0 );
        }
        
        while ( isRightTurn() ) {
          result.pop();
        }
        result.push( point );
      } );
      
      return result;
    }
  };
  
  return dot.ConvexHull2;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Basic width and height
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/Dimension2',['require','DOT/dot'], function( require ) {
  
  
  var dot = require( 'DOT/dot' );
  
  dot.Dimension2 = function( width, height ) {
    this.width = width;
    this.height = height;
  };
  var Dimension2 = dot.Dimension2;

  Dimension2.prototype = {
    constructor: Dimension2,

    toString: function() {
      return "[" + this.width + "w, " + this.height + "h]";
    },

    equals: function( other ) {
      return this.width === other.width && this.height === other.height;
    }
  };
  
  return Dimension2;
} );

// Copyright 2002-2012, University of Colorado

/**
 * LU decomposition, based on Jama
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/LUDecomposition',['require','DOT/dot'], function( require ) {
  
  
  var dot = require( 'DOT/dot' );
  
  var Float32Array = window.Float32Array || Array;
  
  // require( 'DOT/Matrix' ); // commented out so Require.js doesn't complain about the circular dependency

  dot.LUDecomposition = function( matrix ) {
    var i, j, k;

    this.matrix = matrix;

    // TODO: size!
    this.LU = matrix.getArrayCopy();
    var LU = this.LU;
    this.m = matrix.getRowDimension();
    var m = this.m;
    this.n = matrix.getColumnDimension();
    var n = this.n;
    this.piv = new Uint32Array( m );
    for ( i = 0; i < m; i++ ) {
      this.piv[i] = i;
    }
    this.pivsign = 1;
    var LUcolj = new Float32Array( m );

    // Outer loop.

    for ( j = 0; j < n; j++ ) {

      // Make a copy of the j-th column to localize references.
      for ( i = 0; i < m; i++ ) {
        LUcolj[i] = LU[matrix.index( i, j )];
      }

      // Apply previous transformations.

      for ( i = 0; i < m; i++ ) {
        // Most of the time is spent in the following dot product.
        var kmax = Math.min( i, j );
        var s = 0.0;
        for ( k = 0; k < kmax; k++ ) {
          var ik = matrix.index( i, k );
          s += LU[ik] * LUcolj[k];
        }

        LUcolj[i] -= s;
        LU[matrix.index( i, j )] = LUcolj[i];
      }

      // Find pivot and exchange if necessary.

      var p = j;
      for ( i = j + 1; i < m; i++ ) {
        if ( Math.abs( LUcolj[i] ) > Math.abs( LUcolj[p] ) ) {
          p = i;
        }
      }
      if ( p !== j ) {
        for ( k = 0; k < n; k++ ) {
          var pk = matrix.index( p, k );
          var jk = matrix.index( j, k );
          var t = LU[pk];
          LU[pk] = LU[jk];
          LU[jk] = t;
        }
        k = this.piv[p];
        this.piv[p] = this.piv[j];
        this.piv[j] = k;
        this.pivsign = -this.pivsign;
      }

      // Compute multipliers.

      if ( j < m && LU[this.matrix.index( j, j )] !== 0.0 ) {
        for ( i = j + 1; i < m; i++ ) {
          LU[matrix.index( i, j )] /= LU[matrix.index( j, j )];
        }
      }
    }
  };
  var LUDecomposition = dot.LUDecomposition;

  LUDecomposition.prototype = {
    constructor: LUDecomposition,

    isNonsingular: function() {
      for ( var j = 0; j < this.n; j++ ) {
        var index = this.matrix.index( j, j );
        if ( this.LU[index] === 0 ) {
          return false;
        }
      }
      return true;
    },

    getL: function() {
      var result = new dot.Matrix( this.m, this.n );
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          if ( i > j ) {
            result.entries[result.index( i, j )] = this.LU[this.matrix.index( i, j )];
          }
          else if ( i === j ) {
            result.entries[result.index( i, j )] = 1.0;
          }
          else {
            result.entries[result.index( i, j )] = 0.0;
          }
        }
      }
      return result;
    },

    getU: function() {
      var result = new dot.Matrix( this.n, this.n );
      for ( var i = 0; i < this.n; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          if ( i <= j ) {
            result.entries[result.index( i, j )] = this.LU[this.matrix.index( i, j )];
          }
          else {
            result.entries[result.index( i, j )] = 0.0;
          }
        }
      }
      return result;
    },

    getPivot: function() {
      var p = new Uint32Array( this.m );
      for ( var i = 0; i < this.m; i++ ) {
        p[i] = this.piv[i];
      }
      return p;
    },

    getDoublePivot: function() {
      var vals = new Float32Array( this.m );
      for ( var i = 0; i < this.m; i++ ) {
        vals[i] = this.piv[i];
      }
      return vals;
    },

    det: function() {
      if ( this.m !== this.n ) {
        throw new Error( "Matrix must be square." );
      }
      var d = this.pivsign;
      for ( var j = 0; j < this.n; j++ ) {
        d *= this.LU[this.matrix.index( j, j )];
      }
      return d;
    },

    solve: function( matrix ) {
      var i, j, k;
      if ( matrix.getRowDimension() !== this.m ) {
        throw new Error( "Matrix row dimensions must agree." );
      }
      if ( !this.isNonsingular() ) {
        throw new Error( "Matrix is singular." );
      }

      // Copy right hand side with pivoting
      var nx = matrix.getColumnDimension();
      var Xmat = matrix.getArrayRowMatrix( this.piv, 0, nx - 1 );

      // Solve L*Y = B(piv,:)
      for ( k = 0; k < this.n; k++ ) {
        for ( i = k + 1; i < this.n; i++ ) {
          for ( j = 0; j < nx; j++ ) {
            Xmat.entries[Xmat.index( i, j )] -= Xmat.entries[Xmat.index( k, j )] * this.LU[this.matrix.index( i, k )];
          }
        }
      }

      // Solve U*X = Y;
      for ( k = this.n - 1; k >= 0; k-- ) {
        for ( j = 0; j < nx; j++ ) {
          Xmat.entries[Xmat.index( k, j )] /= this.LU[this.matrix.index( k, k )];
        }
        for ( i = 0; i < k; i++ ) {
          for ( j = 0; j < nx; j++ ) {
            Xmat.entries[Xmat.index( i, j )] -= Xmat.entries[Xmat.index( k, j )] * this.LU[this.matrix.index( i, k )];
          }
        }
      }
      return Xmat;
    }
  };
  
  return LUDecomposition;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Tests whether a reference is to an array.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('PHET_CORE/isArray',['require'], function( require ) {
  
  
  return function isArray( array ) {
    // yes, this is actually how to do this. see http://stackoverflow.com/questions/4775722/javascript-check-if-object-is-array
    return Object.prototype.toString.call( array ) === '[object Array]';
  };
} );

// Copyright 2002-2012, University of Colorado

/**
 * SVD decomposition, based on Jama
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/SingularValueDecomposition',['require','DOT/dot'], function( require ) {
  
  
  var dot = require( 'DOT/dot' );
  
  var Float32Array = window.Float32Array || Array;
  
  // require( 'DOT/Matrix' ); // commented out so Require.js doesn't complain about the circular dependency

  dot.SingularValueDecomposition = function( matrix ) {
    this.matrix = matrix;

    var Arg = matrix;

    // Derived from LINPACK code.
    // Initialize.
    var A = Arg.getArrayCopy();
    this.m = Arg.getRowDimension();
    this.n = Arg.getColumnDimension();
    var m = this.m;
    var n = this.n;

    var min = Math.min;
    var max = Math.max;
    var pow = Math.pow;
    var abs = Math.abs;

    /* Apparently the failing cases are only a proper subset of (m<n),
     so let's not throw error.  Correct fix to come later?
     if (m<n) {
     throw new IllegalArgumentException("Jama SVD only works for m >= n"); }
     */
    var nu = min( m, n );
    this.s = new Float32Array( min( m + 1, n ) );
    var s = this.s;
    this.U = new Float32Array( m * nu );
    var U = this.U;
    this.V = new Float32Array( n * n );
    var V = this.V;
    var e = new Float32Array( n );
    var work = new Float32Array( m );
    var wantu = true;
    var wantv = true;

    var i, j, k, t, f;
    var cs,sn;

    var hypot = dot.Matrix.hypot;

    // Reduce A to bidiagonal form, storing the diagonal elements
    // in s and the super-diagonal elements in e.

    var nct = min( m - 1, n );
    var nrt = max( 0, min( n - 2, m ) );
    for ( k = 0; k < max( nct, nrt ); k++ ) {
      if ( k < nct ) {

        // Compute the transformation for the k-th column and
        // place the k-th diagonal in s[k].
        // Compute 2-norm of k-th column without under/overflow.
        s[k] = 0;
        for ( i = k; i < m; i++ ) {
          s[k] = hypot( s[k], A[i * n + k] );
        }
        if ( s[k] !== 0.0 ) {
          if ( A[k * n + k] < 0.0 ) {
            s[k] = -s[k];
          }
          for ( i = k; i < m; i++ ) {
            A[i * n + k] /= s[k];
          }
          A[k * n + k] += 1.0;
        }
        s[k] = -s[k];
      }
      for ( j = k + 1; j < n; j++ ) {
        if ( (k < nct) && (s[k] !== 0.0) ) {

          // Apply the transformation.

          t = 0;
          for ( i = k; i < m; i++ ) {
            t += A[i * n + k] * A[i * n + j];
          }
          t = -t / A[k * n + k];
          for ( i = k; i < m; i++ ) {
            A[i * n + j] += t * A[i * n + k];
          }
        }

        // Place the k-th row of A into e for the
        // subsequent calculation of the row transformation.

        e[j] = A[k * n + j];
      }
      if ( wantu && (k < nct) ) {

        // Place the transformation in U for subsequent back
        // multiplication.

        for ( i = k; i < m; i++ ) {
          U[i * nu + k] = A[i * n + k];
        }
      }
      if ( k < nrt ) {

        // Compute the k-th row transformation and place the
        // k-th super-diagonal in e[k].
        // Compute 2-norm without under/overflow.
        e[k] = 0;
        for ( i = k + 1; i < n; i++ ) {
          e[k] = hypot( e[k], e[i] );
        }
        if ( e[k] !== 0.0 ) {
          if ( e[k + 1] < 0.0 ) {
            e[k] = -e[k];
          }
          for ( i = k + 1; i < n; i++ ) {
            e[i] /= e[k];
          }
          e[k + 1] += 1.0;
        }
        e[k] = -e[k];
        if ( (k + 1 < m) && (e[k] !== 0.0) ) {

          // Apply the transformation.

          for ( i = k + 1; i < m; i++ ) {
            work[i] = 0.0;
          }
          for ( j = k + 1; j < n; j++ ) {
            for ( i = k + 1; i < m; i++ ) {
              work[i] += e[j] * A[i * n + j];
            }
          }
          for ( j = k + 1; j < n; j++ ) {
            t = -e[j] / e[k + 1];
            for ( i = k + 1; i < m; i++ ) {
              A[i * n + j] += t * work[i];
            }
          }
        }
        if ( wantv ) {

          // Place the transformation in V for subsequent
          // back multiplication.

          for ( i = k + 1; i < n; i++ ) {
            V[i * n + k] = e[i];
          }
        }
      }
    }

    // Set up the final bidiagonal matrix or order p.

    var p = min( n, m + 1 );
    if ( nct < n ) {
      s[nct] = A[nct * n + nct];
    }
    if ( m < p ) {
      s[p - 1] = 0.0;
    }
    if ( nrt + 1 < p ) {
      e[nrt] = A[nrt * n + p - 1];
    }
    e[p - 1] = 0.0;

    // If required, generate U.

    if ( wantu ) {
      for ( j = nct; j < nu; j++ ) {
        for ( i = 0; i < m; i++ ) {
          U[i * nu + j] = 0.0;
        }
        U[j * nu + j] = 1.0;
      }
      for ( k = nct - 1; k >= 0; k-- ) {
        if ( s[k] !== 0.0 ) {
          for ( j = k + 1; j < nu; j++ ) {
            t = 0;
            for ( i = k; i < m; i++ ) {
              t += U[i * nu + k] * U[i * nu + j];
            }
            t = -t / U[k * nu + k];
            for ( i = k; i < m; i++ ) {
              U[i * nu + j] += t * U[i * nu + k];
            }
          }
          for ( i = k; i < m; i++ ) {
            U[i * nu + k] = -U[i * nu + k];
          }
          U[k * nu + k] = 1.0 + U[k * nu + k];
          for ( i = 0; i < k - 1; i++ ) {
            U[i * nu + k] = 0.0;
          }
        }
        else {
          for ( i = 0; i < m; i++ ) {
            U[i * nu + k] = 0.0;
          }
          U[k * nu + k] = 1.0;
        }
      }
    }

    // If required, generate V.

    if ( wantv ) {
      for ( k = n - 1; k >= 0; k-- ) {
        if ( (k < nrt) && (e[k] !== 0.0) ) {
          for ( j = k + 1; j < nu; j++ ) {
            t = 0;
            for ( i = k + 1; i < n; i++ ) {
              t += V[i * n + k] * V[i * n + j];
            }
            t = -t / V[k + 1 * n + k];
            for ( i = k + 1; i < n; i++ ) {
              V[i * n + j] += t * V[i * n + k];
            }
          }
        }
        for ( i = 0; i < n; i++ ) {
          V[i * n + k] = 0.0;
        }
        V[k * n + k] = 1.0;
      }
    }

    // Main iteration loop for the singular values.

    var pp = p - 1;
    var iter = 0;
    var eps = pow( 2.0, -52.0 );
    var tiny = pow( 2.0, -966.0 );
    while ( p > 0 ) {
      var kase;

      // Here is where a test for too many iterations would go.

      // This section of the program inspects for
      // negligible elements in the s and e arrays.  On
      // completion the variables kase and k are set as follows.

      // kase = 1   if s(p) and e[k-1] are negligible and k<p
      // kase = 2   if s(k) is negligible and k<p
      // kase = 3   if e[k-1] is negligible, k<p, and
      //        s(k), ..., s(p) are not negligible (qr step).
      // kase = 4   if e(p-1) is negligible (convergence).

      for ( k = p - 2; k >= -1; k-- ) {
        if ( k === -1 ) {
          break;
        }
        if ( abs( e[k] ) <=
           tiny + eps * (abs( s[k] ) + abs( s[k + 1] )) ) {
          e[k] = 0.0;
          break;
        }
      }
      if ( k === p - 2 ) {
        kase = 4;
      }
      else {
        var ks;
        for ( ks = p - 1; ks >= k; ks-- ) {
          if ( ks === k ) {
            break;
          }
          t = (ks !== p ? abs( e[ks] ) : 0) +
            (ks !== k + 1 ? abs( e[ks - 1] ) : 0);
          if ( abs( s[ks] ) <= tiny + eps * t ) {
            s[ks] = 0.0;
            break;
          }
        }
        if ( ks === k ) {
          kase = 3;
        }
        else if ( ks === p - 1 ) {
          kase = 1;
        }
        else {
          kase = 2;
          k = ks;
        }
      }
      k++;

      // Perform the task indicated by kase.

      switch( kase ) {

        // Deflate negligible s(p).

        case 1:
        {
          f = e[p - 2];
          e[p - 2] = 0.0;
          for ( j = p - 2; j >= k; j-- ) {
            t = hypot( s[j], f );
            cs = s[j] / t;
            sn = f / t;
            s[j] = t;
            if ( j !== k ) {
              f = -sn * e[j - 1];
              e[j - 1] = cs * e[j - 1];
            }
            if ( wantv ) {
              for ( i = 0; i < n; i++ ) {
                t = cs * V[i * n + j] + sn * V[i * n + p - 1];
                V[i * n + p - 1] = -sn * V[i * n + j] + cs * V[i * n + p - 1];
                V[i * n + j] = t;
              }
            }
          }
        }
          break;

        // Split at negligible s(k).

        case 2:
        {
          f = e[k - 1];
          e[k - 1] = 0.0;
          for ( j = k; j < p; j++ ) {
            t = hypot( s[j], f );
            cs = s[j] / t;
            sn = f / t;
            s[j] = t;
            f = -sn * e[j];
            e[j] = cs * e[j];
            if ( wantu ) {
              for ( i = 0; i < m; i++ ) {
                t = cs * U[i * nu + j] + sn * U[i * nu + k - 1];
                U[i * nu + k - 1] = -sn * U[i * nu + j] + cs * U[i * nu + k - 1];
                U[i * nu + j] = t;
              }
            }
          }
        }
          break;

        // Perform one qr step.

        case 3:
        {

          // Calculate the shift.

          var scale = max( max( max( max(
              abs( s[p - 1] ), abs( s[p - 2] ) ), abs( e[p - 2] ) ),
                          abs( s[k] ) ), abs( e[k] ) );
          var sp = s[p - 1] / scale;
          var spm1 = s[p - 2] / scale;
          var epm1 = e[p - 2] / scale;
          var sk = s[k] / scale;
          var ek = e[k] / scale;
          var b = ((spm1 + sp) * (spm1 - sp) + epm1 * epm1) / 2.0;
          var c = (sp * epm1) * (sp * epm1);
          var shift = 0.0;
          if ( (b !== 0.0) || (c !== 0.0) ) {
            shift = Math.sqrt( b * b + c );
            if ( b < 0.0 ) {
              shift = -shift;
            }
            shift = c / (b + shift);
          }
          f = (sk + sp) * (sk - sp) + shift;
          var g = sk * ek;

          // Chase zeros.

          for ( j = k; j < p - 1; j++ ) {
            t = hypot( f, g );
            cs = f / t;
            sn = g / t;
            if ( j !== k ) {
              e[j - 1] = t;
            }
            f = cs * s[j] + sn * e[j];
            e[j] = cs * e[j] - sn * s[j];
            g = sn * s[j + 1];
            s[j + 1] = cs * s[j + 1];
            if ( wantv ) {
              for ( i = 0; i < n; i++ ) {
                t = cs * V[i * n + j] + sn * V[i * n + j + 1];
                V[i * n + j + 1] = -sn * V[i * n + j] + cs * V[i * n + j + 1];
                V[i * n + j] = t;
              }
            }
            t = hypot( f, g );
            cs = f / t;
            sn = g / t;
            s[j] = t;
            f = cs * e[j] + sn * s[j + 1];
            s[j + 1] = -sn * e[j] + cs * s[j + 1];
            g = sn * e[j + 1];
            e[j + 1] = cs * e[j + 1];
            if ( wantu && (j < m - 1) ) {
              for ( i = 0; i < m; i++ ) {
                t = cs * U[i * nu + j] + sn * U[i * nu + j + 1];
                U[i * nu + j + 1] = -sn * U[i * nu + j] + cs * U[i * nu + j + 1];
                U[i * nu + j] = t;
              }
            }
          }
          e[p - 2] = f;
          iter = iter + 1;
        }
          break;

        // Convergence.

        case 4:
        {

          // Make the singular values positive.

          if ( s[k] <= 0.0 ) {
            s[k] = (s[k] < 0.0 ? -s[k] : 0.0);
            if ( wantv ) {
              for ( i = 0; i <= pp; i++ ) {
                V[i * n + k] = -V[i * n + k];
              }
            }
          }

          // Order the singular values.

          while ( k < pp ) {
            if ( s[k] >= s[k + 1] ) {
              break;
            }
            t = s[k];
            s[k] = s[k + 1];
            s[k + 1] = t;
            if ( wantv && (k < n - 1) ) {
              for ( i = 0; i < n; i++ ) {
                t = V[i * n + k + 1];
                V[i * n + k + 1] = V[i * n + k];
                V[i * n + k] = t;
              }
            }
            if ( wantu && (k < m - 1) ) {
              for ( i = 0; i < m; i++ ) {
                t = U[i * nu + k + 1];
                U[i * nu + k + 1] = U[i * nu + k];
                U[i * nu + k] = t;
              }
            }
            k++;
          }
          iter = 0;
          p--;
        }
          break;
      }
    }
  };
  var SingularValueDecomposition = dot.SingularValueDecomposition;

  SingularValueDecomposition.prototype = {
    constructor: SingularValueDecomposition,

    getU: function() {
      return new dot.Matrix( this.m, Math.min( this.m + 1, this.n ), this.U, true ); // the "fast" flag added, since U is Float32Array
    },

    getV: function() {
      return new dot.Matrix( this.n, this.n, this.V, true );
    },

    getSingularValues: function() {
      return this.s;
    },

    getS: function() {
      var result = new dot.Matrix( this.n, this.n );
      for ( var i = 0; i < this.n; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          result.entries[result.index( i, j )] = 0.0;
        }
        result.entries[result.index( i, i )] = this.s[i];
      }
      return result;
    },

    norm2: function() {
      return this.s[0];
    },

    cond: function() {
      return this.s[0] / this.s[Math.min( this.m, this.n ) - 1];
    },

    rank: function() {
      // changed to 23 from 52 (bits of mantissa), since we are using floats here!
      var eps = Math.pow( 2.0, -23.0 );
      var tol = Math.max( this.m, this.n ) * this.s[0] * eps;
      var r = 0;
      for ( var i = 0; i < this.s.length; i++ ) {
        if ( this.s[i] > tol ) {
          r++;
        }
      }
      return r;
    }
  };
} );

// Copyright 2002-2012, University of Colorado

/**
 * QR decomposition, based on Jama
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/QRDecomposition',['require','DOT/dot'], function( require ) {
  
  
  var dot = require( 'DOT/dot' );
  
  var Float32Array = window.Float32Array || Array;
  
  // require( 'DOT/Matrix' ); // commented out so Require.js doesn't complain about the circular dependency

  dot.QRDecomposition = function( matrix ) {
    this.matrix = matrix;

    // TODO: size!
    this.QR = matrix.getArrayCopy();
    var QR = this.QR;
    this.m = matrix.getRowDimension();
    var m = this.m;
    this.n = matrix.getColumnDimension();
    var n = this.n;

    this.Rdiag = new Float32Array( n );

    var i, j, k;

    // Main loop.
    for ( k = 0; k < n; k++ ) {
      // Compute 2-norm of k-th column without under/overflow.
      var nrm = 0;
      for ( i = k; i < m; i++ ) {
        nrm = dot.Matrix.hypot( nrm, QR[this.matrix.index( i, k )] );
      }

      if ( nrm !== 0.0 ) {
        // Form k-th Householder vector.
        if ( QR[this.matrix.index( k, k )] < 0 ) {
          nrm = -nrm;
        }
        for ( i = k; i < m; i++ ) {
          QR[this.matrix.index( i, k )] /= nrm;
        }
        QR[this.matrix.index( k, k )] += 1.0;

        // Apply transformation to remaining columns.
        for ( j = k + 1; j < n; j++ ) {
          var s = 0.0;
          for ( i = k; i < m; i++ ) {
            s += QR[this.matrix.index( i, k )] * QR[this.matrix.index( i, j )];
          }
          s = -s / QR[this.matrix.index( k, k )];
          for ( i = k; i < m; i++ ) {
            QR[this.matrix.index( i, j )] += s * QR[this.matrix.index( i, k )];
          }
        }
      }
      this.Rdiag[k] = -nrm;
    }
  };
  var QRDecomposition = dot.QRDecomposition;

  QRDecomposition.prototype = {
    constructor: QRDecomposition,

    isFullRank: function() {
      for ( var j = 0; j < this.n; j++ ) {
        if ( this.Rdiag[j] === 0 ) {
          return false;
        }
      }
      return true;
    },

    getH: function() {
      var result = new dot.Matrix( this.m, this.n );
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          if ( i >= j ) {
            result.entries[result.index( i, j )] = this.QR[this.matrix.index( i, j )];
          }
          else {
            result.entries[result.index( i, j )] = 0.0;
          }
        }
      }
      return result;
    },

    getR: function() {
      var result = new dot.Matrix( this.n, this.n );
      for ( var i = 0; i < this.n; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          if ( i < j ) {
            result.entries[result.index( i, j )] = this.QR[this.matrix.index( i, j )];
          }
          else if ( i === j ) {
            result.entries[result.index( i, j )] = this.Rdiag[i];
          }
          else {
            result.entries[result.index( i, j )] = 0.0;
          }
        }
      }
      return result;
    },

    getQ: function() {
      var i, j, k;
      var result = new dot.Matrix( this.m, this.n );
      for ( k = this.n - 1; k >= 0; k-- ) {
        for ( i = 0; i < this.m; i++ ) {
          result.entries[result.index( i, k )] = 0.0;
        }
        result.entries[result.index( k, k )] = 1.0;
        for ( j = k; j < this.n; j++ ) {
          if ( this.QR[this.matrix.index( k, k )] !== 0 ) {
            var s = 0.0;
            for ( i = k; i < this.m; i++ ) {
              s += this.QR[this.matrix.index( i, k )] * result.entries[result.index( i, j )];
            }
            s = -s / this.QR[this.matrix.index( k, k )];
            for ( i = k; i < this.m; i++ ) {
              result.entries[result.index( i, j )] += s * this.QR[this.matrix.index( i, k )];
            }
          }
        }
      }
      return result;
    },

    solve: function( matrix ) {
      if ( matrix.getRowDimension() !== this.m ) {
        throw new Error( "Matrix row dimensions must agree." );
      }
      if ( !this.isFullRank() ) {
        throw new Error( "Matrix is rank deficient." );
      }

      var i, j, k;

      // Copy right hand side
      var nx = matrix.getColumnDimension();
      var X = matrix.getArrayCopy();

      // Compute Y = transpose(Q)*matrix
      for ( k = 0; k < this.n; k++ ) {
        for ( j = 0; j < nx; j++ ) {
          var s = 0.0;
          for ( i = k; i < this.m; i++ ) {
            s += this.QR[this.matrix.index( i, k )] * X[matrix.index( i, j )];
          }
          s = -s / this.QR[this.matrix.index( k, k )];
          for ( i = k; i < this.m; i++ ) {
            X[matrix.index( i, j )] += s * this.QR[this.matrix.index( i, k )];
          }
        }
      }

      // Solve R*X = Y;
      for ( k = this.n - 1; k >= 0; k-- ) {
        for ( j = 0; j < nx; j++ ) {
          X[matrix.index( k, j )] /= this.Rdiag[k];
        }
        for ( i = 0; i < k; i++ ) {
          for ( j = 0; j < nx; j++ ) {
            X[matrix.index( i, j )] -= X[matrix.index( k, j )] * this.QR[this.matrix.index( i, k )];
          }
        }
      }
      return new dot.Matrix( X, this.n, nx ).getMatrix( 0, this.n - 1, 0, nx - 1 );
    }
  };
  
  return QRDecomposition;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Arbitrary-dimensional matrix, based on Jama
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/Matrix',['require','ASSERT/assert','DOT/dot','PHET_CORE/isArray','DOT/SingularValueDecomposition','DOT/LUDecomposition','DOT/QRDecomposition','DOT/Vector2','DOT/Vector3','DOT/Vector4'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'dot' );
  
  var dot = require( 'DOT/dot' );
  
  var Float32Array = window.Float32Array || Array;
  
  var isArray = require( 'PHET_CORE/isArray' );
  
  require( 'DOT/SingularValueDecomposition' );
  require( 'DOT/LUDecomposition' );
  require( 'DOT/QRDecomposition' );
  require( 'DOT/Vector2' );
  require( 'DOT/Vector3' );
  require( 'DOT/Vector4' );
  
  dot.Matrix = function( m, n, filler, fast ) {
    this.m = m;
    this.n = n;

    var size = m * n;
    this.size = size;
    var i;

    if ( fast ) {
      this.entries = filler;
    }
    else {
      if ( !filler ) {
        filler = 0;
      }

      // entries stored in row-major format
      this.entries = new Float32Array( size );

      if ( isArray( filler ) ) {
        assert && assert( filler.length === size );

        for ( i = 0; i < size; i++ ) {
          this.entries[i] = filler[i];
        }
      }
      else {
        for ( i = 0; i < size; i++ ) {
          this.entries[i] = filler;
        }
      }
    }
  };
  var Matrix = dot.Matrix;

  /** sqrt(a^2 + b^2) without under/overflow. **/
  Matrix.hypot = function hypot( a, b ) {
    var r;
    if ( Math.abs( a ) > Math.abs( b ) ) {
      r = b / a;
      r = Math.abs( a ) * Math.sqrt( 1 + r * r );
    }
    else if ( b !== 0 ) {
      r = a / b;
      r = Math.abs( b ) * Math.sqrt( 1 + r * r );
    }
    else {
      r = 0.0;
    }
    return r;
  };

  Matrix.prototype = {
    constructor: Matrix,

    copy: function() {
      var result = new Matrix( this.m, this.n );
      for ( var i = 0; i < this.size; i++ ) {
        result.entries[i] = this.entries[i];
      }
      return result;
    },

    getArray: function() {
      return this.entries;
    },

    getArrayCopy: function() {
      return new Float32Array( this.entries );
    },

    getRowDimension: function() {
      return this.m;
    },

    getColumnDimension: function() {
      return this.n;
    },

    // TODO: inline this places if we aren't using an inlining compiler! (check performance)
    index: function( i, j ) {
      return i * this.n + j;
    },

    get: function( i, j ) {
      return this.entries[this.index( i, j )];
    },

    set: function( i, j, s ) {
      this.entries[this.index( i, j )] = s;
    },

    getMatrix: function( i0, i1, j0, j1 ) {
      var result = new Matrix( i1 - i0 + 1, j1 - j0 + 1 );
      for ( var i = i0; i <= i1; i++ ) {
        for ( var j = j0; j <= j1; j++ ) {
          result.entries[result.index( i - i0, j - j0 )] = this.entries[this.index( i, j )];
        }
      }
      return result;
    },

    // getMatrix (int[] r, int j0, int j1)
    getArrayRowMatrix: function( r, j0, j1 ) {
      var result = new Matrix( r.length, j1 - j0 + 1 );
      for ( var i = 0; i < r.length; i++ ) {
        for ( var j = j0; j <= j1; j++ ) {
          result.entries[result.index( i, j - j0 )] = this.entries[this.index( r[i], j )];
        }
      }
      return result;
    },

    transpose: function() {
      var result = new Matrix( this.n, this.m );
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          result.entries[result.index( j, i )] = this.entries[this.index( i, j )];
        }
      }
      return result;
    },

    norm1: function() {
      var f = 0;
      for ( var j = 0; j < this.n; j++ ) {
        var s = 0;
        for ( var i = 0; i < this.m; i++ ) {
          s += Math.abs( this.entries[ this.index( i, j ) ] );
        }
        f = Math.max( f, s );
      }
      return f;
    },

    norm2: function() {
      return (new dot.SingularValueDecomposition( this ).norm2());
    },

    normInf: function() {
      var f = 0;
      for ( var i = 0; i < this.m; i++ ) {
        var s = 0;
        for ( var j = 0; j < this.n; j++ ) {
          s += Math.abs( this.entries[ this.index( i, j ) ] );
        }
        f = Math.max( f, s );
      }
      return f;
    },

    normF: function() {
      var f = 0;
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          f = Matrix.hypot( f, this.entries[ this.index( i, j ) ] );
        }
      }
      return f;
    },

    uminus: function() {
      var result = new Matrix( this.m, this.n );
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          result.entries[result.index( i, j )] = -this.entries[ this.index( i, j ) ];
        }
      }
      return result;
    },

    plus: function( matrix ) {
      this.checkMatrixDimensions( matrix );
      var result = new Matrix( this.m, this.n );
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          var index = result.index( i, j );
          result.entries[index] = this.entries[index] + matrix.entries[index];
        }
      }
      return result;
    },

    plusEquals: function( matrix ) {
      this.checkMatrixDimensions( matrix );
      var result = new Matrix( this.m, this.n );
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          var index = result.index( i, j );
          this.entries[index] = this.entries[index] + matrix.entries[index];
        }
      }
      return this;
    },

    minus: function( matrix ) {
      this.checkMatrixDimensions( matrix );
      var result = new Matrix( this.m, this.n );
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          var index = this.index( i, j );
          result.entries[index] = this.entries[index] - matrix.entries[index];
        }
      }
      return result;
    },

    minusEquals: function( matrix ) {
      this.checkMatrixDimensions( matrix );
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          var index = this.index( i, j );
          this.entries[index] = this.entries[index] - matrix.entries[index];
        }
      }
      return this;
    },

    arrayTimes: function( matrix ) {
      this.checkMatrixDimensions( matrix );
      var result = new Matrix( this.m, this.n );
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          var index = result.index( i, j );
          result.entries[index] = this.entries[index] * matrix.entries[index];
        }
      }
      return result;
    },

    arrayTimesEquals: function( matrix ) {
      this.checkMatrixDimensions( matrix );
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          var index = this.index( i, j );
          this.entries[index] = this.entries[index] * matrix.entries[index];
        }
      }
      return this;
    },

    arrayRightDivide: function( matrix ) {
      this.checkMatrixDimensions( matrix );
      var result = new Matrix( this.m, this.n );
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          var index = this.index( i, j );
          result.entries[index] = this.entries[index] / matrix.entries[index];
        }
      }
      return result;
    },

    arrayRightDivideEquals: function( matrix ) {
      this.checkMatrixDimensions( matrix );
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          var index = this.index( i, j );
          this.entries[index] = this.entries[index] / matrix.entries[index];
        }
      }
      return this;
    },

    arrayLeftDivide: function( matrix ) {
      this.checkMatrixDimensions( matrix );
      var result = new Matrix( this.m, this.n );
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          var index = this.index( i, j );
          result.entries[index] = matrix.entries[index] / this.entries[index];
        }
      }
      return result;
    },

    arrayLeftDivideEquals: function( matrix ) {
      this.checkMatrixDimensions( matrix );
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          var index = this.index( i, j );
          this.entries[index] = matrix.entries[index] / this.entries[index];
        }
      }
      return this;
    },

    times: function( matrixOrScalar ) {
      var result;
      var i, j, k, s;
      var matrix;
      if ( matrixOrScalar.isMatrix ) {
        matrix = matrixOrScalar;
        if ( matrix.m !== this.n ) {
          throw new Error( "Matrix inner dimensions must agree." );
        }
        result = new Matrix( this.m, matrix.n );
        var matrixcolj = new Float32Array( this.n );
        for ( j = 0; j < matrix.n; j++ ) {
          for ( k = 0; k < this.n; k++ ) {
            matrixcolj[k] = matrix.entries[ matrix.index( k, j ) ];
          }
          for ( i = 0; i < this.m; i++ ) {
            s = 0;
            for ( k = 0; k < this.n; k++ ) {
              s += this.entries[this.index( i, k )] * matrixcolj[k];
            }
            result.entries[result.index( i, j )] = s;
          }
        }
        return result;
      }
      else {
        s = matrixOrScalar;
        result = new Matrix( this.m, this.n );
        for ( i = 0; i < this.m; i++ ) {
          for ( j = 0; j < this.n; j++ ) {
            result.entries[result.index( i, j )] = s * this.entries[this.index( i, j )];
          }
        }
        return result;
      }
    },

    timesEquals: function( s ) {
      for ( var i = 0; i < this.m; i++ ) {
        for ( var j = 0; j < this.n; j++ ) {
          var index = this.index( i, j );
          this.entries[index] = s * this.entries[index];
        }
      }
      return this;
    },

    solve: function( matrix ) {
      return (this.m === this.n ? (new dot.LUDecomposition( this )).solve( matrix ) :
          (new dot.QRDecomposition( this )).solve( matrix ));
    },

    solveTranspose: function( matrix ) {
      return this.transpose().solve( matrix.transpose() );
    },

    inverse: function() {
      return this.solve( Matrix.identity( this.m, this.m ) );
    },

    det: function() {
      return new dot.LUDecomposition( this ).det();
    },

    rank: function() {
      return new dot.SingularValueDecomposition( this ).rank();
    },

    cond: function() {
      return new dot.SingularValueDecomposition( this ).cond();
    },

    trace: function() {
      var t = 0;
      for ( var i = 0; i < Math.min( this.m, this.n ); i++ ) {
        t += this.entries[ this.index( i, i ) ];
      }
      return t;
    },

    checkMatrixDimensions: function( matrix ) {
      if ( matrix.m !== this.m || matrix.n !== this.n ) {
        throw new Error( "Matrix dimensions must agree." );
      }
    },

    toString: function() {
      var result = "";
      result += "dim: " + this.getRowDimension() + "x" + this.getColumnDimension() + "\n";
      for ( var row = 0; row < this.getRowDimension(); row++ ) {
        for ( var col = 0; col < this.getColumnDimension(); col++ ) {
          result += this.get( row, col ) + " ";
        }
        result += "\n";
      }
      return result;
    },

    // returns a vector that is contained in the specified column
    extractVector2: function( column ) {
      assert && assert( this.m === 2 ); // rows should match vector dimension
      return new dot.Vector2( this.get( 0, column ), this.get( 1, column ) );
    },

    // returns a vector that is contained in the specified column
    extractVector3: function( column ) {
      assert && assert( this.m === 3 ); // rows should match vector dimension
      return new dot.Vector3( this.get( 0, column ), this.get( 1, column ), this.get( 2, column ) );
    },

    // returns a vector that is contained in the specified column
    extractVector4: function( column ) {
      assert && assert( this.m === 4 ); // rows should match vector dimension
      return new dot.Vector4( this.get( 0, column ), this.get( 1, column ), this.get( 2, column ), this.get( 3, column ) );
    },

    isMatrix: true
  };

  Matrix.identity = function( m, n ) {
    var result = new Matrix( m, n );
    for ( var i = 0; i < m; i++ ) {
      for ( var j = 0; j < n; j++ ) {
        result.entries[result.index( i, j )] = (i === j ? 1.0 : 0.0);
      }
    }
    return result;
  };

  Matrix.rowVector2 = function( vector ) {
    return new Matrix( 1, 2, [vector.x, vector.y] );
  };

  Matrix.rowVector3 = function( vector ) {
    return new Matrix( 1, 3, [vector.x, vector.y, vector.z] );
  };

  Matrix.rowVector4 = function( vector ) {
    return new Matrix( 1, 4, [vector.x, vector.y, vector.z, vector.w] );
  };

  Matrix.rowVector = function( vector ) {
    if ( vector.isVector2 ) {
      return Matrix.rowVector2( vector );
    }
    else if ( vector.isVector3 ) {
      return Matrix.rowVector3( vector );
    }
    else if ( vector.isVector4 ) {
      return Matrix.rowVector4( vector );
    }
    else {
      throw new Error( "undetected type of vector: " + vector.toString() );
    }
  };

  Matrix.columnVector2 = function( vector ) {
    return new Matrix( 2, 1, [vector.x, vector.y] );
  };

  Matrix.columnVector3 = function( vector ) {
    return new Matrix( 3, 1, [vector.x, vector.y, vector.z] );
  };

  Matrix.columnVector4 = function( vector ) {
    return new Matrix( 4, 1, [vector.x, vector.y, vector.z, vector.w] );
  };

  Matrix.columnVector = function( vector ) {
    if ( vector.isVector2 ) {
      return Matrix.columnVector2( vector );
    }
    else if ( vector.isVector3 ) {
      return Matrix.columnVector3( vector );
    }
    else if ( vector.isVector4 ) {
      return Matrix.columnVector4( vector );
    }
    else {
      throw new Error( "undetected type of vector: " + vector.toString() );
    }
  };

  /**
   * Create a Matrix where each column is a vector
   */

  Matrix.fromVectors2 = function( vectors ) {
    var dimension = 2;
    var n = vectors.length;
    var data = new Float32Array( dimension * n );

    for ( var i = 0; i < n; i++ ) {
      var vector = vectors[i];
      data[i] = vector.x;
      data[i + n] = vector.y;
    }

    return new Matrix( dimension, n, data, true );
  };

  Matrix.fromVectors3 = function( vectors ) {
    var dimension = 3;
    var n = vectors.length;
    var data = new Float32Array( dimension * n );

    for ( var i = 0; i < n; i++ ) {
      var vector = vectors[i];
      data[i] = vector.x;
      data[i + n] = vector.y;
      data[i + 2 * n] = vector.z;
    }

    return new Matrix( dimension, n, data, true );
  };

  Matrix.fromVectors4 = function( vectors ) {
    var dimension = 4;
    var n = vectors.length;
    var data = new Float32Array( dimension * n );

    for ( var i = 0; i < n; i++ ) {
      var vector = vectors[i];
      data[i] = vector.x;
      data[i + n] = vector.y;
      data[i + 2 * n] = vector.z;
      data[i + 3 * n] = vector.w;
    }

    return new Matrix( dimension, n, data, true );
  };
  
  return Matrix;
} );

// Copyright 2002-2012, University of Colorado

/**
 * An immutable permutation that can permute an array
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/Permutation',['require','ASSERT/assert','DOT/dot','PHET_CORE/isArray','DOT/Util'], function( require ) {
  
  
  var assert = require( 'ASSERT/assert' )( 'dot' );
  
  var dot = require( 'DOT/dot' );
  
  var isArray = require( 'PHET_CORE/isArray' );
  require( 'DOT/Util' ); // for rangeInclusive
  
  // Creates a permutation that will rearrange a list so that newList[i] = oldList[permutation[i]]
  var Permutation = function( indices ) {
    this.indices = indices;
  };

  // An identity permutation with a specific number of elements
  Permutation.identity = function( size ) {
    assert && assert( size >= 0 );
    var indices = new Array( size );
    for ( var i = 0; i < size; i++ ) {
      indices[i] = i;
    }
    return new Permutation( indices );
  };

  // lists all permutations that have a given size
  Permutation.permutations = function( size ) {
    var result = [];
    Permutation.forEachPermutation( dot.rangeInclusive( 0, size - 1 ), function( integers ) {
      result.push( new Permutation( integers ) );
    } );
    return result;
  };

  /**
   * Call our function with each permutation of the provided list PREFIXED by prefix, in lexicographic order
   *
   * @param array   List to generate permutations of
   * @param prefix   Elements that should be inserted at the front of each list before each call
   * @param callback Function to call
   */
  function recursiveForEachPermutation( array, prefix, callback ) {
    if ( array.length === 0 ) {
      callback.call( undefined, prefix );
    }
    else {
      for ( var i = 0; i < array.length; i++ ) {
        var element = array[i];

        // remove the element from the array
        var nextArray = array.slice( 0 );
        nextArray.splice( i, 1 );

        // add it into the prefix
        var nextPrefix = prefix.slice( 0 );
        nextPrefix.push( element );

        recursiveForEachPermutation( nextArray, nextPrefix, callback );
      }
    }
  }

  Permutation.forEachPermutation = function( array, callback ) {
    recursiveForEachPermutation( array, [], callback );
  };

  Permutation.prototype = {
    constructor: Permutation,

    size: function() {
      return this.indices.length;
    },

    apply: function( arrayOrInt ) {
      if ( isArray( arrayOrInt ) ) {
        if ( arrayOrInt.length !== this.size() ) {
          throw new Error( "Permutation length " + this.size() + " not equal to list length " + arrayOrInt.length );
        }

        // permute it as an array
        var result = new Array( arrayOrInt.length );
        for ( var i = 0; i < arrayOrInt.length; i++ ) {
          result[i] = arrayOrInt[ this.indices[i] ];
        }
        return result;
      }
      else {
        // permute a single index
        return this.indices[ arrayOrInt ];
      }
    },

    // The inverse of this permutation
    inverted: function() {
      var newPermutation = new Array( this.size() );
      for ( var i = 0; i < this.size(); i++ ) {
        newPermutation[this.indices[i]] = i;
      }
      return new Permutation( newPermutation );
    },

    withIndicesPermuted: function( indices ) {
      var result = [];
      var that = this;
      Permutation.forEachPermutation( indices, function( integers ) {
        var oldIndices = that.indices;
        var newPermutation = oldIndices.slice( 0 );

        for ( var i = 0; i < indices.length; i++ ) {
          newPermutation[indices[i]] = oldIndices[integers[i]];
        }
        result.push( new Permutation( newPermutation ) );
      } );
      return result;
    },

    toString: function() {
      return "P[" + this.indices.join( ", " ) + "]";
    }
  };

  Permutation.testMe = function( console ) {
    var a = new Permutation( [ 1, 4, 3, 2, 0 ] );
    console.log( a.toString() );

    var b = a.inverted();
    console.log( b.toString() );

    console.log( b.withIndicesPermuted( [ 0, 3, 4 ] ).toString() );

    console.log( Permutation.permutations( 4 ).toString() );
  };
  
  return Permutation;
} );

// Copyright 2002-2012, University of Colorado

/**
 * 3-dimensional ray
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/Ray3',['require','DOT/dot'], function( require ) {
  
  
  var dot = require( 'DOT/dot' );
  
  dot.Ray3 = function( pos, dir ) {
    this.pos = pos;
    this.dir = dir;
  };
  var Ray3 = dot.Ray3;
  
  Ray3.prototype = {
    constructor: Ray3,

    shifted: function( distance ) {
      return new Ray3( this.pointAtDistance( distance ), this.dir );
    },

    pointAtDistance: function( distance ) {
      return this.pos.plus( this.dir.timesScalar( distance ) );
    },

    toString: function() {
      return this.pos.toString() + " => " + this.dir.toString();
    }
  };
  
  return Ray3;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Forward and inverse transforms with 4x4 matrices, allowing flexibility including affine and perspective transformations.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('DOT/Transform4',['require','DOT/dot','DOT/Matrix4','DOT/Vector3','DOT/Ray3'], function( require ) {
  
  
  var dot = require( 'DOT/dot' );
  
  require( 'DOT/Matrix4' );
  require( 'DOT/Vector3' );
  require( 'DOT/Ray3' );
  
  // takes a 4x4 matrix
  dot.Transform4 = function( matrix ) {
    // using immutable version for now. change it to the mutable identity copy if we need mutable operations on the matrices
    this.set( matrix === undefined ? dot.Matrix4.IDENTITY : matrix );
  };
  var Transform4 = dot.Transform4;
  
  Transform4.prototype = {
    constructor: Transform4,
    
    set: function( matrix ) {
      this.matrix = matrix;
      
      // compute these lazily
      this.inverse = null;
      this.matrixTransposed = null; // since WebGL won't allow transpose == true
      this.inverseTransposed = null;
    },
    
    getMatrix: function() {
      return this.matrix;
    },
    
    getInverse: function() {
      if ( this.inverse === null ) {
        this.inverse = this.matrix.inverted();
      }
      return this.inverse;
    },
    
    getMatrixTransposed: function() {
      if ( this.matrixTransposed === null ) {
        this.matrixTransposed = this.matrix.transposed();
      }
      return this.matrixTransposed;
    },
    
    getInverseTransposed: function() {
      if ( this.inverseTransposed === null ) {
        this.inverseTransposed = this.getInverse().transposed();
      }
      return this.inverseTransposed;
    },
    
    prepend: function( matrix ) {
      this.set( matrix.timesMatrix( this.matrix ) );
    },
    
    append: function( matrix ) {
      this.set( this.matrix.timesMatrix( matrix ) );
    },
    
    prependTransform: function( transform ) {
      this.prepend( transform.matrix );
    },
    
    appendTransform: function( transform ) {
      this.append( transform.matrix );
    },
    
    isIdentity: function() {
      return this.matrix.type === dot.Matrix4.Types.IDENTITY;
    },
    
    // applies the 2D affine transform part of the transformation
    applyToCanvasContext: function( context ) {
      context.setTransform( this.matrix.m00(), this.matrix.m10(), this.matrix.m01(), this.matrix.m11(), this.matrix.m03(), this.matrix.m13() );
    },
    
    /*---------------------------------------------------------------------------*
     * forward transforms (for Vector3 or scalar)
     *----------------------------------------------------------------------------*/
     
    // transform a position (includes translation)
    transformPosition3: function( vec3 ) {
      return this.matrix.timesVector3( vec3 );
    },
    
    // transform a vector (exclude translation)
    transformDelta3: function( vec3 ) {
      return this.matrix.timesRelativeVector3( vec3 );
    },
    
    // transform a normal vector (different than a normal vector)
    transformNormal3: function( vec3 ) {
      return this.getInverse().timesTransposeVector3( vec3 );
    },
    
    transformDeltaX: function( x ) {
      return this.transformDelta3( new dot.Vector3( x, 0, 0 ) ).x;
    },
    
    transformDeltaY: function( y ) {
      return this.transformDelta3( new dot.Vector3( 0, y, 0 ) ).y;
    },
    
    transformDeltaZ: function( z ) {
      return this.transformDelta3( new dot.Vector3( 0, 0, z ) ).z;
    },
    
    transformRay: function( ray ) {
      return new dot.Ray3(
          this.transformPosition3( ray.pos ),
          this.transformPosition3( ray.pos.plus( ray.dir ) ).minus( this.transformPosition3( ray.pos ) ) );
    },
    
    /*---------------------------------------------------------------------------*
     * inverse transforms (for Vector3 or scalar)
     *----------------------------------------------------------------------------*/
     
    inversePosition3: function( vec3 ) {
      return this.getInverse().timesVector3( vec3 );
    },
    
    inverseDelta3: function( vec3 ) {
      // inverse actually has the translation rolled into the other coefficients, so we have to make this longer
      return this.inversePosition3( vec3 ).minus( this.inversePosition3( dot.Vector3.ZERO ) );
    },
    
    inverseNormal3: function( vec3 ) {
      return this.matrix.timesTransposeVector3( vec3 );
    },
    
    inverseDeltaX: function( x ) {
      return this.inverseDelta3( new dot.Vector3( x, 0, 0 ) ).x;
    },
    
    inverseDeltaY: function( y ) {
      return this.inverseDelta3( new dot.Vector3( 0, y, 0 ) ).y;
    },
    
    inverseDeltaZ: function( z ) {
      return this.inverseDelta3( new dot.Vector3( 0, 0, z ) ).z;
    },
    
    inverseRay: function( ray ) {
      return new dot.Ray3(
          this.inversePosition3( ray.pos ),
          this.inversePosition3( ray.pos.plus( ray.dir ) ).minus( this.inversePosition3( ray.pos ) )
      );
    }
  };
  
  return Transform4;
} );


define('DOT/main', [
  'DOT/dot',
  'DOT/Bounds2',
  'DOT/ConvexHull2',
  'DOT/Dimension2',
  'DOT/LUDecomposition',
  'DOT/Matrix',
  'DOT/Matrix3',
  'DOT/Matrix4',
  'DOT/Permutation',
  'DOT/QRDecomposition',
  'DOT/Ray2',
  'DOT/Ray3',
  'DOT/SingularValueDecomposition',
  'DOT/Transform3',
  'DOT/Transform4',
  'DOT/Util',
  'DOT/Vector2',
  'DOT/Vector3',
  'DOT/Vector4'
  ], function( dot ) {
  return dot;
} );

// Copyright 2013, University of Colorado

/**
 * A method of calling an overridden super-type method.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define('PHET_CORE/callSuper',['require'], function( require ) {
  

  /**
   * A somewhat ugly method of calling an overridden super-type method.
   * <p>
   * Example:
   * <code>
   * function SuperType() {
   * }
   *
   * SuperType.prototype.reset = function() {...}
   *
   * function SubType() {
   *    SuperType.call( this ); // constructor stealing
   * }
   *
   * SubType.prototype = new SuperType(); // prototype chaining
   *
   * SubType.prototype.reset = function() {
   *     Inheritance.callSuper( SuperType, "reset", this ); // call overridden super method
   *     // do subtype-specific stuff
   * }
   * </code>
   *
   * @param supertype
   * @param {String} name
   * @param context typically this
   * @return {Function}
   */
  function callSuper( supertype, name, context ) {
    (function () {
      var fn = supertype.prototype[name];
      Function.call.apply( fn, arguments );
    })( context );
  }

  return callSuper;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Like Underscore's _.extend, but with hardcoded support for ES5 getters/setters.
 *
 * See https://github.com/documentcloud/underscore/pull/986.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('PHET_CORE/extend',['require'], function( require ) {
  
  
  return function extend( obj ) {
    _.each( Array.prototype.slice.call( arguments, 1 ), function( source ) {
      if ( source ) {
        for ( var prop in source ) {
          Object.defineProperty( obj, prop, Object.getOwnPropertyDescriptor( source, prop ) );
        }
      }
    });
    return obj;
  };
} );

// Copyright 2013, University of Colorado

/**
 * Experimental prototype inheritance
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */
define('PHET_CORE/inherit',['require','PHET_CORE/extend'], function( require ) {
  
  
  var extend = require( 'PHET_CORE/extend' );
  
  /**
   * Experimental inheritance prototype, similar to Inheritance.inheritPrototype, but maintains
   * supertype.prototype.constructor while properly copying ES5 getters and setters.
   *
   * TODO: find problems with this! It's effectively what is being used by Scenery
   * TODO: consider inspecting arguments to see whether they are functions or just objects, to support
   *       something like inherit( subtype, supertypeA, supertypeB, properties )
   *
   * Usage:
   * function A() { scenery.Node.call( this ); };
   * inherit( A, scenery.Node, {
   *   customBehavior: function() { ... },
   *   isAnA: true
   * } );
   * new A().isAnA // true
   * new scenery.Node().isAnA // undefined
   * new A().constructor.name // 'A'
   *
   * @param subtype             Constructor for the subtype. Generally should contain supertype.call( this, ... )
   * @param supertype           Constructor for the supertype.
   * @param prototypeProperties [optional] object containing properties that will be set on the prototype.
   */
  function inherit( subtype, supertype, prototypeProperties ) {
    function F() {}
    F.prototype = supertype.prototype; // so new F().__proto__ === supertype.prototype
    
    subtype.prototype = extend( // extend will combine the properties and constructor into the new F copy
      new F(),                  // so new F().__proto__ === supertype.prototype, and the prototype chain is set up nicely
      { constructor: subtype }, // overrides the constructor properly
      prototypeProperties       // [optional] additional properties for the prototype, as an object.
    );
  }

  return inherit;
} );

// Copyright 2013, University of Colorado

/**
 * Prototype chaining using Parasitic Combination Inheritance
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define('PHET_CORE/inheritPrototype',['require'], function( require ) {
  

  /**
   * Use this function to do prototype chaining using Parasitic Combination Inheritance.
   * Instead of calling the supertype's constructor to assign a prototype (as is done
   * in Combination Inheritance), you create a copy of the supertype's prototype.
   * <br>
   * Here's the basic pattern:
   * <br>
   * <code>
   * function Supertype(...) {...}
   *
   * function Subtype(...) {
           *     Supertype.call(this, ...); // constructor stealing, called second
           *     ...
           * }
   *
   * inheritPrototype( Subtype, Supertype ); // prototype chaining, called first
   * </code>
   * <br>
   * (source: JavaScript for Web Developers, N. Zakas, Wrox Press, p. 212-215)
   */
  function inheritPrototype( subtype, supertype ) {
    var prototype = Object( supertype.prototype ); // create a clone of the supertype's prototype
    prototype.constructor = subtype; // account for losing the default constructor when prototype is overwritten
    subtype.prototype = prototype; // assign cloned prototype to subtype
  }

  return inheritPrototype;
} );

// Copyright 2002-2012, University of Colorado

/**
 * Loads a script
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define('PHET_CORE/loadScript',['require'], function( require ) {
  
  
  /*
   * Load a script. The only required argument is src, and can be specified either as
   * loadScript( "<url>" ) or loadScript( { src: "<url>", ... other options ... } ).
   *
   * Arguments:
   *   src:         The source of the script to load
   *   callback:    A callback to call (with no arguments) once the script is loaded and has been executed
   *   async:       Whether the script should be loaded asynchronously. Defaults to true
   *   cacheBuster: Whether the URL should have an appended query string to work around caches
   */
  return function loadScript( args ) {
    // handle a string argument
    if ( typeof args === 'string' ) {
      args = { src: args };
    }
    
    var src         = args.src;
    var callback    = args.callback;
    var async       = args.async === undefined ? true : args.async;
    var cacheBuster = args.cacheBuster === undefined ? false : args.cacheBuster;
    
    var called = false;
    
    var script = document.createElement( 'script' );
    script.type = 'text/javascript';
    script.async = async;
    script.onload = script.onreadystatechange = function() {
      var state = this.readyState;
      if ( state && state !== "complete" && state !== "loaded" ) {
        return;
      }
      
      if ( !called ) {
        called = true;
        
        if ( callback ) {
          callback();
        }
      }
    };
    
    // make sure things aren't cached, just in case
    script.src = src + ( cacheBuster ? '?random=' + Math.random().toFixed( 10 ) : '' );
    
    var other = document.getElementsByTagName( 'script' )[0];
    other.parentNode.insertBefore( script, other );
  };
} );


define('PHET_CORE/main',['require','PHET_CORE/callSuper','PHET_CORE/inherit','PHET_CORE/inheritPrototype','PHET_CORE/isArray','PHET_CORE/extend','PHET_CORE/loadScript'], function( require ) {
  return {
    callSuper: require( 'PHET_CORE/callSuper' ),
    inherit: require( 'PHET_CORE/inherit' ),
    inheritPrototype: require( 'PHET_CORE/inheritPrototype' ),
    isArray: require( 'PHET_CORE/isArray' ),
    extend: require( 'PHET_CORE/extend' ),
    loadScript: require( 'PHET_CORE/loadScript' )
  };
} );


if ( window.has ) {
  window.has.add( 'assert.kite', function( global, document, anElement ) {
    return true;
  } );
  window.has.add( 'assert.kite.extra', function( global, document, anElement ) {
    return true;
  } );
}

window.loadedKiteConfig = true;

require.config( {
  deps: [ 'main', 'DOT/main', 'PHET_CORE/main' ],

  paths: {
    underscore: '../contrib/lodash.min-1.0.0-rc.3',
    KITE: '.',
    DOT: '../common/dot/js',
    PHET_CORE: '../common/phet-core/js',
    ASSERT: '../common/assert/js'
  },
  
  shim: {
    underscore: { exports: '_' }
  },

  urlArgs: new Date().getTime() // add cache buster query string to make browser refresh actually reload everything
} );

define("config", function(){});
 window.kite = require( 'main' ); window.dot = require( 'DOT/main' ); }());