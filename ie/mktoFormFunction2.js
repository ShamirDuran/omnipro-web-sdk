// Se usa para obtener programas, countries, provinces
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
  picklist.innerHTML = '<option value="" disabled selected>Select...</option>';

  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    picklist.appendChild(option);
  });
}

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

/**
 * Espera a que el formulario esté listo y luego obtiene los programas por IDs.
 * @param {*} allowedValues
 */
async function asyncFilterValues(form, field, allowedValues = []) {
  try {
    const interestedIn = document.getElementById('ie_interestedin');

    interestedIn.addEventListener('change', function () {
      filterValues(field, allowedValues);
    });
  } catch (e) {
    console.error('asyncFilterValues ->', e);
  }
}

function filterValues(field, allowedValues = []) {
  const picklist = document.getElementById(field);
  if (!picklist) {
    return;
  }

  // Itera sobre cada <option> que ya existe dentro del select.
  for (const option of picklist.options) {
    const shouldBeVisible =
      allowedValues.length === 0 || allowedValues.includes(option.value) || option.value === '';
    option.style.display = shouldBeVisible ? '' : 'none';
  }
  picklist.value = '';
}

/**
 * Preselecciona una opción de un <select> en base al value proporcionado.
 * @param {string} selectedValue - El valor de la opción que se debe seleccionar.
 */
function selectProgram(programId) {
  const programPicklist = document.getElementById('ie_programmarketoid');

  if (!programPicklist) {
    return;
  }

  // Busca si existe una opción con el value indicado
  const optionExists = Array.from(programPicklist.options).some(
    (option) => option.value === programId
  );

  // Si existe, asigna el valor al select
  if (optionExists) {
    programPicklist.value = programId;
  }
}
/** Route map for all Thank-You Pages (TYP). */
const ROUTES = {
  stage1_interestedIn: '/corporate/typ/stage1/interested-in.html',
  stage2_master_pathway: '/corporate/typ/stage2/master-pathway.html',
  stage2_bachelor_pathway: '/corporate/typ/stage2/bachelor-pathway.html',
  stage3_master_program: '/corporate/typ/stage3/master-program.html',
  stage3_bachelor_program: '/corporate/typ/stage3/bachelor-program.html',
  stage3_summer_program: '/corporate/typ/stage3/summer-program.html',
  stage3_doctorate_program: '/corporate/typ/stage3/doctorate-program.html',
  others_default: '/corporate/typ/others/default.html',
  others_bachelor_counselor: '/corporate/typ/others/bachelor-counselor.html',
  others_bachelor_parent: '/corporate/typ/others/bachelor-parent.html',
  stage1_executive_interestedIn: '/executive/typ/stage1/interested-in.html',
  stage2_executive_pathway: '/executive/typ/stage2/pathway.html',
  stage3_executive_program: '/executive/typ/stage3/program.html',
  others_executive_default: '/executive/typ/others/default.html',
};

const BUSINESS_PATHWAY = '9cfdcfe7-e324-eb11-a813-000d3a2cbc56';
const DESIGN_PATHWAY = 'a103e80c-e424-eb11-a813-000d3a2cbc56';
const FINANCE_PATHWAY = '3e2ad5f9-e324-eb11-a813-000d3a2cbc56';
const LAW_PATHWAY = '3bace212-e424-eb11-a813-000d3a2cbc56';
const LEADERSHIP_PATHWAY = '90e2dcf3-e324-eb11-a813-000d3a2cbc56';
const MARKETING_PATHWAY = '34bdef06-e424-eb11-a813-000d3a2cbc56';
const SCIENCE_PATHWAY = '868ceb00-e424-eb11-a813-000d3a2cbc56';

/** Stakeholder role: Parent. */
const PARENT_VALUE = 'cf8feddc-1107-eb11-a813-000d3a2cbc56';
/** Stakeholder role: Counselor/Professor. */
const PROFESSOR_VALUE = '34122eb2-1107-eb11-a813-000d3a2cbc56';
/** Stakeholder role: Student. */
const STUDENT_VALUE_CLOUD = 'Student';
const STUDENT_VALUE_CLOUD_SPANISH = 'Alumno';

/** Interested-in value: Master programs. */
const INTERESTED_IN_MASTER = 'Master programs';
/** Interested-in value: Undergraduate degrees. */
const INTERESTED_IN_BACHELOR = 'Undergraduate degrees';
/** Interested-in value: Undergraduate degrees. */
const INTERESTED_IN_EXECUTIVE = 'Executive Education';

/** ID Programs. */
const PRE_UNIVERSITY_SUMMER_PROGRAM =
  'cHzSoE9fPwCfWGp+o6Sr3wdfh+S2JQU8N625PIsIBqAxgNneOP9qfXifssk9+qpmbAm/RCCLK1nwrNbEL0Aujg==';
