// @flow

// this component is used in tables (resource, topic) to show preview
import React, { Component } from 'react'

type Props = {
  url: string,
  title: string,
}

class VimeoIframe extends Component<Props> {
  render() {
    const { url, title } = this.props

    if (!url) return null
    // $FlowFixMe: not undefined
    const id = url.slice('https://vimeo.com/'.length)
    return (
      <iframe
        className="preview"
        title={title}
        src={`https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`}
        frameBorder="0"
        allowFullScreen
      />
    )
  }
}

export default VimeoIframe
