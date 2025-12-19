import Joi from "joi";

const useScheme = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
});

export const validateUser = (req, res, next) => {
  const { error } = useScheme.validate(req.body);
  if (error)
    return res.status(400).json({
      status: 400,
      message: error.details[0].message,
    });
  next();
};

const updateUserScheme = Joi.object({
  name: Joi.string().min(3),
  email: Joi.string().email(),
}).min(1);

export const validateUpdadeUser = (req, res, next) => {
  const { error } = updateUserScheme.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: error.details[0].message,
    });
  }
};

export default { validateUser, validateUpdadeUser };
