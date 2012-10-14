(function(Orange) {
  
  var Entity;
  
	var EntityFieldText;
	var EntityFieldBoolean;
	var EntityFieldInteger;
	var EntityFieldNumber;
	var EntityFieldCurrency;
	var EntityFieldDate;
	var EntityFieldObject;
	var EntityFieldEntity;
	
	
	// Class Definitions
	
	/**
	 * @class Entity
	 */
	Entity = Class.extend({
	  
	  initialize: function(data) {
	    	    
	    this.data = {};
	    
	    if (!data) {
	      data = {};
	    }
	  		  	
	    // get properties
	    var props = this.getProperties();
	    var field;
	    
	    // read in data
	    for (var prop in props) {
	      if (props[prop] instanceof EntityFieldFunction) {
	        continue;
	      }
	      var field = props[prop].process(data[prop]);
	      if (props[prop] instanceof EntityFieldId) {
	        this.id = field;
	      } 
	      this.data[prop] = field;
	    }
	    	  
	  },
	  
	  getProperties: function() {
	    throw 'Unimplemented Exception';
	  },
	  
	  get: function(name, format) {
	    if (this.data.hasOwnProperty(name)) {
	      return this.data[name];
	    } else if (typeof this[name] === 'function') {
	      return this[name]();
	    } else {
	      throw 'Property "' + name + '" Does Not Exist';
	    }
	  },
	  
	  set: function(name, value) {
	    if (this.data.hasOwnProperty(name)) {
	      var props = this.getProperties();
	      this.data[name] = props[name].process(value);
	    } else {
	      throw 'Cannot Set Unknown Property "' + name + '"';
	    }
	  },
	  
	  clear: function(name) {
	    if (this.data.hasOwnProperty(name)) {
	      var props = this.getProperties();
	      this.data[name] = props[name].process();
	    } else {
	      throw 'Cannot Clear Unknown Property "' + name + '"';
	    }
	  },
	  
	  getId: function() {
	    return this.id;
	  },
	  
	  toObject: function() {
	  
	    // build object
	    var data = {};
	    	  
	    // get properties
	    var props = this.getProperties();
	    
	    // read in data
	    for (var prop in props) {
	      if (props[prop] instanceof EntityFieldFunction) {
	        data[prop] = this[prop]();
	      } else {
	        data[prop] = props[prop].format(this.data[prop]);
	      }
	    }
	    	    
	    // return data
	    return data;
	    
	  }
	
	});
	
	
	/**
	 * @class EntityFieldId
	 */
	EntityFieldId = Class.extend({
	  
	  initialize: function(config) {
	    config = config || {};
	    this.numeric = config.numeric || true;
	  },
	  
	  process: function(data) {
	    if (data && !this.numeric && typeof data === 'string' && data.length > 0) {
	      return data;
	    } else if (this.numeric && !isNaN(data)) {
	      return parseInt(data, 10);
	    } else {
	      throw 'Invalid Entity: ID not set';
	    }
	  },
	  
	  format: function(data, format) {
	    return data;
	  }
	
	});
	
	/**
	 * @class EntityFieldText
	 */
	EntityFieldText = Class.extend({
	  
	  initialize: function(config) {
	    config = config || {};
	    this.placeholder = config.placeholder || '';
	    this.maxlength = config.maxlength || null;
	    this.required = config.required || false;
	    this.custom = config.custom || null;
	  },
	  
	  process: function(data) {
	    if (data && typeof data === 'string' && data.length > 0) {
	      if (this.maxlength) {
	        return data.substr(0, this.maxlength);
	      }
	      if (typeof this.custom === 'function') {
	        data = this.custom.call(this, data);
	      }
	      return data;
	    } else if (this.required) {
	      throw 'Invalid Entity: Field not set';
	    } else {
	      return this.placeholder;
	    }
	  },
	  
	  format: function(data, format) {
	    return data;
	  }
	
	});
	
	
	/**
	 * @class EntityFieldBoolean
	 */
	EntityFieldBoolean = Class.extend({
	  
	  initialize: function(config) {
	    config = config || {};
	    this.placeholder = config.placeholder || false;
	    this.required = config.required || false;
	  },
	  
	  process: function(data) {
	    if (data === true || data === 'true') {
	      return true;
	    } else if (data === false || data === 'false') {
	      return false;
	    } else if (this.required) {
	      throw 'Invalid Entity: Field not set';
	    } else {
	      return this.placeholder;
	    }
	  },
	  
	  format: function(data, format) {
	    return data;
	  }
	
	});
	
	
	/**
	 * @class EntityFieldInteger
	 */
	EntityFieldInteger = Class.extend({
	  
	  initialize: function(config) {
	    config = config || {};
	    this.placeholder = config.placeholder || 0;
	    this.unsigned = config.unsigned || false;
	    this.minval = config.minval || null;
	    this.maxval = config.maxval || null;
	    this.required = config.required || false;
	  },
	  
	  process: function(data) {
	    if (data && !isNaN(data)) {
	      data = parseInt(data, 10);
	      if (this.maxval && data > this.maxval) {
	        throw 'Integer Max Exceeded';
	      }
	      if (this.maxval && data < this.minval) {
	        throw 'Integer Min Exceeded';
	      }
	      if (this.unsigned && data < 0) {
	        throw 'Unsigned Integer Cannot Be Negative';
	      }
	      return data;
	    } else if (this.required) {
	      throw 'Invalid Entity: Field not set';
	    } else {
	      return this.placeholder;
	    }
	  },
	  
	  format: function(data, format) {
	    return data;
	  }
	
	});
	
	
	/**
	 * @class EntityFieldNumber
	 */
	EntityFieldNumber = Class.extend({
	  
	  initialize: function(config) {
	    config = config || {};
	    this.placeholder = config.placeholder || 0;
	    this.precision = config.precision || null;
	    this.required = config.required || false;
	    this.maxval = config.maxval || null;
	  },
	  
	  process: function(data) {
	    if (data && !isNaN(data)) {
	      data = parseInt(data, 10);
	      if (this.maxval && data > this.maxval) {
	        throw 'Number Max Exceeded';
	      }
	      if (this.maxval && data < this.minval) {
	        throw 'Number Min Exceeded';
	      }
	      if (this.precision) {
	        var multiplier = Math.pow(10, this.precision);
	        return Math.round(data*multiplier)/multiplier;
	      } else {
	        return data;
	      }
	    } else if (this.required) {
	      throw 'Invalid Entity: Field not set';
	    } else {
	      return this.placeholder;
	    }
	  },
	  
	  format: function(data, format) {
	    return data;
	  }
	
	});
	
	
	/**
	 * @class EntityFieldCurrency
	 */
	EntityFieldCurrency = Class.extend({
	  
	  initialize: function(config) {
	    config = config || {};
	    this.placeholder = config.placeholder || 0;
	    this.precision = config.precision || 2;
	    this.maxval = config.maxval || null;
	    this.type = config.type || 'USD';
	    this.required = config.required || false;
	    this.symbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CNY': '¥', 'MXN': '$', 'CAD': '$' };
	  },
	  
	  process: function(data) {
	    if (data && !isNaN(data)) {
	      data = parseInt(data, 10);
	      if (this.maxval && data > this.maxval) {
	        throw 'Number Max Exceeded';
	      }
	      if (this.maxval && data < this.minval) {
	        throw 'Number Min Exceeded';
	      }
	      if (this.precision) {
	        var multiplier = Math.pow(10, this.precision);
	        return Math.round(data*multiplier)/multiplier;
	      } else {
	        return data;
	      }
	    } else if (this.required) {
	      throw 'Invalid Entity: Field not set';
	    } else {
	      return this.placeholder;
	    }
	  },
	  
	  format: function(data, format) {
	    
	    function addCommas(number) {
	        number += '';
	        var x = number.split('.');
	        var x1 = x[0];
	        var x2 = x.length > 1 ? '.' + x[1] : '';
	        var rgx = /(\d+)(\d{3})/;
	        while (rgx.test(x1)) {
	            x1 = x1.replace(rgx, '$1' + ',' + '$2');
	        }
	        return x1 + x2;
	    }
	  
	    if (format === 'raw') {
	      return data;
	    } else if (this.symbols.hasOwnProperty(this.type)) {
	      return this.symbols[this.type] + addCommas(data);
	    }
	    return data;
	    
	  }
	
	});
	
	
	/**
	 * @class EntityFieldDate
	 */
	EntityFieldDate = Class.extend({
	  
	  initialize: function(config) {
	    config = config || {};
	    this.placeholder = config.placeholder || false;
	    this.required = config.required || false;
	    this.months = [
	      'January',
	      'February',
	      'March',
	      'April',
	      'May',
	      'June',
	      'July',
	      'August',
	      'September',
	      'October',
	      'November',
	      'December'
	    ];
	    this.monthAbbr = [
	      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
	    ];
	    this.days = [
	      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
	    ];
	    this.daysAbbr = [
	      'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
	    ];
	  },
	  
	  process: function(data) {
	    try {
	      var date = new Date(data);
	      var test = date.getMonth();
	      if (isNaN(test)) {
	        throw 'Invalid Date';
	      }
	      return date;
	    } catch(ex) {
	      if (this.required) {
	        throw 'Invalid Entity: Date field not set';
	      } else if (this.placeholder) {
	        return this.placeholder;
	      } else {
	        return null;
	      }
	    }
	  },
	  
	  format: function(data, format) {
	    
	    if (!data) {
	      return 'No Date Set';
	    }
	    
	    if (typeof format !== 'string') {
	      format = 'mmmm D, YYYY';
	    }
	    
	    var string = format;
	    
	    function addLeadingZero(number) {
	      if (number < 9 && number > 0) {
	        return '0' + number;
	      } else {
	        return number;
	      }
	    }
	    
	    function printHours(hours) {
	      if (hours > 11) {
	        return hours-12;
	      } else {
	        return hours;
	      }
	    }
	    
	    function printAMPM(hours) {
	      if (hours > 11) {
	        return 'PM';
	      } else {
	        return 'AM';
	      }
	    }
	    
	    function getTimezone(date) {
	      var zone = date.toString().match(/\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[\-+]\d{4})?)\b/g);
	      return zone[1];
	    }	    
	    	    
	    format = format.replace(/YYYY/g, data.getFullYear());
	    format = format.replace(/YY/g, data.getFullYear().toString().substr(2, 2));
	    	    
	    format = format.replace(/hh/g, addLeadingZero(printHours(data.getHours())));
	    format = format.replace(/h/g, printHours(data.getHours()));
	    format = format.replace(/HH/g, addLeadingZero(data.getHours() + 1));
	    format = format.replace(/H/g, data.getHours() + 1);
	    
	    format = format.replace(/MM/g, addLeadingZero(data.getMinutes()));
	    format = format.replace(/M/g, data.getMinutes());
	    
	    format = format.replace(/ss/g, addLeadingZero(data.getSeconds()));
	    format = format.replace(/s/g, data.getSeconds());
	    
	    format = format.replace(/TT/g, printAMPM(data.getHours()));
	    format = format.replace(/T/g, printAMPM(data.getHours()).substr(0, 1));
	    format = format.replace(/tt/g, printAMPM(data.getHours()).toLowerCase());
	    format = format.replace(/t/g, printAMPM(data.getHours()).substr(0, 1).toLowerCase());
	    
	    format = format.replace(/Z/g, getTimezone(data));
	    
	    format = format.replace(/mmmm/g, this.months[data.getMonth()]);
	    format = format.replace(/mmm/g, this.monthAbbr[data.getMonth()]);
	    format = format.replace(/mm/g, addLeadingZero(data.getMonth() + 1));
	    format = format.replace(/m/g, data.getMonth() + 1);
	    
	    format = format.replace(/DDDD/g, this.days[data.getDay()]);
	    format = format.replace(/DDD/g, this.daysAbbr[data.getDay()]);
	    format = format.replace(/DD/g, addLeadingZero(data.getDate()));
	    format = format.replace(/D/g, data.getDate());
	
	    return format;
	    
	  }
	
	});
	
	
	/**
	 * @class EntityFieldObject
	 */
	EntityFieldObject = Class.extend({
	  
	  initialize: function(config) {
	    config = config || {};
	    this.required = config.required || false;
	  },
	  
	  process: function(data) {
	    if (data && typeof data === 'object') {
	      return data;
	    } else if (this.required) {
	      throw 'Invalid Entity: Field not set';
	    } else {
	      return {};
	    }
	  },
	  
	  format: function(data, format) {
	    return data;
	  }
	
	});
	
	
	/**
	 * @class EntityFieldObject
	 */
	EntityFieldArray = Class.extend({
	  
	  initialize: function(config) {
	    config = config || {};
	    this.required = config.required || false;
	  },
	  
	  process: function(data) {
	    if (data && data instanceof Array) {
	      return data;
	    } else if (this.required) {
	      throw 'Invalid Entity: Field not set';
	    } else {
	      return [];
	    }
	  },
	  
	  format: function(data, format) {
	    return data;
	  }
	
	});
	
	
	/**
	 * @class EntityFieldEntity
	 */
	EntityFieldEntity = Class.extend({
	  
	  initialize: function(config) {
	    config = config || {};
	    if (config.type instanceof Entity) {
	      this.type = config.type;
	      this.required = config.required || false;
	    } else {
	      throw 'Missing Entity Type';
	    }
	  },
	  
	  process: function(data) {
	    if (data && data instanceof this.type) {
	      return data;
	    } else if (data && typeof data === 'object') {
	      return new this.type(data);
	    } else if (this.required) {
	      throw 'Invalid Entity: Field not set';
	    } else {
	      return new this.type();
	    }
	  },
	  
	  format: function(data, format) {
	    return data;
	  }
	
	});
	
	
	/**
	 * @class EntityFieldEntity
	 */
	EntityFieldFunction = Class.extend({
	  
	  initialize: function() {},
	  
	  process: function(data) {
	    return data;
	  },
	  
	  format: function(data, format) {
	    return data;
	  }
	
	});
	
	
	// Exports
	
	Orange.Entity = Entity;
	
	Orange.EntityField = {
	  Id: EntityFieldId,
	  Text: EntityFieldText,
	  Boolean: EntityFieldBoolean,
	  Integer: EntityFieldInteger,
	  Number: EntityFieldNumber,
	  Currency: EntityFieldCurrency,
	  Date: EntityFieldDate,
	  Object: EntityFieldObject,
	  Array: EntityFieldArray,
	  Entity: EntityFieldEntity,
	  Function: EntityFieldFunction
	};


}(Orange));