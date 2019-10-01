import express from 'express';
import Joi from 'joi';

import Auth from './Auth';
import ErrorHandler from './ErrorHandler';

import {
  UserService,
  PlaceService,
  OpinionService,
  TagService,
} from '../services';

import { placeRequestSchema } from './PlaceController';
import { loginSchema } from './UserController';


const adminLogIn = (req, res) =>
  ErrorHandler.withValidationWithErrorHandling(req, res, req.body, loginSchema, async valid => {
    (await UserService.logInAsAdmin(valid.emailOrUsername, valid.password))
      .fold(
        failure => res.boom.forbidden(failure),
        success => res.status(200).json(success)
      );
  });

const getAllUsers = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await UserService.findAllUsers())
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });

const getAllBlockedUsers = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await UserService.findAllBlockedUsers())
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });

const getSingleUser = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await UserService.getSingleUser(req.params.id))
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });

const deleteUser = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await UserService.deleteUser(req.params.id))
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });

const blockUser = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await UserService.blockUser(req.params.id))
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });

const unblockUser = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await UserService.unblockUser(req.params.id))
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });


const getAllOpinions = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () =>
    res.status(200).json(await OpinionService.findAllOpinionsAllPlaces()));

const getAllBlockedOpinions = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await OpinionService.findAllBlockedOpinions())
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });

const blockOpinion = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await OpinionService.blockOpinion(req.params.id))
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });

const unblockOpinion = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await OpinionService.unblockOpinion(req.params.id))
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });

const deleteOpinion = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await OpinionService.deleteOpinionByAdmin(req.params.id))
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });

const addPlace = (req, res) =>
  ErrorHandler.withValidationWithErrorHandling(req, res, req.body, placeRequestSchema, async valid => {
    const additionResult = await PlaceService.addPlace(valid.name, valid.coordinates);
    additionResult.fold(
      failure => res.boom.badRequest(failure),
      success => res.status(200).json(success)
    );
  });

const modifyPlace = async (req, res) =>
  ErrorHandler.withValidationWithErrorHandling(req, res, req.body, placeRequestSchema, async valid => {
    const additionResult = await PlaceService.updatePlace(req.params.oldName, valid.name, valid.coordinates);
    additionResult.fold(
      failure => res.boom.badRequest(failure),
      success => res.status(200).json(success)
    );
  });

const deletePlace = (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await PlaceService.deletePlace(req.params.placeName))
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });


const __tagAdditionSchema = Joi.object().keys({
  name: Joi.string().required(),
  category: Joi.string().required(),
});

const addTag = (req, res) =>
  ErrorHandler.withValidationWithErrorHandling(req, res, req.body, __tagAdditionSchema, async valid => {
    const additionResult = await TagService.addTag(valid.name, valid.category);
    additionResult.fold(
      failure => res.boom.badRequest(failure),
      success => res.status(200).json(success)
    );
  });

const getAllTags = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await TagService.getAllTags())
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });

const activateTag = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await TagService.activateTag(req.params.tagName))
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });

const deactivateTag = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await TagService.deactivateTag(req.params.tagName))
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });

const deleteTag = (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await TagService.deleteTag(req.params.tagName))
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });

const adminRouter = express.Router();

adminRouter.post('/login', adminLogIn);

adminRouter.get('/users', Auth.verifyToken, Auth.verifyAdmin, getAllUsers);
adminRouter.get('/users/blocked', Auth.verifyToken, Auth.verifyAdmin, getAllBlockedUsers);
adminRouter.get('/users/:id', Auth.verifyToken, Auth.verifyAdmin, getSingleUser);
adminRouter.delete('/users/:id', Auth.verifyToken, Auth.verifyAdmin, deleteUser);
adminRouter.put('/users/:id/block', Auth.verifyToken, Auth.verifyAdmin, blockUser);
adminRouter.put('/users/:id/unblock', Auth.verifyToken, Auth.verifyAdmin, unblockUser);

// TODO: Write tests
adminRouter.get('/opinions', Auth.verifyToken, Auth.verifyAdmin, getAllOpinions);
adminRouter.get('/opinions/blocked', Auth.verifyToken, Auth.verifyAdmin, getAllBlockedOpinions);
adminRouter.put('/opinions/:id/block', Auth.verifyToken, Auth.verifyAdmin, blockOpinion);
adminRouter.put('/opinions/:id/unblock', Auth.verifyToken, Auth.verifyAdmin, unblockOpinion);
///
adminRouter.delete('/opinions/:id', Auth.verifyToken, Auth.verifyAdmin, deleteOpinion);


adminRouter.post('/places', Auth.verifyToken, Auth.verifyAdmin, addPlace);
// TODO: Modifying place
adminRouter.put('/places/:oldName', Auth.verifyToken, Auth.verifyAdmin, modifyPlace);
///
adminRouter.delete('/places/:placeName', Auth.verifyToken, Auth.verifyAdmin, deletePlace);


adminRouter.post('/tags', Auth.verifyToken, Auth.verifyAdmin, addTag);
adminRouter.get('/tags', Auth.verifyToken, Auth.verifyAdmin, getAllTags);
adminRouter.put('/tags/:tagName/activate', Auth.verifyToken, Auth.verifyAdmin, activateTag);
adminRouter.put('/tags/:tagName/deactivate', Auth.verifyToken, Auth.verifyAdmin, deactivateTag);
adminRouter.delete('/tags/:tagName', Auth.verifyToken, Auth.verifyAdmin, deleteTag);


export default adminRouter;
