export default {
  tags: [
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
  ],
  place: {
    name: 'PlaceA',
    coordinates: {
      latitude: 49.2506,
      longitude: 19.9339,
      elevation: 1895
    }
  },
  placeB: {
    name: 'PlaceB',
    coordinates: {
      latitude: 49.2506,
      longitude: 19.9339,
      elevation: 1895
    }
  },
  placeC: {
    name: 'PlaceC',
    coordinates: {
      latitude: 49.2506,
      longitude: 19.9339,
      elevation: 1895
    }
  },
  opinion: {
    text: 'Test opinionA',
    date: new Date(),
    tags: [{ name: 'testTagA', category: 'testCategory' }]
  },
  opinionB: {
    text: 'Test opinionB',
    date: new Date(),
    tags: [{ name: 'testTagA', category: 'testCategory' }]
  },
  opinionC: {
    text: 'Test opinionC',
    date: new Date(),
    tags: [{ name: 'testTagA', category: 'testCategory' }]
  },
  user: {
    email: 'a@gmail.com',
    username: 'userAdmin',
    password: 'pass123',
  },
  regularUser1: {
    email: 'a@a.a',
    username: 'userA',
    password: 'pass123',
  },
  regularUser2: {
    email: 'b@b.b',
    username: 'userB',
    password: 'pass123',
  }
};
