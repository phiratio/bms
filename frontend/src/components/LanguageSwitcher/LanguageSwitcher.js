/* eslint-disable no-shadow */

import React from 'react';
import PropTypes from 'prop-types';
import { DropdownItem, Badge } from 'reactstrap';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { connect } from 'react-redux';
import { setLocale } from '../../actions/intl';
import s from './LanguageSwitcher.css';

const localeDict = {
  /* @intl-code-template '${lang}-${COUNTRY}': '${Name}', */
  'en-US': 'English',
  'ru-RU': 'Русский',
  /* @intl-code-template-end */
};

class LanguageSwitcher extends React.Component {
  static propTypes = {
    currentLocale: PropTypes.string.isRequired,
    availableLocales: PropTypes.arrayOf(PropTypes.string).isRequired,
    setLocale: PropTypes.func.isRequired,
  };

  render() {
    const { currentLocale, availableLocales, setLocale } = this.props;
    const isSelected = locale => locale === currentLocale;
    const localeName = locale => localeDict[locale] || locale;
    const localeKeys = Object.keys(localeDict);

    return (
      <React.Fragment>
        {availableLocales.map((locale, index) => (
          <DropdownItem key={locale}>
            {isSelected(locale) ? (
              localeName(locale)
            ) : (
              <a
                href={`?lang=${locale}`}
                onClick={e => {
                  setLocale({ locale });
                  e.preventDefault();
                }}
              >
                {localeName(locale)}
              </a>
            )}{' '}
            <Badge>{localeKeys[index]}</Badge>
          </DropdownItem>
        ))}
      </React.Fragment>
    );
  }
}

const mapState = state => ({
  availableLocales: state.runtime.availableLocales,
  currentLocale: state.intl.locale,
});

const mapDispatch = {
  setLocale,
};

export default connect(mapState, mapDispatch)(withStyles(s)(LanguageSwitcher));
