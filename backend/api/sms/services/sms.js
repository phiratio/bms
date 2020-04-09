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

  async send({phoneNumber, recaptchaToken}) {
    try {
      const verification = await this.identityToolkit.relyingparty.sendVerificationCode({
        phoneNumber,
        recaptchaToken,
      });

      return verification;
    } catch (e) {
      strapi.log.error('sms.services.send Error: %s', e.message);
      return {
        status: 400,
        message: e.message,
      }
    }

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
      if (!phoneSessionId) return false;

      const verification = await this.identityToolkit.relyingparty.verifyPhoneNumber({
        code: verificationCode,
        sessionInfo: phoneSessionId,
      });


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
      let msg;

      switch(e.message) {
        case 'INVALID_CODE':
          msg = 'Invalid code provided';
          break;
        case 'SESSION_EXPIRED':
          msg = 'Session expired';
          break;
        default:
          msg = 'Unable to verify mobile phone';
      }

      return {
        code: e.code,
        error: e.message,
        msg
      };
    }

  }

}

module.exports = new SMS();
