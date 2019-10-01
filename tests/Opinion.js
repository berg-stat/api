import chai from 'chai';
import chaiHttp from 'chai-http';
import mongoose from 'mongoose';

import app from '../index';
import {
  Opinion,
  Place,
  User,
} from '../models';
import { ReportReasons } from '../models/Report';


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

const testPlaceA = {
  name: 'PlaceA',
  coordinates: {
    latitude: 49.2506,
    longitude: 19.9339,
    elevation: 1895
  }
};

const testOpinionA = {
  text: 'Test opinionA',
  date: new Date(),
  tags: [{ name: 'testTagA', category: 'testCategory' }]
};

let testOpinionId;

describe('Opinion controller', () => {

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
      Place(testPlaceA).save(),
    ])
  );

  beforeEach((done) => {
    chai.request(app)
      .post(`/api/v1/opinions/${testPlaceA.name}`)
      .send(testOpinionA)
      .set('authorization', `Bearer ${userAToken}`)
      .end((err, res) => {
        testOpinionId = res.body.opinion._id;
        done();
      });
  });

  after(() => Promise.all([
    User.collection.drop(),
    Place.collection.drop(),
  ]));

  afterEach(() => Opinion.collection.drop());

  describe('Adding opinion', () => {
    it('should add a new opinion on /api/v1/opinions/:placeName POST', (done) => {
      chai.request(app)
        .post(`/api/v1/opinions/${testPlaceA.name}`)
        .set('authorization', `Bearer ${userAToken}`)
        .send({
          text: 'Test opinionB',
          date: new Date(),
          tags: [{ name: 'testTagB', category: 'testCategory' }]
        })
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          done();
        });
    });

    it('should not add a new opinion when place name is wrong', (done) => {
      chai.request(app)
        .post('/api/v1/opinions/PlaceX')
        .set('authorization', `Bearer ${userAToken}`)
        .send({
          text: 'Test opinionB',
          date: new Date(),
          tags: [{ name: 'testTagB', category: 'testCategory' }]
        })
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have.property('message').eql('Place with given name does not exist');
          done();
        });
    });

    it('should add a new opinion when text is not provided', (done) => {
      chai.request(app)
        .post(`/api/v1/opinions/${testPlaceA.name}`)
        .set('authorization', `Bearer ${userAToken}`)
        .send({
          date: new Date(),
          tags: [{ name: 'testTagB', category: 'testCategory' }],
        })
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.message.should.eql('Opinion added');
          done();
        });
    });

    it('should add a new opinion when text is empty', (done) => {
      chai.request(app)
        .post(`/api/v1/opinions/${testPlaceA.name}`)
        .set('authorization', `Bearer ${userAToken}`)
        .send({
          date: new Date(),
          tags: [{ name: 'testTagB', category: 'testCategory' }],
          text: ''
        })
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.message.should.eql('Opinion added');
          done();
        });
    });

    it('should not add a new opinion when date is not provided', (done) => {
      chai.request(app)
        .post(`/api/v1/opinions/${testPlaceA.name}`)
        .set('authorization', `Bearer ${userAToken}`)
        .send({
          text: 'Test opinionB',
          tags: [{ name: 'testTagB', category: 'testCategory' }]
        })
        .end((err, res) => {
          res.should.have.status(422);
          res.should.be.json;
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Invalid request data.');
          done();
        });
    });
  });

  describe('Getting opinion', () => {
    const testOpinionB = {
      text: 'Test opinionB',
      date: new Date(),
      tags: [{ name: 'testTagB', category: 'testCategory' }]
    };

    let testOpinionBId;

    beforeEach((done) => {
      chai.request(app)
        .post(`/api/v1/opinions/${testPlaceA.name}`)
        .send(testOpinionB)
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          testOpinionBId = res.body.opinion._id;
          done();
        });
    });

    it('should return array of two opinions on /api/v1/opinions/:placeName GET', async () => {
      const res = await chai.request(app)
        .get(`/api/v1/opinions/${testPlaceA.name}`)
        .set('authorization', `Bearer ${userAToken}`);
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.have.property('opinions').lengthOf(2);
      res.body.opinions[0].user.username.should.eql(testUserA.username);
    });

    it('should not return opinions when place name is wrong', (done) => {
      chai.request(app)
        .get('/api/v1/opinions/PlaceX')
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.opinions.should.eql([]);
          done();
        });
    });

    it('should return opinion on /api/v1/opinions/:placeName/:opinionId GET', (done) => {
      chai.request(app)
        .get(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}`)
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.opinion.should.have.property('author');
          res.body.opinion.should.have.property('place');
          res.body.opinion.should.have.property('text').eql('Test opinionA');
          res.body.opinion.should.have.property('date');
          done();
        });
    });

    it('should not return opinion when opinion id is wrong', (done) => {
      chai.request(app)
        .get(`/api/v1/opinions/${testPlaceA.name}/${mongoose.Types.ObjectId()}`)
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(400);
          res.should.be.json;
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Opinion not found');
          done();
        });
    });

    describe('Deleted opinions', () => {
      beforeEach((done) => {
        chai.request(app)
          .delete(`/api/v1/opinions/${testPlaceA.name}/${testOpinionBId}`)
          .set('authorization', `Bearer ${userAToken}`)
          .end((err, res) => {
            console.log(res.body);
            done();
          });
      });

      it('should not return opinion when deleted', (done) => {
        chai.request(app)
          .get(`/api/v1/opinions/${testPlaceA.name}`)
          .set('authorization', `Bearer ${userAToken}`)
          .end((err, res) => {
            console.log(res.body);
            res.should.have.status(200);
            res.should.be.json;
            res.body.opinions.length.should.eql(1);
            // res.body.opinions.should.eql([testOpinionA]);
            done();
          });
      });
    });
  });

  describe('Deleting opinion', () => {
    it('should delete opinion on /api/v1/opinions/:placeName/:opinionId DELETE', (done) => {
      chai.request(app)
        .delete(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}`)
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('message').eql('Opinion deleted');
          done();
        });
    });

    it('should not delete opinion when opinion id is wrong', (done) => {
      chai.request(app)
        .delete(`/api/v1/opinions/${testPlaceA.name}/${mongoose.Types.ObjectId()}`)
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(404);
          res.should.be.json;
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Opinion not found');
          done();
        });
    });

    it('should not delete opinion when user is not an author', (done) => {
      chai.request(app)
        .delete(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}`)
        .set('authorization', `Bearer ${userBToken}`)
        .end((err, res) => {
          res.should.have.status(404);
          res.should.be.json;
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('You have no permission to delete this resource');
          done();
        });
    });
  });

  describe('Updating opinion', () => {
    it('should update opinion on /api/v1/opinions/:placeName/:opinionId PUT', (done) => {
      chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}`)
        .set('authorization', `Bearer ${userAToken}`)
        .send({
          text: 'Updated test opinionA',
          date: new Date(),
          tags: testOpinionA.tags,
        })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('message').eql('Opinion updated');
          res.body.should.have.property('opinion');
          res.body.opinion.should.have.property('text').eql('Updated test opinionA');
          res.body.opinion.should.have.property('date').not.eql(testOpinionA.date);
          done();
        });
    });

    it('should not update opinion when updated date is not provided', (done) => {
      chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}`)
        .set('authorization', `Bearer ${userAToken}`)
        .send({
          text: 'Updated test opinionA'
        })
        .end((err, res) => {
          res.should.have.status(422);
          res.should.be.json;
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Invalid request data.');
          done();
        });
    });

    it('should not update opinion when opinion id is wrong', (done) => {
      chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${mongoose.Types.ObjectId()}`)
        .set('authorization', `Bearer ${userAToken}`)
        .send({
          text: 'Updated test opinionA',
          date: new Date(),
          tags: testOpinionA.tags,
        })
        .end((err, res) => {
          res.should.have.status(400);
          res.should.be.json;
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Opinion not found');
          done();
        });
    });

    it('should not update opinion when user is not an author', (done) => {
      chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}`)
        .set('authorization', `Bearer ${userBToken}`)
        .send({
          text: 'Updated test opinionA',
          date: new Date(),
          tags: testOpinionA.tags,
        })
        .end((err, res) => {
          res.should.have.status(400);
          res.should.be.json;
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('You have no permission to delete this resource');
          done();
        });
    });
  });

  describe('Adding like to opinion', () => {
    it('should add like to opinion on /api/v1/opinions//:placeName/:opinionId/likes PUT', (done) => {
      chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}/likes`)
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          done();
        });
    });

    it('should not add like to opinion when opinion id is wrong', (done) => {
      chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${mongoose.Types.ObjectId()}/likes`)
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(400);
          res.should.be.json;
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Opinion not found');
          done();
        });
    });

    it('should not add like to opinion when user has already liked it', (done) => {
      chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}/likes`)
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          chai.request(app)
            .put(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}/likes`)
            .set('authorization', `Bearer ${userAToken}`)
            .end((err, res) => {
              res.should.have.status(400);
              res.should.be.json;
              res.body.message.should.not.be.undefined;
              res.body.message.should.eql('You have already liked this opinion');
              done();
            });
        });
    });
  });

  describe('Adding unlike to opinion', () => {
    it('should add unlike to opinion on /api/v1/opinions/:placeName/:opinionId/unlikes PUT', (done) => {
      chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}/likes`)
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          chai.request(app)
            .put(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}/unlikes`)
            .set('authorization', `Bearer ${userAToken}`)
            .end((err, res) => {
              res.should.have.status(200);
              res.should.be.json;
              done();
            });
        });
    });

    it('should not add unlike to opinion when opinion id is wrong', (done) => {
      chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${mongoose.Types.ObjectId()}/unlikes`)
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(400);
          res.should.be.json;
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('Opinion not found');
          done();
        });
    });

    it('should not add unlike to opinion when user has not liked it', (done) => {
      chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}/unlikes`)
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(400);
          res.should.be.json;
          res.body.message.should.not.be.undefined;
          res.body.message.should.eql('You did not like this opinion');
          done();
        });
    });
  });

  describe('Reporting opinion', () => {
    it('should return array of possible reasons to report opinion on /api/v1/opinions/report', async () => {
      const res = await chai.request(app)
        .get('/api/v1/opinions/report')
        .set('authorization', `Bearer ${userAToken}`);
      res.should.have.status(200);
      res.body.should.have.property('reasons');
      res.body.reasons.should.eql(ReportReasons);
    });

    it('should report opinion on /api/v1/opinions/:placeName/:opinionId/report', async () => {
      const res = await chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}/report`)
        .set('authorization', `Bearer ${userAToken}`)
        .send({
          text: 'I dont like this opinion',
          reason: ReportReasons[0]
        });
      res.should.have.status(200);
      res.body.should.have.property('message').eql('Opinion reported');
    });

    it('should not report opinion when reason is invalid', async () => {
      const res = await chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}/report`)
        .set('authorization', `Bearer ${userAToken}`)
        .send({
          text: 'I dont like this opinion',
          reason: 'invalid reason'
        });
      res.should.have.status(400);
      res.body.should.have.property('message').eql('You provide invalid report reason');
    });

    it('should not report opinion when reason is missing', async () => {
      const res = await chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}/report`)
        .set('authorization', `Bearer ${userAToken}`)
        .send({
          text: 'I dont like this opinion',
        });

      res.should.have.status(422);
      res.body.should.have.property('message').eql('Invalid request data.');
      res.body.should.have.property('reasons');
      res.body.reasons.should.contain('"reason" is required');
    });

    it('should not report opinion when given user already reported it', async () => {
      const firstRes = await chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}/report`)
        .set('authorization', `Bearer ${userAToken}`)
        .send({
          text: 'I dont like this opinion',
          reason: ReportReasons[0]
        });
      firstRes.should.have.status(200);
      firstRes.body.should.have.property('message').eql('Opinion reported');

      const secondRes = await chai.request(app)
        .put(`/api/v1/opinions/${testPlaceA.name}/${testOpinionId}/report`)
        .set('authorization', `Bearer ${userAToken}`)
        .send({
          text: 'I dont like this opinion once more',
          reason: ReportReasons[1]
        });
      secondRes.should.have.status(400);
      secondRes.body.should.have.property('message').eql('You have already reported this opinion.');
    });

  });
});
