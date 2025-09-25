// Se usa para obtener programas, countries, provinces
// const API_BASE = `${window.location.origin}/content/dam/ieprogram/json`;
const API_BASE = `${window.location.origin}/graphql/execute.json/global`;
const timestamp = new Date().getTime();

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
 * Fetches and populates programs based on the selected pathway.
 */
const getProgramsByPathway = () => {
  const programPicklist = document.getElementById('ie_programmarketoid');
  const selectedPathway = document.getElementById('ie_pathwayid').value;

  fetch(`${API_BASE}/getAllPrograms?timestamp=${timestamp}`)
    .then((response) => response.json())
    .then((apiResponse) => {
      const allPrograms = apiResponse.data.ieProgramList.items;

      // 1. Filtra programas que tengan un ID válido y pertenezcan al pathway
      const filteredPrograms = allPrograms.filter(
        (program) => program.programId && program.programPathwayId === selectedPathway
      );

      // 2. Transforma al formato estándar { id, name }
      const formattedPrograms = filteredPrograms.map((program) => ({
        id: program.programId,
        name: program.programTitle,
      }));

      // 3. Actualiza el picklist con los datos formateados
      updatePicklist(programPicklist, formattedPrograms);
    })
    .catch((error) => {
      console.error('Error fetching programs by pathway:', error);
      updatePicklist(programPicklist, []); // Limpia la lista en caso de error
    });
};

/**
 * Fetches and populates programs based on an array of program IDs.
 * @param {string[]} programIds - An array of program IDs to show.
 */
const getProgramsById = (programIds = []) => {
  const programPicklist = document.getElementById('ie_programmarketoid');

  fetch(`${API_BASE}/getAllPrograms?timestamp=${timestamp}`)
    .then((response) => response.json())
    .then((apiResponse) => {
      const allPrograms = apiResponse.data.ieProgramList.items;

      // 1. Filtra programas que tengan un ID y que esté incluido en el array
      const filteredPrograms = allPrograms.filter(
        (program) => program.programId && programIds.includes(program.programId)
      );

      // 2. Transforma al formato estándar { id, name }
      const formattedPrograms = filteredPrograms.map((program) => ({
        id: program.programId,
        name: program.programTitle,
      }));

      // 3. Actualiza el picklist con los datos formateados
      updatePicklist(programPicklist, formattedPrograms);
    })
    .catch((error) => {
      console.error('Error fetching programs by ID:', error);
      updatePicklist(programPicklist, []); // Limpia la lista en caso de error
    });
};

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

/**
 * Asigna valores a campos ocultos basados en la selección de un radio button.
 * @param {*} form Rferencia al objeto de Marketo. Es proporcionado en el on load o ready.
 * @param {*} interestedIn Valor que se asigna al campo ie_interestedin.
 * @param {*} pathwayId Valor que se asigna al campo ie_pathwayid.
 */
function conditionalHiddenFields(form, interestedIn, pathwayId) {
  const radios = document.querySelectorAll('input[name="mktoRadioButtonsProgram"]');

  radios.forEach((radio) => {
    radio.addEventListener('change', function () {
      const selectedValue = event.target.value;

      if (selectedValue == 'I want information about one specific program') {
        form.setValues({
          ie_pathwayid: '',
          ie_interestedin: '',
        });
      } else {
        form.setValues({
          ie_pathwayid: pathwayId,
          ie_interestedin: interestedIn,
        });
      }
    });
  });
}

/**
 * Guarda los valores del formulario en el localStorage del navegador.
 * @param {Object} values  - Un objeto con los valores del formulario.
 */
function saveValuesIntoLocalStorage(values) {
  values.cta = true;
  localStorage.setItem('formValues', JSON.stringify(values));
}

/**
 * Recupera los valores del formulario desde el localStorage del navegador.
 */
function waitForElement(selector, { root = document, mustBeVisible = false } = {}) {
  return new Promise((resolve) => {
    const immediate = root.querySelector(selector);
    if (immediate && (!mustBeVisible || immediate.offsetParent !== null)) {
      return resolve(immediate);
    }
    const obs = new MutationObserver(() => {
      const el = root.querySelector(selector);
      if (!el) return;
      if (mustBeVisible && el.offsetParent === null) return;
      obs.disconnect();
      resolve(el);
    });
    obs.observe(root === document ? document.documentElement : root, {
      childList: true,
      subtree: true,
      attributes: mustBeVisible,
      attributeFilter: mustBeVisible ? ['style', 'class', 'hidden', 'aria-hidden'] : undefined,
    });
  });
}

/**
 * Espera a que el formulario esté listo y luego obtiene los programas por IDs.
 * @param {*} programIds
 */
async function asyncGetProgramsByIds(form, programIds = []) {
  try {
    const root = form.getFormElem()[0] || document;
    await waitForElement('#ie_programmarketoid', { root, mustBeVisible: false });
    getProgramsById(programIds);
  } catch (e) {
    console.error('asyncGetProgramsByIds ->', e);
  }
}
