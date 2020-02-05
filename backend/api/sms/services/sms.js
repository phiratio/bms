const NAMESPACE = 'accounts:verifications:mobilePhone:';
const { HOUR_1 } = require('../../constants');
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

  saveSession({ phoneNumber, sessionInfo }) {
    return strapi.services.redis.set(`${NAMESPACE}${phoneNumber}`, sessionInfo, 'EX', HOUR_1);
  }

  getSession(phoneNumber) {
    return strapi.services.redis.get(`${NAMESPACE}${phoneNumber}`);
  }

  removeSession(phoneNumber) {
    return strapi.services.redis.del(`${NAMESPACE}${phoneNumber}`);
  }

  async verify({ verificationCode, mobilePhone }) {
    try {
      const phoneSessionId = await strapi.services.sms.getSession(mobilePhone);
      console.log('phoneSessionId', phoneSessionId);
      if (!phoneSessionId) return false;

      const verification = await this.identityToolkit.relyingparty.verifyPhoneNumber({
        code: verificationCode,
        sessionInfo: phoneSessionId,
      });

      console.log('verification', verification);

      if (verification.status === 200) {
        await strapi.services.sms.removeSession(mobilePhone);
      }

      return {
        code: verification.status,
        status: verification.statusText,
      };

    } catch(e) {
      console.error(e);
      strapi.log.error('sms.services.verify Error: %s', e.message);
      return {
        code: e.code,
        error: e.message,
      };
    }

  }

}

module.exports = new SMS();
