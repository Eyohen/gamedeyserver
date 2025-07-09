
// utils/response.js
class ResponseUtil {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      data
    };
    
    console.log('Sending success response:', response); // Add this for debugging
    return res.status(statusCode).json(response);
  }

  static error(res, message = 'Error occurred', statusCode = 400, errors = null) {
    const response = {
      success: false,
      message
    };

    if (errors) {
      response.errors = errors;
    }

    console.log('Sending error response:', response); // Add this for debugging
    return res.status(statusCode).json(response);
  }

  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination
    });
  }
}

module.exports = ResponseUtil;
