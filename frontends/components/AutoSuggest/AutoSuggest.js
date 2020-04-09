import React, { Component } from 'react';
import Autosuggest from 'react-autosuggest';
import SpinnerRound from '../SpinnerRound';

class AutoSuggest extends Component {
  constructor() {
    super();

    this.state = {
      value: '',
      suggestions: [],
      isLoading: false,
    };

    this.lastRequestId = null;
  }

  loadSuggestions(value) {
    // Debounce Cancel the previous request
    if (this.lastRequestId !== null) {
      clearTimeout(this.lastRequestId);
    }

    this.setState({
      isLoading: true,
    });

    // Make request
    this.lastRequestId = setTimeout(async () => {
      const suggestions = await this.props.loadSuggestions(value);
      if (suggestions) {
        this.setState({
          isLoading: false,
          suggestions,
        });
      }
    }, 500);
  }

  onChange = (event, { newValue }) => {
    this.setState({
      value: newValue,
    });
  };

  onSuggestionsFetchRequested = ({ value }) => {
    this.loadSuggestions(value, this.state.value);
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  render() {
    const { value, suggestions, isLoading } = this.state;
    const inputProps = {
      placeholder: this.props.placeholder,
      value,
      onChange: this.onChange,
    };
    const status = isLoading && <SpinnerRound />;

    return (
      <div>
        <div className="react-autosuggest__status">{status}</div>
        <Autosuggest
          suggestions={suggestions}
          onSuggestionSelected={this.props.onSuggestionSelected}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          getSuggestionValue={this.props.getSuggestionValue}
          renderSuggestion={this.props.renderSuggestion}
          inputProps={{ ...inputProps, ...this.props.inputProps }}
        />
      </div>
    );
  }
}
export default AutoSuggest;
