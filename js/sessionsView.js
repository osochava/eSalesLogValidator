'use strict';

let $ = require('jquery');

let classNames = require('classnames'),
  m = require("mithril");

let sessionsEnd = 0;
const resultView = {
  view(args) {
    let pageY = args.attrs.pageY;
    let begin = pageY / 72 | 0;
    // Add 2 so that the top and bottom of the page are filled with
    // next/prev item, not just whitespace if item not in full view
    let end = begin + (args.attrs.pageHeight / 72 | 0 + 2);
    sessionsEnd = (end > sessionsEnd) ? end : sessionsEnd;
    let sessionsLength = Object.values(args.attrs.model.sessions).length;
    return m('div', { class: "results-box", style: "overflow: hidden;" }, [
      m('p', [m('strong', "Sessions:"), m('span', { class: classNames("ellipse-background", "total-background") }, args.attrs.model.totalNumberOfSessions), "Total",
        m('span', { class: classNames("ellipse-background", "valid-background") }, args.attrs.model.numberOfValidSessions), "Valid",
        m('span', { class: classNames("ellipse-background", "invalid-background") }, args.attrs.model.numberOfInvalidSessions), "Invalid",
        m('span', { class: (args.attrs.model.numberOfActionsWithoutSessionId == 0 ? "hidden" : "") },
          m('span', { class: classNames("ellipse-background", "invalid-background") }, args.attrs.model.numberOfActionsWithoutSessionId), "Actions without session_id"
        )
      ]),
      //Object.values(args.attrs.model.sessions).slice(0, Object.values(args.attrs.model.sessions).length > 15 ? 15 : Object.values(args.attrs.model.sessions).length).map(function(session, index) {
      //Object.values(args.attrs.model.sessions).slice(begin, sessionsLength > end ? end : sessionsLength).map(
      // Object.values(args.attrs.model.sessions).map(function(session, index) {
      Object.values(args.attrs.model.sessions).slice(0, sessionsLength > sessionsEnd ? sessionsEnd : sessionsLength).map(function(session, index) {
        return m(sessionBoxView, { session: session, id: index })
      })
    ]);
  }
};

function getSessionResultClass(session) {
  let wasPurchase = session.boughtActCount > 0;
  let colorResultClass = !session.hasError ? (wasPurchase ? "bought-result" : "viewed-result") : "error-result";
  return ["session-result", colorResultClass];
};

let sessionResultView = {
  addEventsHandlers: (id) => {
    $("#logs" + id).on("show.bs.collapse", function() {
      $("#a" + id).removeClass('link-img-down');
      $("#a" + id).addClass('link-img-up');
    });
    $("#logs" + id).on("hide.bs.collapse", function() {
      $("#a" + id).removeClass('link-img-up');
      $("#a" + id).addClass('link-img-down');
    });
  },
  view: (args) =>
    m('div', { class: "row" }, [m('div', { class: "col-md-9" }, [
        m('a', {
          id: "a" + args.attrs.id,
          oncreate: () => sessionResultView.addEventsHandlers(args.attrs.id),
          'data-toggle': "collapse",
          'data-target': "#logs" + args.attrs.id,
          'aria-expanded': "false",
          class: classNames("link-img-expander", "link-img-down")
        }),
        m('div', { class: "session-div" }, [
          m('p', { class: classNames("error-box", args.attrs.session.hasError ? "" : "hidden") }, [m('strong', "Error: "), args.attrs.session.error]),
          m('p', { class: args.attrs.session.hasError ? "hidden" : "" }, ["Market: ", m('strong', args.attrs.session.market), m('br'), "Products: ",
            m('span', { class: classNames("ellipse-background", "product-viewed") }, args.attrs.session.viewedActCount), " Viewed",
            m('span', { class: classNames("ellipse-background", "product-bought") }, args.attrs.session.boughtActCount), m('span', " Bought"),
            m('span', { class: classNames("ellipse-background", "product-rated") }, args.attrs.session.ratedActCount), m('span', " Rated")
          ]),
          "Session: ", m('span', { class: "session-id" }, args.attrs.session.session_key)
        ])
      ]),
      m('div', { class: "col-md-3" },
        m('p', "Started: " + args.attrs.session.startDate, m('br'), "Duration: " + args.attrs.session.duration, m('br'), "Actions: " + args.attrs.session.totalActions))
    ])
};

let logView = {
  view: (args) =>
    m('div', { id: "logs" + args.attrs.id, class: classNames("collapse", "row", "log-box") },
      m('strong', "Log:"), m('br'), m('div', { class: classNames("col-md-12", "log-container") },
        args.attrs.session.actionsLogs.map((log, index) => {
          return m('div', { class: "row" }, [m('div', { class: "col-md-4" }, log.aLogs), m('div', { class: "col-md-6" }, log.aProducts)])
        })
      ))
};

const sessionBoxView = {
  view: (args) =>
    m('div', { class: classNames("session-box") }, [
      m('div', { class: classNames(...getSessionResultClass(args.attrs.session)) }),
      m('div', { class: classNames("container-fluid", "session-result-box") }, [
        m(sessionResultView, { session: args.attrs.session, id: args.attrs.id }),
        m(logView, { session: args.attrs.session, id: args.attrs.id })
      ])
    ])
}

module.exports = { resultView };