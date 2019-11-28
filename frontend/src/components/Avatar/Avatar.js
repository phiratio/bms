import React from 'react';
import Avatar from 'react-avatar';
import get from 'lodash.get';
import { Cache } from './Cache';

const cache = new Cache({
  sourceTTL: (3600 / 4) * 1000,
  sourceSize: 20,
});

export default providedProps => {
  const size = providedProps.size || 35;
  const { email, color } = providedProps;
  let name = providedProps.name;
  if (providedProps.firstName && providedProps.lastName) {
    name = `${providedProps.firstName} ${providedProps.lastName}`
  }
  let src;
  if (process.env.BROWSER) {
    if (typeof providedProps.src === 'object') {
      const avatarPath = get(providedProps.src, 'url');
      if (avatarPath) src = `${window.App.apiUrl}${avatarPath}`;
    } else if (typeof providedProps.src === 'string') {
      src = `${window.App.apiUrl}${providedProps.src}`;
    }
  }

  const props = {
    ...(color && { color }),
    ...(size && { size }),
    ...(!src && name && { name }),
    ...(name && { name }),
    ...(src && { src }),
    ...(!src && email && { email }),
  };
  return <Avatar cache={cache} round {...props} />;
};
