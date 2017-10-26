'use strict';

require('../css/app.css');
// Bootstrap wants jQuery global
let $ = require('jquery');
window.jQuery = $;
let bootstrap = require('bootstrap');
let classNames = require('classnames');

let m = require("mithril");

let Controller = require('./readFileController.js');
let dndViewFromModule = require('./dndView.js');
let sessionsView = require('./sessionsView.js');

class Uploader {
  constructor() {
    this.readingInProgress = false;
    this.controller = new Controller();
  }
  _readFileByReader(file) {
    this.progress = 0;
    this.readingInProgress = true;
    this.controller.readLogs(file);
    this.controller.subscribeToProgressChanges((value) => {
      this.progress = value;
      if (this.progress === 100)
        this.readingInProgress = false;
      m.redraw();
    });
    this.controller.subscribeToFinishEvent((args) => {
      m.redraw();
    });
  }
  upload(files) {
    m.redraw(); //needed .....
    if (files.length != 1)
      return;
    this._readFileByReader(files[0]);
  }
}

var app = app || {};
app.init = function(title) {
  app.title = title;
}

app.uploader = new Uploader();

app.state = { pageY: 0, pageHeight: window.innerHeight }

window.addEventListener("scroll", function(e) {
  let lastValuePageY = app.state.pageY;
  app.state.pageY = Math.max(e.pageY || window.pageYOffset, 0);
  app.state.pageHeight = window.innerHeight;
  if (app.state.pageY - lastValuePageY > 200)
    m.redraw() //notify view
})

function ready() {
  m.mount(document.body, {
    oninit: app.init("E-Sales Log importer"),
    view: function() {
      return m('div', [m(dndViewFromModule.dndView, { upload: app.uploader.upload.bind(app.uploader), title: app.title, readingInProgress: app.uploader.readingInProgress, progressPercentage: app.uploader.progress }),
        m(sessionsView.resultView, { model: app.uploader.controller.sessionsModel, pageHeight: app.state.pageHeight, pageY: app.state.pageY })
      ])
    }
  });

  $("#upload_link").on('click', function(e) {
    e.preventDefault();
    $("#upload:hidden").trigger('click');
  });

  $('#upload').on('fileselect', function(event, files) {
    app.uploader.upload(files);
  });

  $(document).on('change', ':file', function() {
    let input = $(this);
    let files = input.get(0).files;
    input.trigger('fileselect', [files]);
  });
}


document.addEventListener("DOMContentLoaded", ready);