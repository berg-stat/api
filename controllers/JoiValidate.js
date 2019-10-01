import Joi from 'joi';


const withValidation = (objToValidate, schema, res, callback) =>
  Joi.validate(objToValidate, schema, { abortEarly: false }, (error, value) => {
    if (error) {
      console.error(`[ERROR] bad request data: ${error}`);
      const reasons = error.details.map(detail => detail.message);
      return res.boom.badData('Invalid request data.', { reasons });
    } else {
      callback(value);
    }
  });

export default withValidation;
