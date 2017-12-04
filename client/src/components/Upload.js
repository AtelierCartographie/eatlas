// @flow

import React, { Component } from 'react';

import GooglePicker from 'react-google-picker';

class Upload extends Component<{}> {
  render() {
    return (
      <GooglePicker
        clientId={'937774650140-tvfga32rphg3p3ubh53stscagmtb9tf5.apps.googleusercontent.com'}
        developerKey={'AIzaSyAy4sF8n9pZ_pbWR1aECiz9gk9x70f0reg'}
        scope={['https://www.googleapis.com/auth/drive.readonly']}
        onChange={data => console.log('on change:', data)}
        multiselect={true}
        navHidden={true}
        authImmediate={false}
        // mimeTypes={['image/png', 'image/jpeg', 'image/jpg']}
        viewId={'DOCS'}
      >
        <button className="button is-primary">picker</button>
      </GooglePicker>
    );
  }
}

export default Upload;
