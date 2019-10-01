import express from 'express';
import ErrorHandler from './ErrorHandler';
import { TagService } from '../services';
import Auth from './Auth';


const getAllActiveTags = async (req, res) =>
  ErrorHandler.withErrorHandling(req, res, async () => {
    (await TagService.getAllTags(true))
      .fold(
        failure => res.boom.notFound(failure),
        success => res.status(200).json(success)
      );
  });


const tagsRouter = express.Router();

tagsRouter.get('/active', Auth.verifyToken, getAllActiveTags);

export default tagsRouter;
