import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../index';
import {
  Place,
  User,
} from '../models';


chai.use(chaiHttp);
chai.should();

const testUserA = {
  email: 'a@gmail.com',
  username: 'userA',
  password: 'pass123'
};

let userAToken;

const testPlaceA = {
  name: 'PlaceA',
  coordinates: {
    latitude: 49.2506,
    longitude: 19.9339,
    elevation: 1895
  }
};

describe('Place controller', () => {

  before((done) => {
    chai.request(app)
      .post('/api/v1/users')
      .send(testUserA)
      .end((err, res) => {
        userAToken = res.body.token;
        done();
      });
  });

  beforeEach(() => Place(testPlaceA).save());

  after(() => User.collection.drop());

  afterEach(() => Place.collection.drop());

  describe('Getting places', () => {
    const testPlaceB = {
      name: 'PlaceB',
      coordinates: {
        latitude: 49.1794,
        longitude: 20.0881,
        elevation: 2503
      }
    };

    beforeEach(() => Place(testPlaceB).save());

    it('should return array of two places on /api/v1/places GET', (done) => {     //TO DO
      chai.request(app)
        .get('/api/v1/places')
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.have.property('places').lengthOf(2);
          done();
        });
    });

    it('should return place on /api/v1/places/:name GET', (done) => {
      chai.request(app)
        .get(`/api/v1/places/${testPlaceA.name}`)
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.have.nested.property('place.name', 'PlaceA');
          done();
        });
    });


    it('should not return place when place name is wrong', (done) => {
      chai.request(app)
        .get('/api/v1/places/PlaceX')
        .set('authorization', `Bearer ${userAToken}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });
  });
});
