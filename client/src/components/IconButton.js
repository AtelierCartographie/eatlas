// @flow

import React, { Component, Fragment } from 'react'
import { FormattedMessage as T } from 'react-intl'

import Icon from './Icon'

type Props = {
  label?: string,
  icon?: string,
}

class IconButton extends Component<Props> {
  render() {
    const { label, icon } = this.props

    const $icon = icon ? (
      <Icon icon={icon} size="small" style={{ marginLeft: '.5em' }} />
    ) : null
    const $label = label ? <T id={label} /> : null

    return (
      <Fragment>
        {$label}
        {$icon}
      </Fragment>
    )
  }
}

export default IconButton
