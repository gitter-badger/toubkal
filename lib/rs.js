/*  rs.js
    
    Copyright (C) 2013-2015, Reactive Sets
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.
    
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    
    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
    ---
    
    RS: Connected Set namespace definition:
      extend()      : Copy own properties of source objects to a destination object 
      log()         : Date-stamped non-persistqnt log for debugging and profiling sent to console.log() if available.
      log.s()       : Object serializer for log based on JSON.Stringify() if console.log() if available.
      subclass()    : Simple subclassing one-liner
      add_exports() : Add exports to RS
    
    Copyright (C) 2013, 2014, Reactive Sets

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
!function( exports ) {
  "use strict";
  
  var Console_Logger, Lazy_Logger;
  
  if ( typeof require === 'function' ) {
    Console_Logger = require( './console_logger.js' );
    Lazy_Logger    = require( './lazy_logger.js'    );
  } else {
    Console_Logger = exports.Console_Logger;
    Lazy_Logger    = exports.Lazy_Logger;
  }
  
  var logger = Lazy_Logger( 'rs' );
  
  var log = logger.set_log_level( 6 ); // set to false to remove all log code after minification
  
  /* -------------------------------------------------------------------------------------------
     nil_function()
  */
  function nil_function() {}
  
  /* -------------------------------------------------------------------------------------------
     _log( message ), deprecated, use logger instead
     
     Date-stamped non-persistant log for debugging and profiling sent to console.log() if
     available.
     
     Example output:
       2013/01/12 08:39:52.698 - rs, module loaded
     
     Parameters:
       message (string): message to display
    ---
    
    _log.s( object [, replacer [, space] ] )
    
    Deprecated, logger uses plain objects, but one must provide toJSON() functions with no
    recursive structure.
    
    Object serializer for log based on JSON.Stringify() if console.log() if available.
    
    If console.log() is not available, _log.s() returns undefined so this function should not
    be used as a general purpose shortcut for JSON.Stringify().
  */
  var _log;
  
  if ( typeof console != "object" || typeof console.log != "function" ) {
    // Browsers that do not have a console.log()
    _log = nil_function;
    _log.s = _log.pretty = _log;
  } else {
    _log = Console_Logger();
    
    _log.s = JSON.stringify;
    
    _log.pretty = function( o ) {
      return JSON.stringify( o, void 0, '  ' );
    };
  }
  
  /* -------------------------------------------------------------------------------------------
     extend  ( destination [, source [, source ... ] ] )
     extend_2( destination [, source ] )
     
     Copy properties of source objects to a destination object.
     
     extend_2() is an optimized version of extend() that requires one non-null destination and
     one optional source object.
     
     Parameters:
       destination: returned object that will be augmented or ammended from source object
         own properties.
         With extend(): if null or undefined, destination will be set to a new object.
         With extend_2(): destination must be a non-null object or an exception will be thrown.
         
       source: object(s) which own properties are copied into destination.
         With extend(): If null or undefined, source is ignored
         With extend_2(): zero or one source object
     
     Optimizations:    
       If Object.prototype does not hold enumerable properties, optimized versions of extend()
       and extend_2() are provided that do not test if properties are owned.
       
       If Object.prototype holds at least one enumerable property, extend_2() equals the
       non-optimized version extend() which verifies if each property is owned.
       
       This would be the case if prior to loading rs.js, a library would augment
       Object.prototype without using Object.defineProperty() or defining a property using
       Object.defineProperty() with a descriptor setting 'enumerable' to 'true'.
  */
  var x = {}, not_owned_properties = [], extend, extend_2;
  
  for ( var p in x ) not_owned_properties.push( p );
  
  if ( not_owned_properties.length ) {
    logger( 4 // warning
      , '_', 'extend'
      , 'Some library added to Object.prototype these enumerable proerties'
      , not_owned_properties
    );
    
    // This version of extend therefore tests if properties are owned or not
    extend_2 = extend = function( d ) {
      d || ( d = {} );
      
      for ( var i = 0, l = arguments.length, s; ++i < l; )
        if ( s = arguments[ i ] )
          for ( var p in s )
            if ( s.hasOwnProperty( p ) )
              d[ p ] = s[ p ];
      
      return d;
    } // extend()
  } else {
    log && log( 6, '_', 'extend', 'No added enumerable properties in Object.prototype' );
    
    // It should therefore be safe to not test if properties are owned
    extend = function( d ) {
      d || ( d = {} );
      
      for ( var i = 0, l = arguments.length, s; ++i < l; )
        if ( s = arguments[ i ] )
          for ( var p in s ) d[ p ] = s[ p ];
      
      return d;
    } // extend()
    
    extend_2 = function( d, s ) {
      for ( var p in s ) d[ p ] = s[ p ];
      
      return d;
    } // extend()
  }
  
  /* -------------------------------------------------------------------------------------------
     subclass( base, derived [, methods] )
     
     Creates a derived class from a base class.
     
     Parameters:
     - base (Function): Base class constructor, or null if this is a top class
     - derived (Function): Derived class constructor
     - methods:
       - (Object): methods for derived prototype
       - (Function): Function that returns methods Object as above, signature:
         methods( base.prototype )
     
     Returns derived altered properties:
     - prototype includes base.prototype at the top of its chain.
     - sublcass() a class method to derive from derived class
  */
  function subclass( base, derived, methods ) {
    var base_prototype, prototype;
    
    if ( base ) {
      base_prototype = base.prototype;
      
      derived.prototype = Object.create( base_prototype );
    }
    
    prototype = derived.prototype;
    
    if ( methods ) {
      if ( typeof methods == 'function' ) {
        // Methods is a function returning methods Object
        
        methods = methods( base_prototype );
      }
      
      extend_2( prototype, methods );
    }
    
    derived.subclass = function( derived, methods ) {
      return subclass( this, derived, methods );
    };
    
    return prototype.constructor = derived;
  } // subclass()
  
  function Root() {}
  
  subclass( null, Root );
  
  /* -------------------------------------------------------------------------------------------
     make_constructor_apply( constructor )
     
     Transform a constructor into a constructor that can be called with an array instead of a
     parameter list.
     
     Example: make a person constructor that can be called with an Array
     
       function person( first_name, last_name ) {
         this.first_name = first_name;
         this.last_name = last_name;
         
         return this;
       }
       
       var person_apply = make_constructor_apply( person );
       
       var joe = new person_apply( [ 'Joe', 'Cash' ] );
       
       console.log( joe.first_name ) // displays Joe
  */
  function make_constructor_apply( constructor ) {
    function constructor_apply( a ) {
      var u;
      
      // Pretend this object was created using new constructor()
      this.constructor = constructor;

      // Call constructor as new would have
      var r = constructor.apply( this, a );

      // Return this if constructor did not return anything
      return r === u ? this: r;
    }
    
    constructor_apply.prototype = constructor.prototype;
    
    return constructor_apply;
  } // make_constructor_apply()
  
  // Add tests for Dictionary
  var create = Object.create;
  
  function Dictionary() {
    return create( null );
  }
  
  /* -------------------------------------------------------------------------------------------
     RS.add_exports( exports )
     
     Exports 'exports' attributes into RS.
     
     Parameters:
       exports (Object): attributes to export into RS.
     
     Example:
     // fibonacci.js
     
     ( function( exports ) {
       var RS;
       
       if ( typeof( require ) === 'function' ) {
         RS = require( 'rs.js' ).RS;
       } else {
         RS = exports.RS;
       }
       
       // Trivial implementation of Fibonacci number calculator
       function fibonacci( n ) {
         if ( n === 0 || n === 1 ) return n;
         
         return fibonacci( n - 1 ) + fibonacci( n - 2 );
       }
       
       // Export fibonacci() into the RS namespace
       RS.add_exports( { fibonacci: fibonacci } );
     } )( this );
     
     // fibonacci_search.js
     var RS;
     
     if ( typeof( require ) === 'function' ) {
       RS = require( 'rs.js' ).RS;
     } else {
       RS = this.RS;
     }
     
     RS.log( 'Fibonacci of 5 is', RS.fibonacci( 5 ) );
  */
  function add_exports( attributes ) {
    extend_2( this, attributes );
    
    log && log( 6, '_', 'add_exports', Object.keys( attributes ) );
    
    return this;
  } // add_exports()
  
  /* -------------------------------------------------------------------------------------------
     module exports
  */
  exports.RS = add_exports.call( {}, {
    add_exports           : add_exports,
    extend                : extend,
    extend_2              : extend_2,
    logger                : logger,
    log                   : _log, // deprecated
    subclass              : subclass,
    Root                  : Root,
    make_constructor_apply: make_constructor_apply,
    Dictionary            : Dictionary
  } );
  
  log && log( 6, '_', 'global', 'module loaded' );
}( this ); // rs.js
