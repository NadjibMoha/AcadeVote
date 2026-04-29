const jwt = require('jsonwebtoken');
const { authenticateToken, requireRole } = require('../middleware/auth');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test_secret';
  });

  describe('authenticateToken', () => {
    it('should return 401 if no token is provided', () => {
      authenticateToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied, token missing' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if token is invalid', () => {
      req.headers['authorization'] = 'Bearer invalid_token';
      jwt.verify.mockImplementation((token, secret, callback) => callback(new Error('Invalid token')));
      
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next and set req.user if token is valid', () => {
      const mockUser = { id: 1, role: 'admin' };
      req.headers['authorization'] = 'Bearer valid_token';
      jwt.verify.mockImplementation((token, secret, callback) => callback(null, mockUser));
      
      authenticateToken(req, res, next);
      
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should return 403 if user is not present', () => {
      const middleware = requireRole(['admin']);
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is not allowed', () => {
      req.user = { role: 'voter' };
      const middleware = requireRole(['admin']);
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user role is allowed', () => {
      req.user = { role: 'admin' };
      const middleware = requireRole(['admin']);
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
});
