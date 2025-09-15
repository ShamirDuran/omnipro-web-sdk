// Se usa para obtener programas, countries, provinces
const API_BASE = 'https://publish-p147864-e1510969.adobeaemcloud.com/content/dam/ieprogram/json';

// Landing a donde se redirecciona al usuario en el onSuccess del form (se le deben agregar los queryParams
const THANK_YOU_PAGE =
  'https://publish-p147864-e1510969.adobeaemcloud.com/content/ieprogram/test/us/en/typ/masterthankyou-bus-global-online-mba.html';

/**
 * Filtra las opciones de un 'select' para mostrar solo aquellas cuyos valores
 * coinciden con los IDs proporcionados en el listado.
 * @param {Array<string>} allowedPathwayIds - Un array con los IDs de las opciones que se deben mostrar.
 * Si el array está vacío, se mostrarán todas las opciones.
 */
function filterPathways(allowedPathwayIds = []) {
  // Obtiene el elemento select del DOM.
  const pathwayPicklist = document.getElementById('ie_pathwayid');

  // Si el elemento no existe, termina la ejecución para evitar errores.
  if (!pathwayPicklist) {
    return;
  }

  // Itera sobre cada <option> que ya existe dentro del select.
  for (const option of pathwayPicklist.options) {
    // Determina si la opción debe ser visible.
    // Una opción es visible si:
    // 1. El listado de IDs permitidos está vacío (mostrar todo).
    // 2. El valor de la opción está incluido en el listado de IDs permitidos.
    // 3. La opción no tiene valor (ej. el "Select..." inicial).
    const shouldBeVisible =
      allowedPathwayIds.length === 0 ||
      allowedPathwayIds.includes(option.value) ||
      option.value === '';

    // Modifica el estilo 'display' para mostrar u ocultar la opción.
    // Asignar '' restaura el display por defecto del navegador.
    option.style.display = shouldBeVisible ? '' : 'none';
  }

  // Restablece la selección al valor por defecto para evitar
  // que una opción oculta permanezca seleccionada.
  pathwayPicklist.value = '';
}

/**
 * Fetch and populate programs into the program picklist based on the selected pathway.
 * @param {string} pathway - The selected pathway ID to filter programs.
 */
const getProgramsByPathway = (pathway) => {
  const programPicklist = document.querySelector('#ie_pathwayid');

  fetch(`${API_BASE}/programas.json`)
    .then((response) => response.json())
    .then(({ value: programs }) => {
      const filteredPrograms = programs.filter(
        (program) => program.parentproductid.productid === pathway
      );

      if (filteredPrograms.length > 0) {
        updatePicklist(programPicklist, filteredPrograms);
      } else {
        programPicklist.innerHTML = '<option value="">Select...</option>';
      }
    })
    .catch((error) => console.error(error));
};

/**
 * Fetch and populate programs into the program picklist based on an array of program IDs.
 * @param {Array} programs - An array of program IDs to filter programs.
 */
const getProgramsById = (programs = []) => {
  const programPicklist = document.querySelector('#mkto_programoriginal');

  fetch(`${API_BASE}/programas.json`)
    .then((response) => response.json())
    .then(({ value: allPrograms }) => {
      // Filtra los programas que están en el array 'programs'
      const filteredPrograms = allPrograms.filter((program) =>
        programs.includes(program.productid)
      );

      if (filteredPrograms.length > 0) {
        updatePicklist(programPicklist, filteredPrograms);
      } else {
        programPicklist.innerHTML = '<option value="">Select...</option>';
      }
    })
    .catch((error) => console.error(error));
};

/**
 * Fetch and populate countries into the country picklist.
 * @param {HTMLSelectElement} picklist - The country select element. Not the Id, the element itself.
 */
function getCountries() {
  const picklist = document.getElementById('ie_countryid');

  fetch(`${API_BASE}/Country.json`)
    .then((response) => response.json())
    .then(({ entities: countries }) => {
      updatePicklist(picklist, countries);
    })
    .catch((error) => console.error('Error fetching countries:', error));
}

/**
 * Fetch and populate provinces based on the selected country.
 * @param {HTMLSelectElement} picklist - The province select element.
 * @param {string} country - The selected country ID.
 */
function getProvinces() {
  const picklist = document.getElementById('ie_provinceregionid');
  const selectedCountry = document.getElementById('ie_countryid').value;

  fetch(`${API_BASE}/Province.json`)
    .then((response) => response.json())
    .then(({ entities: allProvinces }) => {
      const filteredProvinces = allProvinces.filter((province) =>
        province.attributes.some(
          (attr) => attr.name === 'ie_countryid' && attr.value === selectedCountry
        )
      );

      // Controlamos la visibilidad del picklist
      toggleVisibility(picklist, filteredProvinces.length > 0);

      if (filteredProvinces.length > 0) {
        updatePicklist(picklist, filteredProvinces);
      }
    })
    .catch((error) => {
      console.error('Error fetching provinces:', error);
      toggleVisibility(picklist, false);
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
 * Update a picklist with new options.
 * @param {HTMLSelectElement} picklist - The select element to update.
 * @param {Array} items - The items to populate the picklist with.
 */
function updatePicklist(picklist, items) {
  picklist.innerHTML = '<option value="">Select...</option>';

  items.forEach((item) => {
    // Se limpian algunos caracteres que vienen en las respuestas de la API de AEM
    const id = item.id.replace(/[{}]/g, '');
    const name = item.attributes.find((attr) => attr.name === 'ie_name')?.value || 'Unknown';

    const option = document.createElement('option');
    option.value = id;
    option.textContent = name;
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

  console.log('params', params);
  console.log('redirectUrl', redirectUrl);

  window.location.href = redirectUrl;
};
