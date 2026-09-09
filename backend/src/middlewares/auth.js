import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { fail } from '../utils/response.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, { token: 'Missing bearer token' }, 'Unauthorized', 401);
  }

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const { rows } = await query(
      'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1',
      [payload.id]
    );

    if (!rows.length || !rows[0].is_active) {
      return fail(res, { token: 'User is no longer active' }, 'Unauthorized', 401);
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return fail(res, { token: 'Invalid or expired token' }, 'Unauthorized', 401);
    }
    next(error);
  }
}
