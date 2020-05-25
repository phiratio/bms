import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalBody, ModalHeader, ModalFooter, Button } from 'reactstrap';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from 'suneditor/dist/css/suneditor.min.css';
import customCss from './EditorModal.css';

const SunEditor =
  // eslint-disable-next-line global-require
  typeof document !== 'undefined' && require('suneditor-react').default;

class EditorModal extends Component {
  static contextTypes = {
    fetch: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    translate: PropTypes.func.isRequired,
  };

  state = {
    saveText: false,
    saveTextValue: {},
  };

  showModal = () => {
    this.setState({
      saveTextValue: this.props.value,
      saveText: !this.state.saveText,
    });
  };

  render() {
    return (
      <React.Fragment>
        <Modal
          size="lg"
          fade={false}
          className="modal-primary"
          isOpen={this.state.saveText}
          toggle={this.showModal}
        >
          <ModalHeader>{this.props.header}</ModalHeader>
          <ModalBody>
            {SunEditor && (
              <SunEditor
                onChange={this.props.onChange}
                setContents={this.props.savedState ? this.props.savedState : this.props.value}
                setOptions={{
                  height: 400,
                  resizingBar: false,
                  buttonList: [
                    ['undo','redo'],
                    [
                      'bold',
                      'underline',
                      'italic',
                      'strike',
                    ],
                    ['link', 'codeView']
                  ],
                }}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={async () => {
                const res = await this.props.save(
                  this.props.settingName,
                  this.props.settingKey,
                  this.state.saveTextValue,
                );

                if (res) {
                  this.setState({
                    saveText: !this.state.saveText,
                  });
                }
              }}
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
export default withStyles(s, customCss)(EditorModal);
