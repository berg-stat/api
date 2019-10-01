import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../index';
import { User } from '../models';


chai.use(chaiHttp);
chai.should();

const testUserA = {
  email: 'a@gmail.com',
  username: 'userA',
  password: 'pass123'
};

let userAToken;

const testUserB = {
  email: 'b@gmail.com',
  username: 'userB',
  password: 'pass456'
};

let userBToken;

describe('User controller', () => {

  before(() =>
    Promise.all([
      chai.request(app)
        .post('/api/v1/users')
        .send(testUserA)
        .then((res) => userAToken = res.body.token),
      chai.request(app)
        .post('/api/v1/users')
        .send(testUserB)
        .then((res) => userBToken = res.body.token),
    ])
  );

  after(() => User.collection.drop());

  describe('User registration', () => {
    it('should not create a new user if email is missing', (done) => {
      chai.request(app)
        .post('/api/v1/users')
        .send({
          username: 'newUser',
          password: 'newpass'
        })
        .end((err, res) => {
          res.status.should.equal(422);
          res.type.should.equal('application/json');
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Invalid request data.');
          res.body.reasons.should.be.an('Array');
          res.body.reasons.should.include('"email" is required');
          done();
        });
    });

    it('should not create a new user if username is missing', (done) => {
      chai.request(app)
        .post('/api/v1/users')
        .send({
          email: 'newuser@gmail.com',
          password: 'newpass'
        })
        .end((err, res) => {
          res.status.should.equal(422);
          res.type.should.equal('application/json');
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Invalid request data.');
          res.body.reasons.should.be.an('Array');
          res.body.reasons.should.include('"username" is required');
          done();
        });
    });

    it('should not create a new user if email, username and password are missing', (done) => {
      chai.request(app)
        .post('/api/v1/users')
        .send({})
        .end((err, res) => {
          res.status.should.equal(422);
          res.type.should.equal('application/json');
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Invalid request data.');
          res.body.reasons.should.be.an('Array');
          res.body.reasons.should.include('"email" is required');
          res.body.reasons.should.include('"username" is required');
          res.body.reasons.should.include('"password" is required');
          done();
        });
    });

    it('should not create a new user if password is missing', (done) => {
      chai.request(app)
        .post('/api/v1/users')
        .send({
          email: 'newuser@gmail.com',
          username: 'newUser',
        })
        .end((err, res) => {
          res.status.should.equal(422);
          res.type.should.equal('application/json');
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Invalid request data.');
          res.body.reasons.should.be.an('Array');
          res.body.reasons.should.include('"password" is required');
          done();
        });
    });

    it('should not create a new user if email is incorrect', (done) => {
      chai.request(app)
        .post('/api/v1/users')
        .send({
          email: 'wrongEmail',
          username: 'newUser',
          password: 'newpass'
        })
        .end((err, res) => {
          res.status.should.equal(422);
          res.type.should.equal('application/json');
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Invalid request data.');
          res.body.reasons.should.be.an('Array');
          res.body.reasons.should.include('"email" must be a valid email');
          done();
        });
    });

    it('should not create a new user if password is too short', (done) => {
      chai.request(app)
        .post('/api/v1/users')
        .send({
          email: 'newuser@gmail.com',
          username: 'newUser',
          password: 'n'
        })
        .end((err, res) => {
          res.status.should.equal(422);
          res.type.should.equal('application/json');
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Invalid request data.');
          res.body.reasons.should.be.an('Array');
          res.body.reasons.should.include('"password" length must be at least 4 characters long');
          done();
        });
    });

    it('should not create a new user if username is too short', (done) => {
      chai.request(app)
        .post('/api/v1/users')
        .send({
          email: 'newuser@gmail.com',
          username: 'n',
          password: 'newpassword1234'
        })
        .end((err, res) => {
          res.status.should.equal(422);
          res.type.should.equal('application/json');
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Invalid request data.');
          res.body.reasons.should.be.an('Array');
          res.body.reasons.should.include('"username" length must be at least 2 characters long');
          done();
        });
    });

    it('should create a new user if not exists on /api/v1/users POST', (done) => {
      chai.request(app)
        .post('/api/v1/users')
        .send({
          email: 'newuser@gmail.com',
          username: 'newuser1234',
          password: 'newpass'
        })
        .end((err, res) => {
          res.should.have.status(200);
          res.type.should.equal('application/json');
          res.body.should.have.property('token');
          done();
        });
    });

    it('should not register user if user with given email already exists', (done) => {
      chai.request(app)
        .post('/api/v1/users')
        .send({
          email: testUserA.email,
          username: 'someRandomUsername',
          password: 'somepassword123'
        })
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have.property('message').eql('User with that email already exists');
          done();
        });
    });

    it('should not register user if user with given username already exists', (done) => {
      chai.request(app)
        .post('/api/v1/users')
        .send({
          email: 'another@gmail.com',
          username: testUserA.username,
          password: 'somepassword123'
        })
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have.property('message').eql('User with that username already exists');
          done();
        });
    });
  });

  describe('User login', () => {
    it('should not log in user when email is not provided', (done) => {
      chai.request(app)
        .post('/api/v1/users/login')
        .send({
          password: 'testpass'
        })
        .end((err, res) => {
          res.status.should.equal(422);
          res.type.should.equal('application/json');
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Invalid request data.');
          done();
        });
    });

    it('should not log in user when password is not provided', (done) => {
      chai.request(app)
        .post('/api/v1/users/login')
        .send({
          emailOrUsername: 'testmail@gmail.com'
        })
        .end((err, res) => {
          res.status.should.equal(422);
          res.type.should.equal('application/json');
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Invalid request data.');
          done();
        });
    });

    it('should not log in user when user does not exist', (done) => {
      chai.request(app)
        .post('/api/v1/users/login')
        .send({
          emailOrUsername: 'testuser@gmail.com',
          password: 'testpass'
        })
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have.property('message').eql('Wrong credentials');
          done();
        });
    });

    it('should not log in user when provided password is incorrect', (done) => {
      chai.request(app)
        .post('/api/v1/users/login')
        .send({
          emailOrUsername: 'a@gmail.com',
          password: 'wrongpass'
        })
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have.property('message').eql('Wrong credentials');
          done();
        });
    });

    it('should log in user on /api/v1/users/login POST', (done) => {
      chai.request(app)
        .post('/api/v1/users/login')
        .send({
          emailOrUsername: testUserA.email,
          password: testUserA.password
        })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('token');
          userAToken = res.body.token;
          done();
        });
    });

    it('should log in user on /api/v1/users/login POST', (done) => {
      chai.request(app)
        .post('/api/v1/users/login')
        .send({
          emailOrUsername: testUserA.username,
          password: testUserA.password
        })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('token');
          userAToken = res.body.token;
          done();
        });
    });
  });

  describe('Changing password', () => {
    after(() =>
      chai.request(app)
        .post('/api/v1/users')
        .send(testUserA)
        .then((res) => userAToken = res.body.token)
    );

    it('should change password on /api/v1/me/password', (done) => {
      chai.request(app)
        .put('/api/v1/users/me/password')
        .set('authorization', `Bearer ${userAToken}`)
        .send({
          oldPassword: 'pass123',
          newPassword: 'pass987'
        })
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.have.property('message').eql('Password updated');
          chai.request(app)
            .put('/api/v1/users/me/password')
            .set('authorization', `Bearer ${userAToken}`)
            .send({
              oldPassword: 'pass987',
              newPassword: 'pass98712312312'
            })
            .end((err, res) => {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.have.property('message').eql('Password updated');
              done();
            });

        });
    });

    it('should not update user password when user does not exists', (done) => {
      chai.request(app)
        .delete('/api/v1/users/me')
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('message').eql('Account deleted');
          chai.request(app)
            .put('/api/v1/users/me/password')
            .set('authorization', `Bearer ${userAToken}`)
            .send({
              oldPassword: 'pass123',
              newPassword: 'pass987'
            })
            .end((err, res) => {
              res.should.have.status(403);
              res.should.be.json;
              done();
            });
        });
    });
  });

  describe('Getting user info', () => {
    it('should not return user data when token is not provided', (done) => {
      chai.request(app)
        .get('/api/v1/users/me')
        .end((err, res) => {
          res.should.have.status(403);
          res.body.should.have.property('message').eql('Token is not provided.');
          done();
        });
    });

    it('should not return user info when token is incorrect', (done) => {
      chai.request(app)
        .get('/api/v1/users/me')
        .set('authorization', 'Bearer incorrectToken')
        .end((err, res) => {
          res.should.have.status(403);
          res.body.should.have.property('message').eql('Provided token is invalid.');
          done();
        });
    });

    it('should return user info on /api/v1/users/me GET', (done) => {
      chai.request(app)
        .get('/api/v1/users/me')
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.have.property('user');
          res.body.user.should.have.property('_id');
          res.body.user.should.have.property('email').eql('a@gmail.com');
          res.body.user.should.have.property('password');
          done();
        });
    });
  });

  describe('Deleting user', () => {
    it('should delete user on /api/v1/users/me DELETE', (done) => {
      chai.request(app)
        .delete('/api/v1/users/me')
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('message').eql('Account deleted');
          done();
        });
    });
  });
});

describe('Blocking user', () => {

  beforeEach(() =>
    Promise.all([
      chai.request(app)
        .post('/api/v1/users')
        .send(testUserA)
        .then((res) => userAToken = res.body.token),
      chai.request(app)
        .post('/api/v1/users')
        .send(testUserB)
        .then((res) => userBToken = res.body.token),
    ])
  );

  afterEach(() => User.collection.drop());

  it('should not return user info when user is banned', async () => {
    await User.findOneAndUpdate({ username: testUserA.username }, { $set: { isBanned: true } }, { new: true });
    const res = await chai.request(app)
      .get('/api/v1/users/me')
      .set('authorization', `Bearer ${userAToken}`);
    res.should.have.status(403);
    res.body.should.have.property('message').eql('You are banned');
  });

  it('should not log in user when user is banned', async () => {
    await User.findOneAndUpdate({ username: testUserA.username }, { $set: { isBanned: true } }, { new: true });
    const res = await chai.request(app)
      .post('/api/v1/users/login')
      .send({
        emailOrUsername: testUserA.username,
        password: testUserA.password
      });
    res.should.have.status(400);
    res.body.should.have.property('message').eql('You are banned');
  });
});
