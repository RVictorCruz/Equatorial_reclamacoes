const apiUrl =
  "https://cors-anywhere.herokuapp.com/https://dadosabertos.aneel.gov.br/api/3/action/datastore_search?resource_id=4af32411-da8b-492c-ae15-8f615e35d2e2&q=06272793000184";
const openCageApiKey = "e6e36749507245ef9a598a01d0854765";

// Função para obter coordenadas usando OpenCage, restrita ao Maranhão, Brasil
async function getCoordinates(city) {
  const response = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
      city + ", Maranhão, Brasil"
    )}&key=$e6e36749507245ef9a598a01d0854765&countrycode=br`
  );
  const data = await response.json();

  if (data.results.length > 0) {
    const result = data.results[0];

    // Verificando se a cidade está dentro dos limites geográficos do Maranhão
    if (
      result.components.state === "Maranhão" &&
      result.components.country === "Brazil"
    ) {
      const { lat, lng } = result.geometry;
      return { latitude: lat, longitude: lng };
    } else {
      throw new Error(
        `A cidade ${city} não está localizada no estado do Maranhão, Brasil.`
      );
    }
  } else {
    throw new Error(`Coordenadas não encontradas para a cidade: ${city}`);
  }
}

// Função para buscar os dados da API e criar os gráficos
async function fetchDataAndCreateCharts() {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    const records = data.result.records;

    // Preparando dados para os gráficos
    const municipios = records.map((record) => record.NomMunicipio);
    const reclamacoesRecebidas = records.map((record) =>
      parseInt(record.QtdReclamacoesRecebidas)
    );
    const reclamacoesProcedentes = records.map((record) =>
      parseInt(record.QtdReclamacoesProcedentes)
    );
    const prazoMedioSolucao = records.map(
      (record) => parseFloat(record.NumPrazoMedioSolucao.replace(",", ".")) || 0
    );

    // Gráfico de Reclamações Recebidas vs Procedentes
    const ctx1 = document.getElementById("reclamacoesChart").getContext("2d");
    new Chart(ctx1, {
      type: "bar",
      data: {
        labels: municipios,
        datasets: [
          {
            label: "Reclamações Recebidas",
            data: reclamacoesRecebidas,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
          {
            label: "Reclamações Procedentes",
            data: reclamacoesProcedentes,
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    // Gráfico de Prazo Médio de Solução
    const ctx2 = document.getElementById("prazoMedioChart").getContext("2d");
    new Chart(ctx2, {
      type: "line",
      data: {
        labels: municipios,
        datasets: [
          {
            label: "Prazo Médio de Solução (dias)",
            data: prazoMedioSolucao,
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    // Mapa com marcações
    async function updateChartsAndMap(selectedCity) {
      const cityCoordinates = await getCoordinates(selectedCity);

      if (!cityCoordinates) {
        console.error(
          `Coordenadas não disponíveis para a cidade: ${selectedCity}`
        );
        return;
      }

      const map = L.map("map").setView(
        [cityCoordinates.latitude, cityCoordinates.longitude],
        10
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      L.marker([cityCoordinates.latitude, cityCoordinates.longitude])
        .addTo(map)
        .bindPopup(`${selectedCity}`)
        .openPopup();
    }

    const citySelect = document.getElementById("citySelect");
    citySelect.addEventListener("change", () => {
      const selectedCity = citySelect.value;
      updateChartsAndMap(selectedCity);
    });
  } catch (error) {
    console.error("Erro ao buscar dados da API:", error);
  }
}

// Chama a função para buscar dados e criar os gráficos
fetchDataAndCreateCharts();
