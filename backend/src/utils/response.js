/**
 * Standard API response utility
 */
class ApiResponse {
  /**
   * Send success response
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data,
    });
  }

  /**
   * Send error response
   */
  static error(res, message = 'Error', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      status: 'error',
      message,
      ...(errors && { errors }),
    });
  }

  /**
   * Send paginated response
   */
  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      status: 'success',
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
    });
  }
}

export default ApiResponse;
