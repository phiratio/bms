const banner = require('../../email/templates/layout/banner.js');
const contacts = require('../../email/templates/layout/contacts.js');
const footer = require('../../email/templates/layout/footer.js');
const layout = require('../../email/templates/layout/layout');
const forgotPasswordTemplate = require('../../email/templates/auth/forgot');

module.exports = async ({ user, url }) => {
    const location = await strapi.services.business.info();
    const html = new strapi.classes.emailTemplate({
      layout,
      body: [
        banner({ url: `/uploads/templates/email/header.png`}),
        forgotPasswordTemplate({
          user,
          url,
          location,
        }),
        contacts({
          location,
        }),
      ],
      footer: footer({
        footerText: 'You are receiving this email because you agreed to receive emails from us regarding events and special offers. Sent from an automated mailbox. If replying to this email, you will not receive a response.',
        location
      }),
    }).html;

    return {
      to: user.email,
      html,
      subject: `Reset you password`,
    }
};