const UNIVERSITY_SUMMER_PROGRAM =
  'BHnB4JJwp2F+XCLVAPocVeDYiP0t9DOi1lnRP82N0kxRBi/981o94pzr9qnUpguhzSl3fVTp7QMzrry3gjKYLA==';

/** Allowed pathway IDs for Stage 2 routing. */
const STAGE2_PATHWAYS = new Set([
  BUSINESS_PATHWAY,
  DESIGN_PATHWAY,
  FINANCE_PATHWAY,
  LAW_PATHWAY,
  LEADERSHIP_PATHWAY,
  MARKETING_PATHWAY,
  SCIENCE_PATHWAY,
]);

/** Allowed pathway IDs for Stage 2 - Executive routing. */
const STAGE2_EXECUTIVE_PATHWAYS = new Set([
  BUSINESS_PATHWAY,
  FINANCE_PATHWAY,
  LAW_PATHWAY,
  LEADERSHIP_PATHWAY,
  MARKETING_PATHWAY,
  SCIENCE_PATHWAY,
]);

const abs = (path) => `${path}`;
const norm = (s) => String(s || '');

/**
 * Redirects to a provided TYP URL or falls back to stage logic.
 */
function redirectToThankYouPageLogic(config, values, thankYouPage) {
  const { params } = config;
  if (thankYouPage != null && thankYouPage != '') {
    redirectToThankYouPage(params, thankYouPage);
  } else {
    handleThankYouPageLogic(config, values);
  }
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
    // Ignora valores nulos o vacíos
    if (value == null || value === '') return;

    // No agregar lavalores con "000"
    if (value === '000') return;

    searchParams.append(key, value);
  });

  // 3. Convierte los parámetros a una cadena de texto (ej: "country=CO&gender=male").
  const queryString = searchParams.toString();

  // 4. Construye la URL final y realiza la redirección.
  // La variable global THANK_YOU_PAGE debe estar definida en tu script.
  const redirectUrl = `${thankYouPage}${queryString ? '?' + queryString : ''}`;

  console.log('redirect', redirectUrl);

  try {
    const consent = localStorage.getItem('OptanonConsent');
    const alertBoxClosed = localStorage.getItem('OptanonAlertBoxClosed');

    if (consent) {
      document.cookie = `OptanonConsent=${consent}; path=/; domain=.ie.edu; SameSite=None; Secure`;
    }
    if (alertBoxClosed) {
      document.cookie = `OptanonAlertBoxClosed=${alertBoxClosed}; path=/; domain=.ie.edu; SameSite=None; Secure`;
    }
  } catch (e) {
    console.warn('⚠️ Error al sincronizar OneTrust antes del redirect:', e);
  }

  window.location.href = redirectUrl;
};

/**
 * Resolves the TYP using current config and form values, then redirects.
 */
function handleThankYouPageLogic(config, values) {
  let { params } = config;
  if (params == null) {
    params = buildParamsStage(config, values);
  }
  let thankYouPage = chooseTYPStage(config, values);
  adjustThankYouPage = adjustAuthorPath(thankYouPage);
  redirectToThankYouPage(params, adjustThankYouPage);
}

/**
 * Validates author domain and modify path
 */
function adjustAuthorPath(path) {
  const isAuthor = /\bauthor\b/i.test(location.hostname);

  if (isAuthor) {
    path = '/content/ieprogram/us/en' + path;
  }
  return path;
}
/**
 * Build Params
 */
function buildParamsStage(config, values) {
  const { type } = config;
  let params = {};
  if (type == '1') {
    params = {
      country: values.ie_countryid,
      province: values.ie_provinceregionid,
      gender: values.ie_genderidentity,
      interestedIn: values.ie_interestedin,
      stakeholderRole: values.mktoStakeholder,
      typeofDualMastersdegrees: 'pendiente',
    };
  } else if (type == '2') {
    params = {
      country: values.ie_countryid,
      province: values.ie_provinceregionid,
      gender: values.ie_genderidentity,
      interestedIn: values.ie_interestedin,
      pathwayId: values.ie_pathwayid,
      stakeholderRole: values.mktoStakeholder,
    };
  } else if (type == '3') {
    params = {
      country: values.ie_countryid,
      province: values.ie_provinceregionid,
      gender: values.ie_genderidentity,
      interestedIn: values.ie_interestedin,
      pathwayId: values.ie_pathwayid,
      stakeholderRole: values.mktoStakeholder,
      programId: values.ie_programmarketoid,
      mktoSummerSpecialization: 'pendiente',
    };
  }
  return params;
}

/**
 * Selects the TYP based on the configured flow stage.
 */
