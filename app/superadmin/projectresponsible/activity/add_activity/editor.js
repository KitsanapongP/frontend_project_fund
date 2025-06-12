// components/CKEditorWrapper.js
import React from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
const editorConfiguration = {
  toolbar: [
    "undo",
    "redo",
    "|",
    "heading",
    "|",
    "bold",
    "italic",
    // "link",
    "bulletedList",
    "numberedList",
    "|",
    "outdent",
    "indent",
    "|",
    // "imageUpload",
    // "blockQuote",
    // "insertTable",
    // "mediaEmbed",

  ],
};

export default function CustomEditor({ value, onChange }) {
  return (
    <div className="rounded-lg border shadow-md border-gray-100">
      <CKEditor
        editor={ClassicEditor}
        config={{
          ...editorConfiguration,
          typing: {
            transformations: {
              remove: ["quotes", "typographicQuotes"],
            },
          },
        }}
        onReady={(editor) => {
          editor.editing.view.change((writer) => {
            const root = editor.editing.view.document.getRoot();
            writer.setStyle("padding", "1rem 2rem", root);
          });

          // ดัก event Tab
          editor.editing.view.document.on("keydown", (evt, data) => {
            if (data.keyCode === 9) {
              // Tab
              const command = data.shiftKey
                ? editor.commands.get("outdent")
                : editor.commands.get("indent");

              if (command.isEnabled) {
                command.execute();
                data.preventDefault(); // ป้องกันโฟกัสหลุด
                evt.stop();
              }
            }
          });
        }}
        onChange={(event, editor) => {
          onChange(editor.getData());
        }}
      />
    </div>
  );
}
