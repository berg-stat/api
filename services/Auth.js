import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'


const Auth = {
  async verifyToken(req, res, next) {
    const token = __getToken(req.headers);
    if(!token) {
      return res.status(403).send({
        message: 'Token is not provided.'
      })
    }
    try {
      const tokenData = await jwt.verify(token, process.env.SECRET);
      const userId = tokenData.userId;
      // TODO get user from db after importing mongo connection
      const user = 'mockUser';
      if(!user) {
        return res.status(403).json({
          message: 'Provided token is invalid.'
        })
      }
      req.user = { userId: tokenData.userId };
      next()
    } catch(error) {
      return res.status(400).json(error)
    }
  },

  hashPassword(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(12))
  },

  comparePassword(password, hashedPassword) {
    return bcrypt.compareSync(password, hashedPassword)
  },

  isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
  },

  generateToken(id) {
    return jwt.sign({ userId: id }, process.env.SECRET, { expiresIn: '12h' })
  },

  __getToken(header) {
    return header['authorization'].split("Bearer ")[1]
  },

};

export default Auth;
