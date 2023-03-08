import jwt from 'jsonwebtoken';
export const userFromToken = (token: string) => {
  let data = null;
  try {
    data = jwt.verify(token, process.env.JWT_TOKEN || '1');
  } catch (e) {
    return null;
  }
  return data as { id: number; role: string[]; username: string };
};
