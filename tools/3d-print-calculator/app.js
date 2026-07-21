(function () {
  "use strict";

  var APP_NAME = "Simulador de custo de impressão 3D";
  var APP_VERSION = "1.1.0";
  var PAYLOAD_TYPE = "3d-print-cost-simulation";
  var PAYLOAD_VERSION = 1;
  var CUSTOM_MATERIAL_ID = "custom";
  var activeCostTooltip = null;
  var state = {
    configs: null,
    lastEstimate: null,
    importedPayload: null
  };

  var $ = function (id) {
    return document.getElementById(id);
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function numberOr(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function nonNegative(value, fallback) {
    return Math.max(0, numberOr(value, fallback));
  }

  function currencyInputValue(value, fallback) {
    var normalized = String(value == null ? "" : value)
      .trim()
      .replace(/\s/g, "")
      .replace(/^R\$/i, "");
    if (!normalized) {
      return fallback;
    }
    if (normalized.indexOf(",") !== -1) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    }
    return nonNegative(normalized, fallback);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(numberOr(value, 0));
  }

  function formatNumber(value, maximumFractionDigits) {
    return new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: maximumFractionDigits == null ? 2 : maximumFractionDigits
    }).format(numberOr(value, 0));
  }

  function formatPercent(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "percent",
      maximumFractionDigits: 1
    }).format(numberOr(value, 0));
  }

  function formatDuration(hours, minutes) {
    var totalMinutes = Math.max(0, Math.round(numberOr(hours, 0) * 60 + numberOr(minutes, 0)));
    var wholeHours = Math.floor(totalMinutes / 60);
    var remainingMinutes = totalMinutes % 60;
    return wholeHours + "h " + String(remainingMinutes).padStart(2, "0") + "min";
  }

  function normalizeCollection(config, key) {
    if (Array.isArray(config)) {
      return config;
    }
    if (config && Array.isArray(config[key])) {
      return config[key];
    }
    throw new Error("O arquivo de configuração não contém a lista " + key + ".");
  }

  function calculateEstimate(input) {
    var printer = input.printer || {};
    var material = input.material || {};
    var expenses = input.expenses || {};
    var settings = input.settings || {};
    var job = input.job || {};

    var hours = nonNegative(job.hours, 0);
    var minutes = nonNegative(job.minutes, 0);
    var printHours = hours + minutes / 60;
    var filamentGrams = nonNegative(job.filamentGrams, 0);
    var quantity = Math.max(1, Math.floor(nonNegative(job.quantity, 1)));
    var spoolWeightKg = Math.max(0.000001, nonNegative(material.spoolWeightKg, 1));
    var materialCostPerKg = nonNegative(material.spoolPriceBRL, 0) / spoolWeightKg;
    var materialCost = (filamentGrams / 1000) * materialCostPerKg;

    var purchasePrice = nonNegative(printer.purchasePriceBRL, 0);
    var maintenanceReservePercent = clamp(
      nonNegative(printer.maintenanceReservePercent, 0),
      0,
      10
    );
    var usefulLifeHours = Math.max(0.000001, nonNegative(printer.usefulLifeHours, 1));
    var maintenanceReserve = purchasePrice * maintenanceReservePercent;
    var machineHourlyRate = (purchasePrice + maintenanceReserve) / usefulLifeHours;
    var machineCost = printHours * machineHourlyRate;

    var powerKw = nonNegative(printer.averagePowerKw, 0);
    var electricityRate = nonNegative(
      expenses.electricity && expenses.electricity.costPerKwhBRL,
      0
    );
    var electricityCost = printHours * powerKw * electricityRate;

    var directCost = materialCost + machineCost + electricityCost;
    var failureRate = clamp(nonNegative(expenses.failureRate, 0), 0, 0.99);
    var failureAllowance = failureRate > 0
      ? directCost * (failureRate / (1 - failureRate))
      : 0;
    var consumablesCost = nonNegative(expenses.consumablesPerJobBRL, 0);

    var costTotal = directCost + failureAllowance + consumablesCost;
    var profitMargin = clamp(nonNegative(settings.profitMargin, 0), 0, 0.99);
    var priceTotal = costTotal / (1 - profitMargin);
    var serviceValue = priceTotal - costTotal;
    var pricePerPiece = priceTotal / quantity;

    return {
      printHours: printHours,
      materialCostPerKg: materialCostPerKg,
      machineHourlyRate: machineHourlyRate,
      failureRate: failureRate,
      profitMargin: profitMargin,
      quantity: quantity,
      directCost: directCost,
      costTotal: costTotal,
      serviceValue: serviceValue,
      priceTotal: priceTotal,
      pricePerPiece: pricePerPiece,
      breakdown: [
        {
          key: "material",
          label: "Filamento",
          cost: materialCost,
          description: "Custo do plástico usado: " +
            formatNumber(filamentGrams, 1) + " g × " +
            formatCurrency(materialCostPerKg) + "/kg."
        },
        {
          key: "machine",
          label: "Reserva da impressora",
          cost: machineCost,
          description: "Custo de uso, desgaste e manutenção futura da impressora: " +
            formatDuration(hours, minutes) + " × " +
            formatCurrency(machineHourlyRate) + "/h. A taxa por hora dilui o preço da máquina e a reserva de manutenção pela vida útil configurada."
        },
        {
          key: "electricity",
          label: "Energia elétrica",
          cost: electricityCost,
          description: "Custo da energia durante a impressão: " +
            formatDuration(hours, minutes) + " × " +
            formatNumber(powerKw, 2) + " kW × " +
            formatCurrency(electricityRate) + "/kWh."
        },
        {
          key: "failure",
          label: "Reserva de falhas",
          cost: failureAllowance,
          description: "Reserva para cobrir material, energia e uso da máquina perdidos em impressões que falham. A taxa configurada é " +
            formatPercent(failureRate) + " e é aplicada ao custo direto de " +
            formatCurrency(directCost) + "."
        },
        {
          key: "consumables",
          label: "Consumíveis",
          cost: consumablesCost,
          description: "Valor fixo por trabalho para itens como cola, fita, limpeza ou desgaste de peças. O valor atual é definido no config.js."
        },
        {
          key: "service",
          label: "Valor do serviço",
          cost: serviceValue,
          description: "Margem da operação, não mão de obra. É a diferença entre os custos e o preço sugerido, calculada com a margem de " +
            formatPercent(profitMargin) + " configurada para o serviço."
        }
      ]
    };
  }

  function readJobFromForm() {
    return {
      hours: nonNegative($("hours-input").value, 0),
      minutes: nonNegative($("minutes-input").value, 0),
      filamentGrams: nonNegative($("grams-input").value, 0),
      quantity: Math.max(1, Math.floor(nonNegative($("quantity-input").value, 1)))
    };
  }

  function setJobForm(job) {
    $("hours-input").value = numberOr(job.hours, 0);
    $("minutes-input").value = numberOr(job.minutes, 0);
    $("grams-input").value = numberOr(job.filamentGrams, 0);
    $("quantity-input").value = Math.max(1, Math.floor(numberOr(job.quantity, 1)));
  }

  function selectedItem(collection, id) {
    return collection.find(function (item) {
      return item.id === id;
    }) || collection[0];
  }

  function setSelectOptions(select, items, selectedId) {
    select.replaceChildren();
    items.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.name;
      if (item.id === selectedId) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    select.disabled = items.length === 0;
  }

  function isCustomMaterial(material) {
    return material && material.id === CUSTOM_MATERIAL_ID;
  }

  function selectedMaterial() {
    var material = selectedItem(state.configs.materials, $("filament-select").value);
    if (!isCustomMaterial(material)) {
      return material;
    }
    var customMaterial = clone(material);
    customMaterial.spoolPriceBRL = currencyInputValue(
      $("custom-filament-price-input").value,
      0
    );
    return customMaterial;
  }

  function updateCustomFilamentPriceField(material) {
    var isCustom = isCustomMaterial(material);
    var field = $("custom-filament-price-field");
    var input = $("custom-filament-price-input");
    field.hidden = !isCustom;
    input.required = isCustom;
  }

  function updateFieldNotes(printer, material) {
    if (printer) {
      $("printer-note").textContent =
        formatCurrency(printer.purchasePriceBRL) +
        " · " +
        formatNumber(printer.averagePowerKw, 2) +
        " kW médio";
    }
    if (material) {
      if (isCustomMaterial(material) && !$("custom-filament-price-input").value.trim()) {
        $("filament-note").textContent = "Informe o preço do rolo de 1 kg abaixo.";
        return;
      }
      $("filament-note").textContent =
        formatCurrency(material.spoolPriceBRL) +
        " por " +
        formatNumber(material.spoolWeightKg, 2) +
        " kg · " +
        formatCurrency(material.spoolPriceBRL / Math.max(0.000001, material.spoolWeightKg)) +
        "/kg";
    }
  }

  function closeCostTooltip(restoreFocus) {
    if (!activeCostTooltip) {
      return;
    }
    activeCostTooltip.panel.hidden = true;
    activeCostTooltip.button.setAttribute("aria-expanded", "false");
    if (restoreFocus) {
      activeCostTooltip.button.focus();
    }
    activeCostTooltip = null;
  }

  function toggleCostTooltip(button, panel, row) {
    if (activeCostTooltip && activeCostTooltip.button === button) {
      closeCostTooltip(false);
      return;
    }
    closeCostTooltip(false);
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    activeCostTooltip = { button: button, panel: panel, row: row };
  }

  function initializeCostTooltipDismissal() {
    document.addEventListener("click", function (event) {
      if (activeCostTooltip && !activeCostTooltip.row.contains(event.target)) {
        closeCostTooltip(false);
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && activeCostTooltip) {
        closeCostTooltip(true);
      }
    });
  }

  function renderEstimate() {
    if (!state.configs) {
      return;
    }
    var printer = selectedItem(state.configs.printers, $("printer-select").value);
    var configuredMaterial = selectedItem(state.configs.materials, $("filament-select").value);
    updateCustomFilamentPriceField(configuredMaterial);
    var material = selectedMaterial();
    if (!printer || !material) {
      return;
    }
    var job = readJobFromForm();
    var estimate = calculateEstimate({
      printer: printer,
      material: material,
      expenses: state.configs.expenses,
      settings: state.configs.settings,
      job: job
    });

    state.lastEstimate = {
      printer: clone(printer),
      material: clone(material),
      expenses: clone(state.configs.expenses),
      settings: clone(state.configs.settings),
      job: clone(job),
      estimate: clone(estimate)
    };

    updateFieldNotes(printer, material);
    $("result-total").textContent = formatCurrency(estimate.priceTotal);
    $("result-per-piece").textContent = formatCurrency(estimate.pricePerPiece);
    $("result-duration").textContent = formatDuration(job.hours, job.minutes);

    var breakdown = $("breakdown-list");
    closeCostTooltip(false);
    breakdown.replaceChildren();
    estimate.breakdown.forEach(function (line, index) {
      var row = document.createElement("div");
      row.className = "breakdown-row";
      var label = document.createElement("dt");
      var labelText = document.createElement("span");
      labelText.textContent = line.label;
      var tooltipButton = document.createElement("button");
      var tooltipId = "cost-tooltip-" + line.key + "-" + index;
      tooltipButton.type = "button";
      tooltipButton.className = "info-tooltip";
      tooltipButton.textContent = "i";
      tooltipButton.setAttribute("aria-label", "Mostrar explicação de " + line.label);
      tooltipButton.setAttribute("aria-controls", tooltipId);
      tooltipButton.setAttribute("aria-expanded", "false");
      var value = document.createElement("dd");
      value.textContent = formatCurrency(line.cost);
      var tooltipPanel = document.createElement("span");
      tooltipPanel.id = tooltipId;
      tooltipPanel.className = "cost-tooltip";
      tooltipPanel.setAttribute("role", "tooltip");
      tooltipPanel.textContent = line.description;
      tooltipPanel.hidden = true;
      tooltipButton.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleCostTooltip(tooltipButton, tooltipPanel, row);
      });
      label.append(labelText, tooltipButton);
      row.append(label, value, tooltipPanel);
      breakdown.appendChild(row);
    });
    var assumptions = $("assumptions-text");
    assumptions.replaceChildren();
    [
      "Impressora: " + printer.name,
      "Filamento: " + material.name + " (" + formatCurrency(estimate.materialCostPerKg) + "/kg)",
      "Consumo médio: " + formatNumber(printer.averagePowerKw, 2) + " kW",
      "Energia: " + formatCurrency(state.configs.expenses.electricity.costPerKwhBRL) + "/kWh",
      "Taxa de falhas: " + formatPercent(estimate.failureRate),
      "Reserva de manutenção: " + formatPercent(printer.maintenanceReservePercent),
      "Margem do serviço: " + formatPercent(estimate.profitMargin)
    ].forEach(function (text) {
      var paragraph = document.createElement("p");
      paragraph.textContent = text;
      assumptions.appendChild(paragraph);
    });
  }

  function buildPayload() {
    if (!state.lastEstimate) {
      throw new Error("Preencha os dados da impressão antes de copiar.");
    }
    return {
      type: PAYLOAD_TYPE,
      schemaVersion: PAYLOAD_VERSION,
      app: {
        name: APP_NAME,
        version: APP_VERSION
      },
      createdAt: new Date().toISOString(),
      selection: {
        printerId: state.lastEstimate.printer.id,
        materialId: state.lastEstimate.material.id
      },
      job: clone(state.lastEstimate.job),
      configSnapshot: {
        printer: clone(state.lastEstimate.printer),
        material: clone(state.lastEstimate.material),
        expenses: clone(state.lastEstimate.expenses),
        settings: clone(state.lastEstimate.settings)
      },
      estimate: clone(state.lastEstimate.estimate)
    };
  }

  function createShareText(payload) {
    var printer = payload.configSnapshot.printer;
    var material = payload.configSnapshot.material;
    var estimate = payload.estimate;
    var job = payload.job;
    var readable = [
      "SIMULAÇÃO DE IMPRESSÃO 3D",
      "",
      "Impressora: " + printer.name,
      "Filamento: " + material.name,
      "Tempo: " + formatDuration(job.hours, job.minutes),
      "Filamento usado: " + formatNumber(job.filamentGrams, 1) + " g",
      "Quantidade: " + estimate.quantity + " peça(s)",
      "",
      "CUSTOS",
      "Filamento: " + formatCurrency(estimate.breakdown[0].cost),
      "Reserva da impressora: " + formatCurrency(estimate.breakdown[1].cost),
      "Energia elétrica: " + formatCurrency(estimate.breakdown[2].cost),
      "Reserva de falhas: " + formatCurrency(estimate.breakdown[3].cost),
      "Consumíveis: " + formatCurrency(estimate.breakdown[4].cost),
      "Valor do serviço: " + formatCurrency(estimate.serviceValue),
      "Margem do serviço: " + formatPercent(estimate.profitMargin),
      "",
      "PREÇO SUGERIDO: " + formatCurrency(estimate.priceTotal),
      "POR PEÇA: " + formatCurrency(estimate.pricePerPiece),
      "",
      "--- DADOS PARA IMPORTAÇÃO ---",
      JSON.stringify(payload, null, 2),
      "--- FIM DOS DADOS ---"
    ];
    return readable.join("\n");
  }

  function setActionStatus(element, message, kind) {
    element.textContent = message || "";
    element.className = "action-status" + (kind ? " " + kind : "");
  }

  function fallbackCopy(text) {
    var helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    var copied = false;
    try {
      copied = document.execCommand("copy");
    } finally {
      helper.remove();
    }
    return copied;
  }

  async function copySimulation() {
    var status = $("copy-status");
    try {
      var text = createShareText(buildPayload());
      var copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          copied = true;
        } catch (clipboardError) {
          copied = false;
        }
      }
      if (!copied && !fallbackCopy(text)) {
        throw new Error("Não foi possível acessar a área de transferência.");
      }
      setActionStatus(status, "Info copiada. Você já pode enviar a mensagem.", "success");
    } catch (error) {
      setActionStatus(status, error.message, "error");
    }
  }

  function extractImportPayload(text) {
    var source = String(text || "").trim();
    var markerMatch = source.match(/--- DADOS PARA IMPORTAÇÃO ---\s*([\s\S]*?)\s*--- FIM DOS DADOS ---/i);
    var jsonText = markerMatch ? markerMatch[1].trim() : source;
    if (!markerMatch) {
      var firstBrace = jsonText.indexOf("{");
      var lastBrace = jsonText.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        jsonText = jsonText.slice(firstBrace, lastBrace + 1);
      }
    }
    if (!jsonText) {
      throw new Error("Cole uma mensagem ou um bloco JSON para importar.");
    }
    var payload;
    try {
      payload = JSON.parse(jsonText);
    } catch (error) {
      throw new Error("Não consegui ler o bloco de dados. Copie a mensagem completa novamente.");
    }
    validatePayload(payload);
    return payload;
  }

  function validatePayload(payload) {
    if (!payload || payload.type !== PAYLOAD_TYPE) {
      throw new Error("Este texto não parece ser uma simulação deste aplicativo.");
    }
    if (payload.schemaVersion !== PAYLOAD_VERSION) {
      throw new Error("A versão desta simulação não é compatível com esta página.");
    }
    if (!payload.job || !payload.configSnapshot || !payload.configSnapshot.printer ||
      !payload.configSnapshot.material || !payload.configSnapshot.expenses ||
      !payload.configSnapshot.settings || !payload.estimate) {
      throw new Error("A simulação está incompleta e não pode ser conferida.");
    }
    ["costTotal", "priceTotal", "pricePerPiece"].forEach(function (key) {
      if (!Number.isFinite(Number(payload.estimate[key]))) {
        throw new Error("A simulação não contém um resultado válido.");
      }
    });
  }

  function valuesMatch(first, second) {
    return Math.abs(numberOr(first, 0) - numberOr(second, 0)) < 0.005;
  }

  function valueCard(label, value) {
    var wrapper = document.createElement("div");
    wrapper.className = "verification-value";
    var labelElement = document.createElement("span");
    labelElement.textContent = label;
    var valueElement = document.createElement("strong");
    valueElement.textContent = formatCurrency(value);
    wrapper.append(labelElement, valueElement);
    return wrapper;
  }

  function renderVerification(payload) {
    var snapshot = payload.configSnapshot;
    var snapshotEstimate = calculateEstimate({
      printer: snapshot.printer,
      material: snapshot.material,
      expenses: snapshot.expenses,
      settings: snapshot.settings,
      job: payload.job
    });
    var currentPrinter = state.configs.printers.find(function (item) {
      return item.id === (payload.selection && payload.selection.printerId);
    }) || snapshot.printer;
    var currentMaterial = state.configs.materials.find(function (item) {
      return item.id === (payload.selection && payload.selection.materialId);
    }) || snapshot.material;
    var currentEstimate = calculateEstimate({
      printer: currentPrinter || snapshot.printer,
      material: currentMaterial || snapshot.material,
      expenses: state.configs.expenses,
      settings: state.configs.settings,
      job: payload.job
    });
    var formulaMatches = valuesMatch(payload.estimate.priceTotal, snapshotEstimate.priceTotal) &&
      valuesMatch(payload.estimate.costTotal, snapshotEstimate.costTotal);
    var localMatches = valuesMatch(payload.estimate.priceTotal, currentEstimate.priceTotal);

    $("verification-panel").hidden = false;
    $("verification-title").textContent = formulaMatches ? "Conferência concluída" : "Resultado precisa de atenção";
    var badge = $("verification-badge");
    badge.textContent = formulaMatches ? "Fórmula confere" : "Diferença encontrada";
    badge.className = "verification-badge" + (formulaMatches ? "" : " warning");

    var body = $("verification-body");
    body.replaceChildren();
    body.append(
      valueCard("Resultado recebido", payload.estimate.priceTotal),
      valueCard("Recalculado com snapshot", snapshotEstimate.priceTotal),
      valueCard("Configuração atual local", currentEstimate.priceTotal)
    );
    var explanation = document.createElement("p");
    explanation.className = "verification-explanation";
    if (formulaMatches && localMatches) {
      explanation.textContent = "O resultado recebido confere com a fórmula e com os parâmetros atuais desta página.";
    } else if (formulaMatches) {
      explanation.textContent = "A fórmula confere. A diferença com o valor local provavelmente vem de preço de filamento, energia, impressora, despesas ou margem do serviço alterados no config.js.";
    } else {
      explanation.textContent = "O resultado recebido não coincide com o recálculo usando os parâmetros que foram enviados.";
    }
    body.appendChild(explanation);
  }

  function importSimulationText(text) {
    var status = $("import-status");
    try {
      var payload = extractImportPayload(text);
      state.importedPayload = payload;
      setJobForm(payload.job);
      if (payload.selection && state.configs.printers.some(function (item) { return item.id === payload.selection.printerId; })) {
        $("printer-select").value = payload.selection.printerId;
      }
      if (payload.selection && state.configs.materials.some(function (item) { return item.id === payload.selection.materialId; })) {
        $("filament-select").value = payload.selection.materialId;
        if (payload.selection.materialId === CUSTOM_MATERIAL_ID) {
          $("custom-filament-price-input").value = numberOr(
            payload.configSnapshot.material.spoolPriceBRL,
            0
          );
        }
      }
      renderEstimate();
      renderVerification(payload);
      $("verification-panel").scrollIntoView({ block: "nearest" });
      setActionStatus(status, "Simulação importada e conferida abaixo.", "success");
    } catch (error) {
      $("verification-panel").hidden = true;
      setActionStatus(status, error.message, "error");
    }
  }

  async function pasteAndImport() {
    var status = $("import-status");
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      $("import-textarea").focus();
      setActionStatus(status, "Cole a mensagem na área acima e clique em Conferir texto.", "error");
      return;
    }
    try {
      var text = await navigator.clipboard.readText();
      $("import-textarea").value = text;
      importSimulationText(text);
    } catch (error) {
      $("import-textarea").focus();
      setActionStatus(status, "Cole a mensagem na área acima e clique em Conferir texto.", "error");
    }
  }

  function resetForm() {
    var defaults = state.configs.settings.defaultJob || {};
    setJobForm({
      hours: defaults.hours,
      minutes: defaults.minutes,
      filamentGrams: defaults.filamentGrams,
      quantity: defaults.quantity
    });
    $("import-textarea").value = "";
    $("verification-panel").hidden = true;
    setActionStatus($("copy-status"), "", "");
    setActionStatus($("import-status"), "", "");
    state.importedPayload = null;
    renderEstimate();
  }

  function setFormEnabled(enabled) {
    document.querySelectorAll("#simulator-form input, #simulator-form select, #simulator-form button, #copy-button, #reset-button").forEach(function (element) {
      element.disabled = !enabled;
    });
    $("copy-button").disabled = !enabled;
  }

  function loadConfigs() {
    var raw = window.COST_SIMULATOR_CONFIG;
    if (!raw || typeof raw !== "object") {
      throw new Error("Não encontrei config.js. Verifique se o arquivo está na mesma pasta do index.html.");
    }
    return {
      printers: normalizeCollection(raw.printers, "printers"),
      materials: normalizeCollection(raw.materials, "materials"),
      expenses: raw.expenses || {},
      settings: raw.settings || {}
    };
  }

  function initializeForm() {
    var configs = state.configs;
    var defaults = configs.settings.defaultJob || {};
    setSelectOptions($("printer-select"), configs.printers);
    setSelectOptions($("filament-select"), configs.materials);
    setJobForm({
      hours: defaults.hours,
      minutes: defaults.minutes,
      filamentGrams: defaults.filamentGrams,
      quantity: defaults.quantity
    });
    initializeCostTooltipDismissal();
    $("simulator-form").querySelectorAll("input, select").forEach(function (element) {
      element.addEventListener("input", renderEstimate);
      element.addEventListener("change", renderEstimate);
    });
    $("copy-button").addEventListener("click", copySimulation);
    $("import-focus-button").addEventListener("click", function () {
      $("import-panel").open = true;
      $("import-panel").scrollIntoView({ block: "start" });
      $("import-textarea").focus();
    });
    $("reset-button").addEventListener("click", resetForm);
    $("parse-import-button").addEventListener("click", function () {
      importSimulationText($("import-textarea").value);
    });
    $("paste-import-button").addEventListener("click", pasteAndImport);
    renderEstimate();
  }

  function init() {
    setFormEnabled(false);
    try {
      state.configs = loadConfigs();
      initializeForm();
      setFormEnabled(true);
      var status = $("config-status");
      status.hidden = true;
    } catch (error) {
      var errorStatus = $("config-status");
      errorStatus.textContent = error.message + " Confira se config.js está presente e foi carregado antes de app.js.";
      errorStatus.className = "config-status error";
      errorStatus.hidden = false;
      setFormEnabled(false);
    }
  }

  window.costSimulator = {
    calculateEstimate: calculateEstimate,
    buildPayload: buildPayload,
    extractImportPayload: extractImportPayload,
    getState: function () { return state; }
  };

  init();
}());
