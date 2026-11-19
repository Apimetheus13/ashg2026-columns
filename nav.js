(function () {
  var data = window.COLUMN_DATA;
  var finder = document.getElementById("finder");
  var older = document.getElementById("olderdays");
  if (!data || !finder || !older) return;

  var sections = Array.prototype.slice.call(document.querySelectorAll("section[id^='c']"));
  var byId = {};
  sections.forEach(function (sec) {
    var h2 = sec.querySelector("h2");
    var orig = sec.querySelector(".orig");
    byId[sec.id] = {
      id: sec.id,
      el: sec,
      title: h2 ? h2.textContent.replace(/\s+/g, " ").trim() : sec.id,
      orig: orig ? orig.textContent.replace(/\s+/g, " ").trim() : "",
      text: (sec.textContent || "").toLowerCase()
    };
  });

  function num(id) {
    return String(parseInt(id.slice(1), 10));
  }
  function dayId(date) {
    var p = date.split("/");
    return "day-" + p[0] + p[1];
  }
  function tagsOf(id) {
    return data.tags[id] || [];
  }

  document.querySelectorAll("#bidx a[href^='#c']").forEach(function (a) {
    var li = a.closest("li");
    if (li) li.setAttribute("data-col", a.getAttribute("href").slice(1));
  });

  sections.forEach(function (sec) {
    var tags = tagsOf(sec.id);
    if (!tags.length) return;
    var row = document.createElement("p");
    row.className = "tags";
    tags.forEach(function (tag) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tag";
      b.textContent = "#" + tag;
      b.setAttribute("data-tag", tag);
      b.addEventListener("click", function () {
        state.tag = state.tag === tag ? "" : tag;
        apply(true);
        var bar = document.getElementById("searchbar");
        if (bar) bar.scrollIntoView({ block: "start" });
      });
      row.appendChild(b);
    });
    var h2 = sec.querySelector("h2");
    if (h2 && h2.nextSibling) h2.parentNode.insertBefore(row, h2.nextSibling);
    else if (h2) h2.parentNode.appendChild(row);
  });

  var searchbar = document.createElement("div");
  searchbar.className = "searchbar";
  searchbar.id = "searchbar";
  var label = document.createElement("label");
  label.className = "sr";
  label.setAttribute("for", "q");
  label.textContent = "搜尋專欄";
  var input = document.createElement("input");
  input.id = "q";
  input.type = "search";
  input.placeholder = "搜尋標題、英文原題或內文";
  input.autocomplete = "off";
  input.enterKeyHint = "search";
  var clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.id = "clearf";
  clearBtn.textContent = "清除";
  var count = document.createElement("p");
  count.id = "hitcount";
  count.setAttribute("aria-live", "polite");
  searchbar.appendChild(label);
  searchbar.appendChild(input);
  searchbar.appendChild(clearBtn);
  searchbar.appendChild(count);
  var hits = document.createElement("div");
  hits.id = "hits";
  var cloud = document.createElement("div");
  cloud.id = "tagcloud";
  cloud.className = "tagcloud";
  var chips = document.createElement("div");
  chips.id = "datechips";
  chips.className = "datechips";
  finder.appendChild(searchbar);
  finder.appendChild(hits);
  finder.appendChild(cloud);
  finder.appendChild(chips);

  data.vocabulary.forEach(function (tag) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tag";
    b.textContent = "#" + tag;
    b.setAttribute("data-tag", tag);
    b.addEventListener("click", function () {
      state.tag = state.tag === tag ? "" : tag;
      apply(true);
    });
    cloud.appendChild(b);
  });

  data.days.forEach(function (day, i) {
    var a = document.createElement("a");
    a.className = "chip";
    a.href = i === 0 ? "#brief" : "#" + dayId(day.date);
    a.textContent = day.date;
    a.addEventListener("click", function (ev) {
      if (i === 0) return;
      ev.preventDefault();
      openDay(day.date);
    });
    chips.appendChild(a);
  });

  var recentLab = document.getElementById("recentlab");
  if (recentLab) {
    var note = document.createElement("span");
    note.className = "recentnote";
    note.textContent = "最新一天在下面展開。點日期可跳到那一天。";
    recentLab.appendChild(note);
  }

  var recentBox = document.createElement("div");
  recentBox.className = "daywrap";
  var archive = document.createElement("details");
  archive.className = "archive";
  archive.id = "archive";
  var archiveSum = document.createElement("summary");
  archiveSum.textContent = "更早的早報";
  archive.appendChild(archiveSum);
  var archiveBody = document.createElement("div");
  archive.appendChild(archiveBody);

  data.days.forEach(function (day, i) {
    if (i === 0) return;
    var box = renderDay(day, i < 3);
    if (i < 3) recentBox.appendChild(box);
    else archiveBody.appendChild(box);
  });
  older.appendChild(recentBox);
  older.appendChild(archive);

  function renderDay(day, recent) {
    var det = document.createElement("details");
    det.className = "daybox" + (recent ? " recent" : "");
    det.id = dayId(day.date);
    var sum = document.createElement("summary");
    var total = day.groups.reduce(function (n, g) { return n + g.ids.length; }, 0);
    sum.textContent = day.date + " 早報（" + day.weekday + "，" + total + " 則）";
    det.appendChild(sum);
    day.groups.forEach(function (g) {
      if (!g.ids.length) return;
      var h = document.createElement("h4");
      h.textContent = g.name;
      det.appendChild(h);
      var ol = document.createElement("ol");
      g.ids.forEach(function (id) {
        var info = byId[id];
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "#" + id;
        var sp = document.createElement("span");
        sp.textContent = num(id);
        a.appendChild(sp);
        a.appendChild(document.createTextNode(info ? info.title : id));
        li.appendChild(a);
        li.setAttribute("data-col", id);
        ol.appendChild(li);
      });
      det.appendChild(ol);
    });
    return det;
  }

  function openDay(date) {
    var id = dayId(date);
    var el = document.getElementById(id);
    if (!el) return;
    if (archiveBody.contains(el)) archive.open = true;
    el.open = true;
    el.scrollIntoView({ block: "start" });
    if (history.replaceState) {
      var url = new URL(location.href);
      url.hash = id;
      history.replaceState(null, "", url);
    }
  }

  var state = { q: "", tag: "" };

  function readUrl() {
    var url = new URL(location.href);
    state.q = url.searchParams.get("q") || "";
    state.tag = url.searchParams.get("tag") || "";
    input.value = state.q;
  }

  function writeUrl() {
    var url = new URL(location.href);
    if (state.q) url.searchParams.set("q", state.q);
    else url.searchParams.delete("q");
    if (state.tag) url.searchParams.set("tag", state.tag);
    else url.searchParams.delete("tag");
    if (history.replaceState) history.replaceState(null, "", url);
  }

  function tokens(q) {
    return q.toLowerCase().split(/\s+/).filter(Boolean);
  }

  function match(info) {
    var tags = tagsOf(info.id);
    if (state.tag && tags.indexOf(state.tag) < 0) return false;
    var parts = tokens(state.q);
    if (!parts.length) return !state.tag || tags.indexOf(state.tag) >= 0;
    var blob = info.text;
    return parts.every(function (t) { return blob.indexOf(t) >= 0; });
  }

  function apply(push) {
    var filtering = !!(state.q || state.tag);
    var matched = [];
    sections.forEach(function (sec) {
      var info = byId[sec.id];
      var ok = !filtering || match(info);
      sec.classList.toggle("filt-hide", filtering && !ok);
      if (ok) matched.push(info);
    });
    document.querySelectorAll("[data-col]").forEach(function (li) {
      var id = li.getAttribute("data-col");
      var info = byId[id];
      var ok = !filtering || (info && match(info));
      li.classList.toggle("filt-hide", filtering && !ok);
    });
    document.querySelectorAll(".tag").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-tag") === state.tag);
    });
    document.querySelectorAll(".chip").forEach(function (a) {
      a.classList.toggle("on", false);
    });
    if (!filtering) {
      count.textContent = "";
      hits.hidden = true;
      hits.textContent = "";
    } else {
      count.textContent = "命中 " + matched.length + " 篇";
      hits.hidden = false;
      hits.textContent = "";
      if (!matched.length) {
        var empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = "沒有符合的專欄。";
        hits.appendChild(empty);
      } else {
        var ol = document.createElement("ol");
        matched.slice(0, 40).forEach(function (info) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = "#" + info.id;
          var sp = document.createElement("span");
          sp.textContent = num(info.id);
          a.appendChild(sp);
          a.appendChild(document.createTextNode(info.title));
          a.addEventListener("click", function (ev) {
            ev.preventDefault();
            var el = document.getElementById(info.id);
            if (!el) return;
            el.classList.remove("filt-hide");
            if (history.pushState) {
              var url = new URL(location.href);
              url.hash = info.id;
              history.pushState(null, "", url);
            }
            el.scrollIntoView({ block: "start" });
          });
          li.appendChild(a);
          ol.appendChild(li);
        });
        hits.appendChild(ol);
        if (matched.length > 40) {
          var more = document.createElement("p");
          more.className = "empty";
          more.textContent = "還有 " + (matched.length - 40) + " 篇，縮小關鍵字可看其餘的。";
          hits.appendChild(more);
        }
      }
    }
    if (push) writeUrl();
  }

  input.addEventListener("input", function () {
    state.q = input.value.trim();
    apply(true);
  });
  clearBtn.addEventListener("click", function () {
    state.q = "";
    state.tag = "";
    input.value = "";
    apply(true);
    input.focus();
  });

  var seek = document.createElement("button");
  seek.type = "button";
  seek.className = "seek";
  seek.id = "searchfab";
  seek.textContent = "搜尋";
  seek.setAttribute("aria-label", "打開搜尋");
  seek.addEventListener("click", function () {
    searchbar.scrollIntoView({ block: "start" });
    input.focus();
  });
  document.body.appendChild(seek);

  readUrl();
  apply(false);
  window.addEventListener("popstate", function () {
    readUrl();
    apply(false);
  });
})();
