  
var mocha   = require("mocha");
var should  = require("should");
var norm = require("../index");

describe('Normalizer', function(){

  before(function(done){
    norm.loadData(function(){
      done();
    });
  });

  describe('Should clean input', function() {

    it("should replace subsitutes", function() {
      norm.clean("Nov 1st I weighed 90 kgs. total").should.eql("November 1st I weighed 90 kilograms total");
      norm.clean("I shared it on FB w/ friends, ie: you").should.eql("I shared it on Facebook with friends, for example : you");
    });

    it("should expand contractions", function() {
      norm.clean("I'm on the yelow zebra").should.eql("I am on the yellow zebra");
      norm.clean("I'll listen to y'all").should.eql("I will listen to you all");
      norm.clean("do n't make it right").should.eql("do not make it right");
      norm.clean("it's all good").should.eql("it is all good");
    });

    it("should swap british / canadian words", function() {
      norm.clean("armour axe coloured gold").should.eql("armor ax colored gold");
    });

    it("should fix spelling", function() {
      norm.clean("are we sceduled thrsday for teh restraunt").should.eql("are we scheduled Thursday for the restaurant");
    });

    it("should expand txt speak", function() {
      norm.clean("n").should.eql("~no");
      norm.clean("lol").should.eql("~emolaugh");
      norm.clean("haha").should.eql("~emolaugh");
      norm.clean(":)").should.eql("~emohappy");
    });

    it("should clean this", function() {
      norm.clean("Well , I could not help it, could I").should.eql("I could not help it, could I")
    });

    it("should not remove +", function() {
      norm.clean("3+4=7").should.eql("3+4=7");
    });

    it("should remove extra spaces", function() {
      norm.clean("this    is     spaced     out").should.eql("this is spaced out");
    });

    it("should remove punct", function() {
      norm.clean("why do i care?").should.eql("why do I care");
    });

    it("Fix numbers", function() {
      norm.clean("how much is 1,000.00").should.eql("how much is 1000.00");
    });
    
    it("Spell Fix 2 word combo", function() {
      norm.clean("hwo do you").should.eql("how do you");
      norm.clean("hwo is you").should.eql("who is you");
    });

    it("Fix ASCII characters", function() {
      norm.clean("What’s up").should.eql("what is up");
      norm.clean("What's up").should.eql("what is up");
      norm.clean("I said “shut up”").should.eql('I said "shut up"');
      norm.clean("œ").should.eql('');
    });


  });
});