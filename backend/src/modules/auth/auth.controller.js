import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/database.js';
import { ok, fail } from '../../utils/response.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const { rows } = await query(
      'SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];

    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
      return fail(res, { credentials: 'Email or password is incorrect' }, 'Unauthorized', 401);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    return ok(
      res,
      {
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    return ok(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
}
