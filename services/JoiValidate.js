import Joi from 'joi';

const Validated = (objToValidate, schema, res, callback) =>
  Joi.validate(objToValidate, schema, (error, value) => {
    if (error) {
      return res.status(422).json({
        message: 'Invalid request data.',
        error
      })
    }

    callback(value);
  });

export default Validated;
