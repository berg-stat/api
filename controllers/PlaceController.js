import express from 'express';
import Joi from 'joi';

import Auth from './Auth';
import ErrorHandler from './ErrorHandler';
import { PlaceService } from '../services';


const coordinatesRequestSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  elevation: Joi.number().min(0).required(),
});

const placeRequestSchema = Joi.object().keys({
  name: Joi.string().required(),
  coordinates: coordinatesRequestSchema.required(),
});


const getAllPlaces = (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await PlaceService.getAllPlaces())
      .fold(
        failure => res.boom.badRequest(failure),
        success => res.status(200).json(success)
      );
  });


const getPlace = (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await PlaceService.getPlaceByName(req.params.placeName))
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });


const placesRouter = express.Router();

placesRouter.get('/', Auth.verifyToken, getAllPlaces);
placesRouter.get('/:placeName', Auth.verifyToken, getPlace);

export default placesRouter;
export { coordinatesRequestSchema, placeRequestSchema };
