/**
 * Schema types: String, Number, Date, Boolean, Array
 *
 * Field Options: 
 *  required: Boolean
 *  default: *Same as schema type*
 *  min: Number
 *  max: Number
 *  get: Function
 *  set: Function   
 *  validate: [Function] 
 *  (unique): Boolean
 */


(function () {

  var isNode = typeof module !== 'undefined' && module.exports
    , _ = isNode ? require('underscore') : this._
    , Backbone = isNode ? require('backbone') : this.Backbone;


  function typeCheck(type, value) {
    var typeName  = ( _.isArray(type) ? Array : type.prototype.constructor.name)
    ,   valueType = value.constructor
    ,   success   = true;

    if (_.isArray(type)) {
      if (valueType !== Array) {
        success = false;
      } else if (type.length === 1) {
        for (var i = 0; i < value.length; i++)
          if (_.isUndefined(value[i]) || (value[i] != null && value[i].constructor !== type[0])) {
            success = false;
            break;
          }
      }
      typeName = !_.isUndefined(type[0]) ? '['+ type[0].prototype.constructor.name +']' : 'Array';
    } else if (_.isFunction(type) && valueType !== type) {
      success = false;
    }

    return {
      success: success,
      typeName: typeName
    }
  }

  function isDefined(value) {
    return !(_.isUndefined(value) || _.isNull(value) || _.isNaN(value));
  }



  _.extend(Backbone.Model.prototype, {

    validateSchema: function() {
      var schema = this.schema || {}
      ,   attrs = this.attributes;

      for (var key in schema) {
        var value = attrs[key]
        ,   field = schema[key]
        ,   type = typeof field === 'object' && !_.isArray(field) ? field.type : field;

        if (field.required && !isDefined(value)) {
          return '"' + key + '" is required.';
        } 
          
        if (_.isUndefined(value)) continue;

        /* Type checking */
        if (type) {
          var typeCheckResult = typeCheck(type, value);
          if (!typeCheckResult.success)
            return '"' + key + '" must be of type ' + typeCheckResult.typeName;
        }
        
      }
    },

    validate: function(attrs) {
      return this.validateSchema();
    }

  });

}.call(this));


