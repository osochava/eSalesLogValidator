'use strict';

let classNames = require('classnames'),
  m = require("mithril");

class DragDrop {
  constructor(element, options) {
    function activate(e) {
      e.preventDefault()
    }

    function update(e) {
      e.stopPropagation();
      e.preventDefault()
      if (typeof options.onchange == "function") {
        options.onchange((e.dataTransfer || e.target).files)
      }
    }
    options = options || {}
    element.addEventListener("dragover", activate);
    element.addEventListener("drop", update);
  }
}

class UploaderView {
  config(vnode, onchange) {
    this._dragdrop = new DragDrop(vnode.dom, { onchange });
  }

  view(args) {
    return m('div', {
      class: classNames("uploader", args.attrs.hidden),
      oncreate: (vnode) => this.config(vnode, args.attrs.onchange)
    }, m('p', ["Drag-and-drop your log file here or ", m('input', {
      class: "display-none",
      id: "upload",
      type: "file"
    }), m('a', { href: "", id: "upload_link", 'aria-hidden': "true" }, "select a file to upload")]));
  }
}

const uploaderView = new UploaderView();

const dndView = {
  view: (args) => m('div', [
    m("h3", args.attrs.title),
    m(uploaderView, {
      hidden: args.attrs.readingInProgress ? "hidden" : "",
      onchange: function(files) {
        args.attrs.upload(files);
      }
    }),
    m('div', { class: args.attrs.readingInProgress ? "" : "hidden" }, [m('p', "Progress:"),
      m('div', { class: classNames("progress") }, [
        m('div', { class: classNames("progress-bar", "no-transition"), role: "progressbar", style: { width: args.attrs.progressPercentage + "%" } })
      ])
    ])
  ])
};

module.exports = { dndView };