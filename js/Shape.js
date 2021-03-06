// Copyright 2013-2015, University of Colorado Boulder

/**
 * Shape handling
 *
 * Shapes are internally made up of Subpaths, which contain a series of segments, and are optionally closed.
 * Familiarity with how Canvas handles subpaths is helpful for understanding this code.
 *
 * Canvas spec: http://www.w3.org/TR/2dcontext/
 * SVG spec: http://www.w3.org/TR/SVG/expanded-toc.html
 *           http://www.w3.org/TR/SVG/paths.html#PathData (for paths)
 * Notes for elliptical arcs: http://www.w3.org/TR/SVG/implnote.html#PathElementImplementationNotes
 * Notes for painting strokes: https://svgwg.org/svg2-draft/painting.html
 *
 * TODO: add nonzero / evenodd support when browsers support it
 * TODO: docs
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( function( require ) {
  'use strict';

  var kite = require( 'KITE/kite' );

  var inherit = require( 'PHET_CORE/inherit' );
  var Events = require( 'AXON/Events' );

  var Vector2 = require( 'DOT/Vector2' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Ray2 = require( 'DOT/Ray2' );

  var Subpath = require( 'KITE/util/Subpath' );
  var svgPath = require( 'KITE/parser/svgPath' );
  var Arc = require( 'KITE/segments/Arc' );
  var Cubic = require( 'KITE/segments/Cubic' );
  var EllipticalArc = require( 'KITE/segments/EllipticalArc' );
  var Line = require( 'KITE/segments/Line' );
  var Quadratic = require( 'KITE/segments/Quadratic' );

  // for brevity
  function p( x, y ) { return new Vector2( x, y ); }

  function v( x, y ) { return new Vector2( x, y ); } // TODO: use this version in general, it makes more sense and is easier to type

  // The tension parameter controls how smoothly the curve turns through its control points. For a Catmull-Rom
  // curve, the tension is zero. The tension should range from -1 to 1.
  function weightedSplineVector( beforeVector, currentVector, afterVector, tension ) {
    return afterVector.copy()
      .subtract( beforeVector )
      .multiplyScalar( ( 1 - tension ) / 6 )
      .add( currentVector );
  }

  // a normalized vector for non-zero winding checks
  // var weirdDir = p( Math.PI, 22 / 7 );

  // all arguments optional, they are for the copy() method. if used, ensure that 'bounds' is consistent with 'subpaths'
  function Shape( subpaths, bounds ) {
    var self = this;

    Events.call( this );

    // @public Lower-level piecewise mathematical description using segments, also individually immutable
    this.subpaths = [];

    // If non-null, computed bounds for all pieces added so far. Lazily computed with getBounds/bounds ES5 getter
    this._bounds = bounds ? bounds.copy() : null; // {Bounds2 | null}

    this.resetControlPoints();

    this._invalidateListener = this.invalidate.bind( this );
    this._invalidatingPoints = false; // So we can invalidate all of the points without firing invalidation tons of times

    // Add in subpaths from the constructor (if applicable)
    if ( typeof subpaths === 'object' ) {
      // assume it's an array
      for ( var i = 0; i < subpaths.length; i++ ) {
        this.addSubpath( subpaths[ i ] );
      }
    }

    if ( subpaths && typeof subpaths !== 'object' ) {
      assert && assert( typeof subpaths === 'string', 'if subpaths is not an object, it must be a string' );
      // parse the SVG path
      _.each( svgPath.parse( subpaths ), function( item ) {
        assert && assert( Shape.prototype[ item.cmd ] !== undefined, 'method ' + item.cmd + ' from parsed SVG does not exist' );
        self[ item.cmd ].apply( self, item.args );
      } );
    }

    // defines _bounds if not already defined (among other things)
    this.invalidate();

    phetAllocation && phetAllocation( 'Shape' );
  }

  kite.register( 'Shape', Shape );

  inherit( Events, Shape, {

    // for tracking the last quadratic/cubic control point for smooth* functions
    // see https://github.com/phetsims/kite/issues/38
    resetControlPoints: function() {
      this.lastQuadraticControlPoint = null;
      this.lastCubicControlPoint = null;
    },
    setQuadraticControlPoint: function( point ) {
      this.lastQuadraticControlPoint = point;
      this.lastCubicControlPoint = null;
    },
    setCubicControlPoint: function( point ) {
      this.lastQuadraticControlPoint = null;
      this.lastCubicControlPoint = point;
    },

    // Adds a new subpath if there have already been draw calls made. Will prevent any line or connection from the last
    // draw call to future draw calls.
    subpath: function() {
      if ( this.hasSubpaths() ) {
        this.addSubpath( new Subpath() );
      }

      return this; // for chaining
    },

    moveTo: function( x, y ) { return this.moveToPoint( v( x, y ) ); },
    moveToRelative: function( x, y ) { return this.moveToPointRelative( v( x, y ) ); },
    moveToPointRelative: function( point ) { return this.moveToPoint( this.getRelativePoint().plus( point ) ); },
    moveToPoint: function( point ) {
      this.addSubpath( new Subpath().addPoint( point ) );
      this.resetControlPoints();

      return this;
    },

    lineTo: function( x, y ) { return this.lineToPoint( v( x, y ) ); },
    lineToRelative: function( x, y ) { return this.lineToPointRelative( v( x, y ) ); },
    lineToPointRelative: function( point ) { return this.lineToPoint( this.getRelativePoint().plus( point ) ); },
    lineToPoint: function( point ) {
      // see http://www.w3.org/TR/2dcontext/#dom-context-2d-lineto
      if ( this.hasSubpaths() ) {
        var start = this.getLastSubpath().getLastPoint();
        var end = point;
        var line = new Line( start, end );
        this.getLastSubpath().addPoint( end );
        this.addSegmentAndBounds( line );
      }
      else {
        this.ensure( point );
      }
      this.resetControlPoints();

      return this;
    },

    horizontalLineTo: function( x ) { return this.lineTo( x, this.getRelativePoint().y ); },
    horizontalLineToRelative: function( x ) { return this.lineToRelative( x, 0 ); },

    verticalLineTo: function( y ) { return this.lineTo( this.getRelativePoint().x, y ); },
    verticalLineToRelative: function( y ) { return this.lineToRelative( 0, y ); },

    quadraticCurveTo: function( cpx, cpy, x, y ) { return this.quadraticCurveToPoint( v( cpx, cpy ), v( x, y ) ); },
    quadraticCurveToRelative: function( cpx, cpy, x, y ) { return this.quadraticCurveToPointRelative( v( cpx, cpy ), v( x, y ) ); },
    quadraticCurveToPointRelative: function( controlPoint, point ) {
      var relativePoint = this.getRelativePoint();
      return this.quadraticCurveToPoint( relativePoint.plus( controlPoint ), relativePoint.plus( point ) );
    },
    // TODO: consider a rename to put 'smooth' farther back?
    smoothQuadraticCurveTo: function( x, y ) { return this.quadraticCurveToPoint( this.getSmoothQuadraticControlPoint(), v( x, y ) ); },
    smoothQuadraticCurveToRelative: function( x, y ) { return this.quadraticCurveToPoint( this.getSmoothQuadraticControlPoint(), v( x, y ).plus( this.getRelativePoint() ) ); },
    quadraticCurveToPoint: function( controlPoint, point ) {
      var shape = this;

      // see http://www.w3.org/TR/2dcontext/#dom-context-2d-quadraticcurveto
      this.ensure( controlPoint );
      var start = this.getLastSubpath().getLastPoint();
      var quadratic = new Quadratic( start, controlPoint, point );
      this.getLastSubpath().addPoint( point );
      var nondegenerateSegments = quadratic.getNondegenerateSegments();
      _.each( nondegenerateSegments, function( segment ) {
        // TODO: optimization
        shape.addSegmentAndBounds( segment );
      } );
      this.setQuadraticControlPoint( controlPoint );

      return this;
    },

    cubicCurveTo: function( cp1x, cp1y, cp2x, cp2y, x, y ) { return this.cubicCurveToPoint( v( cp1x, cp1y ), v( cp2x, cp2y ), v( x, y ) ); },
    cubicCurveToRelative: function( cp1x, cp1y, cp2x, cp2y, x, y ) { return this.cubicCurveToPointRelative( v( cp1x, cp1y ), v( cp2x, cp2y ), v( x, y ) ); },
    cubicCurveToPointRelative: function( control1, control2, point ) {
      var relativePoint = this.getRelativePoint();
      return this.cubicCurveToPoint( relativePoint.plus( control1 ), relativePoint.plus( control2 ), relativePoint.plus( point ) );
    },
    smoothCubicCurveTo: function( cp2x, cp2y, x, y ) { return this.cubicCurveToPoint( this.getSmoothCubicControlPoint(), v( cp2x, cp2y ), v( x, y ) ); },
    smoothCubicCurveToRelative: function( cp2x, cp2y, x, y ) { return this.cubicCurveToPoint( this.getSmoothCubicControlPoint(), v( cp2x, cp2y ).plus( this.getRelativePoint() ), v( x, y ).plus( this.getRelativePoint() ) ); },
    cubicCurveToPoint: function( control1, control2, point ) {
      var shape = this;
      // see http://www.w3.org/TR/2dcontext/#dom-context-2d-quadraticcurveto
      this.ensure( control1 );
      var start = this.getLastSubpath().getLastPoint();
      var cubic = new Cubic( start, control1, control2, point );

      var nondegenerateSegments = cubic.getNondegenerateSegments();
      _.each( nondegenerateSegments, function( segment ) {
        shape.addSegmentAndBounds( segment );
      } );
      this.getLastSubpath().addPoint( point );

      this.setCubicControlPoint( control2 );

      return this;
    },

    arc: function( centerX, centerY, radius, startAngle, endAngle, anticlockwise ) { return this.arcPoint( v( centerX, centerY ), radius, startAngle, endAngle, anticlockwise ); },
    arcPoint: function( center, radius, startAngle, endAngle, anticlockwise ) {
      // see http://www.w3.org/TR/2dcontext/#dom-context-2d-arc

      var arc = new Arc( center, radius, startAngle, endAngle, anticlockwise );

      // we are assuming that the normal conditions were already met (or exceptioned out) so that these actually work with canvas
      var startPoint = arc.getStart();
      var endPoint = arc.getEnd();

      // if there is already a point on the subpath, and it is different than our starting point, draw a line between them
      if ( this.hasSubpaths() && this.getLastSubpath().getLength() > 0 && !startPoint.equals( this.getLastSubpath().getLastPoint(), 0 ) ) {
        this.addSegmentAndBounds( new Line( this.getLastSubpath().getLastPoint(), startPoint ) );
      }

      if ( !this.hasSubpaths() ) {
        this.addSubpath( new Subpath() );
      }

      // technically the Canvas spec says to add the start point, so we do this even though it is probably completely unnecessary (there is no conditional)
      this.getLastSubpath().addPoint( startPoint );
      this.getLastSubpath().addPoint( endPoint );

      this.addSegmentAndBounds( arc );
      this.resetControlPoints();

      return this;
    },

    ellipticalArc: function( centerX, centerY, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise ) { return this.ellipticalArcPoint( v( centerX, centerY ), radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise ); },
    ellipticalArcPoint: function( center, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise ) {
      // see http://www.w3.org/TR/2dcontext/#dom-context-2d-arc

      var ellipticalArc = new EllipticalArc( center, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise );

      // we are assuming that the normal conditions were already met (or exceptioned out) so that these actually work with canvas
      var startPoint = ellipticalArc.start;
      var endPoint = ellipticalArc.end;

      // if there is already a point on the subpath, and it is different than our starting point, draw a line between them
      if ( this.hasSubpaths() && this.getLastSubpath().getLength() > 0 && !startPoint.equals( this.getLastSubpath().getLastPoint(), 0 ) ) {
        this.addSegmentAndBounds( new Line( this.getLastSubpath().getLastPoint(), startPoint ) );
      }

      if ( !this.hasSubpaths() ) {
        this.addSubpath( new Subpath() );
      }

      // technically the Canvas spec says to add the start point, so we do this even though it is probably completely unnecessary (there is no conditional)
      this.getLastSubpath().addPoint( startPoint );
      this.getLastSubpath().addPoint( endPoint );

      this.addSegmentAndBounds( ellipticalArc );
      this.resetControlPoints();

      return this;
    },

    close: function() {
      if ( this.hasSubpaths() ) {
        var previousPath = this.getLastSubpath();
        var nextPath = new Subpath();

        previousPath.close();
        this.addSubpath( nextPath );
        nextPath.addPoint( previousPath.getFirstPoint() );
      }
      this.resetControlPoints();
      return this;
    },

    // matches SVG's elliptical arc from http://www.w3.org/TR/SVG/paths.html
    ellipticalArcToRelative: function( radiusX, radiusY, rotation, largeArc, sweep, x, y ) {
      var relativePoint = this.getRelativePoint();
      return this.ellipticalArcTo( radiusX, radiusY, rotation, largeArc, sweep, x + relativePoint.x, y + relativePoint.y );
    },
    ellipticalArcTo: function( radiusX, radiusY, rotation, largeArc, sweep, x, y ) {
      throw new Error( 'ellipticalArcTo unimplemented' );
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
        return this.arcPoint( center, radius, 0, Math.PI * 2, false );
      }
      else {
        // circle( centerX, centerY, radius )
        return this.arcPoint( p( centerX, centerY ), radius, 0, Math.PI * 2, false );
      }
    },

    /*
     * Draws an ellipse using the ellipticalArc() call with the following parameters:
     * ellipse( center, radiusX, radiusY, rotation ) // center is a Vector2
     * ellipse( centerX, centerY, radiusX, radiusY, rotation )
     *
     * The rotation is about the centerX, centerY.
     */
    ellipse: function( centerX, centerY, radiusX, radiusY, rotation ) {
      // TODO: separate into ellipse() and ellipsePoint()?
      // TODO: Ellipse/EllipticalArc has a mess of parameters. Consider parameter object, or double-check parameter handling
      if ( typeof centerX === 'object' ) {
        // ellipse( center, radiusX, radiusY, rotation )
        var center = centerX;
        rotation = radiusY;
        radiusY = radiusX;
        radiusX = centerY;
        return this.ellipticalArcPoint( center, radiusX, radiusY, rotation || 0, 0, Math.PI * 2, false );
      }
      else {
        // ellipse( centerX, centerY, radiusX, radiusY, rotation )
        return this.ellipticalArcPoint( v( centerX, centerY ), radiusX, radiusY, rotation || 0, 0, Math.PI * 2, false );
      }
    },

    rect: function( x, y, width, height ) {
      var subpath = new Subpath();
      this.addSubpath( subpath );
      subpath.addPoint( v( x, y ) );
      subpath.addPoint( v( x + width, y ) );
      subpath.addPoint( v( x + width, y + height ) );
      subpath.addPoint( v( x, y + height ) );
      this.addSegmentAndBounds( new Line( subpath.points[ 0 ], subpath.points[ 1 ] ) );
      this.addSegmentAndBounds( new Line( subpath.points[ 1 ], subpath.points[ 2 ] ) );
      this.addSegmentAndBounds( new Line( subpath.points[ 2 ], subpath.points[ 3 ] ) );
      subpath.close();
      this.addSubpath( new Subpath() );
      this.getLastSubpath().addPoint( v( x, y ) );
      assert && assert( !isNaN( this.bounds.getX() ) );
      this.resetControlPoints();

      return this;
    },

    //Create a round rectangle. All arguments are number.
    roundRect: function( x, y, width, height, arcw, arch ) {
      var lowX = x + arcw;
      var highX = x + width - arcw;
      var lowY = y + arch;
      var highY = y + height - arch;
      // if ( true ) {
      if ( arcw === arch ) {
        // we can use circular arcs, which have well defined stroked offsets
        this
          .arc( highX, lowY, arcw, -Math.PI / 2, 0, false )
          .arc( highX, highY, arcw, 0, Math.PI / 2, false )
          .arc( lowX, highY, arcw, Math.PI / 2, Math.PI, false )
          .arc( lowX, lowY, arcw, Math.PI, Math.PI * 3 / 2, false )
          .close();
      }
      else {
        // we have to resort to elliptical arcs
        this
          .ellipticalArc( highX, lowY, arcw, arch, 0, -Math.PI / 2, 0, false )
          .ellipticalArc( highX, highY, arcw, arch, 0, 0, Math.PI / 2, false )
          .ellipticalArc( lowX, highY, arcw, arch, 0, Math.PI / 2, Math.PI, false )
          .ellipticalArc( lowX, lowY, arcw, arch, 0, Math.PI, Math.PI * 3 / 2, false )
          .close();
      }
      return this;
    },

    polygon: function( vertices ) {
      var length = vertices.length;
      if ( length > 0 ) {
        this.moveToPoint( vertices[ 0 ] );
        for ( var i = 1; i < length; i++ ) {
          this.lineToPoint( vertices[ i ] );
        }
      }
      return this.close();
    },

    /**
     * This is a convenience function that allows to generate Cardinal splines
     * from a position array. Cardinal spline differs from Bezier curves in that all
     * defined points on a Cardinal spline are on the path itself.
     *
     * It includes a tension parameter to allow the client to specify how tightly
     * the path interpolates between points. One can think of the tension as the tension in
     * a rubber band around pegs. however unlike a rubber band the tension can be negative.
     * the tension ranges from -1 to 1
     *
     * @param {Array.<Vector2>} positions
     * @param {Object} [options] - see documentation below
     * @returns {Shape}
     */
    cardinalSpline: function( positions, options ) {
      options = _.extend( {
        // the tension parameter controls how smoothly the curve turns through its
        // control points. For a Catmull-Rom curve the tension is zero.
        // the tension should range from  -1 to 1
        tension: 0,

        // is the resulting shape forming a closed line?
        isClosedLineSegments: false
      }, options );

      assert && assert( options.tension < 1 && options.tension > -1, ' the tension goes from -1 to 1 ' );

      var pointNumber = positions.length; // number of points in the array

      // if the line is open, there is one less segments than point vectors
      var segmentNumber = ( options.isClosedLineSegments ) ? pointNumber : pointNumber - 1;

      for ( var i = 0; i < segmentNumber; i++ ) {
        var cardinalPoints; // {Array.<Vector2>} cardinal points Array
        if ( i === 0 && !options.isClosedLineSegments ) {
          cardinalPoints = [
            positions[ 0 ],
            positions[ 0 ],
            positions[ 1 ],
            positions[ 2 ] ];
        }
        else if ( (i === segmentNumber - 1) && !options.isClosedLineSegments ) {
          cardinalPoints = [
            positions[ i - 1 ],
            positions[ i ],
            positions[ i + 1 ],
            positions[ i + 1 ] ];
        }
        else {
          cardinalPoints = [
            positions[ ( i - 1 + pointNumber ) % pointNumber ],
            positions[ i % pointNumber ],
            positions[ ( i + 1 ) % pointNumber ],
            positions[ ( i + 2 ) % pointNumber ] ];
        }

        // Cardinal Spline to Cubic Bezier conversion matrix
        //    0                 1             0            0
        //  (-1+tension)/6      1      (1-tension)/6       0
        //    0            (1-tension)/6      1       (-1+tension)/6
        //    0                 0             1           0

        // {Array.<Vector2>} bezier points Array
        var bezierPoints = [
          cardinalPoints[ 1 ],
          weightedSplineVector( cardinalPoints[ 0 ], cardinalPoints[ 1 ], cardinalPoints[ 2 ], options.tension ),
          weightedSplineVector( cardinalPoints[ 3 ], cardinalPoints[ 2 ], cardinalPoints[ 1 ], options.tension ),
          cardinalPoints[ 2 ]
        ];

        // special operations on the first point
        if ( i === 0 ) {
          this.ensure( bezierPoints[ 0 ] );
          this.getLastSubpath().addPoint( bezierPoints[ 0 ] );
        }

        this.cubicCurveToPoint( bezierPoints[ 1 ], bezierPoints[ 2 ], bezierPoints[ 3 ] );
      }

      return this;
    },

    copy: function() {
      // copy each individual subpath, so future modifications to either Shape doesn't affect the other one
      return new Shape( _.map( this.subpaths, function( subpath ) { return subpath.copy(); } ), this.bounds );
    },

    // write out this shape's path to a canvas 2d context. does NOT include the beginPath()!
    writeToContext: function( context ) {
      var len = this.subpaths.length;
      for ( var i = 0; i < len; i++ ) {
        this.subpaths[ i ].writeToContext( context );
      }
    },

    // returns something like "M150 0 L75 200 L225 200 Z" for a triangle
    getSVGPath: function() {
      var string = '';
      var len = this.subpaths.length;
      for ( var i = 0; i < len; i++ ) {
        var subpath = this.subpaths[ i ];
        if ( subpath.isDrawable() ) {
          // since the commands after this are relative to the previous 'point', we need to specify a move to the initial point
          var startPoint = subpath.segments[ 0 ].start;
          assert && assert( startPoint.equalsEpsilon( subpath.getFirstPoint(), 0.00001 ) ); // sanity check
          string += 'M ' + kite.svgNumber( startPoint.x ) + ' ' + kite.svgNumber( startPoint.y ) + ' ';

          for ( var k = 0; k < subpath.segments.length; k++ ) {
            string += subpath.segments[ k ].getSVGPathFragment() + ' ';
          }

          if ( subpath.isClosed() ) {
            string += 'Z ';
          }
        }
      }
      return string;
    },

    // return a new Shape that is transformed by the associated matrix
    transformed: function( matrix ) {
      // TODO: allocation reduction
      var subpaths = _.map( this.subpaths, function( subpath ) { return subpath.transformed( matrix ); } );
      var bounds = _.reduce( subpaths, function( bounds, subpath ) { return bounds.union( subpath.bounds ); }, Bounds2.NOTHING );
      return new Shape( subpaths, bounds );
    },

    /*
     * Provided options (see Segment.nonlinearTransformed)
     * - minLevels:                       how many levels to force subdivisions
     * - maxLevels:                       prevent subdivision past this level
     * - distanceEpsilon (optional null): controls level of subdivision by attempting to ensure a maximum (squared) deviation from the curve. smaller => more subdivision
     * - curveEpsilon (optional null):    controls level of subdivision by attempting to ensure a maximum curvature change between segments. smaller => more subdivision
     * -   OR includeCurvature:           {Boolean}, whether to include a default curveEpsilon (usually off by default)
     * - pointMap (optional):             function( Vector2 ) : Vector2, represents a (usually non-linear) transformation applied
     * - methodName (optional):           if the method name is found on the segment, it is called with the expected signature function( options ) : Array[Segment]
     *                                    instead of using our brute-force logic. Supports optimizations for custom non-linear transforms (like polar coordinates)
     */
    nonlinearTransformed: function( options ) {
      // defaults
      options = _.extend( {
        minLevels: 0,
        maxLevels: 7,
        distanceEpsilon: 0.16, // NOTE: this will change when the Shape is scaled, since this is a threshold for the square of a distance value
        curveEpsilon: ( options && options.includeCurvature ) ? 0.002 : null
      }, options );

      // TODO: allocation reduction
      var subpaths = _.map( this.subpaths, function( subpath ) { return subpath.nonlinearTransformed( options ); } );
      var bounds = _.reduce( subpaths, function( bounds, subpath ) { return bounds.union( subpath.bounds ); }, Bounds2.NOTHING );
      return new Shape( subpaths, bounds );
    },

    /*
     * Maps points by treating their x coordinate as polar angle, and y coordinate as polar magnitude.
     * See http://en.wikipedia.org/wiki/Polar_coordinate_system
     *
     * Please see Shape.nonlinearTransformed for more documentation on adaptive discretization options (minLevels, maxLevels, distanceEpsilon, curveEpsilon)
     *
     * Example: A line from (0,10) to (pi,10) will be transformed to a circular arc from (10,0) to (-10,0) passing through (0,10).
     */
    polarToCartesian: function( options ) {
      return this.nonlinearTransformed( _.extend( {
        pointMap: function( p ) {
          return Vector2.createPolar( p.y, p.x );
          // return new Vector2( p.y * Math.cos( p.x ), p.y * Math.sin( p.x ) );
        },
        methodName: 'polarToCartesian' // this will be called on Segments if it exists to do more optimized conversion (see Line)
      }, options ) );
    },

    /*
     * Converts each segment into lines, using an adaptive (midpoint distance subdivision) method.
     *
     * NOTE: uses nonlinearTransformed method internally, but since we don't provide a pointMap or methodName, it won't create anything but line segments.
     * See nonlinearTransformed for documentation of options
     */
    toPiecewiseLinear: function( options ) {
      assert && assert( !options.pointMap, 'No pointMap for toPiecewiseLinear allowed, since it could create non-linear segments' );
      assert && assert( !options.methodName, 'No methodName for toPiecewiseLinear allowed, since it could create non-linear segments' );
      return this.nonlinearTransformed( options );
    },

    containsPoint: function( point ) {
      // we pick a ray, and determine the winding number over that ray. if the number of segments crossing it CCW == number of segments crossing it CW, then the point is contained in the shape
      var ray = new Ray2( point, Vector2.X_UNIT );

      return this.windingIntersection( ray ) !== 0;
    },

    intersection: function( ray ) {
      var hits = [];
      var numSubpaths = this.subpaths.length;
      for ( var i = 0; i < numSubpaths; i++ ) {
        var subpath = this.subpaths[ i ];

        if ( subpath.isDrawable() ) {
          var numSegments = subpath.segments.length;
          for ( var k = 0; k < numSegments; k++ ) {
            var segment = subpath.segments[ k ];
            hits = hits.concat( segment.intersection( ray ) );
          }

          if ( subpath.hasClosingSegment() ) {
            hits = hits.concat( subpath.getClosingSegment().intersection( ray ) );
          }
        }
      }
      return _.sortBy( hits, function( hit ) { return hit.distance; } );
    },

    windingIntersection: function( ray ) {
      var wind = 0;

      var numSubpaths = this.subpaths.length;
      for ( var i = 0; i < numSubpaths; i++ ) {
        var subpath = this.subpaths[ i ];

        if ( subpath.isDrawable() ) {
          var numSegments = subpath.segments.length;
          for ( var k = 0; k < numSegments; k++ ) {
            wind += subpath.segments[ k ].windingIntersection( ray );
          }

          // handle the implicit closing line segment
          if ( subpath.hasClosingSegment() ) {
            wind += subpath.getClosingSegment().windingIntersection( ray );
          }
        }
      }

      return wind;
    },

    /**
     * Whether the path of the Shape intersects (or is contained in) the provided bounding box.
     * Computed by checking intersections with all four edges of the bounding box, or whether the Shape is totally
     * contained within the bounding box.
     *
     * @param {Bounds2} bounds
     */
    intersectsBounds: function( bounds ) {
      // If the bounding box completely surrounds our shape, it intersects the bounds
      if ( this.bounds.intersection( bounds ).equals( this.bounds ) ) {
        return true;
      }

      // rays for hit testing along the bounding box edges
      var minHorizontalRay = new Ray2( new Vector2( bounds.minX, bounds.minY ), new Vector2( 1, 0 ) );
      var minVerticalRay = new Ray2( new Vector2( bounds.minX, bounds.minY ), new Vector2( 0, 1 ) );
      var maxHorizontalRay = new Ray2( new Vector2( bounds.maxX, bounds.maxY ), new Vector2( -1, 0 ) );
      var maxVerticalRay = new Ray2( new Vector2( bounds.maxX, bounds.maxY ), new Vector2( 0, -1 ) );

      var hitPoint;
      var i;
      // TODO: could optimize to intersect differently so we bail sooner
      var horizontalRayIntersections = this.intersection( minHorizontalRay ).concat( this.intersection( maxHorizontalRay ) );
      for ( i = 0; i < horizontalRayIntersections.length; i++ ) {
        hitPoint = horizontalRayIntersections[ i ].point;
        if ( hitPoint.x >= bounds.minX && hitPoint.x <= bounds.maxX ) {
          return true;
        }
      }

      var verticalRayIntersections = this.intersection( minVerticalRay ).concat( this.intersection( maxVerticalRay ) );
      for ( i = 0; i < verticalRayIntersections.length; i++ ) {
        hitPoint = verticalRayIntersections[ i ].point;
        if ( hitPoint.y >= bounds.minY && hitPoint.y <= bounds.maxY ) {
          return true;
        }
      }

      // not contained, and no intersections with the sides of the bounding box
      return false;
    },

    // returns a new Shape that is an outline of the stroked path of this current Shape. currently not intended to be nested (doesn't do intersection computations yet)
    // TODO: rename stroked( lineStyles )
    getStrokedShape: function( lineStyles ) {
      var subpaths = [];
      var bounds = Bounds2.NOTHING.copy();
      var subLen = this.subpaths.length;
      for ( var i = 0; i < subLen; i++ ) {
        var subpath = this.subpaths[ i ];
        var strokedSubpath = subpath.stroked( lineStyles );
        subpaths = subpaths.concat( strokedSubpath );
      }
      subLen = subpaths.length;
      for ( i = 0; i < subLen; i++ ) {
        bounds.includeBounds( subpaths[ i ].bounds );
      }
      return new Shape( subpaths, bounds );
    },

    // {experimental!}
    getOffsetShape: function( distance ) {
      // TODO: abstract away this type of behavior
      var subpaths = [];
      var bounds = Bounds2.NOTHING.copy();
      var subLen = this.subpaths.length;
      for ( var i = 0; i < subLen; i++ ) {
        subpaths.push( this.subpaths[ i ].offset( distance ) );
      }
      subLen = subpaths.length;
      for ( i = 0; i < subLen; i++ ) {
        bounds.includeBounds( subpaths[ i ].bounds );
      }
      return new Shape( subpaths, bounds );
    },

    getBounds: function() {
      if ( this._bounds === null ) {
        var bounds = Bounds2.NOTHING.copy();
        _.each( this.subpaths, function( subpath ) {
          bounds.includeBounds( subpath.getBounds() );
        } );
        this._bounds = bounds;
      }
      return this._bounds;
    },
    get bounds() { return this.getBounds(); },

    getStrokedBounds: function( lineStyles ) {
      // Check if all of our segments end vertically or horizontally AND our drawable subpaths are all closed. If so,
      // we can apply a bounds dilation.
      var areStrokedBoundsDilated = true;
      for ( var i = 0; i < this.subpaths.length; i++ ) {
        var subpath = this.subpaths[ i ];

        // If a subpath with any segments is NOT closed, line-caps will apply. We can't make the simplification in this
        // case.
        if ( subpath.isDrawable() && !subpath.isClosed() ) {
          areStrokedBoundsDilated = false;
          break;
        }
        for ( var j = 0; j < subpath.segments.length; j++ ) {
          var segment = subpath.segments[ j ];
          if ( !segment.areStrokedBoundsDilated() ) {
            areStrokedBoundsDilated = false;
            break;
          }
        }
      }

      if ( areStrokedBoundsDilated ) {
        return this.bounds.dilated( lineStyles.lineWidth / 2 );
      }
      else {
        return this.bounds.union( this.getStrokedShape( lineStyles ).bounds );
      }
    },

    getBoundsWithTransform: function( matrix, lineStyles ) {
      // if we don't need to handle rotation/shear, don't use the extra effort!
      if ( matrix.isAxisAligned() ) {
        return this.getStrokedBounds( lineStyles );
      }

      var bounds = Bounds2.NOTHING.copy();

      var numSubpaths = this.subpaths.length;
      for ( var i = 0; i < numSubpaths; i++ ) {
        var subpath = this.subpaths[ i ];
        bounds.includeBounds( subpath.getBoundsWithTransform( matrix ) );
      }

      if ( lineStyles ) {
        bounds.includeBounds( this.getStrokedShape( lineStyles ).getBoundsWithTransform( matrix ) );
      }

      return bounds;
    },

    /**
     * Should be called after mutating the x/y of Vector2 points that were passed in to various Shape calls, so that
     * derived information computed (bounds, etc.) will be correct, and any clients (e.g. Scenery Paths) will be
     * notified of the updates.
     */
    invalidatePoints: function() {
      this._invalidatingPoints = true;

      var numSubpaths = this.subpaths.length;
      for ( var i = 0; i < numSubpaths; i++ ) {
        this.subpaths[ i ].invalidatePoints();
      }

      this._invalidatingPoints = false;
      this.invalidate();
    },

    toString: function() {
      // TODO: consider a more verbose but safer way?
      return 'new kite.Shape( \'' + this.getSVGPath() + '\' )';
    },

    /*---------------------------------------------------------------------------*
     * Internal subpath computations
     *----------------------------------------------------------------------------*/

    // @private
    invalidate: function() {
      if ( !this._invalidatingPoints ) {
        this._bounds = null;

        this.trigger0( 'invalidated' );
      }
    },

    // @private
    addSegmentAndBounds: function( segment ) {
      this.getLastSubpath().addSegment( segment );
      this.invalidate();
    },

    // @private
    ensure: function( point ) {
      if ( !this.hasSubpaths() ) {
        this.addSubpath( new Subpath() );
        this.getLastSubpath().addPoint( point );
      }
    },

    // @private
    addSubpath: function( subpath ) {
      this.subpaths.push( subpath );

      // listen to when the subpath is invalidated (will cause bounds recomputation here)
      subpath.onStatic( 'invalidated', this._invalidateListener );

      this.invalidate();

      return this; // allow chaining
    },

    // @private
    hasSubpaths: function() {
      return this.subpaths.length > 0;
    },

    // @private
    getLastSubpath: function() {
      return _.last( this.subpaths );
    },

    // @private - gets the last point in the last subpath, or null if it doesn't exist
    getLastPoint: function() {
      return this.hasSubpaths() ? this.getLastSubpath().getLastPoint() : null;
    },

    // @private
    getLastSegment: function() {
      if ( !this.hasSubpaths() ) { return null; }

      var subpath = this.getLastSubpath();
      if ( !subpath.isDrawable() ) { return null; }

      return subpath.getLastSegment();
    },

    // @private - returns the point to be used for smooth quadratic segments
    getSmoothQuadraticControlPoint: function() {
      var lastPoint = this.getLastPoint();

      if ( this.lastQuadraticControlPoint ) {
        return lastPoint.plus( lastPoint.minus( this.lastQuadraticControlPoint ) );
      }
      else {
        return lastPoint;
      }
    },

    // @private - returns the point to be used for smooth cubic segments
    getSmoothCubicControlPoint: function() {
      var lastPoint = this.getLastPoint();

      if ( this.lastCubicControlPoint ) {
        return lastPoint.plus( lastPoint.minus( this.lastCubicControlPoint ) );
      }
      else {
        return lastPoint;
      }
    },

    // @private
    getRelativePoint: function() {
      var lastPoint = this.getLastPoint();
      return lastPoint ? lastPoint : Vector2.ZERO;
    }
  } );

  /*---------------------------------------------------------------------------*
   * Shape shortcuts
   *----------------------------------------------------------------------------*/

  Shape.rectangle = function( x, y, width, height ) {
    return new Shape().rect( x, y, width, height );
  };
  Shape.rect = Shape.rectangle;

  // Create a round rectangle {Shape}, with {Number} arguments. Uses circular or elliptical arcs if given.
  Shape.roundRect = function( x, y, width, height, arcw, arch ) {
    return new Shape().roundRect( x, y, width, height, arcw, arch );
  };
  Shape.roundRectangle = Shape.roundRect;

  /**
   * Creates a rounded rectangle, where each corner can have a different radius. The radii default to 0, and may be set
   * using topLeft, topRight, bottomLeft and bottomRight in the options.
   * @public

   * E.g.:
   *
   * var cornerRadius = 20;
   * var rect = Shape.roundedRectangleWithRadii( 0, 0, 200, 100, {
   *   topLeft: cornerRadius,
   *   topRight: cornerRadius
   * } );
   *
   * @param {number} x - Left edge location
   * @param {number} y - Top edge location
   * @param {number} width - Width of rectangle
   * @param {number} height - Height of rectangle
   * @param {Object} [cornerRadii] - Optional object with potential radii for each corner.
   */
  Shape.roundedRectangleWithRadii = function( x, y, width, height, cornerRadii ) {
    // defaults to 0 (not using _.extends, since we reference each multiple times)
    var topLeftRadius = cornerRadii && cornerRadii.topLeft || 0;
    var topRightRadius = cornerRadii && cornerRadii.topRight || 0;
    var bottomLeftRadius = cornerRadii && cornerRadii.bottomLeft || 0;
    var bottomRightRadius = cornerRadii && cornerRadii.bottomRight || 0;

    // type and constraint assertions
    assert && assert( typeof x === 'number' && isFinite( x ), 'Non-finite x' );
    assert && assert( typeof y === 'number' && isFinite( y ), 'Non-finite y' );
    assert && assert( typeof width === 'number' && width >= 0 && isFinite( width ), 'Negative or non-finite width' );
    assert && assert( typeof height === 'number' && height >= 0 && isFinite( height ), 'Negative or non-finite height' );
    assert && assert( typeof topLeftRadius === 'number' && topLeftRadius >= 0 && isFinite( topLeftRadius ),
      'Invalid topLeft' );
    assert && assert( typeof topRightRadius === 'number' && topRightRadius >= 0 && isFinite( topRightRadius ),
      'Invalid topRight' );
    assert && assert( typeof bottomLeftRadius === 'number' && bottomLeftRadius >= 0 && isFinite( bottomLeftRadius ),
      'Invalid bottomLeft' );
    assert && assert( typeof bottomRightRadius === 'number' && bottomRightRadius >= 0 && isFinite( bottomRightRadius ),
      'Invalid bottomRight' );

    // verify there is no overlap between corners
    assert && assert( topLeftRadius + topRightRadius <= width, 'Corner overlap on top edge' );
    assert && assert( bottomLeftRadius + bottomRightRadius <= width, 'Corner overlap on bottom edge' );
    assert && assert( topLeftRadius + bottomLeftRadius <= height, 'Corner overlap on left edge' );
    assert && assert( topRightRadius + bottomRightRadius <= height, 'Corner overlap on right edge' );

    var shape = new kite.Shape();
    var right = x + width;
    var bottom = y + height;

    // To draw the rounded rectangle, we use the implicit "line from last segment to next segment" and the close() for
    // all of the straight line edges between arcs, or lineTo the corner.

    if ( bottomRightRadius > 0 ) {
      shape.arc( right - bottomRightRadius, bottom - bottomRightRadius, bottomRightRadius, 0, Math.PI / 2, false );
    }
    else {
      shape.moveTo( right, bottom );
    }

    if ( bottomLeftRadius > 0 ) {
      shape.arc( x + bottomLeftRadius, bottom - bottomLeftRadius, bottomLeftRadius, Math.PI / 2, Math.PI, false );
    }
    else {
      shape.lineTo( x, bottom );
    }

    if ( topLeftRadius > 0 ) {
      shape.arc( x + topLeftRadius, y + topLeftRadius, topLeftRadius, Math.PI, 3 * Math.PI / 2, false );
    }
    else {
      shape.lineTo( x, y );
    }

    if ( topRightRadius > 0 ) {
      shape.arc( right - topRightRadius, y + topRightRadius, topRightRadius, 3 * Math.PI / 2, 2 * Math.PI, false );
    }
    else {
      shape.lineTo( right, y );
    }

    shape.close();

    return shape;
  };

  Shape.polygon = function( vertices ) {
    return new Shape().polygon( vertices );
  };

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
      return new Shape().moveToPoint( a ).lineToPoint( b );
    }
  };

  Shape.regularPolygon = function( sides, radius ) {
    var shape = new Shape();
    _.each( _.range( sides ), function( k ) {
      var point = Vector2.createPolar( radius, 2 * Math.PI * k / sides );
      ( k === 0 ) ? shape.moveToPoint( point ) : shape.lineToPoint( point );
    } );
    return shape.close();
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
   * Supports ellipse( centerX, centerY, radiusX, radiusY, rotation ), ellipse( center, radiusX, radiusY, rotation ), and ellipse( radiusX, radiusY, rotation )
   * with the center default to 0,0 and rotation of 0.  The rotation is about the centerX, centerY.
   */
  Shape.ellipse = function( centerX, centerY, radiusX, radiusY, rotation ) {
    // TODO: Ellipse/EllipticalArc has a mess of parameters. Consider parameter object, or double-check parameter handling
    if ( radiusY === undefined ) {
      // ellipse( radiusX, radiusY ), center = 0,0
      return new Shape().ellipse( 0, 0, centerX, centerY, radiusX );
    }
    return new Shape().ellipse( centerX, centerY, radiusX, radiusY, rotation ).close();
  };

  // supports both arc( centerX, centerY, radius, startAngle, endAngle, anticlockwise ) and arc( center, radius, startAngle, endAngle, anticlockwise )
  Shape.arc = function( centerX, centerY, radius, startAngle, endAngle, anticlockwise ) {
    return new Shape().arc( centerX, centerY, radius, startAngle, endAngle, anticlockwise );
  };

  return Shape;
} );
