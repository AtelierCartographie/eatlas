// @flow

import React, { Component } from 'react'

type Props = {}

class ArticleForm extends Component<Props> {
  state = { nodes: [] }

  componentDidMount() {
    fetch('/tmp-article.json')
      .then(res => res.json())
      .then(({ nodes }) => this.setState({ nodes }))
  }

  renderH1(node, k) {
    return (
      <div className="field" key={k}>
        <label className="label">SubTitle</label>
        <div className="control">
          <input className="input" defaultValue={node.text} />
        </div>
      </div>
    )
  }

  renderParagraph(node, k) {
    return (
      <div className="field" key={k}>
        <label className="label">Paragraph</label>
        <div className="columns">
          <div className="column">
            <div className="control">
              <textarea className="textarea" defaultValue={node.text} />
            </div>
          </div>
          <div className="column">
            {!node.links.length ? null : (
              <div>
                <label className="label">Links</label>
                <ul>
                  {node.links.map(l => (
                    <li key={l.label}>
                      <a href={l.url}>{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!node.lexicon.length ? null : (
              <div>
                <label className="label">Lexicon</label>
                <ul>{node.lexicon.map(l => <li key={l.label}>{l}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  renderResource(node, k) {
    return (
      <div className="field" key={k}>
        <label className="label">Resource</label>
        <div className="control">
          {node.id} {node.text}
        </div>
      </div>
    )
  }

  renderMeta(node, k) {
    switch (node.id) {
      // TODO rename in english
      case 'Mots-clés':
        return (
          <div className="field" key={k}>
            <label className="label">Keywords</label>
            <ul>{node.list.map((kw, k) => <li key={k}>{kw.text}</li>)}</ul>
          </div>
        )

      default:
        return null
    }
  }

  render() {
    return (
      <div className="ArticleForm">
        <h1 className="title">Article form (tmp)</h1>
        {this.state.nodes.map((node, k) => {
          switch (node.type) {
            case 'h1':
              return this.renderH1(node, k)

            case 'p':
              return this.renderParagraph(node, k)

            case 'resource':
              return this.renderResource(node, k)

            case 'meta':
              return this.renderMeta(node, k)

            default:
              return null
          }
        })}
      </div>
    )
  }
}

export default ArticleForm
