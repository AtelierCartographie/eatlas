// @flow

import React, { Component, Fragment } from 'react'

type Props = {
  object: ?Object,
  title: string,
}

class ObjectDebug extends Component<Props> {
  render() {
    if (process.env.NODE_ENV !== 'development') {
      return null
    }

    const { object } = this.props

    if (!object) {
      return null
    }

    const keys = []
    const appendKeys = (object, prefix = []) => {
      Object.keys(object).forEach(k => {
        const k2 = prefix.concat(k)
        if (object[k] && typeof object[k] === 'object') {
          appendKeys(object[k], k2)
        } else {
          keys.push(k2)
        }
      })
    }
    appendKeys(object)

    const get = (object: any, key: string[]) =>
      // $FlowFixMe: it seems like "o && typeof o === 'object'" is not enough to know it's an object
      key.reduce((o, k) => (o && typeof o === 'object' ? o[k] : null), object)

    return (
      <Fragment>
        <hr />
        <div className="box">
          <h1 className="title">Debug: {this.props.title} (dev only)</h1>
          <table className="table">
            <thead>
              <tr>
                <th>Attribute</th>
                <th>Type</th>
                <th>Content</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(key => {
                const k = key.join('.')
                const v = get(object, key)
                return (
                  <tr key={k}>
                    <th>{k}</th>
                    <td>{typeof v}</td>
                    <td>{JSON.stringify(v)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <pre>{JSON.stringify(object, null, '  ')}</pre>
        </div>
      </Fragment>
    )
  }
}

export default ObjectDebug
