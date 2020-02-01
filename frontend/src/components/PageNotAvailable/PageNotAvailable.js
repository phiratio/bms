import React from 'react';

class PageNotAvailable extends React.Component {
  render() {
    return (
      <React.Fragment>
        <div className="text-center justify-content-center mb-2">
          <i className="icon-info font-4xl"></i>
        </div>
        <h4 className="text-center">For technical reasons this page temporarily not available.</h4>
      </React.Fragment>
    );
  }
}

export default PageNotAvailable;
