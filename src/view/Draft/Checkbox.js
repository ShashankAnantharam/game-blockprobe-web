import React, { Component } from 'react';
class Checkbox extends React.Component {
    constructor(props) {
      //toggleChange, value, isChecked, label
      super(props);
    }
    render() {
      return (
        <label
            style={{fontSize:'15px', marginRight:'25px'}}
            >
          <input type="checkbox"
            checked={this.props.isChecked}
            onChange={() => {this.props.toggleChange(this.props.value)}}
          />
          {this.props.label}
         </label>
      );
    }
  }
  export default Checkbox;
  