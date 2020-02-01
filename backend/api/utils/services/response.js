
class Response {

  flash(msg, type='success') {
    return {
      notifications: {
        flash: {
          msg,
          type,
        }
      }
    };
  }

  template() {
    return {
      statusCode: 200,
      error: undefined,
      message: {
        // form validation failure
        errors:{},
      },
    }
  }

};

module.exports = new Response();
