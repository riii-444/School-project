/* YOUR VOICE 共通データ層(試作版)
   データはこのブラウザの localStorage に保存されます。
   本番運用ではサーバー(DB)・教員認証に置き換えてください。 */
(function () {
  var KEY = 'yv_posts_v1', LIKE = 'yv_liked_v1', AUTH = 'yv_teacher_ok';
  var TEACHER_PASSWORD = 'teacher1234'; // ★試作用の仮パスワード。必ず変更/置き換えてください
  var STATUSES = ['受付済み', '検討中', '実行', '実行不可'];
  var CATEGORIES = ['学校生活', '学校施設', '授業・学習環境', '制服・服装', '行事・部活動', 'その他'];
  var mem = null;

  function read(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function iso(daysAgo) { return new Date(Date.now() - daysAgo * 86400000).toISOString(); }

  function seed() {
    return [
      { id: 's1', no: 'YV-1001', code: 'DEMO01', subject: '体育館のエアコンを設置してほしい', category: '学校施設',
        body: '夏の体育館は暑すぎて、授業や部活動で体調を崩す人がいます。エアコンまたは大型扇風機の設置をお願いします。',
        publicSubject: '体育館のエアコンを設置してほしい',
        publicBody: '夏の体育館は暑すぎて、授業や部活動で体調を崩す人がいます。エアコンまたは大型扇風機の設置をお願いします。',
        grade: '2年', cls: '', num: '', name: '', publicConsent: true, approved: true, status: '検討中',
        reply: '予算と工事の可否を確認中です。まずは大型扇風機の導入から検討します。', likes: 24, createdAt: iso(12), updatedAt: iso(3), sample: true },
      { id: 's2', no: 'YV-1002', code: 'DEMO02', subject: '雨の日の傘立てを増やしてほしい', category: '学校生活',
        body: '昇降口の傘立てが足りず、雨の日は傘が通路にあふれています。', publicSubject: '雨の日の傘立てを増やしてほしい',
        publicBody: '昇降口の傘立てが足りず、雨の日は傘が通路にあふれています。',
        grade: '1年', cls: '', num: '', name: '', publicConsent: true, approved: true, status: '実行',
        reply: '各昇降口に傘立てを追加しました。ご意見ありがとうございました。', likes: 17, createdAt: iso(30), updatedAt: iso(9), sample: true },
      { id: 's3', no: 'YV-1003', code: 'DEMO03', subject: '校内でのスマホ使用ルールを見直したい', category: 'その他',
        body: '昼休みだけでも、調べ学習や連絡用にスマホを使えるようにしてほしいです。', publicSubject: '校内でのスマホ使用ルールを見直したい',
        publicBody: '昼休みだけでも、調べ学習や連絡用にスマホを使えるようにしてほしいです。',
        grade: '3年', cls: '', num: '', name: '', publicConsent: true, approved: true, status: '実行不可',
        reply: '安全管理や学習への影響の観点から、現時点では全面的な許可は難しいです。引き続き生徒会と話し合います。', likes: 9, createdAt: iso(45), updatedAt: iso(20), sample: true }
    ];
  }

  function posts() {
    var l = read(KEY);
    if (!l) { l = mem || seed(); save(l); }
    return l;
  }
  function save(l) { mem = l; write(KEY, l); }

  function rnd() {
    try { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; } catch (e) { return Math.random(); }
  }
  function genCode() {
    var c = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', s = '';
    for (var i = 0; i < 6; i++) s += c[Math.floor(rnd() * c.length)];
    return s;
  }
  function nextNo(l) {
    var max = 1000;
    l.forEach(function (p) { var n = parseInt(String(p.no).replace(/\D/g, ''), 10); if (n > max) max = n; });
    return 'YV-' + String(max + 1).padStart(4, '0');
  }

  function liked() { return read(LIKE) || []; }

  window.YV = {
    STATUSES: STATUSES, CATEGORIES: CATEGORIES,
    all: posts,
    add: function (d) {
      var l = posts(), p = {
        id: 'p' + Date.now().toString(36) + Math.floor(rnd() * 1e4), no: nextNo(l), code: genCode(),
        subject: d.subject, category: d.category, body: d.body,
        publicSubject: d.subject, publicBody: d.body,
        grade: d.grade || '', cls: d.cls || '', num: d.num || '', name: d.name || '',
        publicConsent: !!d.publicConsent, approved: false, status: '受付済み', reply: '', likes: 0,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      };
      l.push(p); save(l); return p;
    },
    find: function (no, code) {
      no = String(no || '').trim().toUpperCase(); code = String(code || '').trim().toUpperCase();
      return posts().filter(function (p) { return p.no.toUpperCase() === no && p.code.toUpperCase() === code; })[0] || null;
    },
    update: function (id, patch) {
      var l = posts();
      l.forEach(function (p) { if (p.id === id) { for (var k in patch) p[k] = patch[k]; p.updatedAt = new Date().toISOString(); } });
      save(l);
    },
    remove: function (id) { save(posts().filter(function (p) { return p.id !== id; })); },
    isLiked: function (id) { return liked().indexOf(id) >= 0; },
    toggleLike: function (id) {
      var ls = liked(), i = ls.indexOf(id), l = posts(), on;
      if (i >= 0) { ls.splice(i, 1); on = false; } else { ls.push(id); on = true; }
      write(LIKE, ls);
      l.forEach(function (p) { if (p.id === id) p.likes = Math.max(0, (p.likes || 0) + (on ? 1 : -1)); });
      save(l); return on;
    },
    removeSamples: function () { save(posts().filter(function (p) { return !p.sample; })); },
    addSamples: function () {
      var l = posts().filter(function (p) { return !p.sample; });
      save(seed().concat(l));
    },
    clearAll: function () { save([]); },
    login: function (pw) { if (pw === TEACHER_PASSWORD) { try { sessionStorage.setItem(AUTH, '1'); } catch (e) {} return true; } return false; },
    logout: function () { try { sessionStorage.removeItem(AUTH); } catch (e) {} },
    isTeacher: function () { try { return sessionStorage.getItem(AUTH) === '1'; } catch (e) { return false; } },
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    date: function (iso) { var d = new Date(iso); return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate(); },
    badge: function (s) { return '<span class="badge b' + Math.max(0, STATUSES.indexOf(s)) + '">' + s + '</span>'; }
  };
})();
