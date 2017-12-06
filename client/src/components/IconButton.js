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
        <span>
          <T id={label} />
        </span>{' '}
        <span className="icon is-small">
          <i className={`fa fa-${icon}`} />
        </span>
      </Fragment>
    )
  }
}

export default IconButton
