import { fail } from '../utils/response.js';

export function allow(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(
        res,
        { role: `This endpoint requires one of the roles: ${roles.join(', ')}` },
        'Forbidden',
        403
      );
    }
    next();
  };
}
