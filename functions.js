/**
 * Fetch and populate countries into the country picklist.
 * @param {HTMLSelectElement} picklist - The country select element. Not the Id, the element itself.
 */
function getCountries() {
  const picklist = document.getElementById('ie_countryid');

  fetch(`${API_BASE}/getAllCountries?timestamp=${timestamp}`)
    .then((response) => response.json())
    .then((apiResponse) => {
      const countries = apiResponse.data.ieCountryList.items;

      const formattedCountries = countries.map((country) => {
        return {
          id: country.countryId,
          name: country.countryName,
        };
      });

      updatePicklist(picklist, formattedCountries);
    })
    .catch((error) => console.error('Error fetching countries:', error));
}

/**
 * Sets up the province picklist to be populated based on the selected country.
 */
function getProvinces() {
  const countryPicklist = document.getElementById('ie_countryid');
  const provincePicklist = document.getElementById('ie_provinceregionid');

  getCountries();
  toggleVisibility(provincePicklist, false); // Oculta las provincias al inicio

  countryPicklist.addEventListener('change', function () {
    const selectedCountry = this.value;

    // Si no se selecciona ningún país, oculta y limpia la lista de provincias
    if (!selectedCountry) {
      toggleVisibility(provincePicklist, false);
      updatePicklist(provincePicklist, []); // Limpia las opciones
      return;
    }

    // Si se selecciona un país, busca las provincias
    fetch(`${API_BASE}/getAllProvinces?timestamp=${timestamp}`)
      .then((response) => response.json())
      .then((apiResponse) => {
        // 1. Accede a la lista completa de provincias desde la nueva ruta
        const allProvinces = apiResponse.data.ieProvinceList.items;

        // 2. Filtra las provincias de forma más simple y directa
        const filteredProvinces = allProvinces.filter(
          (province) => province.provinceCountryId === selectedCountry
        );

        // Muestra u oculta el campo si se encontraron provincias
        toggleVisibility(provincePicklist, filteredProvinces.length > 0);

        if (filteredProvinces.length > 0) {
          // 3. Transforma el resultado al formato estándar { id, name }
          const formattedProvinces = filteredProvinces.map((province) => ({
            id: province.provinceId,
            name: province.provinceName,
          }));

          // 4. Llama a la función estándar para actualizar la lista
          updatePicklist(provincePicklist, formattedProvinces);
        }
      })
      .catch((error) => {
        console.error('Error fetching provinces:', error);
        toggleVisibility(provincePicklist, false);
      });
  });
}

/**
 * Muestra u oculta el campo según si es requerido o no.
 * @param {HTMLSelectElement} selectElement - El elemento select.
 * @param {boolean} isRequired - Indica si el campo debe ser visible (requerido) o no.
 */
function toggleVisibility(element, isRequired) {
  // Encuentra el div padre que contiene la fila del formulario completa
  const formRow = element.closest('.mktoFormRow');

  if (isRequired) {
    formRow.style.display = 'block';
  } else {
    formRow.style.display = 'none';

    // Si el element es de tipo select, se limpian las opciones y se deja por defect una con value 000
    // Para evitar el error de campo requerido. Si es de otro tipo, se limpia su valor.
    if (element.tagName.toLowerCase() === 'select') {
      element.innerHTML = '<option value="000"></option>';
      element.value = '000';
    } else {
      element.value = '';
    }
  }
}

/**
 * Populates a picklist from a standardized array of objects.
 * Expects each object to have an 'id' and a 'name' property.
 * @param {HTMLSelectElement} picklist - The <select> element to update.
 * @param {Array<{id: string, name: string}>} items - The standardized array.
 */
function updatePicklist(picklist, items) {
  picklist.innerHTML = '<option value="">Select...</option>';

  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    picklist.appendChild(option);
  });
}

/**
 * Construye una URL con parámetros de consulta y redirige al usuario.
 * @param {object} params - El objecto de values del form con los campos necesarios
   de acuerdo al tipo de landing.
 */
const redirectToThankYouPage = (params, thankYouPage) => {
  // 1. Crea un objeto URLSearchParams para construir la cadena de consulta.
  const searchParams = new URLSearchParams();

  // 2. Agrega cada parámetro solo si tiene un valor válido (no es nulo ni vacío).
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      searchParams.append(key, value);
    }
  });

  // 3. Convierte los parámetros a una cadena de texto (ej: "country=CO&gender=male").
  const queryString = searchParams.toString();

  // 4. Construye la URL final y realiza la redirección.
  // La variable global THANK_YOU_PAGE debe estar definida en tu script.
  const redirectUrl = `${thankYouPage}${queryString ? '?' + queryString : ''}`;

  window.location.href = redirectUrl;
};
