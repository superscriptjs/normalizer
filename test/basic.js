import mocha from 'mocha';
import assert from 'assert';
import norm from '../src/normalizer';

describe('Normalizer', () => {
  let startTime;
  before((done) => {
    startTime = new Date();
    done();
  });

  describe('Should clean input', () => {
    it('should replace subsitutes', () => {
      assert.equal(norm.clean('Nov 1st I weighed 90 kgs. total'), 'November 1st I weighed 90 kilograms total')
      assert.equal(norm.clean('I shared it on FB w/ friends, ie: you'), 'I shared it on Facebook with friends, for example : you');
    });

    it('should expand contractions', () => {
      assert.equal(norm.clean("I'm on the yelow zebra"), 'I am on the yellow zebra');
      assert.equal(norm.clean("I'll listen to y'all"), 'I will listen to you all');
      assert.equal(norm.clean("do n't make it right"), 'do not make it right');
      assert.equal(norm.clean("it's all good"), 'it is all good');
    });

    it('should swap british / canadian words', () => {
      assert.equal(norm.clean('armour axe coloured gold'), 'armor ax colored gold');
    });

    it('should fix spelling', () => {
      assert.equal(norm.clean('are we sceduled thrsday for teh restraunt'), 'are we scheduled Thursday for the restaurant');
    });

    it('should expand txt speak', () => {
      assert.equal(norm.clean('n'), '~no');
      assert.equal(norm.clean('lol'), '~emolaugh');
      assert.equal(norm.clean('haha'), '~emolaugh');
      assert.equal(norm.clean(':)'), '~emohappy');
    });

    it('should clean this', () => {
      assert.equal(norm.clean('Well , I could not help it, could I'), 'I could not help it, could I');
    });

    it('should not remove +', () => {
      assert.equal(norm.clean('3+4=7'), '3+4=7');
    });

    it('should remove extra spaces', () => {
      assert.equal(norm.clean('this    is     spaced     out'), 'this is spaced out');
    });

    it('should remove punct', () => {
      assert.equal(norm.clean('why do i care?'), 'why do I care');
    });

    it('Fix numbers', () => {
      assert.equal(norm.clean('how much is 1,000.00'), 'how much is 1000.00');
    });

    it('Spell Fix 2 word combo', () => {
      assert.equal(norm.clean('hwo do you'), 'how do you');
      assert.equal(norm.clean('hwo is you'), 'who is you');
    });

    it('Fix ASCII characters', () => {
      assert.equal(norm.clean('What’s up'), 'what is up');
      assert.equal(norm.clean("What's up"), 'what is up');
      assert.equal(norm.clean('I said “shut up”'), 'I said "shut up"');
      assert.equal(norm.clean('œ'), '');
    });
  });

  describe('Matching', () => {
    // <it_is>
    describe('<xxx>', () => {
      it('should match start and end', () => {
        assert.equal(norm.clean('it is'), '~yes');
      });

      it('should not match start', () => {
        assert.equal(norm.clean('it is abc'), 'it is abc');
      });

      it('should not match end', () => {
        assert.equal(norm.clean('abc it is'), 'abc it is');
      });

      it('should not match middle', () => {
        assert.equal(norm.clean('abc it is abc'), 'abc it is abc');
      });
    });

    // <ew
    describe('<xxx', () => {
      it('should match start and end', () => {
        assert.equal(norm.clean('ew'), '~emodisgust');
      });

      it('should match start', () => {
        assert.equal(norm.clean('ew abc'), '~emodisgust abc');
      });

      it('should not match end', () => {
        assert.equal(norm.clean('abc ew'), 'abc ew');
      });

      it('should not match middle', () => {
        assert.equal(norm.clean('abc ew abc'), 'abc ew abc');
      });
    });

    // have_to_go>
    describe('xxx>', () => {
      it('should match start and end', () => {
        assert.equal(norm.clean('have to go'), '~emogoodbye');
      });

      it('should not match start', () => {
        assert.equal(norm.clean('have to go abc'), 'have to go abc');
      });

      it('should match end', () => {
        assert.equal(norm.clean('abc have to go'), 'abc ~emogoodbye');
      });

      it('should not match middle', () => {
        assert.equal(norm.clean('abc have to go abc'), 'abc have to go abc');
      });
    });

    // okay
    describe('xxx', () => {
      it('should match start and end', () => {
        assert.equal(norm.clean('okay'), '~yes');
      });

      it('should match start', () => {
        assert.equal(norm.clean('okay abc'), '~yes abc');
      });

      it('should match end', () => {
        assert.equal(norm.clean('abc okay'), 'abc ~yes');
      });

      it('should match middle', () => {
        assert.equal(norm.clean('abc okay abc'), 'abc ~yes abc');
      });
    });
  });

  after((done) => {
    console.log(`Test duration: ${new Date() - startTime}ms`);
    done();
  });
});
