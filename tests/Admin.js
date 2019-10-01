import chai from 'chai';
import chaiHttp from 'chai-http';
import mongoose from 'mongoose';

import app from '../index';
import { Opinion, Place, User } from '../models';
import mock from './mocks/Admin.mock';


chai.use(chaiHttp);
chai.should();

const prefixURL = '/api/v1/admin';


describe('Admin controller', () => {
  before((done) => {
    chai.request(app)
      .post('/api/v1/users')
      .send(mock.user)
      .end((err, res) => {
        mock.user.token = res.body.token;
        User.findOneAndUpdate({ name: mock.user.name }, { isAdmin: true }, {}, done);
      });
  });

  after(() => User.collection.drop());

  describe('Admin logging', () => {
    it(`should log in admin on ${prefixURL}/login`, async () => {
      const res = await chai.request(app)
        .post(`${prefixURL}/login`)
        .send({
          emailOrUsername: mock.user.username,
          password: mock.user.password
        });
      res.should.have.status(200);
      res.body.should.have.property('token');
    });

    it(`should not log in user which is not an admin`, async () => {
      const res = await chai.request(app)
        .post(`${prefixURL}/login`)
        .send({
          emailOrUsername: mock.regularUser1.username,
          password: mock.regularUser1.password
        });
      res.should.have.status(403);
      res.body.should.have.property('message').eql('Wrong credentials');
      res.body.should.have.property('error').eql('Forbidden');
    });
  });

  describe('Users functionality', () => {
    before(() =>
      Promise.all([
        chai.request(app)
          .post('/api/v1/users')
          .send(mock.regularUser1)
          .then((res) => {
            mock.regularUser1.id = res.body.user._id;
            mock.regularUser1.token = res.body.token;
          }),
        chai.request(app)
          .post('/api/v1/users')
          .send(mock.regularUser2)
          .then((res) => {
            mock.regularUser2.id = res.body.user._id;
            mock.regularUser2.token = res.body.token;
          }),
      ])
    );

    after(() => Promise.all([
      User.findByIdAndDelete(mock.regularUser1.id).exec(),
      User.findByIdAndDelete(mock.regularUser2.id).exec(),
    ]));

    describe('Deleting user', () => {
      it(`should delete user on ${prefixURL}/users/:id DELETE`, (done) => {
        chai.request(app)
          .delete(`${prefixURL}/users/${mock.regularUser1.id}`)
          .set('authorization', `Bearer ${mock.user.token}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.have.property('message').eql('Account deleted');
            done();
          });
      });
    });
  });


  describe('Opinion censorship functionality', () => {
    before(() =>
      Place(mock.place).save()
        .then(() =>
          chai.request(app)
            .post(`/api/v1/opinions/${mock.place.name}`)
            .send(mock.opinion)
            .set('authorization', `Bearer ${mock.user.token}`)
            .then((res) => mock.opinion.id = res.body.opinion._id)
        )
    );

    after(() => Opinion.collection.drop());

    describe('Opinion fetching', () => {
      beforeEach(async () => {
        await Place(mock.placeB).save().then(() =>
          chai.request(app)
            .post(`/api/v1/opinions/${mock.placeB.name}`)
            .send(mock.opinionB)
            .set('authorization', `Bearer ${mock.user.token}`)
        );
        await Place(mock.placeC).save().then(() =>
          chai.request(app)
            .post(`/api/v1/opinions/${mock.placeC.name}`)
            .send(mock.opinionC)
            .set('authorization', `Bearer ${mock.user.token}`)
        );
      });
      afterEach(async () => {
        await Place.collection.drop();
      });

      it(`Should return whole opinion including username, place name info on ${prefixURL}/opinions`, async () => {
        const res = await chai.request(app)
          .get(`${prefixURL}/opinions`)
          .set('authorization', `Bearer ${mock.user.token}`);

        res.should.have.status(200);
        res.body.opinions.forEach(packedObj => {
          packedObj.should.have.property('opinion');
          packedObj.should.have.property('place');
          packedObj.should.have.property('author');
          packedObj.opinion.should.have.property('_id');
          packedObj.place.should.have.property('_id');
          packedObj.author.should.have.property('_id');
        });
      })
    });

    describe('Deleting opinion', () => {
      it(`should delete place on ${prefixURL}/opinions/:placeName/:opinionId DELETE`, (done) => {
        chai.request(app)
          .delete(`${prefixURL}/opinions/${mock.opinion.id}`)
          .set('authorization', `Bearer ${mock.user.token}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.have.property('message').eql('Opinion deleted');
            done();
          });
      });

      it('should not delete opinion when opinion id is wrong', (done) => {
        chai.request(app)
          .delete(`${prefixURL}/opinions/${mongoose.Types.ObjectId()}`)
          .set('authorization', `Bearer ${mock.user.token}`)
          .end((err, res) => {
            res.should.have.status(404);
            res.should.be.json;
            res.body.message.should.not.be.undefined;
            res.body.message.should.eql('Opinion not found');
            done();
          });
      });
    });
  });


  describe('Managing places functionality', () => {
    beforeEach(() => Place(mock.place).save());
    afterEach(() => Place.collection.drop());

    describe('Adding places', () => {
      it(`should add a new place if not exists on ${prefixURL}/places POST`, (done) => {
        chai.request(app)
          .post(`${prefixURL}/places`)
          .set('authorization', `Bearer ${mock.user.token}`)
          .send({
            name: 'PlaceB',
            coordinates: {
              latitude: 49.1794,
              longitude: 20.0881,
              elevation: 2503
            }
          })
          .end((err, res) => {
            res.should.have.status(200);
            res.type.should.equal('application/json');
            res.body.should.have.property('message').and.eql('Place has been added');
            done();
          });
      });

      it('should not add a new place if place with given name already exists', (done) => {
        chai.request(app)
          .post(`${prefixURL}/places`)
          .set('authorization', `Bearer ${mock.user.token}`)
          .send(mock.place)
          .end((err, res) => {
            res.should.have.status(400);
            res.body.should.have.property('message').eql('Place with that name already exists');
            done();
          });
      });

      it('should not add a new place when name is not provided', (done) => {
        chai.request(app)
          .post(`${prefixURL}/places`)
          .set('authorization', `Bearer ${mock.user.token}`)
          .send({
            coordinates: {
              latitude: 49.1794,
              longitude: 20.0881,
              elevation: 2503
            }
          })
          .end((err, res) => {
            res.should.have.status(422);
            res.type.should.equal('application/json');
            res.body.message.should.not.be.undefined;
            res.body.message.should.eql('Invalid request data.');
            done();
          });
      });

      it('should not add a new place when coordinates are not provided', (done) => {
        chai.request(app)
          .post(`${prefixURL}/places`)
          .set('authorization', `Bearer ${mock.user.token}`)
          .send({
            name: 'PlaceB'
          })
          .end((err, res) => {
            res.should.have.status(422);
            res.type.should.equal('application/json');
            res.body.message.should.not.be.undefined;
            res.body.message.should.eql('Invalid request data.');
            done();
          });
      });

      it('should not add a new place when latitude is not provided', (done) => {
        chai.request(app)
          .post(`${prefixURL}/places`)
          .set('authorization', `Bearer ${mock.user.token}`)
          .send({
            name: 'PlaceB',
            coordinates: {
              longitude: 20.0881,
              elevation: 2503
            }
          })
          .end((err, res) => {
            res.should.have.status(422);
            res.type.should.equal('application/json');
            res.body.message.should.not.be.undefined;
            res.body.message.should.eql('Invalid request data.');
            done();
          });
      });


      it('should not add a new place when longitude is not provided', (done) => {
        chai.request(app)
          .post(`${prefixURL}/places`)
          .set('authorization', `Bearer ${mock.user.token}`)
          .send({
            name: 'PlaceB',
            coordinates: {
              latitude: 49.1794,
              elevation: 2503
            }
          })
          .end((err, res) => {
            res.should.have.status(422);
            res.type.should.equal('application/json');
            res.body.message.should.not.be.undefined;
            res.body.message.should.eql('Invalid request data.');
            done();
          });
      });

      it('should not add a new place when elevation is not provided', (done) => {
        chai.request(app)
          .post(`${prefixURL}/places`)
          .set('authorization', `Bearer ${mock.user.token}`)
          .send({
            name: 'PlaceB',
            coordinates: {
              latitude: 49.1794,
              longitude: 20.0881
            }
          })
          .end((err, res) => {
            res.should.have.status(422);
            res.type.should.equal('application/json');
            res.body.message.should.not.be.undefined;
            res.body.message.should.eql('Invalid request data.');
            done();
          });
      });
    });

    describe('Deleting place', () => {
      it(`should delete place on ${prefixURL}/places/:name DELETE`, (done) => {
        chai.request(app)
          .delete(`${prefixURL}/places/${mock.place.name}`)
          .set('authorization', `Bearer ${mock.user.token}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.have.property('message').eql('Place deleted');
            done();
          });
      });

      it('should not delete place when name is wrong', (done) => {
        chai.request(app)
          .delete(`${prefixURL}/places/PlaceX`)
          .set('authorization', `Bearer ${mock.user.token}`)
          .end((err, res) => {
            res.should.have.status(404);
            res.should.be.json;
            res.body.should.have.property('message', 'Place not found');
            done();
          });
      });
    });
  });


  describe('Managing tags functionality', () => {
    beforeEach(() =>
      Promise.all(mock.tags.map(tag => TagService.addTag(tag.name, tag.category)))
    );
    afterEach(() => Tag.collection.drop());

  });
});
