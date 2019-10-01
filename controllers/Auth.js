import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Left, Maybe, Right } from 'monet';

import { User } from '../models';


const Auth = {
  __getTokenOpt(header) {
    const prefix = 'Bearer ';
    return Maybe.fromNull(header['authorization'])
      .filter(token => token.startsWith(prefix))
      .map(token => token.split(prefix))
      .map(arr => arr[1])
      .map(token => token.trim());
  },

  __extractToken(header) {
    return Auth.__getTokenOpt(header)
      .toEither('Token is not provided.');
  },

  async __checkIfTokenIsValid(token) {
    try {
      const tokenData = await jwt.verify(token, process.env.SECRET);
      return Right(tokenData);
    } catch (e) {
      console.error(e);
      return Left('Provided token is invalid.');
    }
  },

  async __fetchUser(userId) {
    return Maybe.fromNull(await User.findById(userId).exec())
      .toEither('Provided token is invalid');
  },

  __checkIfUserIsNotBlocked(userData) {
    return Maybe.pure(userData)
      .filterNot(user => user.isBanned)
      .toEither('You are banned');
  },

  __addUserDataToRequest(userData, req) {
    req.user = {
      id: userData._id,
      isAdmin: userData.isAdmin
    };
    return Right(userData);
  },

  async verifyToken(req, res, next) {
    const authorizationResult = await Auth.__extractToken(req.headers)
      .flatMap(async tokenString => (await Auth.__checkIfTokenIsValid(tokenString))
        .flatMap(async token => (await Auth.__fetchUser(token.id))
          .flatMap(userData => Auth.__checkIfUserIsNotBlocked(userData))
            .flatMap(userData => Auth.__addUserDataToRequest(userData, req))
        )
      );

    return authorizationResult.fold(
      (msg) => res.boom.forbidden(msg),
      () => next()
    );
  },

  async verifyAdmin(req, res, next) {
    if (req.user.isAdmin) {
      console.info(`Request by admin, admin id: ${req.user.id}`);
      next();
    } else {
      return res.boom.forbidden('You have no access to this resource');
    }
  },

  hashPassword(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(12))
  },

  comparePassword(password, hashedPassword) {
    return bcrypt.compareSync(password, hashedPassword)
  },

  generateToken(id, isAdmin) {
    const tokenData = {
      id,
      isAdmin
    };
    return jwt.sign(tokenData, process.env.SECRET, { expiresIn: '365d' })
  },
};

export default Auth;
