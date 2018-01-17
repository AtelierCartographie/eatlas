// @flow

import React, { Component } from 'react'
import { FormattedMessage as T } from 'react-intl'
import cx from 'classnames'

type Props = {
  model: Object,
  removing: Boolean,
  // actions
  onConfirm: Function,
  onClose: Function,
}

class Confirm extends Component<Props> {
  render() {
    const { model, removing, onConfirm, onClose } = this.props
    return (
      <div className={cx('modal', { 'is-active': !!model })}>
        <div className="modal-background" />
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">
              <T id="delete" /> {model ? model.name : ''}
            </p>
            <button
              className="delete"
              aria-label="close"
              onClick={onClose}
            />
          </header>
          <section className="modal-card-body">
            {model ? <T id="confirm-delete" values={model} /> : null}
          </section>
          <footer className="modal-card-foot">
            <button
              className="button is-success"
              onClick={onConfirm}>
              <T id="delete" />
            </button>
            <button
              className={cx('button', { 'is-loading': removing })}
              onClick={onClose}>
              <T id="cancel" />
            </button>
          </footer>
        </div>
      </div>
    )
  }
}

export default Confirm
