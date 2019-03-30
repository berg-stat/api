import User from '../models/UserModel.js'
import Auth from './'

const UsersService =
{
  async addUser(userEmail, userPassword) {
    try {
      const user = await User.findOne({email: userEmail});
      if (user) {
        return { message: 'User with that email already exists' };
      }
      const newUser = new User(userEmail, Auth.hashPassword(userPassword));
      newUser.save();
      return newUser;
    } catch (error) {
      console.log(error);
      return {error};
    }
  },

  async findAllUsers() {
    try {
      const user = await User.find();
      return user;
    } catch (error) {
      console.log(error);
      return {error};
    }
  },

  async logIn(userEmail, userPassword) {
    try {
      const user = await User.findOne({email: userEmail});
      if(!user) {
        return { message: 'User with that email doesn\'t exist' };
      }
      if(!Auth.comparePassword(userPassword, user.password)) {
        return { message: 'Incorrect password' };
      }
      return { message: 'Successfully logged in' };
    }
    catch (error) {
      console.log(error);
      return {error};
    }
  },

  async findUserById(id) {
    try {
      const user = await User.findById(id);
      if (user) {
        return user;
      }
      return { message: 'User with that id doesn\'t exist' };
    } catch (error) {
      console.log(error);
      return {error};
    }
  },

  async deleteUser(id) {
    try {
      const user = await User.findByIdAndDelete(id);
      return { message: 'Account successfully deleted' };
    } catch (error) {
      console.log(error);
      return {error};
    }
  }
};