function chooseTYPStage(config, values) {
  const { type } = config;
  let thankYouPage = '';
  if (type == '1') {
    thankYouPage = chooseTYPStage1(values);
  } else if (type == '2' || type == '2-3') {
    thankYouPage = chooseTYPStage2(values);
  } else if (type == '3') {
    thankYouPage = chooseTYPStage3(values);
  }
  return thankYouPage;
}

/**
 * Stage 1 rules: maps Interested In, Stakeholder, and Pathway to a TYP route.
 */
function chooseTYPStage1(values) {
  const interestedIn = norm(values.ie_interestedin);
  const stakeholder = norm(values.mktoStakeholder);

  if (INTERESTED_IN_MASTER == interestedIn) {
    return abs(ROUTES.stage1_interestedIn);
  }

  if (INTERESTED_IN_BACHELOR == interestedIn) {
    if (stakeholder === PARENT_VALUE) {
      return abs(ROUTES.others_bachelor_parent);
    } else if (stakeholder === PROFESSOR_VALUE) {
      return abs(ROUTES.others_bachelor_counselor);
    } else if (stakeholder === STUDENT_VALUE_CLOUD || stakeholder === STUDENT_VALUE_CLOUD_SPANISH) {
      return abs(ROUTES.stage1_interestedIn);
    }
  }

  if (programId == UNIVERSITY_SUMMER_PROGRAM) {
    return abs(ROUTES.stage1_interestedIn);
  }
  //Executive
  if (INTERESTED_IN_EXECUTIVE == interestedIn) {
    return abs(ROUTES.stage1_executive_interestedIn);
  }

  return abs(ROUTES.others_default);
}

/**
 * Stage 2 rules: maps Interested In, Stakeholder, and Pathway to a TYP route.
 */
function chooseTYPStage2(values) {
  const interestedIn = norm(values.ie_interestedin);
  const stakeholder = norm(values.mktoStakeholder);
  const pathwayLabel = norm(values.ie_pathwayid);

  // Master
  if (INTERESTED_IN_MASTER == interestedIn && STAGE2_PATHWAYS.has(pathwayLabel)) {
    return abs(ROUTES.stage2_master_pathway);
  }

  // Bachelor
  if (INTERESTED_IN_BACHELOR == interestedIn && STAGE2_PATHWAYS.has(pathwayLabel)) {
    if (stakeholder === PARENT_VALUE) {
      return abs(ROUTES.others_bachelor_parent);
    } else if (stakeholder === PROFESSOR_VALUE) {
      return abs(ROUTES.others_bachelor_counselor);
    } else if (stakeholder === STUDENT_VALUE_CLOUD || stakeholder === STUDENT_VALUE_CLOUD_SPANISH) {
      return abs(ROUTES.stage2_bachelor_pathway);
    }
    // Stakeholder inesperado
    return abs(ROUTES.others_default);
  }

  //Executive
  if (INTERESTED_IN_EXECUTIVE == interestedIn) {
    if (STAGE2_EXECUTIVE_PATHWAYS.has(pathwayLabel)) {
      return abs(ROUTES.stage2_executive_pathway);
    } else {
      return abs(ROUTES.others_executive_default);
    }
  }
  // Default
  return abs(ROUTES.others_default);
}

/**
 * Stage 3 rules: maps Interested In, Stakeholder, and Pathway to a TYP route.
 */
function chooseTYPStage3(values) {
  const interestedIn = norm(values.ie_interestedin);
  const stakeholder = norm(values.mktoStakeholder);
  const programId = norm(values.ie_programmarketoid);

  // Master
  if (interestedIn == INTERESTED_IN_MASTER) {
    return abs(ROUTES.stage3_master_program);
  }

  // Bachelor
  if (interestedIn == INTERESTED_IN_BACHELOR) {
    if (stakeholder === PARENT_VALUE) {
      return abs(ROUTES.others_bachelor_parent);
    } else if (stakeholder === PROFESSOR_VALUE) {
      return abs(ROUTES.others_bachelor_counselor);
    } else if (stakeholder === STAKEHOLDER_STUDENT_VALUE) {
      return abs(ROUTES.stage2_bachelor_pathway);
    }
  }

  // Pre Univesity
  if (programId == PRE_UNIVERSITY_SUMMER_PROGRAM) {
    if (stakeholder === PARENT_VALUE) {
      return abs(ROUTES.others_bachelor_parent);
    } else if (stakeholder === PROFESSOR_VALUE) {
      return abs(ROUTES.others_bachelor_counselor);
    } else if (stakeholder === STAKEHOLDER_STUDENT_VALUE) {
      return abs(ROUTES.stage3_summer_program);
    }
  }

  if (programId == UNIVERSITY_SUMMER_PROGRAM) {
    return abs(ROUTES.stage3_summer_program);
  }
  //Executive
  if (INTERESTED_IN_EXECUTIVE == interestedIn) {
    return abs(ROUTES.stage3_executive_program);
  }

  return abs(ROUTES.others_default);
}
