import { fail } from '../utils/response.js';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = {};
      for (const issue of result.error.issues) {
        errors[issue.path[0] ?? 'body'] = issue.message;
      }
      return fail(res, errors, 'Validation Error', 422);
    }

    req.body = result.data;
    next();
  };
}
