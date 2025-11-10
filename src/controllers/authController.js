import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

function issueToken(user) {
  return jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '2h' });
}

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos' });
    }
    const result = await query('SELECT user_id, username, password_hash, role FROM users WHERE username=$1', [username]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      console.log('Password mismatch');
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
    const token = issueToken(user);
    res.json({ success: true, data: { token, user: { id: user.user_id, username: user.username, role: user.role } } });
  } catch (err) {
    next(err);
  }
}

export async function register(req, res, next) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }
    if (!['gerente', 'cajero', 'cliente'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Rol inválido' });
    }
    const existing = await query('SELECT 1 FROM users WHERE username=$1', [username]);
    if (existing.rowCount) {
      return res.status(409).json({ success: false, message: 'Usuario ya existe' });
    }
    const hash = await bcrypt.hash(password, 10);
    const inserted = await query('INSERT INTO users (username, password_hash, role) VALUES ($1,$2,$3) RETURNING user_id, username, role', [username, hash, role]);
    res.status(201).json({ success: true, data: inserted.rows[0], message: 'Usuario creado' });
  } catch (err) {
    next(err);
  }
}
