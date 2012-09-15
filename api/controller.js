// ------------------------------------------------------------------------------------------------
// ViewController Class
// ------------------------------------------------------------------------------------------------

(function(Orange) {

  var ViewController;
  
  
  // ------------------------------------------------------------------------------------------------
  // Dependencies
  // ------------------------------------------------------------------------------------------------
  
  var Binding     = Orange.Binding;
  var Browser     = Orange.Browser;
  var Deferred    = Orange.Deferred;
  var Form        = Orange.Form;
  var Model       = Orange.Model;
  var View        = Orange.View;
  
  
  // ------------------------------------------------------------------------------------------------
  // Functions
  // ------------------------------------------------------------------------------------------------
  
  // ------------------------------------------------------------------------------------------------
  // Class Definition
  // ------------------------------------------------------------------------------------------------
  
  ViewController = Class.extend({
  
  
    // ------------------------------------------------------------------------------------------------
    // Internal Methods
    // ------------------------------------------------------------------------------------------------
    
    /**
     * The ViewController is the primary class of OrangeUI and manages all interaction logic in
     * the application. This includes binding events to DOM elements, passing data to your views
     * manipulating the DOM, managing route hashes, and organizing the view lifecycle.
     *
     * @class ViewController
     * @extends Module
     * @uses Events
     * @uses Queue
     * @constructor
     * @param {ViewController} parent  The parent of the view controller if it exists.
     * @param {jQuery|string} target  Either a jQuery DOM reference or a HTML string.
     * @param {Application} [app]  An optional reference to the Application instance.
     */
    initialize: function(parent, target, app) {
    
    },
    
    
    // ------------------------------------------------------------------------------------------------
    // Configuration Methods
    // ------------------------------------------------------------------------------------------------
    
    
    // ------------------------------------------------------------------------------------------------
    // Route Management
    // ------------------------------------------------------------------------------------------------
    
    
    // ------------------------------------------------------------------------------------------------
    // State Management
    // ------------------------------------------------------------------------------------------------
    
    
    // ------------------------------------------------------------------------------------------------
    // Chainable State Handlers
    // ------------------------------------------------------------------------------------------------
    
    
    // ------------------------------------------------------------------------------------------------
    // Private State Handlers
    // ------------------------------------------------------------------------------------------------
    
    
    // ------------------------------------------------------------------------------------------------
    // Private Transition Handlers
    // ------------------------------------------------------------------------------------------------
    
    
    // ------------------------------------------------------------------------------------------------
    // Reference Handling
    // ------------------------------------------------------------------------------------------------
    
    
    // ------------------------------------------------------------------------------------------------
    // Reference Validation
    // ------------------------------------------------------------------------------------------------
    
    
    // ------------------------------------------------------------------------------------------------
    // Adhoc References
    // ------------------------------------------------------------------------------------------------
    
    
    // ------------------------------------------------------------------------------------------------
    // Data Bindings
    // ------------------------------------------------------------------------------------------------
    
    
    // ------------------------------------------------------------------------------------------------
    // Connection Management
    // ------------------------------------------------------------------------------------------------
    
  }).include(Events);
  
  
  // ------------------------------------------------------------------------------------------------
  // Object Methods
  // ------------------------------------------------------------------------------------------------
  
  
  // ------------------------------------------------------------------------------------------------
  // Exports
  // ------------------------------------------------------------------------------------------------
  
  Orange.ViewController = ViewController;
    
  
}(Orange));