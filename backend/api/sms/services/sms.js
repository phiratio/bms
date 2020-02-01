const googleApis = require('googleapis');

class SMS {

  constructor() {
    this.identityToolkit = googleApis.google.identitytoolkit({
      auth: process.env.FIREBASE_API_KEY,
      version: 'v3',
    });
  }

  send({phoneNumber, recaptchaToken}) {
    return this.identityToolkit.relyingparty.sendVerificationCode({
      phoneNumber,
      recaptchaToken,
    });
  }

  verify(verificationCode, phoneSessionId) {
    return this.identityToolkit.relyingparty.verifyPhoneNumber({
      verificationCode,
      phoneSessionId,
    });
  }

}

module.exports = new SMS();
