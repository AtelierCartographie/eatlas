// @flow
// view https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/docs/guides/scroll-restoration.md

import { Component } from 'react'
import { withRouter } from 'react-router'

type Props = {
  location: any,
  children: any,
}

class ScrollToTop extends Component<Props> {
  componentDidUpdate(prevProps) {
    // Scroll ONLY if pathname changed (we consider query string should not trigger a "full refresh")
    if (this.props.location.pathname !== prevProps.location.pathname) {
      window.scrollTo(0, 0)
    }
  }

  render() {
    return this.props.children
  }
}

export default withRouter(ScrollToTop)
