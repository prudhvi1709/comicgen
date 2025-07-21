class ComicsGenerator {
  constructor() {
    this.uploadedImageFile = null;
    this.generatedPanels = [];
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.loadAPISettings();
  }

  setupEventListeners() {
    const events = [
      ['imageUpload', 'change', this.handleImageUpload],
      ['generateBtn', 'click', this.generateComic],
      ['downloadBtn', 'click', this.downloadComic],
      ['downloadAllPanelsBtn', 'click', this.downloadAllPanels],
      ['apiKey', 'input', this.saveAPISettings],
      ['baseUrl', 'input', this.saveAPISettings],
      ['storyContextTemplate', 'input', this.saveAPISettings],
      ['openingPanelTemplate', 'input', this.saveAPISettings],
      ['middlePanelTemplate', 'input', this.saveAPISettings],
      ['finalPanelTemplate', 'input', this.saveAPISettings],
      ['visualContinuityTemplate', 'input', this.saveAPISettings],
      ['impactTemplate', 'input', this.saveAPISettings]
    ];
    
    events.forEach(([id, event, handler]) => {
      document.getElementById(id).addEventListener(event, handler.bind(this));
    });
  }

  handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      this.showError("Please upload a valid image file (JPG, PNG, or WebP)");
      return;
    }

    this.uploadedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById("imagePreview");
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  }

  saveAPISettings() {
    const settings = {
      apiKey: document.getElementById("apiKey").value,
      baseUrl: document.getElementById("baseUrl").value,
      storyContextTemplate: document.getElementById("storyContextTemplate").value,
      openingPanelTemplate: document.getElementById("openingPanelTemplate").value,
      middlePanelTemplate: document.getElementById("middlePanelTemplate").value,
      finalPanelTemplate: document.getElementById("finalPanelTemplate").value,
      visualContinuityTemplate: document.getElementById("visualContinuityTemplate").value,
      impactTemplate: document.getElementById("impactTemplate").value
    };
    localStorage.setItem("comicsGenerator_apiSettings", JSON.stringify(settings));
  }

  loadAPISettings() {
    const stored = localStorage.getItem("comicsGenerator_apiSettings");
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        const settingKeys = ['apiKey', 'baseUrl', 'storyContextTemplate', 'openingPanelTemplate', 'middlePanelTemplate', 'finalPanelTemplate', 'visualContinuityTemplate', 'impactTemplate'];
        settingKeys.forEach(key => {
          if (settings[key]) document.getElementById(key).value = settings[key];
        });
      } catch (error) {
        this.expandAPISettings();
      }
    } else {
      this.expandAPISettings();
    }
  }

  expandAPISettings() {
    const accordion = document.getElementById("apiSettings");
    const button = document.querySelector('[data-bs-target="#apiSettings"]');
    accordion.classList.add("show");
    if (button) {
      button.classList.remove("collapsed");
      button.setAttribute("aria-expanded", "true");
    }
  }

  async generateComic() {
    if (!this.validateInputs()) return;

    const apiKey = document.getElementById("apiKey").value;
    const baseUrl = document.getElementById("baseUrl").value;
    const captions = document.getElementById("captions").value.split("\n").filter(line => line.trim());

    this.showProgress(true);
    this.initializeResults();
    this.generatedPanels = [];

    try {
      for (let i = 0; i < captions.length; i++) {
        const caption = captions[i].trim();
        if (!caption) continue;

        const progressText = this.getProgressText(i + 1, captions.length, caption);
        this.updateProgress((i / captions.length) * 100, progressText);
        this.showPanelInProgress(i + 1, caption);

        try {
          const previousPanel = i > 0 ? this.generatedPanels[i - 1] : null;
          const panelImage = await this.generatePanel(caption, i + 1, apiKey, baseUrl, previousPanel, captions);
          const panelData = { image: panelImage, caption, panel: i + 1 };
          this.generatedPanels.push(panelData);
          this.showCompletedPanel(panelData);
        } catch (error) {
          this.showPanelError(i + 1, error.message);
          this.showError(`Failed to generate panel ${i + 1}: ${error.message}`);
        }
      }
      this.updateProgress(100, "Complete!");
      this.showDownloadButtons();
    } catch (error) {
      this.showError("Failed to generate comic: " + error.message);
    } finally {
      this.showProgress(false);
    }
  }

  async generatePanel(caption, panelNumber, apiKey, baseUrl, previousPanel = null, allCaptions = []) {
    const configs = ['promptPrefix', 'imageModel', 'inputFidelity', 'quality', 'outputFormat'];
    const values = configs.map(id => document.getElementById(id).value);
    const [promptPrefix, imageModel, inputFidelity, quality, outputFormat] = values;

    // Build comprehensive prompt with full story context
    let enhancedPrompt = this.buildNarrativePrompt(caption, panelNumber, allCaptions, promptPrefix, previousPanel);

    const formData = new FormData();
    const formFields = {
      image: [this.uploadedImageFile, "input.png"],
      prompt: enhancedPrompt,
      model: imageModel,
      input_fidelity: inputFidelity,
      quality: quality,
      output_format: outputFormat
    };

    // Note: We don't include the previous panel image in the FormData as it may cause API issues
    // The visual consistency is handled through the enhanced prompt instead

    Object.entries(formFields).forEach(([key, value]) => {
      formData.append(key, ...(Array.isArray(value) ? value : [value]));
    });

    // Debug log for troubleshooting (can be removed in production)
    console.log(`Generating panel ${panelNumber} with prompt length: ${enhancedPrompt.length}`);

    const response = await fetch(`${baseUrl}/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "API request failed");
    }

    const data = await response.json();
    return data.data[0].b64_json;
  }

  validateInputs() {
    const checks = [
      [document.getElementById("apiKey").value, "Please enter your OpenAI API key"],
      [this.uploadedImageFile, "Please upload an image"],
      [document.getElementById("captions").value.trim(), "Please enter captions for your comic panels"]
    ];

    for (const [value, message] of checks) {
      if (!value) {
        this.showError(message);
        return false;
      }
    }
    return true;
  }

  showProgress(show) {
    document.getElementById("progressContainer").style.display = show ? "block" : "none";
    if (!show) this.updateProgress(0, "Starting...");
  }

  updateProgress(percentage, text) {
    document.getElementById("progressBar").style.width = percentage + "%";
    document.getElementById("progressText").textContent = text;
  }

  initializeResults() {
    const container = document.getElementById("resultsContainer");
    const panelsContainer = document.getElementById("comicPanels");
    panelsContainer.innerHTML = '';
    container.style.display = "block";
    document.getElementById("downloadButtons").style.display = "none";
  }

  showPanelInProgress(panelNumber, caption) {
    const panelsContainer = document.getElementById("comicPanels");
    const panelId = `panel-${panelNumber}`;
    
    const panelHtml = `
      <div class="col-md-6 mb-4" id="${panelId}">
        <div class="card border-warning">
          <div class="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">Panel ${panelNumber}</h5>
            <div class="spinner-border spinner-border-sm" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div class="card-body text-center p-5">
            <div class="d-flex flex-column align-items-center">
              <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Generating...</span>
              </div>
              <p class="text-muted">Generating panel...</p>
            </div>
          </div>
          <div class="card-footer">
            <p class="card-text text-muted">${caption}</p>
          </div>
        </div>
      </div>
    `;
    
    panelsContainer.insertAdjacentHTML('beforeend', panelHtml);
  }

  showCompletedPanel(panel) {
    const panelElement = document.getElementById(`panel-${panel.panel}`);
    if (!panelElement) return;

    const downloadBtns = ['jpg', 'png'].map(format => 
      `<button class="btn btn-outline-light download-panel-btn" data-panel="${panel.panel - 1}" data-format="${format}" title="Download as ${format.toUpperCase()}"><i class="fas fa-download"></i> ${format.toUpperCase()}</button>`
    ).join('');
    
    panelElement.innerHTML = `
      <div class="card border-success">
        <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">Panel ${panel.panel}</h5>
          <div class="btn-group btn-group-sm">${downloadBtns}</div>
        </div>
        <img src="data:image/jpeg;base64,${panel.image}" class="card-img-top" alt="Panel ${panel.panel}">
        <div class="card-footer">
          <p class="card-text">${panel.caption}</p>
        </div>
      </div>
    `;

    panelElement.querySelectorAll('.download-panel-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const btn = e.target.closest('.download-panel-btn');
        this.downloadPanel(parseInt(btn.dataset.panel), btn.dataset.format);
      });
    });
  }

  showPanelError(panelNumber, errorMessage) {
    const panelElement = document.getElementById(`panel-${panelNumber}`);
    if (!panelElement) return;

    panelElement.innerHTML = `
      <div class="card border-danger">
        <div class="card-header bg-danger text-white d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">Panel ${panelNumber}</h5>
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="card-body text-center p-5">
          <div class="text-danger">
            <i class="fas fa-times-circle fa-3x mb-3"></i>
            <p class="mb-0">Failed to generate panel</p>
            <small class="text-muted">${errorMessage}</small>
          </div>
        </div>
      </div>
    `;
  }

  showDownloadButtons() {
    if (this.generatedPanels.length > 0) {
      document.getElementById("downloadButtons").style.display = "block";
    }
  }

  downloadPanel(panelIndex, format) {
    if (panelIndex < 0 || panelIndex >= this.generatedPanels.length) {
      this.showError("Invalid panel index");
      return;
    }

    const panel = this.generatedPanels[panelIndex];
    this.createImageDownload(panel.image, `panel_${panel.panel.toString().padStart(3, '0')}.${format}`, format);
  }

  async downloadAllPanels() {
    if (this.generatedPanels.length === 0) {
      this.showError("No panels to download");
      return;
    }

    if (typeof JSZip === 'undefined') await this.loadJSZip();

    const zip = new JSZip();
    await Promise.all(this.generatedPanels.map(panel => 
      this.addImageToZip(zip, panel.image, `panel_${panel.panel.toString().padStart(3, '0')}.jpg`)
    ));

    const zipBlob = await zip.generateAsync({ type: "blob" });
    this.downloadFile(zipBlob, `comic_panels_${new Date().toISOString().split("T")[0]}.zip`);
  }

  async downloadComic() {
    if (this.generatedPanels.length === 0) {
      this.showError("No comic panels to download");
      return;
    }

    const htmlContent = await this.generateHTMLComic();
    this.downloadFile(new Blob([htmlContent], { type: "text/html" }), `comic_${new Date().toISOString().split("T")[0]}.html`);
  }

  createImageDownload(base64Image, filename, format) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(blob => this.downloadFile(blob, filename), 
        format === 'png' ? 'image/png' : 'image/jpeg', 
        format === 'jpg' ? 0.95 : undefined);
    };
    img.src = `data:image/jpeg;base64,${base64Image}`;
  }

  addImageToZip(zip, base64Image, filename) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          zip.file(filename, blob);
          resolve();
        }, 'image/jpeg', 0.95);
      };
      img.src = `data:image/jpeg;base64,${base64Image}`;
    });
  }

  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async loadJSZip() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async generateHTMLComic() {
    const htmlPrompt = document.getElementById("htmlPrompt").value.trim();
    return htmlPrompt ? await this.generateCustomHTMLComic(htmlPrompt) : this.generateDefaultHTMLComic();
  }

  async generateCustomHTMLComic(prompt) {
    const apiKey = document.getElementById("apiKey").value;
    const baseUrl = document.getElementById("baseUrl").value;
    
    const processedPrompt = prompt
      .replace(/{panelCount}/g, this.generatedPanels.length)
      .replace(/{panelImages}/g, JSON.stringify(this.generatedPanels.map(p => `panel_${p.panel.toString().padStart(3, '0')}.jpg`)))
      .replace(/{captions}/g, JSON.stringify(this.generatedPanels.map(p => p.caption)));

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a web developer creating HTML comic layouts. Generate only clean, valid HTML code without any explanations or markdown formatting." },
            { role: "user", content: processedPrompt }
          ],
          max_tokens: 2000,
          temperature: 0.3
        })
      });

      if (!response.ok) throw new Error('Failed to generate custom HTML');

      const data = await response.json();
      let htmlContent = data.choices[0].message.content.trim()
        .replace(/```html\n?/g, '').replace(/```\n?$/g, '');
      
      this.generatedPanels.forEach(panel => {
        const placeholder = `panel_${panel.panel.toString().padStart(3, '0')}.jpg`;
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), `data:image/jpeg;base64,${panel.image}`);
      });
      
      return htmlContent.trim();
    } catch (error) {
      return this.generateDefaultHTMLComic();
    }
  }

  generateDefaultHTMLComic() {
    const timestamp = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" });
    const panelsHTML = this.generatedPanels.map(panel => 
      `<div class="card mb-4 border-dark"><div class="card-header bg-danger text-white"><h5 class="card-title mb-0">Panel ${panel.panel}</h5></div><img src="data:image/jpeg;base64,${panel.image}" alt="Panel ${panel.panel}" class="card-img-top"><div class="card-footer bg-dark text-white"><p class="card-text mb-0 fw-bold">${panel.caption}</p></div></div>`).join("");
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Generated Comic</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head><body class="bg-light"><div class="container my-5"><div class="row justify-content-center"><div class="col-lg-8"><div class="card shadow"><div class="card-header text-center bg-dark text-white"><h1 class="display-4 mb-0">Generated Comic</h1><p class="lead mb-0">Created on ${timestamp}</p></div><div class="card-body">${panelsHTML}</div><div class="card-footer text-center text-muted"><p class="mb-1">Generated using OpenAI's Image API</p><p class="mb-0">Total panels: ${this.generatedPanels.length}</p></div></div></div></div></div><script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script></body></html>`;
  }

  getProgressText(panelNumber, totalPanels, caption) {
    if (panelNumber === 1) {
      return `Creating opening panel ${panelNumber}/${totalPanels}: ${caption}`;
    } else if (panelNumber === totalPanels) {
      return `Creating final panel ${panelNumber}/${totalPanels}: ${caption}`;
    } else {
      return `Creating panel ${panelNumber}/${totalPanels} (story context + theme): ${caption}`;
    }
  }

  buildNarrativePrompt(currentCaption, panelNumber, allCaptions, promptPrefix, previousPanel) {
    let prompt = `${promptPrefix} ${currentCaption}`;
    
    // Get editable templates from UI
    const storyContextTemplate = document.getElementById("storyContextTemplate").value;
    const openingPanelTemplate = document.getElementById("openingPanelTemplate").value;
    const middlePanelTemplate = document.getElementById("middlePanelTemplate").value;
    const finalPanelTemplate = document.getElementById("finalPanelTemplate").value;
    const visualContinuityTemplate = document.getElementById("visualContinuityTemplate").value;
    const impactTemplate = document.getElementById("impactTemplate").value;
    
    // Add story context if template is provided
    if (storyContextTemplate.trim()) {
      const totalPanels = allCaptions.length;
      const storyContext = allCaptions.join(' → ');
      
      const contextPrompt = storyContextTemplate
        .replace(/{totalPanels}/g, totalPanels)
        .replace(/{fullStory}/g, storyContext)
        .replace(/{panelNumber}/g, panelNumber);
      
      prompt += `\n\n${contextPrompt}\n`;
    }
    
    // Add narrative positioning based on panel position
    if (panelNumber === 1 && openingPanelTemplate.trim()) {
      prompt += `${openingPanelTemplate}\n`;
    } else if (panelNumber === allCaptions.length && finalPanelTemplate.trim()) {
      prompt += `${finalPanelTemplate}\n`;
    } else if (middlePanelTemplate.trim()) {
      prompt += `${middlePanelTemplate}\n`;
    }
    
    // Add previous panel context for visual consistency
    if (previousPanel && panelNumber > 1 && visualContinuityTemplate.trim()) {
      const continuityPrompt = visualContinuityTemplate
        .replace(/{prevPanelNumber}/g, panelNumber - 1)
        .replace(/{prevCaption}/g, previousPanel.caption);
      
      prompt += `\n${continuityPrompt}\n`;
    }
    
    // Add impact enhancement
    if (impactTemplate.trim()) {
      prompt += `\n${impactTemplate}\n`;
    }
    
    return prompt;
  }

  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  showError(message) {
    let errorAlert = document.getElementById("errorAlert");
    if (!errorAlert) {
      errorAlert = document.createElement("div");
      errorAlert.id = "errorAlert";
      errorAlert.className = "alert alert-danger alert-dismissible fade show";
      errorAlert.innerHTML = `<strong>Error:</strong> <span id="errorMessage"></span><button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
      document.querySelector(".card-body").insertBefore(errorAlert, document.querySelector(".card-body").firstChild);
    }

    document.getElementById("errorMessage").textContent = message;
    errorAlert.style.display = "block";
    setTimeout(() => errorAlert && (errorAlert.style.display = "none"), 5000);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => new ComicsGenerator());