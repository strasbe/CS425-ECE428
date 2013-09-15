var chai = require('chai'),
    masterPort = 8000,
    assert = chai.assert, 
	  should = chai.should(),
    MockMaster = require('./support/MockMaster'),
	  Slave = require('../Slave'),
    server, slave;

describe('Slave', function () {

  before(function (done) {

    server = new MockMaster(masterPort);
    server.on('Listening', function () {
      slave = new Slave();
      done();
    });
  });

  describe('#checkReceivedForGrep', function () {
    it('should return null for empty and null strings', function () {
      should.not.exist(slave.checkReceivedForGrep(''));
      should.not.exist(slave.checkReceivedForGrep(null));
      should.not.exist(slave.checkReceivedForGrep(undefined));
    });

    it('should return null if the command does not start with grep and space', function () {
      should.not.exist(slave.checkReceivedForGrep('notgrep'));
      should.not.exist(slave.checkReceivedForGrep('grep '));
    });

    it('should return the expression after the grep', function () {
      (slave.checkReceivedForGrep('grep test')).should.equal('test');
      (slave.checkReceivedForGrep('grep test 1')).should.equal('test');
    });
  });

  describe('#receivedGrep', function () {
    it('should send grep results to master', function (done) {
      slave.receivedGrep('test');
      server.on('Slave Data', function (data) {
        data.should.be.an('object');
        (data.toString('utf-8')).should.equal('test1:test\n');
        done();
      });
    });
  });

  describe('#receivedGrepFromCommandLine', function () {
    it('should send the grep command to the master', function (done) {
      slave.receivedGrepFromCommandLine('test');
      server.on('Slave Data', function (data) {
        data.should.be.an('object');
        (data.toString('utf-8')).should.equal('grep test');
        done();
      });
    });

    it('should throw an error for empty and null strings', function () {
      (slave.receivedGrepFromCommandLine).should.throw(Error);
      (function () {slave.receivedGrepFromCommandLine(''); }).should.throw(Error);
    });
  });

  

  afterEach(function () {
    server.removeAllListeners('Slave Data');
  });
});