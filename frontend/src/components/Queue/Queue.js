import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { setEmployees, flashEmployee } from '../../core/socketEvents';
import Avatar from '../Avatar';
import s from './Queue.css';

const Offline = () => (
  <div style={{ textAlign: 'center', marginTop: '12rem', color: '#888' }}>
    <svg
      version="1.1"
      x="0px"
      y="0px"
      width="24px"
      height="30px"
      viewBox="0 0 24 30"
      style={{ enableBackground: 'new 0 0 50 50' }}
      xmlSpace="preserve"
    >
      <rect x="0" y="10" width="4" height="10" fill="#C8CED3" opacity="0.2">
        <animate
          attributeName="opacity"
          attributeType="XML"
          values="0.2; 1; .2"
          begin="0s"
          dur="0.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="height"
          attributeType="XML"
          values="10; 20; 10"
          begin="0s"
          dur="0.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="y"
          attributeType="XML"
          values="10; 5; 10"
          begin="0s"
          dur="0.6s"
          repeatCount="indefinite"
        />
      </rect>
      <rect x="8" y="10" width="4" height="10" fill="#C8CED3" opacity="0.2">
        <animate
          attributeName="opacity"
          attributeType="XML"
          values="0.2; 1; .2"
          begin="0.15s"
          dur="0.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="height"
          attributeType="XML"
          values="10; 20; 10"
          begin="0.15s"
          dur="0.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="y"
          attributeType="XML"
          values="10; 5; 10"
          begin="0.15s"
          dur="0.6s"
          repeatCount="indefinite"
        />
      </rect>
      <rect x="16" y="10" width="4" height="10" fill="#C8CED3" opacity="0.2">
        <animate
          attributeName="opacity"
          attributeType="XML"
          values="0.2; 1; .2"
          begin="0.3s"
          dur="0.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="height"
          attributeType="XML"
          values="10; 20; 10"
          begin="0.3s"
          dur="0.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="y"
          attributeType="XML"
          values="10; 5; 10"
          begin="0.3s"
          dur="0.6s"
          repeatCount="indefinite"
        />
      </rect>
    </svg>
  </div>
);

const getItemStyle = (isDragging, draggableStyle) => ({
  position: 'relative',
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  // padding: '2px 34px 4px 6px',
  marginBottom: '4px',
  // change background colour if dragging
  background: isDragging ? '#ffc107' : '',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  width: 'inherit',
  whiteSpace: 'nowrap',
  // styles we need to apply on draggables
  ...draggableStyle,
});

const getListStyle = isDraggingOver => ({
  background: isDraggingOver ? 'lightblue' : 'inherit',
  overflow: 'auto',
  padding: 7,
  // width: 230,
  // marginTop: 5,
  height: 'inherit',
  minHeight: 520,
});

class Queue extends React.Component {
  static contextTypes = {
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    socket: PropTypes.object.isRequired,
  };

  state = {
    socketServerOffline: false,
    employees: {
      enabled: [],
      disabled: [],
    },
  };

  constructor(props) {
    super(props);
    this.flashEmployee = flashEmployee.bind(this);
    this.setEmployees = setEmployees.bind(this);
    this.setOffline = () =>
      this.setState({
        employees: { enabled: [], disabled: [] },
        socketServerOffline: true,
      });
    this.setOnline = () => this.setState({ socketServerOffline: false });
    this.setOffline = this.setOffline.bind(this);
    this.setOnline = this.setOnline.bind(this);
  }

  moveEmployee = item => {
    this.context.socket.emit('queue.moveEmployee', item);
  };

  enableEmployee = id => {
    this.context.socket.emit('queue.enableEmployee', id);
  };

  toggleStatus = id => {
    this.context.socket.emit('queue.toggleStatus', id);
  };

  onDragStart = () => {
    /* ... */
  };

  onDragUpdate = () => {
    /* ... */
  };

  onDragEnd = element => {
    this.context.socket.emit('queue.moveEmployee', element);
  };

  componentDidMount() {
    if (process.env.BROWSER) {
      this.context.socket.on('queue.setEmployees', this.setEmployees);
      this.context.socket.on('queue.flashEmployee', this.flashEmployee);
      this.context.socket.on('disconnect', this.setOffline);
      this.context.socket.on('connect', this.setOnline);
    }
  }

  componentWillUnmount() {
    if (process.env.BROWSER) {
      this.context.socket.off('queue.setEmployees', this.setEmployees);
      this.context.socket.off('queue.flashEmployee', this.flashEmployee);
      this.context.socket.off('disconnect', this.setOffline);
      this.context.socket.off('connect', this.setOnline);
    }
  }

  render() {
    return (
      <div className="list-group-accent list-group">
        <li className="list-group-item-accent-secondary bg-light text-center font-weight-bold text-muted text-uppercase small list-group-item">
          Working Staff
        </li>
        {this.state.socketServerOffline ? (
          <Offline />
        ) : (
          <DragDropContext onDragEnd={this.onDragEnd}>
            <Droppable droppableId="enabled">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  style={getListStyle(snapshot.isDraggingOver)}
                >
                  {this.state.employees.enabled.map((item, index) => (
                    <Draggable
                      // isDragDisabled={true}
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          id={item.id}
                          onClick={() => this.moveEmployee(item)}
                          className={`${
                            item.initialized
                              ? item.status
                                ? 'queeue-busy'
                                : 'queeue-available'
                              : 'queeue-disabled'
                          } noselect`}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style,
                          )}
                        >
                          <div
                            className={`${
                              this.props.enlarged
                                ? 'queue-employee-enlarged'
                                : 'queue-employee'
                            }`}
                          >
                            { !this.props.noAvatars && (<Avatar color={`${
                              item.initialized
                                ? item.status
                                ? '#f63c3a'
                                : '#3a9d5d'
                                : '#ccc'
                            }`} size={45} name={item.fullName} src={item.avatar} />)} {item.name}
                          </div>
                          {this.props.noControlButtons !== true && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                padding: '12px',
                                fontSize: '18px',
                                background: '#c8ced3',
                                backgroundColor: '#d1dbe17d',
                                color: '#fff',
                              }}
                              className="btn btn-light float-right"
                              onClick={e => {
                                e.stopPropagation();
                                this.toggleStatus(item.id);
                              }}
                            >
                              <i
                                className={`icons ${
                                  item.status ? 'icon-clock' : 'icon-check'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            {!this.props.noOfflineStaff && (
              <React.Fragment>
                <li className="list-group-item-accent-secondary bg-light text-center font-weight-bold text-muted text-uppercase small list-group-item">
                  Offline staff
                </li>
                <Droppable droppableId="disabled">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      style={getListStyle(snapshot.isDraggingOver)}
                    >
                      {this.state.employees.disabled.map((item, index) => (
                        <Draggable
                          key={item.id}
                          draggableId={item.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              onClick={() => this.enableEmployee(item.id)}
                              className="queeue-disabled"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={getItemStyle(
                                snapshot.isDragging,
                                provided.draggableProps.style,
                              )}
                            >
                              <div
                                className={`${
                                  this.props.enlarged
                                    ? 'queue-employee-disabled-enlarged'
                                    : 'queue-employee-disabled'
                                }`}
                              >
                                {!this.props.noAvatar && (<Avatar color="#ccc" size={45} name={item.fullName} src={item.avatar} />)} {item.name}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </React.Fragment>
            )}
          </DragDropContext>
        )}
      </div>
    );
  }
}

export default withStyles(s)(Queue);
