// @flow

import React, { Component } from 'react'

type Props = {}

class ArticleForm extends Component<Props> {
  state = { nodes: [], metas: [] }

  componentDidMount() {
    fetch('/tmp-article.json')
      .then(res => res.json())
      .then(({ nodes, metas }) => this.setState({ nodes, metas }))
  }

  renderHeader(node, k) {
    return (
      <div className="field" key={k}>
        <label className="label">Header</label>
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

  renderFootnotes(node, k) {
    return (
      <div className="field" key={k}>
        <label className="label">Footnotes</label>
        <div className="control">
          <ul>{node.list.map((f, k) => <li key={k}>{f.text}</li>)}</ul>
        </div>
      </div>
    )
  }

  renderMeta(meta, k) {
    if (meta.list) {
      return (
        <div className="field" key={k}>
          <label className="label">{meta.type}</label>
          <ul>{meta.list.map((kw, k) => <li key={k}>{kw.text}</li>)}</ul>
        </div>
      )
    }
    return (
      <div className="field" key={k}>
        <label className="label">{meta.type}</label>
        <div className="control">
          <input className="input" defaultValue={meta.text} />
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="ArticleForm">
        <h1 className="title">Article form (tmp)</h1>

        <h2 className="subtitle">Metas</h2>
        {this.state.metas.map(this.renderMeta)}

        <h2 className="subtitle">Content</h2>
        {this.state.nodes.map((node, k) => {
          switch (node.type) {
            case 'header':
              return this.renderHeader(node, k)

            case 'p':
              return this.renderParagraph(node, k)

            case 'resource':
              return this.renderResource(node, k)

            case 'footnotes':
              return this.renderFootnotes(node, k)

            default:
              return null
          }
        })}
      </div>
    )
  }
}

export default ArticleForm
