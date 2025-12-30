import Joi from "joi";

const useSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
});

export const validateUser = (req, res, next) => {
  const { error } = useSchema.validate(req.body);
  if (error)
    return res.status(400).json({
      status: 400,
      message: error.details[0].message,
    });
  next();
};

const updateUserSchema = Joi.object({
  name: Joi.string().min(3),
  email: Joi.string().email(),
}).min(1);

export const validateUpdateUser = (req, res, next) => {
  const { error } = updateUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: error.details[0].message,
    });
  }
  next();
};

export default { validateUser, validateUpdateUser };
