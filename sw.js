  // Dynamically load, filter, and sort models from latest to oldest
  async function loadModels() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const modelSelect = document.getElementById('modelSelect');
    const status = document.getElementById('status');

    if (!apiKey) return;

    status.innerText = 'Fetching and sorting models...';
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();

      if (data.error) throw new Error(data.error.message);

      modelSelect.innerHTML = '';

      // Step 1: Filter models that support content generation and aren't embedding models
      let genModels = data.models.filter(m => 
        m.supportedGenerationMethods?.includes('generateContent') &&
        !m.name.includes('embedding') &&
        !m.name.includes('aqa')
      );

      // Step 2: Sort models by version numbers extracted from their names (Descending order)
      genModels.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.toLowerCase ? b.name.toLowerCase() : b.name;

        // Extract version numbers (e.g. 2.5, 1.5) using regex
        const matchA = nameA.match(/gemini-(\d+\.?\d*)/);
        const matchB = nameB.match(/gemini-(\d+\.?\d*)/);

        const versionA = matchA ? parseFloat(matchA[1]) : 0;
        const versionB = matchB ? parseFloat(matchB[1]) : 0;

        // Sort higher versions first
        if (versionB !== versionA) {
          return versionB - versionA;
        }

        // Secondary sort: Prefer models marked with 'flash' or 'pro' over specific snapshot numbers
        return nameA.localeCompare(nameB);
      });

      // Step 3: Populate the dropdown
      genModels.forEach(m => {
        const modelName = m.name.replace('models/', '');
        const option = document.createElement('option');
        option.value = modelName;
        option.textContent = `${m.displayName || modelName} (${modelName})`;
        modelSelect.appendChild(option);
      });

      modelSelect.disabled = false;
      status.innerText = `Loaded and sorted ${genModels.length} models (latest first).`;
    } catch (err) {
      status.innerText = `Error loading models: ${err.message}. Using default fallback list.`;
      modelSelect.innerHTML = FALLBACK_MODELS.map(m => `<option value="${m}">${m}</option>`).join('');
      modelSelect.disabled = false;
    }
  }
