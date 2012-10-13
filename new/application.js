(function(Orange) {

  var Application;
  
  
  // Dependencies
  
  var Controller = Orange.Controller;
  var Loader = Orange.Loader;
  var Service = Orange.Service;
  var Model = Orange.Model;
  var View = Orange.View;
    
  
  // Class Definition
  
  /**
   * @class Application
   */
  Application = Class.extend({
  
    initialize: function(config) {
      
      // store properties
      if (!config.hasOwnProperty('name') || (new RegExp(/[^A-Za-z:0-9_\[\]]/g)).test(config.name)) {
        throw 'Invalid Application Name';
      }
      
      // store configs
      this.config = {};
      
      // store states
      this.ready = false;
      this.loaded = false;
      
      // store name
      this.config.name = config.name;
      
      // store properties
      this.config.required = config.hasOwnProperty('required') ? config.required : [];
      this.config.services = config.hasOwnProperty('services') ? config.services : [];
      this.config.views    = config.hasOwnProperty('views')    ? config.views    : [];
      this.config.paths    = config.hasOwnProperty('paths')    ? config.paths    : {};
      
      // set environment
      this.env = config.env || 'DEV';
      
      // store services
      this.services = [];
      
      // load required modules
      for (var i=0; i<this.config.required.length; i++) {
        Loader.loadModule(this.config.required[i]);
      }
      
      // load views
      this.loadViews();
      
      // store ready listener
      $(document).ready(proxy(this.onReady, this));
      
    },
    
    createService: function(service) {
      
      // check if exists
      for (var i = 0; i < this.services.length; i++) {
        if (this.services[i] instanceof service) {
          return this.services[i];
        }
      }
            
      // fetch path
      var path = this.config.paths[this.env];
    
      // create service
      var serviceInstance = new service(path);
      
      // set token
      if (this.config.auth)  {
        
        // get token
        var token = this.authService.getToken();
        
        if (token && typeof serviceInstance.setToken === 'function') {
          serviceInstance.setToken(token);
        }
        
      }
      
      // cache instance
      this.services.push(serviceInstance);
      
      // return service
      return serviceInstance;
    
    },
    
    createModel: function(model) {
      
      // create model
      var modelInstance = new model();
      
      // fetch services
      var services = model.getServices();
      
      // load services
      for (var service in services) {
        modelInstance.setService(service, this.createService(services[service]));
      }
      
      // return model
      return modelInstance;
    
    },
    
    loadViews: function() {
    
      // store views
      var views = this.config.views;
      
      // check for views
      if (views.length === 0) {
        this.onLoad();
        return;
      }
      
      // register views
      View.register(views, proxy(function() {
        this.onLoad();
      }, this));
    
    },
    
    onReady: function() {
    
      // mark as ready
      this.ready = true;
      
      // launch if loaded
      if (this.loaded) {
        this.launch();
      }
        
    },
    
    onLoad: function() {
    
      // mark as loaded
      this.loaded = true;
      
      // launch if ready
      if (this.ready) {
        this.launch();
      }
    
    },
    
    onHashChange: function() {
      var hash = location.hash;
      if (!hash) {
        this.root.setState();
      } else {
        this.root.setState(hash.replace('#', '').split('/'));
      }
    },
    
    launch: function() {
    
       // lookup root
       var root = $("[data-root]");
       var control = root.attr("data-control");
       var name = root.attr("data-name") || control;
   
       // check for root
       if (!control || !name) {
         throw 'Syntax Error: Root view not found';
       }
       
       // remove root attr
       root.removeAttr('data-root');
       
       // fetch controller
       var RootController = Controller.get(control);
       
       // instantiate controller
       var root = new RootController(null, root, this);
       
       // store reference
       this.root = root;
       
       // load the controller
       root.on('load', function() {
       
         // trigger first hash change
         $(window).trigger('hashchange');
         
         // show tree
         root.show();
         
       });
       
       // load root
       root.load();       
       
       // bind hash change
       $(window).bind('hashchange', proxy(this.onHashChange, this)); 

       // TEMP
       console.log('Launching App: ' + this.config.name);
    
    }
  
  });
  
   
  // Exports
  
  Orange.Application = Application;
  

}(Orange));