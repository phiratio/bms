import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from '../Select';

class ToggleSettingDropdown extends Component {
  static contextTypes = {
    fetch: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    translate: PropTypes.func.isRequired,
  };

  state = {
    cleared: false,
  };

  render() {
    return (
      <React.Fragment>
        {this.props.header}
        <Select
          {...this.props}
          isSearchable
          closeMenuOnSelect
          className="basic-multi-select setting-dropdown mb-2 width-148"
          onChange={async selected => {
            if (selected === null && !this.state.cleared) {
              await this.setState({ cleared: true });
              await this.props.toggleSetting(this.props.settingName, this.props.settingKey, selected);
              await this.setState({ cleared: false });
            } else if (selected && !this.state.cleared) {
              this.props.toggleSetting(this.props.settingName, this.props.settingKey, selected);
            }
          }}
        />
        {this.props.description && (
          <div>
            <small className="text-muted">{this.props.description}</small>
          </div>
        )}
      </React.Fragment>
    );
  }
}
export default ToggleSettingDropdown;
