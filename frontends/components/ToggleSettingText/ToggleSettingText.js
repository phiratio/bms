import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalBody, ModalHeader, ModalFooter, Button, Input, InputGroup } from 'reactstrap';
import _ from 'lodash';

class ToggleSettingText extends Component {

  static contextTypes = {
    fetch: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    translate: PropTypes.func.isRequired,
  };

  state = {
    toggleSettingText: false,
    toggleSettingTextValue: {},
  };

  showModal = () => {
    this.setState({
      toggleSettingTextValue: this.props.value,
      toggleSettingText: !this.state.toggleSettingText,
    });
  };

  render() {
    const value = this.props.value || {};
    const keys = Object.keys(value);
    return (
      <React.Fragment>
        <Modal
          size="lg"
          fade={false}
          className="modal-primary"
          isOpen={this.state.toggleSettingText}
          toggle={this.showModal}
        >
          <ModalHeader>{this.props.header}</ModalHeader>
          <ModalBody>
            {
              keys.map(el =>
                (
                  <InputGroup key={el}>
                    <InputGroup className="input-group-prepend">
                      <span className="input-group-text">{_.startCase(el)}</span>
                      <Input type="text" onChange={ e => this.setState({ toggleSettingTextValue: { ...this.state.toggleSettingTextValue, [el]: e.target.value }  })} value={this.state.toggleSettingTextValue[el]} />
                    </InputGroup>
                  </InputGroup>
                )
              )
            }
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={() => { this.props.toggleSetting(this.props.settingName, this.props.settingKey, this.state.toggleSettingTextValue); this.setState({ toggleSettingText: !this.state.toggleSettingText, }) }}
            >
              Update
            </Button>
          </ModalFooter>
        </Modal>
        {this.props.header}
        <span
          onClick={this.showModal}
          className="text-overflow basic-multi-select setting-dropdown mb-2 width-148 btn-link text-right"
        >
          Change
        </span>
        {this.props.description && (
          <div>
            <small className="text-muted">{this.props.description}</small>
          </div>
        )}
      </React.Fragment>
    );
  }
}
export default ToggleSettingText;
