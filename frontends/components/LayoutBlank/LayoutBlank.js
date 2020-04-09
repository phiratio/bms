import React from 'react';
import withStyles from "isomorphic-style-loader/lib/withStyles";
import s from "./LayoutBlank.css";

class LayoutBlank extends React.Component {
  render() {
    return this.props.children;
  }
}

export default withStyles(s)(LayoutBlank);
