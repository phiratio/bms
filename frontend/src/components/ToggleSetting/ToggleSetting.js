import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AppSwitch from '../Switch';

class ToggleSetting extends Component {

  static contextTypes = {
    fetch: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    translate: PropTypes.func.isRequired,
  };

  render() {
    return (
      <React.Fragment>
        {this.props.header}
        <AppSwitch
          onChange={() => {
            this.props.toggleSetting(this.props.settingName, this.props.settingKey);
          }}
          className="switch-sm float-right"
          variant="pill"
          checked={this.props.checked}
          color="success"
          label
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
export default ToggleSetting;
