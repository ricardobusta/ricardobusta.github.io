// Parâmetros públicos do simulador.
// Edite este arquivo para adicionar impressoras, filamentos ou despesas.
// Ele é carregado diretamente pelo navegador, sem carregamento assíncrono, para permitir
// abrir o index.html por duplo clique.
window.COST_SIMULATOR_CONFIG = {
  printers: [
    {
      id: "bambu-p1s",
      name: "Bambu Lab P1S",
      purchasePriceBRL: 7000,
      maintenanceReservePercent: 0.25,
      usefulLifeHours: 5000,
      averagePowerKw: 0.3,
      notes: "Parâmetros iniciais baseados na planilha. Atualize o preço para refletir o que você pagou.",
      source: "Planilha fornecida pelo usuário"
    }
  ],
  materials: [
    {
      id: "bambu-pla-basic",
      name: "Bambu PLA Basic",
      material: "PLA",
      spoolPriceBRL: 190,
      spoolWeightKg: 1,
      notes: "Valor inicial observado na Artbox3D; substitua pelo preço real do seu rolo.",
      source: "https://www.artbox3d.com.br/filamentos/bambu-lab1/pla/pla-basic/"
    },
    {
      id: "generic-pla",
      name: "Generic PLA",
      material: "PLA",
      spoolPriceBRL: 100,
      spoolWeightKg: 1,
      notes: "Valor inicial da planilha fornecida.",
      source: "Planilha fornecida pelo usuário"
    }
  ],
  expenses: {
    currency: "BRL",
    electricity: {
      costPerKwhBRL: 0.95,
      label: "Energia elétrica",
      notes: "Estimativa manual de custo total por kWh. Atualize para refletir sua conta de energia.",
      source: "https://www.enel.com.br/pt-ceara/Tarifas_Enel/"
    },
    failureRate: 0.15,
    consumablesPerJobBRL: 0,
    labor: {
      enabled: false,
      baseHourlyRateBRL: 0,
      defaultSetupMinutes: 0
    },
    fixedOverhead: {
      enabled: false,
      monthlyBRL: 0,
      productiveHoursPerMonth: 149.6
    }
  },
  settings: {
    profitMargin: 0.2,
    defaultJob: {
      hours: 1,
      minutes: 0,
      filamentGrams: 50,
      quantity: 1
    }
  }
};
