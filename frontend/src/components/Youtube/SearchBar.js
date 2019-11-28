import React, { Component } from 'react';
import {
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from 'reactstrap';
import _ from 'lodash';


class SearchBar extends Component {

  constructor(props) {
    super(props);
    this.debounceOnChange = _.debounce(this.debounceOnChange.bind(this), 550); // debouncing function to 300 ms and bind this;
  }

  debounceOnChange(value) {
    this.props.onSearch(value);
    localStorage.setItem('tv/searchQuery', value);
  }

  onChange = e => {
    this.props.setSearchQuery(e.target.value);
    this.debounceOnChange(e.target.value);
  };

  clearSearch = () => {
    this.setState({ searchQuery: '' });
    this.props.clearSearchResults();
  };

  searchOnKeyPress = event => {
    if (event.keyCode === 13 || event.key === 'Enter') {
      this.props.onSearch(this.state.searchQuery);
    }
  };

  componentDidMount() {
    if (process.env.BROWSER) {
      const lastSearch = localStorage.getItem('tv/searchQuery');
      const lastVideo = localStorage.getItem('tv/lastVideo');

      document.addEventListener('keyup', this.onKeyUp);

      if (lastSearch) {
        this.setState({ searchQuery: lastSearch });
      }
      if (lastSearch && !lastVideo) {
        this.props.onSearch(lastSearch);
      }
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.onKeyUp);
  }

  render() {
    return (
      <InputGroup className="nav-group">
        <Input
          tabIndex={-1}
          className="nav-element"
          onKeyPress={this.searchOnKeyPress}
          type="text"
          id="youtubeSearch"
          autoComplete="off"
          name="search"
          placeholder="Search"
          value={this.props.searchQuery}
          onChange={this.onChange}
          onBlur={(e) => { this.props.setPreviousSearches(e.target.value) }}
        />
        <InputGroupAddon addonType="append" tabIndex={-1}>
          <InputGroupText
            className="nav-element"
            tabIndex={-1}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              this.props.onSearch(this.props.searchQuery);
            }}
          >
            <i className="icon-magnifier" />
          </InputGroupText>
          <InputGroupText
            tabIndex={-1}
            className="nav-element btn-setting btn"
            onClick={this.props.toggleFullscreen}
          >
              <i className="icon-size-fullscreen" />
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    );
  }
}

export default SearchBar;
