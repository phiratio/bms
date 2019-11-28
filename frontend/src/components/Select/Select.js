import React from 'react';
import Select from 'react-select';

export default props => (
  <Select
    {...props}
    theme={theme => ({
      ...theme,
      colors: {
        ...theme.colors,
        primary: '#8ad4ee',
        primary25: '#ebf5ff',
        borderWidth: 0,
      },
    })}
    options={props.options}
    getOptionLabel={option => option.name}
    getOptionValue={option => option.id}
    classNamePrefix="select"
  />
);
