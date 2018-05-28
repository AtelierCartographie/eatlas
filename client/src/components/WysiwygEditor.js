import React, { Component } from 'react'
import { EditorState, convertToRaw, ContentState } from 'draft-js'
import { Editor } from 'react-draft-wysiwyg'
import draftToHtml from 'draftjs-to-html'
import htmlToDraft from 'html-to-draftjs'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'

import './WysiwygEditor.css'

type Props = {
  value: string,
  onChange: Function,
  readOnly: boolean,
}

class WysiwygEditor extends Component<Props> {
  constructor(props) {
    super(props)
    const contentBlock = htmlToDraft(this.props.value)
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(
        contentBlock.contentBlocks,
      )
      const editorState = EditorState.createWithContent(contentState)
      this.state = {
        editorState,
      }
    }
  }

  onEditorStateChange: Function = editorState => {
    this.setState({
      editorState,
    })

    // simulate dummy event
    this.props.onChange({
      preventDefault: () => {},
      target: {
        value: draftToHtml(convertToRaw(editorState.getCurrentContent())),
      },
    })
  }

  render() {
    const { editorState } = this.state
    if (this.props.readOnly) {
      return (
        <div
          className="textarea"
          rows={this.props.rows}
          dangerouslySetInnerHTML={{ __html: draftToHtml(convertToRaw(editorState.getCurrentContent()))}}
          readOnly
        />
      )
    }
    return (
      <div>
        <Editor
          editorState={editorState}
          editorClassName="WysiwygEditor"
          onEditorStateChange={this.onEditorStateChange}
          toolbar={{
            options: ['inline', 'list', 'link'],
            inline: {
              options: ['bold', 'italic'],
            },
          }}
        />
      </div>
    )
  }
}

export default WysiwygEditor
