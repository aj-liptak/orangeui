(function(Orange) {

  var View = {};
    
  var templates = {};
  
  View.get = function(path, control, name) {
  
    var that = this;
    var views = [];
    var output;
    
    if (!path || !templates.hasOwnProperty(path)) {
      throw 'Path ' + path + ' has not been loaded';
    }
    
    $('<div>' + templates[path] + '</div>').children().each(function() {
      views.push($(this));
    });
        
    for (var i=0; i<views.length; i++) {
      if (typeof control !== 'undefined' && views[i].attr('data-control') !== control) { console.log('123'); continue; }
      if (typeof name !== 'undefined' && views[i].attr('data-name') !== name) { console.log('abc'); continue; }
      return views[i].clone();
    }
    throw 'Could not find view ' + control + ' at ' + path;
    
  };

  function fetch(path, success, sync) {
    return $.ajax({
      async: sync !== true,
      contentType: "text/html; charset=utf-8",
      dataType: "text",
      timeout: 10000,
      url: 'templates/' + path,
      success: function(html) {
        success(path, html);
      },
      error: function() {
        throw "Error: template not found";
      }
    }).responseText;
  }
  
  View.register = function(paths, callback) {
    
    var path;
    var count = paths.length;
    
    if (count === 0) {
		return callback();
    }
    
    function onFetch(path, html) {
      templates[path] = html; count--;
      if (count === 0) { callback(); }
    }
    
    for (var i=0; i<paths.length; i++) {
      path = paths[i];
      fetch(paths[i], proxy(onFetch, this));
    }
    
  };
 
  
  // Exports
  Orange.View = View;
  

}(Orange));