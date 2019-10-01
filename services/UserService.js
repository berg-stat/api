import { Either, Maybe } from 'monet';

import { User } from '../models';
import { Auth } from '../controllers';


const UserService = {

  async addUser(email, username, userPassword) {
    if (await User.findOne({ email }).exec()) {
      return Either.left('User with that email already exists');
    }
    if (await User.findOne({ username }).exec()) {
      return Either.left('User with that username already exists');
    }
    const newUser = new User({ email, username, password: Auth.hashPassword(userPassword) });
    await newUser.save();
    const token = Auth.generateToken(newUser._id);
    return Either.right({
      user: newUser,
      token
    });
  },

  async findUser(emailOrUsername) {
    const isEmailAddress = (emailOrUsername) => {
      const regex = /\S+@\S+\.\S+/;
      return regex.test(emailOrUsername)
    };

    if(isEmailAddress(emailOrUsername)) {
      return Maybe.fromNull(await User.findOne({ email: emailOrUsername }).exec())
    } else {
      return Maybe.fromNull(await User.findOne({ username: emailOrUsername }).exec())
    }
  },


  async logIn(emailOrUsername, userPassword) {
    return (await UserService.findUser(emailOrUsername))
      .filter(user => Auth.comparePassword(userPassword, user.password))
      .toEither('Wrong credentials')
      .flatMap(user => Maybe.pure(user)
        .filterNot(user => user.isBanned)
        .toEither('You are banned')
      )
      .map(user => ({
        token: Auth.generateToken(user._id, user.isAdmin),
        message: 'Successfully logged in'
      }));
  },

  async logInAsAdmin(emailOrUsername, password) {
    return (await UserService.findUser(emailOrUsername))
      .filter(user => Auth.comparePassword(password, user.password))
      .filter(user => user.isAdmin)
      .toEither('Wrong credentials')
      .flatMap(user => Maybe.pure(user)
        .filterNot(user => user.isBanned)
        .toEither('You are banned')
      )
      .map(user => ({
        token: Auth.generateToken(user._id, user.isAdmin),
        message: 'Successfully logged in'
      }));
  },

  async findUserById(id) {
    return Maybe.fromNull(await User.findById(id).exec())
      .map(user => ({ user }))
      .toEither('User not found');
  },

  async getSingleUser(userId) {
    return Maybe.fromNull(await User.findById(userId).select('-password').exec())
      .map(user => ({ user }))
      .toEither('User not found');
  },

  async findAllUsers() {
    return Maybe.fromNull(await User.find().select('-password').exec())
      .map(users => ({ users }))
      .toEither({ users: [] });
  },

  async findAllBlockedUsers() {
    return Maybe.fromNull(await User.find({ isBanned: true }).select('-password').exec())
      .map(blockedUsers => ({ blockedUsers }))
      .toEither({ users: [] });
  },


  async updateUserPassword(id, oldPassword, newPassword) {
    return Maybe.fromNull(await User.findById(id).exec())
      .toEither('User not exists')
      .flatMap(maybeUser =>
        Maybe.fromNull(maybeUser)
          .filter(user => Auth.comparePassword(oldPassword, user.password))
          .map(async user => await User.findByIdAndUpdate(user._id, { password: Auth.hashPassword(newPassword) }))
          .map(() => ({ message: 'Password updated' }))
          .toEither('Wrong password')
      );
  },


  async blockUser(userId) {
    return Maybe.fromNull(await User
      .findByIdAndUpdate(userId, { isBanned: true }, { new: true })
      .select('-password')
      .exec())
      .map(user => ({
        message: 'User blocked',
        user
      }))
      .toEither('User not found');
  },

  async unblockUser(userId) {
    return Maybe.fromNull(await User
      .findByIdAndUpdate(userId, { isBanned: false }, { new: true })
      .select('-password')
      .exec())
      .map(user => ({
        message: 'User unblocked',
        user
      }))
      .toEither('User not found');
  },

  async deleteUser(id) {
    return Maybe.fromNull(await User.findByIdAndDelete(id).exec())
      .map(() => ({ message: 'Account deleted' }))
      .toEither('User not found');
  },
};

export default UserService;
