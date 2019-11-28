import ReactTable from 'react-table';
import React from 'react';

export default props => (
  <ReactTable
    style={{ fontSize: 16, cursor: 'pointer' }}
    // manual
    // onFetchData={this.props.fetchData}
    // filterable
    className="-striped -highlight"
    showPagination={false}
    // Text
    previousText="Previous"
    nextText="Next"
    loadingText="Loading..."
    noDataText="No rows found"
    pageText="Page"
    ofText="of"
    rowsText="rows"
    {...props}
  />
);
