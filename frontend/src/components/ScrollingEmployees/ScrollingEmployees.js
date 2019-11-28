import React from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import classNames from 'classnames';
import Avatar from '../Avatar';
import s from './style.css';

const ScrollingEmployees = props => {
  let list;

  if (props.noAnyone) {
    list = props.list.filter(el => el.name !== 'Anyone');
  } else {
    list = props.list;
  }

  return (
    <div id="scrolling-wrapper" className={classNames('scrolling-wrapper', 'mt-4', 'text-center', {[props.className]: props.className})}>
      {
        list.length !== 0 ? (
          list.map(el => {
              let classList;
              if (props.selected.indexOf('Anyone') > -1) {
                if (el.name !== 'Anyone') classList = 'disabled';
                else classList = 'active';
              } else {
                classList = props.selected.indexOf(el.name) > -1 ? 'active' : '';
              }
              return (
                <div
                  id={el.name}
                  key={el.name}
                  style={{ cursor: 'pointer' }}
                  className={`swipe-card text-center avatar-checkbox ${classList}`}
                  onClick={() => {
                    if (classList !== 'disabled') props.onClick(el.name, props.singleSelect && true);
                  }}
                >
            <span className="avatar-checked">
              <i className="icon-check" />
            </span>
                  <Avatar
                    color="#fff"
                    src={el.avatar}
                    name={el.name}
                    maxInitials={1}
                    size={props.size ? props.size : 80}
                    round
                  />
                  <label className="avatar-checkbox-label">{el.name}</label>
                </div>
              );
            })
        ) : (
            <div className="not-found text-muted text-center"><h5>No employees found</h5></div>
        )
      }
    </div>
  );
};
export default withStyles(s)(ScrollingEmployees);
