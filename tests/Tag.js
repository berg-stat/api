import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../index';
import { Tag, User } from '../models';
import { TagService } from '../services';


chai.use(chaiHttp);
chai.should();

const prefixURL = '/api/v1/tags';
const testTags = [
  {
    name: 'testTag1',
    category: 'testCategory1',
    isActive: true,
  },
  {
    name: 'testTag2',
    category: 'testCategory2',
    isActive: true,
  },
  {
    name: 'testTag3',
    category: 'testCategory3',
    isActive: true,
  },
];

const testUser = {
  email: 'a@gmail.com',
  username: 'userA',
  password: 'pass123',
};

describe('Tags controller', () => {
  before((done) => {
      chai.request(app)
        .post('/api/v1/users')
        .send(testUser)
        .end((err, res) => {
          testUser.token = res.body.token;
          done();
        });
    }
  );

  after(() => User.collection.drop());

  describe('Active tags', () => {
    beforeEach(() =>
      Promise.all(testTags.map(tag => TagService.addTag(tag.name, tag.category)))
    );

    afterEach(() => Tag.collection.drop());

    it('should return all active tags', (done) => {
        chai.request(app)
          .get(`${prefixURL}/active`)
          .set('authorization', `Bearer ${testUser.token}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.have.property('tags').lengthOf(3);
            done();
          });
      }
    );
  });

  describe('Inactive tags', () => {
    beforeEach(() =>
      Promise.all(testTags.map(tag =>
        new Tag({ name: tag.name, category: tag.category, isActive: false }).save()
      ))
    );

    afterEach(() => Tag.collection.drop());

    it('should not return active tags', (done) => {
        chai.request(app)
          .get(`${prefixURL}/active`)
          .set('authorization', `Bearer ${testUser.token}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.have.property('tags').lengthOf(0);
            done();
          });
      }
    );
  });
});
