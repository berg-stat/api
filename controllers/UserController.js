import express from 'express';
import Joi from 'joi';

import Auth from './Auth';
import ErrorHandler from './ErrorHandler';
import { UserService } from '../services';


const __registrationSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  username: Joi.string().min(2, 'utf-8').required(),
  password: Joi.string().min(4, 'utf-8').required(),
});

const registerUser = (req, res) =>
  ErrorHandler.withValidationWithErrorHandling(req, res, req.body, __registrationSchema, async valid => {
    const registrationResult = await UserService.addUser(valid.email, valid.username, valid.password);
    registrationResult.fold(
      failure => res.boom.badRequest(failure),
      success => res.status(200).json(success)
    );
  });


const loginSchema = Joi.object().keys({
  emailOrUsername: Joi.alternatives(
    Joi.string().email().required(),
    Joi.string().min(2, 'utf-8').required()
  ).required(),
  password: Joi.string().min(4, 'utf-8').required(),
});

const logIn = (req, res) =>
  ErrorHandler.withValidationWithErrorHandling(req, res, req.body, loginSchema, async valid => {
    const loginResult = await UserService.logIn(valid.emailOrUsername, valid.password);
    loginResult.fold(
      failure => res.boom.badRequest(failure),
      success => res.status(200).json(success)
    );
  });


const getUserInfo = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await UserService.findUserById(req.user.id))
      .fold(
        failure => res.boom.badRequest(failure),
        success => res.status(200).json(success)
      )
  });


const deleteUser = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await UserService.deleteUser(req.user.id))
      .fold(
        failure => res.boom.badRequest(failure),
        success => res.status(200).json(success)
      )
  });


const __changePasswordSchema = Joi.object().keys({
  oldPassword: Joi.string().min(4, 'utf-8').required(),
  newPassword: Joi.string().min(4, 'utf-8').required(),
});

const changePassword = async (req, res) =>
  ErrorHandler.withValidationWithErrorHandling(req, res, req.body, __changePasswordSchema, async valid => {
    (await UserService.updateUserPassword(req.user.id, valid.oldPassword, valid.newPassword))
      .fold(
        failure => res.boom.badRequest(failure),
        success => res.status(200).json(success)
      )
  });


const usersRouter = express.Router();

usersRouter.post('/', registerUser);

usersRouter.post('/login', logIn);

usersRouter.route('/me')
  .get(Auth.verifyToken, getUserInfo)
  .delete(Auth.verifyToken, deleteUser);

usersRouter.put('/me/password', Auth.verifyToken, changePassword);

export default usersRouter;
export { loginSchema };
