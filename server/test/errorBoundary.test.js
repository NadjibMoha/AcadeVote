const errorBoundary = require('../middleware/errorBoundary');

describe('ErrorBoundary Middleware', () => {
  let req, res, next, consoleSpy;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    delete process.env.NODE_ENV;
  });

  it('should return 500 and hide stack trace in non-development mode', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Test Error');
    error.stack = 'Mock Stack Trace';

    errorBoundary(error, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith('Unhandled Error:', 'Mock Stack Trace');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Test Error',
      details: undefined
    });
  });

  it('should return 500 and show stack trace in development mode', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Test Error');
    error.stack = 'Mock Stack Trace';

    errorBoundary(error, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith('Unhandled Error:', 'Mock Stack Trace');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Test Error',
      details: 'Mock Stack Trace'
    });
  });

  it('should fallback to default error message if error.message is not present', () => {
    const error = { stack: 'Mock Stack Trace' };

    errorBoundary(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Internal Server Error'
    }));
  });
});
