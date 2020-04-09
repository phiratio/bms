import React from 'react';
import history from '../../history';

const createPagination = (meta, fetchNext, pushHistory, searchQuery) => {
  // replace number of pages from server
  const pages = [];
  let i =
    Number(meta.currentPage) > meta.paginationLinks
      ? Number(meta.currentPage) - (meta.paginationLinks - 1)
      : 1;
  if (i !== 1) {
    pages.push(
      <li key={`${i}-disabled`} className="page-item disabled">
        <a href="#" className="page-link">
          ...
        </a>
      </li>,
    );
  }
  for (
    ;
    i <= Number(meta.currentPage) + (meta.paginationLinks - 1) &&
    i <= meta.totalPages;
    i++
  ) {
    if (i === meta.currentPage) {
      pages.push(
        <li key={i} className="active page-item">
          <a href="#" onClick={e => e.preventDefault()} className="page-link">
            {i}
          </a>
        </li>,
      );
    } else {
      // if we have small amount of elements then negative pages start to appear, we have to check that
      if (i > 0) {
        pages.push(
          <li key={i} className="page-item" title={i}>
            <a
              href="#"
              className="page-link"
              data-page={i}
              onClick={e => {
                const { page } = e.target.dataset;
                e.preventDefault();
                // TODO: Take into confideration that probably there will be other queries in `windows.location.search`
                if (pushHistory) {
                  history.push(
                    `?page=${page}${searchQuery && `&search=${searchQuery}`}`,
                  );
                } else {
                  fetchNext(e.target.dataset.page, searchQuery);
                }
              }}
            >
              {i}
            </a>
          </li>,
        );
      }
    }
    if (
      i === Number(meta.currentPage) + (meta.paginationLinks - 1) &&
      i < meta.totalPages
    ) {
      pages.push(
        <li key={`${i} disabled`} className="page-item disabled">
          <a href="#" className="page-link">
            ...
          </a>
        </li>,
      );
    }
  }
  return pages;
};

const Pagination = props =>
  props.meta.totalPages > 1 && (
    <ul className="pagination">
      {props.meta.currentPage === 1 ? ( // if current page is first than disable link
        <li className="disabled page-item" title="next page">
          <a href="#" className="page-link">
            &lt;
          </a>
        </li>
      ) : (
        // otherwise show link that fetch first page
        <li className="page-item" title="next page">
          <a
            href="#"
            className="page-link"
            onClick={e => {
              e.preventDefault();
              if (props.pushHistory)
                history.push(
                  `?page=${1}${props.searchQuery &&
                    `&search=${props.searchQuery}`}`,
                );
              else props.fetchNext();
            }}
          >
            &lt;
          </a>
        </li>
      )}
      {createPagination(
        props.meta,
        props.fetchNext,
        props.pushHistory,
        props.searchQuery,
      )}
      {props.meta.currentPage === props.meta.totalPages ? ( // if current page is last than disable link
        <li className="disabled page-item" title="next page">
          <a href="#" className="page-link">
            &gt;
          </a>
        </li>
      ) : (
        // otherwise show link that fetch last page
        <li className="page-item" title="next page">
          <a
            href="#"
            className="page-link"
            onClick={e => {
              e.preventDefault();
              if (props.pushHistory)
                history.push(
                  `?page=${props.meta.totalPages}${props.searchQuery &&
                    `&search=${props.searchQuery}`}`,
                );
              else props.fetchNext(props.meta.totalPages);
            }}
          >
            &gt;
          </a>
        </li>
      )}
    </ul>
  );

export default Pagination;
