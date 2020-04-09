import {Component} from "react";
import firebase from 'firebase';


export default class SendSMSButton extends Component {
  state = {
    id: 'submitForm',
  };

  constructor(props) {
    super(props);
    if (props.id) {
      this.setState({
        id: props.id,
      });
    }
    if (!firebase.apps.length && process.env.BROWSER) {
      firebase.initializeApp({
        apiKey: window.App.fibasePublicApiKey,
      });
    }
  }

  componentDidMount() {
    window.recaptchaVerifier = this.RecaptchaVerifier();
  }

  RecaptchaVerifier = () =>
    new firebase.auth.RecaptchaVerifier(this.state.id, {
      size: 'invisible',
      callback: this.recaptchaCallback,
      'expired-callback': this.recaptchaExpireCallback,
      'error-callback': this.recaptchaExpireCallback,
    });

  recaptchaExpireCallback = () => {
    console.log('expire');
    window.recaptchaVerifier.reset();
  };

  recaptchaCallback = recaptchaToken => {
    console.log('rec', recaptchaToken);
    this.props.submit({
      phoneNumber: this.props.phoneNumber,
      recaptchaToken,
    });
    window.recaptchaVerifier.reset();
  };

  render() {
    setTimeout(() => {
      window.recaptchaVerifier.render().then(widgetId => {
        window.recaptchaWidgetId = widgetId;
      });
    }, 2500);
    return null;
  }
}
