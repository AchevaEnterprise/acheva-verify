/**
 * The Acheva document verifier.
 *
 * Plain JavaScript, no framework and no build step. This is one screen that
 * people open from a phone camera, often on slow mobile data — a framework
 * runtime would cost more than the whole page does.
 */
(function () {
  'use strict';

  var API = (window.ACHEVA && window.ACHEVA.apiUrl) || 'http://localhost:3000';
  API = API.replace(/\/+$/, '');

  var form = document.getElementById('verify-form');
  var input = document.getElementById('serial');
  var submit = document.getElementById('submit');
  var output = document.getElementById('output');

  // ── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Everything on this page comes from the API, but it is rendered into a
   * public document — so every value goes through here. `textContent` rather
   * than string-building HTML: no interpolation means nothing to escape wrong.
   */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  /** dd/mm/yyyy, matching the printed sheet. */
  function formatDate(iso) {
    if (!iso) return '—';
    var date = new Date(iso);
    if (isNaN(date.getTime())) return '—';
    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0');
    return dd + '/' + mm + '/' + date.getFullYear();
  }

  /** Blank rather than 0 — an unscored cell is empty on the paper too. */
  function score(value) {
    return value === null || value === undefined ? '' : String(value);
  }

  function unit(org) {
    if (!org) return '—';
    return org.code || org.name || '—';
  }

  /** The office that signed, named to its unit exactly as the sheet prints it. */
  function officeLabel(role, sheet) {
    if (role === 'HOD') return 'HOD ' + unit(sheet.department);
    if (role === 'DEAN') return 'Dean of ' + unit(sheet.offeringSchool);
    if (role === 'COURSE_COORDINATOR') return 'Examiner(s)';
    return role;
  }

  /**
   * The serial this page was opened for.
   *
   * The path is the primary form because that is what the QR encodes and it
   * reads well on paper. `?s=` and `#` are accepted too, so the page still
   * works on a static host with no rewrite rules configured.
   */
  function serialFromUrl() {
    var fromPath = decodeURIComponent(
      window.location.pathname.replace(/^\/+/, '')
    ).trim();
    if (fromPath && fromPath.toLowerCase() !== 'index.html') return fromPath;

    var query = new URLSearchParams(window.location.search).get('s');
    if (query) return query.trim();

    return decodeURIComponent(window.location.hash.replace(/^#/, '')).trim();
  }

  // ── Rendering ───────────────────────────────────────────────────────────

  function renderVerdict(result) {
    var box = el('div', 'verdict');

    if (result.status === 'NOT_FOUND') {
      box.className = 'verdict verdict--absent';
      box.appendChild(el('h2', null, 'No document with this serial'));
      box.appendChild(
        el(
          'p',
          null,
          'Acheva has never issued a document with that serial. Check for a ' +
            'typing mistake first — the letters O, I and L never appear in a ' +
            'real serial, so if you read one of those it was probably a 0, 1 ' +
            'or 7. If the serial is definitely right, treat the document as ' +
            'unverified.'
        )
      );
      return box;
    }

    if (result.status === 'REVOKED') {
      box.className = 'verdict verdict--warning';
      box.appendChild(el('h2', null, 'Withdrawn — do not rely on this document'));
      box.appendChild(
        el(
          'p',
          null,
          'This document was issued by Acheva on ' +
            formatDate(result.issuedAt) +
            ' and has since been withdrawn' +
            (result.revokedReason ? ': ' + result.revokedReason : '') +
            '. Ask the issuing department for a current copy.'
        )
      );
      return box;
    }

    box.className = 'verdict verdict--genuine';
    box.appendChild(
      el('h2', null, 'Genuine — issued by Acheva on ' + formatDate(result.issuedAt))
    );
    // "Genuine" is never the whole answer: a serial proves Acheva issued the
    // document, not that the paper was not altered afterwards. The comparison
    // below is the actual check, so the page always asks for it.
    box.appendChild(
      el(
        'p',
        null,
        'Now compare the document below with the one in your hand. They must ' +
          'match exactly — the names, the scores and the totals. A genuine ' +
          'serial proves Acheva issued this document; it cannot tell you ' +
          'whether the paper you are holding was altered afterwards.'
      )
    );

    if (result.supersededByNewerRecord) {
      box.appendChild(
        el(
          'p',
          'note',
          'A newer copy of this result has since been issued — a score may ' +
            'have been moderated after your copy was printed. What is shown ' +
            'below is what your copy said when it was issued.'
        )
      );
    }

    return box;
  }

  var COLUMNS = [
    ['SN', function (e) { return e.serial; }, 'num'],
    ['Names', function (e) { return e.fullName; }, 'name'],
    ['Reg. No.', function (e) { return e.registrationNumber; }, ''],
    ['Program', function (e) { return e.programme; }, ''],
    ['Test', function (e) { return score(e.test); }, 'num'],
    ['*Lab', function (e) { return score(e.lab); }, 'num'],
    ['Exam', function (e) { return score(e.exam); }, 'num'],
    ['Total', function (e) { return score(e.total); }, 'num'],
    ['Grade', function (e) { return e.grade || ''; }, 'num'],
    ['Remark', function (e) { return e.status || ''; }, 'num'],
  ];

  function renderSheet(sheet) {
    var section = el('section', 'sheet');

    var head = el('div', 'sheet__head');
    head.appendChild(el('h2', null, (sheet.institution || '').toUpperCase()));
    head.appendChild(el('p', null, 'OFFICIAL GRADE REPORT'));
    section.appendChild(head);

    // Same order as the printed sheet — the reader is comparing the two line
    // by line, and a different arrangement makes that harder than it needs be.
    var meta = el('dl', 'meta');
    [
      ['School of Student', unit(sheet.studentSchool)],
      ['Department', (sheet.department && sheet.department.name || '').toUpperCase()],
      ['Title of Course', (sheet.course && sheet.course.title || '').toUpperCase()],
      ['School Offering Course', unit(sheet.offeringSchool)],
      ['Semester', sheet.semesterLabel],
      ['Session', sheet.session],
      [
        'Course Code',
        (sheet.course && sheet.course.code) +
          (sheet.course && sheet.course.unitLoad !== null
            ? '   ·   Units: ' + sheet.course.unitLoad
            : ''),
      ],
      ['Date', formatDate(sheet.generatedAt)],
    ].forEach(function (pair) {
      var row = el('div');
      row.appendChild(el('dt', null, pair[0] + ':'));
      row.appendChild(el('dd', null, pair[1] || '—'));
      meta.appendChild(row);
    });
    section.appendChild(meta);

    if (sheet.partial) {
      var partial = el(
        'p',
        'note',
        'This copy covers only some of the class, not the whole list.'
      );
      partial.style.margin = '0 1.25rem 1rem';
      section.appendChild(partial);
    }

    var scroller = el('div', 'table-scroll');
    var table = el('table');

    var thead = el('thead');
    var headRow = el('tr');
    COLUMNS.forEach(function (column) {
      headRow.appendChild(el('th', column[2], column[0]));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = el('tbody');
    (sheet.entries || []).forEach(function (entry) {
      var row = el('tr', entry.voided ? 'voided' : null);
      COLUMNS.forEach(function (column) {
        row.appendChild(el('td', column[2], column[1](entry)));
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    scroller.appendChild(table);
    section.appendChild(scroller);

    section.appendChild(renderFooter(sheet));
    return section;
  }

  function renderFooter(sheet) {
    var grid = el('div', 'footer-grid');
    var summary = sheet.summary || {};

    var analysis = el('div');
    analysis.appendChild(el('h3', null, 'Analysis'));

    var grades = el('ul');
    Object.keys(summary.distribution || {}).forEach(function (grade) {
      grades.appendChild(el('li', null, grade + ' = ' + summary.distribution[grade]));
    });
    analysis.appendChild(grades);

    var stats = el('ul', 'tally');
    [
      ['Total', summary.total],
      ['Passed', summary.totalPass],
      ['Failed', summary.totalFail],
      ['Average', summary.averageTotal + '%'],
      ['Pass rate', summary.percentagePass + '%'],
      ['Fail rate', summary.percentageFail + '%'],
    ].forEach(function (pair) {
      stats.appendChild(el('li', null, pair[0] + ': ' + pair[1]));
    });
    analysis.appendChild(stats);
    grid.appendChild(analysis);

    var approvals = el('div');
    approvals.appendChild(el('h3', null, 'Approvals'));
    if (!sheet.approvals || sheet.approvals.length === 0) {
      approvals.appendChild(el('p', null, 'None recorded.'));
    } else {
      sheet.approvals.forEach(function (approval) {
        var item = el('div', 'approval');
        item.appendChild(
          el(
            'strong',
            null,
            (approval.action === 'REJECTED' ? 'REJECTED' : 'APPROVED') +
              ' — ' +
              officeLabel(approval.role, sheet)
          )
        );
        item.appendChild(el('span', null, formatDate(approval.date)));
        approvals.appendChild(item);
      });
    }
    grid.appendChild(approvals);

    return grid;
  }

  function renderError(message) {
    var box = el('div', 'verdict');
    box.appendChild(el('h2', null, 'Could not check this serial'));
    // Never "not genuine": a network failure says nothing about the document,
    // and implying otherwise would be worse than saying nothing at all.
    box.appendChild(el('p', null, message));
    return box;
  }

  // ── The check itself ────────────────────────────────────────────────────

  function show(node) {
    output.textContent = '';
    output.appendChild(node);
  }

  function verify(serial) {
    var trimmed = (serial || '').trim();
    if (!trimmed) return;

    submit.disabled = true;
    submit.textContent = 'Checking…';
    show(el('p', null, 'Checking this serial…'));

    fetch(API + '/verify/' + encodeURIComponent(trimmed))
      .then(function (response) {
        if (response.status === 429) {
          throw new Error(
            'Too many checks from this connection. Wait a minute and try again.'
          );
        }
        if (!response.ok) {
          throw new Error('Acheva could not be reached. Try again shortly.');
        }
        return response.json();
      })
      .then(function (body) {
        var result = body && body.data;
        if (!result) throw new Error('Acheva returned an unexpected response.');

        var fragment = document.createDocumentFragment();
        fragment.appendChild(renderVerdict(result));
        if (result.document) fragment.appendChild(renderSheet(result.document));
        show(fragment);
      })
      .catch(function (error) {
        show(
          renderError(
            error && error.message
              ? error.message
              : 'No connection to Acheva. Check your network and try again.'
          )
        );
      })
      .finally(function () {
        submit.disabled = false;
        submit.textContent = 'Verify';
      });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    verify(input.value);
  });

  // Scanning a QR lands straight on the answer. Asking someone who has just
  // scanned a code to then press a button would be pointless friction.
  var fromUrl = serialFromUrl();
  if (fromUrl) {
    input.value = fromUrl;
    verify(fromUrl);
  }
})();
