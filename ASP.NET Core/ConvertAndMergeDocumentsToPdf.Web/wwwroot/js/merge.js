(function () {
  var panel = document.getElementById("mergePanel");
  var apiBaseUrl = (panel.getAttribute("data-api") || "").replace(/\/$/, "");
  var allowed = new Set(
    (panel.getAttribute("data-extensions") || "")
      .split(",")
      .map(function (ext) { return ext.trim().toLowerCase(); })
      .filter(Boolean)
  );
  var errorEl = document.getElementById("mergeError");
  var formPane = document.getElementById("formPane");
  var loadingPane = document.getElementById("loadingPane");
  var spinnerHost = document.getElementById("spinnerHost");
  var spinnerReady = false;

  function uploader() {
    return document.getElementById("uploader").ej2_instances[0];
  }

  function generateButton() {
    return document.getElementById("generate").ej2_instances[0];
  }

  function extensionOf(name) {
    var dot = name.lastIndexOf(".");
    return dot < 0 ? "" : name.slice(dot).toLowerCase();
  }

  function setError(message) {
    if (!message) {
      errorEl.hidden = true;
      errorEl.textContent = "";
      return;
    }
    errorEl.hidden = false;
    errorEl.textContent = message;
  }

  function refreshGenerateButton() {
    var files = uploader().getFilesData() || [];
    generateButton().disabled = files.length === 0;
  }

  function ensureSpinner() {
    if (!spinnerReady) {
      ej.popups.createSpinner({ target: spinnerHost });
      spinnerReady = true;
    }
  }

  function setLoading(active) {
    ensureSpinner();
    formPane.hidden = active;
    loadingPane.classList.toggle("is-active", active);
    loadingPane.setAttribute("aria-busy", active ? "true" : "false");
    if (active) {
      ej.popups.showSpinner(spinnerHost);
    } else {
      ej.popups.hideSpinner(spinnerHost);
    }
  }

  function downloadBlob(blob) {
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "MergedDocument.pdf";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  window.onFileSelected = function (args) {
    var incoming = args.filesData || [];
    var rejected = [];
    for (var i = 0; i < incoming.length; i++) {
      if (!allowed.has(extensionOf(incoming[i].name))) {
        rejected.push(incoming[i].name);
      }
    }
    if (rejected.length > 0) {
      args.cancel = true;
      setError("Unsupported file type(s): " + rejected.join(", "));
      return;
    }
    setError("");
    setTimeout(refreshGenerateButton, 0);
  };

  window.onFileRemoving = function () {
    setError("");
    setTimeout(refreshGenerateButton, 0);
  };

  window.onFilesChanged = function () {
    refreshGenerateButton();
  };

  window.onGenerate = function () {
    var files = uploader().getFilesData() || [];
    if (files.length === 0) {
      setError("Please add at least one file before generating a PDF.");
      return;
    }

    var formData = new FormData();
    for (var i = 0; i < files.length; i++) {
      var raw = files[i].rawFile;
      if (raw instanceof Blob) {
        formData.append("files", raw, files[i].name);
      }
    }

    if (!formData.has("files")) {
      setError("Please add at least one file before generating a PDF.");
      return;
    }

    setError("");
    setLoading(true);
    fetch(apiBaseUrl + "/Merge/MergeDocuments", { method: "POST", body: formData })
      .then(function (response) {
        if (!response.ok) {
          return response.text().then(function (text) {
            throw new Error(text || ("Request failed with status " + response.status));
          });
        }
        return response.blob();
      })
      .then(function (blob) {
        downloadBlob(blob);
        uploader().clearAll();
      })
      .catch(function (err) {
        setError(err && err.message ? err.message : "The documents could not be merged.");
      })
      .finally(function () {
        setLoading(false);
        refreshGenerateButton();
      });
  };
})();
