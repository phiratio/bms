import React from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import notificationsCss from 'redux-notification-center/lib/styles.css';
import { Alert } from 'reactstrap';
import { actions as notifActions } from 'redux-notification-center';
import s from './Notification.css';

const { notifDismiss } = notifActions;
const Notification = ({...props}) => {
  const handleDismiss = (id) => {
    props.dispatch(notifDismiss(id));
  };
  let kind = s.notif__header__success;
  if (props.kind === 'error') kind = s.notif__header__error;
  else if (props.kind === 'warning') kind = s.notif__header__warning;

  return (
    <Alert className={`${s.notif} ${kind}`} onClick={() => handleDismiss(props.id)}>
      { props.header ? <h4 className={s.notif__header}>{props.header}</h4> : null }
      <div className={s.notif__message}>{props.message}</div>
      { props.actionLabel ? <h5 onClick={() => props.onActionClick}>{props.actionLabel}</h5> : null }
      {/*{ <span className={s.notif__dismiss} onClick={() => handleDismiss(props.id)}>×</span>}*/}
    </Alert>
  );
}

export default withStyles(s, notificationsCss)(Notification);
