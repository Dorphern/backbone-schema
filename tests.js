var isNode = typeof module !== 'undefined' && module.exports
  , should = isNode ? require('chai').should() : window.chai.should()
  , Backbone = isNode ? require('backbone') : window.Backbone;

if (isNode) require('../backbone-schema');

var TestModel = Backbone.Model.extend()
  , tester;


describe('Backbone.Model.schema', function () {

  beforeEach(function () {
    tester = new TestModel();
  });

  describe('Field types', function () {

    before(function () {
      TestModel.prototype.schema = {
        string1: String,
        string3: { type: String }
      };
    });

    describe('when invalid value', function () {

      it('should not validate when field is a type', function () {
        tester.set({ string1: 12345678 }, { silent: true });
        tester.isValid().should.be.false;
      });

      it('should not validate when type attribute is a type', function () {
        tester.set({ string3: 12345678 }, { silent: true });
        tester.isValid().should.be.false;
      });

    });

    describe('when valid value', function () {

      it('should validate when field is a type', function () {
        tester.set({ string1: 'foobar' }, { silent: true });
        tester.isValid().should.be.true;
      });

      it('should validate when type attribute is a type', function () {
        tester.set({ string3: 'foobar' }, { silent: true });
        tester.isValid().should.be.true;
      });

    });

    describe('allows for different field types', function() {
      before(function() {
        TestModel.prototype.schema = {
          stringType: String,
          numberType: Number,
          dateType: Date,
          booleanType: Boolean,
          ArrayType0: Array,
          ArrayType1: [],
          ArrayStringType: [String]
        };
      });

      var typeTests = [
        {
          type: 'String',
          field: 'stringType',
          validValue: 'some string',
          invalidValue: 1234
        }, {
          type: 'Number',
          field: 'numberType',
          validValue: 1234,
          invalidValue: true
        }, {
          type: 'Date',
          field: 'dateType',
          validValue: new Date(),
          invalidValue: 1234
        }, {
          type: 'Boolean',
          field: 'booleanType',
          validValue: false,
          invalidValue: 1234
        }, {
          type: 'Array',
          field: 'ArrayType0',
          validValue: [0, 1, 2, 3],
          invalidValue: 1234
        }, {
          type: 'Array []',
          field: 'ArrayType1',
          validValue: [0, 1, 2, 3],
          invalidValue: 1234
        }, {
          type: 'Array of String',
          field: 'ArrayStringType',
          validValue: ['a', 'b', 'c', null],
          invalidValue: ['d', 0, 1, 2, 3]
        }
      ];

      for (var i = 0; i < typeTests.length; i++) {
        it('should support ' + typeTests[i].type, (function(typeTest) { 
          return function() {
            tester.set(typeTest.field, typeTest.validValue);
            tester.isValid().should.be.true;

            tester.set(typeTest.field, typeTest.invalidValue);
            tester.isValid().should.be.false;
          };
        })(typeTests[i]) );
      }

    });

  });


  describe('when field is required', function () {

    before(function () {
      TestModel.prototype.schema = {
          requiredField: { required: true }
        , notRequiredField: { required: false }
        , defaultField: {}
      };
    });

    it('should not validate when required fields are missing', function () {
      tester.set({ notRequiredField: 'testing' }, { silent: true });
      tester.isValid().should.be.false;
    });

    it('should validate when no required fields are missing', function () {
      tester.set({ requiredField: 'testing' }, { silent: true });
      tester.isValid().should.be.true;
    });

    it('should validate when unspecified fields are missing', function () {
      tester.set({ requiredField: 'testing' }, { silent: true });
      tester.isValid().should.be.true;
    });
  });

});
