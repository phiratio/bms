const mjml2html = require('mjml');

class EmailTemplate {

  constructor({ layout, header, body=[], footer }) {
    this.setLayout = layout;
    this.header = header;
    this.body = body.reduce((acc, val) => acc+val, '');
    this.footer = footer;

    this.mjmlOptions = {
      minify: true,
      keepComments: false,
    };

    this.layout = this.setLayout({ header, body, footer })
  }

  get template() {
    return this.layout;
  }

  get html() {
      const template =  mjml2html(
        this.layout,
        this.mjmlOptions
      );
      if (template.html) return template.html;
      else if (template.errors) {
        return new Error(template.errors);
      } else {
        throw new Error('Unable to create html template')
      }
  }

}

module.exports = EmailTemplate;
