// @flow
import React, { Component, Fragment } from 'react'
import { FormattedMessage as T } from 'react-intl'

type Props = {
  label: string,
  icon: string,
}

class IconButton extends Component<Props> {
  render() {
    const { label, icon } = this.props
    return (
      <Fragment>
        <T id={label} />
        <span className="icon is-small" style={{ 'marginLeft': '.5em' }}>
          <i className={`fa fa-${icon}`} />
        </span>
      </Fragment>
    )
  }
}

export default IconButton
