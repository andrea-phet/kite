// Copyright 2013-2015, University of Colorado Boulder

/**
 * Quadratic Bezier segment
 *
 * Good reference: http://cagd.cs.byu.edu/~557/text/ch2.pdf
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( function( require ) {
  'use strict';

  var inherit = require( 'PHET_CORE/inherit' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Matrix3 = require( 'DOT/Matrix3' );
  var Util = require( 'DOT/Util' );
  var kite = require( 'KITE/kite' );
  var Segment = require( 'KITE/segments/Segment' );

  // constants
  var solveQuadraticRootsReal = Util.solveQuadraticRootsReal;
  var arePointsCollinear = Util.arePointsCollinear;

  function Quadratic( start, control, end ) {
    Segment.call( this );

    this._start = start;
    this._control = control;
    this._end = end;

    this.invalidate();
  }

  kite.register( 'Quadratic', Quadratic );

  inherit( Segment, Quadratic, {

    degree: 2,

    // @public - Clears cached information, should be called when any of the 'constructor arguments' are mutated.
    invalidate: function() {
      // Lazily-computed derived information
      this._startTangent = null; // {Vector2 | null}
      this._endTangent = null; // {Vector2 | null}
      this._tCriticalX = null; // {number | null} T where x-derivative is 0 (replaced with NaN if not in range)
      this._tCriticalY = null; // {number | null} T where y-derivative is 0 (replaced with NaN if not in range)

      this._bounds = null; // {Bounds2 | null}

      this.trigger0( 'invalidated' );
    },

    getStartTangent: function() {
      if ( this._startTangent === null ) {
        var controlIsStart = this._start.equals( this._control );
        // TODO: allocation reduction
        this._startTangent = controlIsStart ?
                             this._end.minus( this._start ).normalized() :
                             this._control.minus( this._start ).normalized();
      }
      return this._startTangent;
    },
    get startTangent() { return this.getStartTangent(); },

    getEndTangent: function() {
      if ( this._endTangent === null ) {
        var controlIsEnd = this._end.equals( this._control );
        // TODO: allocation reduction
        this._endTangent = controlIsEnd ?
                           this._end.minus( this._start ).normalized() :
                           this._end.minus( this._control ).normalized();
      }
      return this._endTangent;
    },
    get endTangent() { return this.getEndTangent(); },

    getTCriticalX: function() {
      // compute x where the derivative is 0 (used for bounds and other things)
      if ( this._tCriticalX === null ) {
        this._tCriticalX = Quadratic.extremaT( this._start.x, this._control.x, this._end.x );
      }
      return this._tCriticalX;
    },
    get tCriticalX() { return this.getTCriticalX(); },

    getTCriticalY: function() {
      // compute y where the derivative is 0 (used for bounds and other things)
      if ( this._tCriticalY === null ) {
        this._tCriticalY = Quadratic.extremaT( this._start.y, this._control.y, this._end.y );
      }
      return this._tCriticalY;
    },
    get tCriticalY() { return this.getTCriticalY(); },

    getNondegenerateSegments: function() {
      var start = this._start;
      var control = this._control;
      var end = this._end;

      var startIsEnd = start.equals( end );
      var startIsControl = start.equals( control );
      var endIsControl = start.equals( control );

      if ( startIsEnd && startIsControl ) {
        // all same points
        return [];
      }
      else if ( startIsEnd ) {
        // this is a special collinear case, we basically line out to the farthest point and back
        var halfPoint = this.positionAt( 0.5 );
        return [
          new kite.Line( start, halfPoint ),
          new kite.Line( halfPoint, end )
        ];
      }
      else if ( arePointsCollinear( start, control, end ) ) {
        // if they are collinear, we can reduce to start->control and control->end, or if control is between, just one line segment
        // also, start !== end (handled earlier)
        if ( startIsControl || endIsControl ) {
          // just a line segment!
          return [ new kite.Line( start, end ) ]; // no extra nondegenerate check since start !== end
        }
        // now control point must be unique. we check to see if our rendered path will be outside of the start->end line segment
        var delta = end.minus( start );
        var p1d = control.minus( start ).dot( delta.normalized ) / delta.magnitude();
        var t = Quadratic.extremaT( 0, p1d, 1 );
        if ( !isNaN( t ) && t > 0 && t < 1 ) {
          // we have a local max inside the range, indicating that our extrema point is outside of start->end
          // we'll line to and from it
          var pt = this.positionAt( t );
          return _.flatten( [
            new kite.Line( start, pt ).getNondegenerateSegments(),
            new kite.Line( pt, end ).getNondegenerateSegments()
          ] );
        }
        else {
          // just provide a line segment, our rendered path doesn't go outside of this
          return [ new kite.Line( start, end ) ]; // no extra nondegenerate check since start !== end
        }
      }
      else {
        return [ this ];
      }
    },

    getBounds: function() {
      // calculate our temporary guaranteed lower bounds based on the end points
      if ( this._bounds === null ) {
        this._bounds = new Bounds2( Math.min( this._start.x, this._end.x ), Math.min( this._start.y, this._end.y ), Math.max( this._start.x, this._end.x ), Math.max( this._start.y, this._end.y ) );

        // compute x and y where the derivative is 0, so we can include this in the bounds
        var tCriticalX = this.getTCriticalX();
        var tCriticalY = this.getTCriticalY();

        if ( !isNaN( tCriticalX ) && tCriticalX > 0 && tCriticalX < 1 ) {
          this._bounds = this._bounds.withPoint( this.positionAt( tCriticalX ) );
        }
        if ( !isNaN( tCriticalY ) && tCriticalY > 0 && tCriticalY < 1 ) {
          this._bounds = this._bounds.withPoint( this.positionAt( tCriticalY ) );
        }
      }
      return this._bounds;
    },
    get bounds() { return this.getBounds(); },

    // can be described from t=[0,1] as: (1-t)^2 start + 2(1-t)t control + t^2 end
    positionAt: function( t ) {
      var mt = 1 - t;
      // TODO: allocation reduction
      return this._start.times( mt * mt ).plus( this._control.times( 2 * mt * t ) ).plus( this._end.times( t * t ) );
    },

    // derivative: 2(1-t)( control - start ) + 2t( end - control )
    tangentAt: function( t ) {
      // TODO: allocation reduction
      return this._control.minus( this._start ).times( 2 * ( 1 - t ) ).plus( this._end.minus( this._control ).times( 2 * t ) );
    },

    curvatureAt: function( t ) {
      // see http://cagd.cs.byu.edu/~557/text/ch2.pdf p31
      // TODO: remove code duplication with Cubic
      var epsilon = 0.0000001;
      if ( Math.abs( t - 0.5 ) > 0.5 - epsilon ) {
        var isZero = t < 0.5;
        var p0 = isZero ? this._start : this._end;
        var p1 = this._control;
        var p2 = isZero ? this._end : this._start;
        var d10 = p1.minus( p0 );
        var a = d10.magnitude();
        var h = ( isZero ? -1 : 1 ) * d10.perpendicular().normalized().dot( p2.minus( p1 ) );
        return ( h * ( this.degree - 1 ) ) / ( this.degree * a * a );
      }
      else {
        return this.subdivided( t, true )[ 0 ].curvatureAt( 1 );
      }
    },

    // see http://www.visgraf.impa.br/sibgrapi96/trabs/pdf/a14.pdf
    // and http://math.stackexchange.com/questions/12186/arc-length-of-bezier-curves for curvature / arc length

    offsetTo: function( r, reverse ) {
      // TODO: implement more accurate method at http://www.antigrain.com/research/adaptive_bezier/index.html
      // TODO: or more recently (and relevantly): http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf
      var curves = [ this ];

      // subdivide this curve
      var depth = 5; // generates 2^depth curves
      for ( var i = 0; i < depth; i++ ) {
        curves = _.flatten( _.map( curves, function( curve ) {
          return curve.subdivided( 0.5, true );
        } ) );
      }

      var offsetCurves = _.map( curves, function( curve ) { return curve.approximateOffset( r ); } );

      if ( reverse ) {
        offsetCurves.reverse();
        offsetCurves = _.map( offsetCurves, function( curve ) { return curve.reversed( true ); } );
      }

      return offsetCurves;
    },

    subdivided: function( t ) {
      // de Casteljau method
      var leftMid = this._start.blend( this._control, t );
      var rightMid = this._control.blend( this._end, t );
      var mid = leftMid.blend( rightMid, t );
      return [
        new kite.Quadratic( this._start, leftMid, mid ),
        new kite.Quadratic( mid, rightMid, this._end )
      ];
    },

    // elevation of this quadratic Bezier curve to a cubic Bezier curve
    degreeElevated: function() {
      // TODO: allocation reduction
      return new kite.Cubic(
        this._start,
        this._start.plus( this._control.timesScalar( 2 ) ).dividedScalar( 3 ),
        this._end.plus( this._control.timesScalar( 2 ) ).dividedScalar( 3 ),
        this._end
      );
    },

    reversed: function() {
      return new kite.Quadratic( this._end, this._control, this._start );
    },

    approximateOffset: function( r ) {
      return new kite.Quadratic(
        this._start.plus( ( this._start.equals( this._control ) ? this._end.minus( this._start ) : this._control.minus( this._start ) ).perpendicular().normalized().times( r ) ),
        this._control.plus( this._end.minus( this._start ).perpendicular().normalized().times( r ) ),
        this._end.plus( ( this._end.equals( this._control ) ? this._end.minus( this._start ) : this._end.minus( this._control ) ).perpendicular().normalized().times( r ) )
      );
    },

    getSVGPathFragment: function() {
      return 'Q ' + kite.svgNumber( this._control.x ) + ' ' + kite.svgNumber( this._control.y ) + ' ' +
             kite.svgNumber( this._end.x ) + ' ' + kite.svgNumber( this._end.y );
    },

    strokeLeft: function( lineWidth ) {
      return this.offsetTo( -lineWidth / 2, false );
    },

    strokeRight: function( lineWidth ) {
      return this.offsetTo( lineWidth / 2, true );
    },

    getInteriorExtremaTs: function() {
      // TODO: we assume here we are reduce, so that a criticalX doesn't equal a criticalY?
      var result = [];
      var epsilon = 0.0000000001; // TODO: general kite epsilon?

      var criticalX = this.getTCriticalX();
      var criticalY = this.getTCriticalY();

      if ( !isNaN( criticalX ) && criticalX > epsilon && criticalX < 1 - epsilon ) {
        result.push( this.tCriticalX );
      }
      if ( !isNaN( criticalY ) && criticalY > epsilon && criticalY < 1 - epsilon ) {
        result.push( this.tCriticalY );
      }
      return result.sort();
    },

    // returns the resultant winding number of this ray intersecting this segment.
    intersection: function( ray ) {
      var self = this;
      var result = [];

      // find the rotation that will put our ray in the direction of the x-axis so we can only solve for y=0 for intersections
      var inverseMatrix = Matrix3.rotation2( -ray.direction.angle() ).timesMatrix( Matrix3.translation( -ray.position.x, -ray.position.y ) );

      var p0 = inverseMatrix.timesVector2( this._start );
      var p1 = inverseMatrix.timesVector2( this._control );
      var p2 = inverseMatrix.timesVector2( this._end );

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
          var toHit = hitPoint.minus( ray.position );

          // make sure it's not behind the ray
          if ( toHit.dot( ray.direction ) > 0 ) {
            result.push( {
              distance: toHit.magnitude(),
              point: hitPoint,
              normal: perp.dot( ray.direction ) > 0 ? perp.negated() : perp,
              wind: ray.direction.perpendicular().dot( unitTangent ) < 0 ? 1 : -1
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
    },

    // assumes the current position is at start
    writeToContext: function( context ) {
      context.quadraticCurveTo( this._control.x, this._control.y, this._end.x, this._end.y );
    },

    transformed: function( matrix ) {
      return new kite.Quadratic( matrix.timesVector2( this._start ), matrix.timesVector2( this._control ), matrix.timesVector2( this._end ) );
    },

    // given the current curve parameterized by t, will return a curve parameterized by x where t = a * x + b
    reparameterized: function( a, b ) {
      // to the polynomial pt^2 + qt + r:
      var p = this._start.plus( this._end.plus( this._control.timesScalar( -2 ) ) );
      var q = this._control.minus( this._start ).timesScalar( 2 );
      var r = this._start;

      // to the polynomial alpha*x^2 + beta*x + gamma:
      var alpha = p.timesScalar( a * a );
      var beta = p.timesScalar( a * b ).timesScalar( 2 ).plus( q.timesScalar( a ) );
      var gamma = p.timesScalar( b * b ).plus( q.timesScalar( b ) ).plus( r );

      // back to the form start,control,end
      return new kite.Quadratic( gamma, beta.timesScalar( 0.5 ).plus( gamma ), alpha.plus( beta ).plus( gamma ) );
    }
  } );

  Segment.addInvalidatingGetterSetter( Quadratic, 'start' );
  Segment.addInvalidatingGetterSetter( Quadratic, 'control' );
  Segment.addInvalidatingGetterSetter( Quadratic, 'end' );

  // one-dimensional solution to extrema
  Quadratic.extremaT = function( start, control, end ) {
    // compute t where the derivative is 0 (used for bounds and other things)
    var divisorX = 2 * ( end - 2 * control + start );
    if ( divisorX !== 0 ) {
      return -2 * ( control - start ) / divisorX;
    }
    else {
      return NaN;
    }
  };

  return Quadratic;
} );
