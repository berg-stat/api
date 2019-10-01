import withValidation from './JoiValidate';


const ErrorHandler = {
  async withErrorHandling(req, res, callback) {
    try {
      return await callback(req, res);
    } catch (error) {
      console.error(`[ERROR] ${error}`);
      return res.boom.badRequest();
    }
  },

  async withValidationWithErrorHandling(req, res, objToValidate, schema, callback) {
    return await withValidation(objToValidate, schema, res, async (valid) => {
      try {
        return await callback(valid);
      } catch (error) {
        console.error(`[ERROR] ${error}`);
        return res.boom.badRequest();
      }
    });
  },
};

export default ErrorHandler;
