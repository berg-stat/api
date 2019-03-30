import express from 'express';
import Auth from '../services/Auth';
import Joi from 'joi';
import Validated from '../services/JoiValidate';
import UsersService from '../services/UsersService'


const __registrationSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().min(4, 'utf-8').required()
});

const registerUser =  (req, res) => Validated(req, __registrationSchema, res, async value => {
  try {
    const registrationResult = UsersService.addUser(value.email, value.password);
    return res.status(200).json(registrationResult);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
});


const getAllUsers = async (req, res) => {
  try {
    const allUsers = UsersService.findAllUsers();
    return res.status(200).json(allUsers);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
};


const __loginSchema = __registrationSchema;

const logIn = (req, res) => Validated(req, __loginSchema, res, async value =>  {
  try {
    const loginResult = UsersService.logIn(value.email, value.password);
    return res.status(200).json(loginResult);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
};


const getUserInfo = async (req, res) => {
  try {
    const userInfo = UsersService.findUserById(req.user.userId);
    return res.status(200).json(userInfo);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
};


const updateUserInfo = async (req, res) => {
  try {
    return res.status(200).json({msg: 'not implemented'});
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
};


const deleteUser = async (req, res) => {
  try {
    const deleteResult = UsersService.deleteUser(req.user.userId);
    return res.status(200).json(deleteResult);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
};


const changePassword = async (req, res) => {
  try {
    return res.status(200).json({msg: 'not implemented'});
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
};


const usersRouter = express.Router();

usersRouter.route('/')
  .post(registerUser)
  .get(getAllUsers);

usersRouter.post('/login', logIn);

usersRouter.route('/me')
  .get(Auth.verifyToken, getUserInfo)
  .put(Auth.verifyToken, updateUserInfo)
  .delete(Auth.verifyToken, deleteUser);

usersRouter.put('/me/password', changePassword);

export default usersRouter;
