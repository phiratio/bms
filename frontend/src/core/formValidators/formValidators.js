import {
  REGEX_NO_DOUBLE_SPACE,
  REGEX_A_Z_SPACE_DASH,
  REGEX_A_Z_0_9,
} from '../../constants';

// validator checks if string is an email
const isEmail = email => {
  // Regular expression was taken from https://stackoverflow.com/a/1373724
  const reg = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
  return reg.test(email);
};

const lastNameValidator = values => {
  const errors = {};
  if (!values.lastName || values.lastName === ' ') {
    errors.lastName = 'Enter your last name';
  }
  try {
    if (
      !REGEX_A_Z_SPACE_DASH.test(values.lastName) ||
      REGEX_NO_DOUBLE_SPACE.test(values.lastName) // do not allow double spaces
    ) {
      errors.lastName = 'Please provide correct last name';
    }
  } catch (e) {
    errors.lastName = 'Please provide correct last name';
  }
  return errors;
};

const usernameValidator = values => {
  const validate = () => {
    const errors = {};
    if (values.username === ' ') {
      errors.username = 'Enter your nickname';
    }
    try {
      if (!REGEX_A_Z_0_9.test(values.username)) {
        errors.username = 'Please provide correct nickname';
      }
    } catch (e) {
      errors.username = 'Please provide correct nickname';
    }
    return errors;
  };
  return {
    optional() {
      if (values.username) return validate();
      return true;
    },
    ...validate(),
  };
};

const firstNameValidator = values => {
  const errors = {};
  if (!values.firstName || values.firstName === ' ') {
    errors.firstName = 'Enter your first name';
  }
  try {
    if (
      !REGEX_A_Z_SPACE_DASH.test(values.firstName) ||
      REGEX_NO_DOUBLE_SPACE.test(values.firstName) // do not allow double spaces
    ) {
      errors.firstName = 'Please provide correct first name';
    }
  } catch (e) {
    errors.firstName = 'Please provide correct first name';
  }
  return errors;
};

const passwordValidator = values => {
  const validate = () => {
    const errors = {};
    if (!values.password) {
      errors.password = 'Enter a password';
    }

    // Must be 8 characters long
    if (!/^.{8,}$/.test(values.password)) {
      errors.password =
        'Password must be at least {chars} characters long || { "chars": "8" }';
    }
    return errors;
  };
  return {
    optional() {
      if (values.password !== undefined) return validate();
      return true;
    },
    ...validate(),
  };
};

const passwordConfirmValidator = values => {
  const validate = () => {
    const errors = {};
    if (!values.passwordConfirm || values.passwordConfirm !== values.password) {
      errors.passwordConfirm = 'Passwords do not match';
    }
    return errors;
  };
  return {
    optional() {
      if (values.passwordConfirm !== undefined) return validate;
      return true;
    },
    ...validate(),
  };
};

const oldPasswordValidator = values => {
  const errors = {};
  if (!values.oldPassword) {
    errors.oldPassword = 'Enter an old password';
  }
  return errors;
};

const emailValidator = values => {
  const validate = () => {
    const errors = {};
    if (!isEmail(values.email)) {
      errors.email = 'Enter a valid email';
    }
    return errors;
  };
  return {
    optional() {
      if (values.email) return validate();
      return true;
    },
    ...validate(),
  };
};

const identifierValidator = values => {
  const validate = () => {
    const errors = {};
    if (!isEmail(values.identifier)) {
      errors.email = 'Enter a valid email';
    }
    return errors;
  };
  return {
    optional() {
      if (values.identifier) return validate();
      return true;
    },
    ...validate(),
  };
};

export {
  firstNameValidator,
  lastNameValidator,
  usernameValidator,
  passwordValidator,
  passwordConfirmValidator,
  oldPasswordValidator,
  emailValidator,
  identifierValidator,
  isEmail,
};
