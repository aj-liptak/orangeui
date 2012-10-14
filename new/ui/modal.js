Orange.add('UI.Controllers.Modal', function(O) {

  // Definitions
  
  var ModalViewController = O.Controller.extend({
    
    // @region Configuration
    
    getType: function() {
      return 'modal-view';
    },
    
    
    // @region Public Methods

    presentModalView: function() {
      this._target.addClass('visible');
    },
    
    dismissModalView: function(callback, context) {
      this._target.removeClass('visible');
    }
      
  });

  // Exports
  
  O.export(ModalViewController);

}, []);