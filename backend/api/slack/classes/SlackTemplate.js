/**
* Builds a Slack template
* e.g.
*  new SlackTemplate()
* .divider()
* .section(`:book: *Sample text*`)
* .section('John Doe', `<link>`)
* .timeRange('Jan 1, 1970')
* .note('Text')
* .section('Extra text')
* .actions([
* {
*      text: 'View/Modify',
*      value: `<link>`
*    }
* ])
* .divider()
* .template;
 */

class SlackTemplate {

  constructor() {
    this._template = [];
  }

  actionButton(el) {
    return {
      "type": "button",
      "style": el.style ? el.style : 'primary',
      "text": {
        "type": "plain_text",
        "text": el.text
      },
      "url": el.value,
    }
  }

  sectionTemplate(text) {
    return [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": text,
        }
      }
    ]
  }

  divider() {
    const template = [
      {
        "type": "divider"
      },
    ];
    this._template = [...this._template, ...template];
    return this;
  }

  section(text, link) {
    if (!text) return this;
    this._template = [...this._template, ...this.sectionTemplate(link ? `<${link}|${text}>` : text)];
    return this;
  }

  timeRange(timeRange) {
    if (!timeRange) return this;
    this._template = [...this._template, ...this.sectionTemplate(`:clock12: Date & Time: *${timeRange}*`)];
    return this;
  }

  services(services) {
    if (!services) return this;
    this._template = [...this._template, ...this.sectionTemplate(`:pushpin: Services: *${services}*`)];
    return this;
  }

  note(note) {
    if (!note) return this;
    this._template = [...this._template, ...this.sectionTemplate(`:notebook: Note *${note}*`)];
    return this;
  }

  employees(employees) {
    if (!employees) return this;
    this._template = [...this._template, ...this.sectionTemplate(`:bust_in_silhouette: Employees *${employees}*`)];
    return this;
  }

  actions(actionsArray = []) {
    const template = [
      {
        "type": "actions",
        "elements": actionsArray.map(el => this.actionButton(el))
      }
    ];
    this._template = [...this._template, ...template];
    return this;
  }

  get template() {
    return this._template;
  }

}

module.exports = SlackTemplate;
