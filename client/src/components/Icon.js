// @flow

import React, { Component } from 'react'
import cx from 'classnames'

type Props = {
  size?: string,
  icon: string,
  className?: string,
}

class Icon extends Component<Props> {
  render() {
    const { size = 'medium', icon, className, ...rest } = this.props

    return (
      <span className={cx('icon', 'is-' + size, className)} {...rest}>
        <i className={cx('fa', 'fa-' + icon)} />
      </span>
    )
  }
}

export default Icon
