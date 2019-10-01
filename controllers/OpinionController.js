import express from 'express';
import Joi from 'joi';

import Auth from './Auth';
import ErrorHandler from './ErrorHandler';
import { OpinionService } from '../services';


Joi.objectId = require('joi-objectid')(Joi);

const __addTagSchema = Joi.object().keys({
  name: Joi.string().min(1, 'utf-8').required(),
  category: Joi.string().min(1, 'utf-8').required(),
});

const __addOpinionSchema = Joi.object().keys({
  text: Joi.string().allow('', null),
  date: Joi.date().required(),
  tags: Joi.array().items(__addTagSchema).unique('name'),
});

const addOpinion = async (req, res) =>
  ErrorHandler.withValidationWithErrorHandling(req, res, req.body, __addOpinionSchema, async valid => {
    (await OpinionService.addOpinion(req.params.placeName, req.user.id, valid.text, valid.date, valid.tags))
      .fold(
        failure => res.boom.badRequest(failure),
        success => res.status(200).json(success)
      )
  });


const getAllOpinions = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () =>
    res.status(200).json(await OpinionService.findAllOpinions(req.params.placeName)));

const getOpinion = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await OpinionService.getSingleOpinion(req.params.opinionId))
      .fold(
        failure => res.boom.badRequest(failure),
        success => res.status(200).json(success)
      )
  });

const deleteOpinion = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await OpinionService.deleteOpinion(req.params.opinionId, req.user.id))
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      )
  });


const __updateOpinionSchema = Joi.object().keys({
  params: {
    placeName: Joi.string(),
    opinionId: Joi.objectId(),
  },
  body: {
    text: Joi.string().allow('', null),
    date: Joi.date().required(),
    tags: Joi.array().items(__addTagSchema).unique('name'),
  }
});

const updateOpinion = async (req, res) =>
  ErrorHandler.withValidationWithErrorHandling(req, res, {
    body: req.body,
    params: req.params
  }, __updateOpinionSchema, async valid => {
    const { text, date, tags } = valid.body;
    (await OpinionService.updateOpinion(valid.params.opinionId, req.user.id, { text, date, tags }))
      .fold(
        failure => res.boom.badRequest(failure),
        success => res.status(200).json(success)
      )
  });

const addLike = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await OpinionService.addLikeToOpinion(req.params.opinionId, req.user.id))
      .fold(
        failure => res.boom.badRequest(failure),
        success => res.status(200).json(success)
      )
  });

const addUnlike = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await OpinionService.addUnlikeToOpinion(req.params.opinionId, req.user.id))
      .fold(
        failure => res.boom.badRequest(failure),
        success => res.status(200).json(success)
      )
  });

const getReportReasons = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    return res.status(200).json(OpinionService.getReportReasons())
  });

const __reportOpinionSchema = Joi.object().keys({
  params: {
    placeName: Joi.string(),
    opinionId: Joi.objectId(),
  },
  body: {
    text: Joi.string().allow('', null),
    reason: Joi.string().min(1, 'utf-8').required(),
  }
});

const reportOpinion = async (req, res) =>
  ErrorHandler.withValidationWithErrorHandling(req, res, {
    body: req.body,
    params: req.params
  }, __reportOpinionSchema, async valid => {
    (await OpinionService.reportOpinion(valid.params.opinionId, req.user.id, valid.body.text, valid.body.reason))
      .fold(
        failure => res.boom.badRequest(failure),
        success => res.status(200).json(success)
      );
  });


const opinionsRouter = express.Router();

opinionsRouter.route('/report')
  .get(Auth.verifyToken, getReportReasons);

opinionsRouter.route('/:placeName')
  .post(Auth.verifyToken, addOpinion)
  .get(Auth.verifyToken, getAllOpinions);

opinionsRouter.route('/:placeName/:opinionId')
  .get(Auth.verifyToken, getOpinion)
  .delete(Auth.verifyToken, deleteOpinion)
  .put(Auth.verifyToken, updateOpinion);

opinionsRouter.route('/:placeName/:opinionId/likes')
  .put(Auth.verifyToken, addLike);

opinionsRouter.route('/:placeName/:opinionId/unlikes')
  .put(Auth.verifyToken, addUnlike);

opinionsRouter.route('/:placeName/:opinionId/report')
  .put(Auth.verifyToken, reportOpinion);

export default opinionsRouter;
