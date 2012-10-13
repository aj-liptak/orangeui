(function(Orange) {

  var Element;
  
  
  // Class Definitions
  
  /**
   * @class Element
   */
  Element = Class.extend({
    
    initialize: function(target) {
      this.target = $(target);
    },
    
    on: function() {
      this.target.on.apply(this.target, arguments);
      return this;
    },
    
    detach: function() {
      this.target.off.apply(this.target, arguments);
      return this;
    },
    
    fire: function() {
      this.target.trigger.apply(this.target, arguments);
      return this;
    },
    
    attr: function() {
      return this.target.attr.apply(this.target, arguments);
    },
    
    removeAttr: function() {
      this.target.removeAttr.apply(this.target, arguments);
      return this;
    },
    
    addClass: function() {
      this.target.addClass.apply(this.target, arguments);
      return this;
    },
    
    hasClass: function() {
      return this.target.hasClass.apply(this.target, arguments);
    },
    
    removeClass: function() {
      this.target.removeClass.apply(this.target, arguments);
      return this;
    },
        
    find: function() {
      var els = [];
      var matches = this.target.find.apply(this.target, arguments);
      matches.each(function() {
        els.push(new Element(this));
      });
      return els;
    },
    
    closest: function() {
      return new Element(this.target.closest.apply(this.target, arguments));
    },
    
    children: function() {
      var els = [];
      var matches = this.target.children.apply(this.target, arguments);
      matches.each(function() {
        els.push(new Element(els));
      });
      return els;
    },
    
    parent: function() {
      return new Element(this.target.parent.apply(this.target, arguments));
    },
    
    append: function() {
      this.target.append.apply(this.target, arguments);
      return this;
    },
    
    clone: function() {
      return new Element(this.target.clone.apply(this.target, arguments));
    },
    
    hide: function() {
      this.target.addClass('hidden');
      return this;
    },
    
    show: function() {
      this.target.removeClass('hidden');
      return this;
    },
    
    outerHTML: function(s) {
      //return s ? this.target.before(s).remove() : jQuery('<p>').append(this.target.eq(0).clone()).html();
    },
    
    html: function(html) {
      var result = this.target.html.apply(this.target, arguments);
      if (typeof result === 'string') {
        return result;
      } else {
        return this;
      }
    },
    
    cloneAttrs: function(el) {
      var attrs = el.target.get(0).attributes;
      for (var i = 0; i < attrs.length; i++) {
        this.target.attr(attrs[i].name, attrs[i].value);
      }
    },
    
    stripAttrs: function(pattern) {
      if (pattern instanceof RegExp) {
        var attrs = $(this.target).get(0).attributes;
        console.log(attrs);
        var matches = [];
        var match;
        var names = [];
        for (var i = 0; i < attrs.length; i++) {
          match = attrs[i].name.match(pattern);
          names.push(attrs[i].name);
          if (match[1]) {
            matches[match[1]] = attrs[i].value;
          }
        }
        for (var i = 0; i < names.length; i++) {
          this.removeAttr(names[i]);
        }
        return matches;
      }
      return [];
    },
    
    childrenTo: function(selector) {
      var childList = [];
      var that = this;
      this.target.find(selector).each(function() {
        var include = false, parent = $(this).parent();
        while (parent.length !== 0 && !include) {
          if ($(parent).not($(that.target)).length === 0) {
            include = true; break;
          } else if ($(parent).not('[data-control]').length === 0) {
            include = false; break;
          } parent = $(parent).parent();
        }
        if (include) { childList.push(new Element($(this))); }
      });
      return childList;
    }
    
  });
  
  
  // Exports
  
  Orange.Element = Element;
  

}(Orange));