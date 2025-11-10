// Se usa para obtener programas, countries, provinces (con debug en cada función y rama)
const DEBUG_NS = 'IE:FORMS';
let PROVINCES_INIT_VISIBILITY_DONE = false;

const dbg = (...args) => console.debug(`[${DEBUG_NS}]`, ...args);

const AEM_DOMAIN = 'https://discover.ie.edu';
const API_BASE = `${AEM_DOMAIN}/graphql/execute.json/global`;
const timestamp = new Date().getTime();

/**
 * Filtra las opciones de un 'select' para mostrar solo aquellas cuyos valores
 * coinciden con los IDs proporcionados en el listado.
 * @param {Array<string>} allowedPathwayIds - Un array con los IDs de las opciones que se deben mostrar.
 * Si el array está vacío, se mostrarán todas las opciones.
 */
function filterPathways(allowedPathwayIds = []) {
  dbg('filterPathways: init', { allowedPathwayIds });
  const pathwayPicklist = document.getElementById('ie_pathwayid');

  if (!pathwayPicklist) {
    dbg('filterPathways: pathwayPicklist NOT found → return');
    return;
  } else {
    dbg('filterPathways: pathwayPicklist found');
  }

  for (const option of pathwayPicklist.options) {
    const shouldBeVisible =
      allowedPathwayIds.length === 0 ||
      allowedPathwayIds.includes(option.value) ||
      option.value === '';

    if (shouldBeVisible) {
      dbg('filterPathways: option visible', option.value);
    } else {
      dbg('filterPathways: option hidden', option.value);
    }
    option.style.display = shouldBeVisible ? '' : 'none';
  }

  dbg('filterPathways: reset value to empty');
  pathwayPicklist.value = '';
}

/**
 * Fetches and populates programs based on the selected pathway.
 */
const getProgramsByPathway = () => {
  dbg('getProgramsByPathway: init');
  const programPicklist = document.getElementById('ie_programmarketoid');
  const selectedPathway = document.getElementById('ie_pathwayid').value;
  dbg('getProgramsByPathway: selectedPathway', selectedPathway);

  fetch(`${API_BASE}/getAllPrograms?timestamp=${timestamp}`)
    .then((response) => {
      dbg('getProgramsByPathway: fetch response received');
      return response.json();
    })
    .then((apiResponse) => {
      dbg('getProgramsByPathway: apiResponse OK');
      const allPrograms = apiResponse.data.ieProgramList.items;

      const filteredPrograms = allPrograms.filter((program) => {
        const cond = program.programId && program.programPathwayId === selectedPathway;
        if (cond) {
          dbg('getProgramsByPathway: keep program', program.programId);
        } else {
          dbg('getProgramsByPathway: skip program', program.programId);
        }
        return cond;
      });

      const formattedPrograms = filteredPrograms.map((program) => ({
        id: program.programId,
        name: program.programTitle,
      }));
      dbg('getProgramsByPathway: formattedPrograms count', formattedPrograms.length);
      updatePicklist(programPicklist, formattedPrograms);
    })
    .catch((error) => {
      console.error('Error fetching programs by pathway:', error);
      dbg('getProgramsByPathway: error → clean picklist');
      updatePicklist(programPicklist, []);
    });
};

/**
 * Fetches and populates programs based on an array of program IDs.
 * @param {string[]} programIds - An array of program IDs to show.
 */
const getProgramsById = (programIds = []) => {
  dbg('getProgramsById: init', { programIds });
  const programPicklist = document.getElementById('ie_programmarketoid');

  fetch(`${API_BASE}/getAllPrograms?timestamp=${timestamp}`)
    .then((response) => {
      dbg('getProgramsById: fetch response received');
      return response.json();
    })
    .then((apiResponse) => {
      dbg('getProgramsById: apiResponse OK');
      const allPrograms = apiResponse.data.ieProgramList.items;

      const filteredPrograms = allPrograms.filter((program) => {
        const cond = program.programId && programIds.includes(program.programId);
        if (cond) {
          dbg('getProgramsById: keep program', program.programId);
        } else {
          dbg('getProgramsById: skip program', program.programId);
        }
        return cond;
      });

      const formattedPrograms = filteredPrograms.map((program) => ({
        id: program.programId,
        name: program.programTitle,
      }));
      dbg('getProgramsById: formattedPrograms count', formattedPrograms.length);
      updatePicklist(programPicklist, formattedPrograms);
    })
    .catch((error) => {
      console.error('Error fetching programs by ID:', error);
      dbg('getProgramsById: error → clean picklist');
      updatePicklist(programPicklist, []);
    });
};

/**
 * Fetch and populate countries into the country picklist.
 */
function getCountries() {
  const picklist = document.getElementById('ie_countryid');

  fetch(`${API_BASE}/getAllCountries?timestamp=${timestamp}`)
    .then((response) => {
      dbg('getCountries: fetch response received');
      return response.json();
    })
    .then((apiResponse) => {
      dbg('getCountries: apiResponse OK');
      const countries = apiResponse.data.ieCountryList.items;

      const formattedCountries = countries.map((country) => {
        const item = { id: country.countryId, name: country.countryName };
        return item;
      });

      updatePicklist(picklist, formattedCountries);
    })
    .catch((error) => {
      console.error('Error fetching countries:', error);
      dbg('getCountries: error');
    });
}

/**
 * Sets up the province picklist to be populated based on the selected country.
 */
function getProvinces() {
  const countryPicklist = document.getElementById('ie_countryid');
  const provincePicklist = document.getElementById('ie_provinceregionid');

  getCountries();

  // Solo ocultar la PRIMERA vez que se llame
  if (!PROVINCES_INIT_VISIBILITY_DONE) {
    dbg('getProvinces: first call → hide provinces');
    toggleVisibility(provincePicklist, false);
    resetDefaultOption(provincePicklist);
    PROVINCES_INIT_VISIBILITY_DONE = true;
  } else {
    dbg('getProvinces: not first call → skip initial hide');
  }

  // evitar listeners duplicados si se invoca múltiples veces
  if (countryPicklist.dataset.provincesListenerAttached === '1') {
    dbg('getProvinces: listener already attached → return');
    return;
  }
  countryPicklist.dataset.provincesListenerAttached = '1';

  countryPicklist.addEventListener('change', function () {
    const selectedCountry = this.value;
    dbg('getProvinces: country changed', selectedCountry);

    if (!selectedCountry) {
      dbg('getProvinces: no country selected → hide & clear provinces');
      toggleVisibility(provincePicklist, false);
      updatePicklist(provincePicklist, []);
      return;
    } else {
      dbg('getProvinces: country selected → fetch provinces');
    }

    fetch(`${API_BASE}/getAllProvinces?timestamp=${timestamp}`)
      .then((response) => {
        dbg('getProvinces: provinces fetch response received');
        return response.json();
      })
      .then((apiResponse) => {
        dbg('getProvinces: apiResponse OK');
        const allProvinces = apiResponse.data.ieProvinceList.items;

        const filteredProvinces = allProvinces.filter(
          (province) => province.provinceCountryId === selectedCountry
        );

        if (filteredProvinces.length > 0) {
          dbg('getProvinces: provinces found → show');

          const formattedProvinces = filteredProvinces.map((province) => ({
            id: province.provinceId,
            name: province.provinceName,
          }));
          dbg('getProvinces: formattedProvinces count', formattedProvinces.length);
          updatePicklist(provincePicklist, formattedProvinces);
          toggleVisibility(provincePicklist, true);
        } else {
          updatePicklist(provincePicklist, []);
          toggleVisibility(provincePicklist, false);
          dbg('getProvinces: no provinces found → hide');
        }
      })
      .catch((error) => {
        dbg('getProvinces: error → hide provinces');
        console.error('Error fetching provinces:', error);
        toggleVisibility(provincePicklist, false);
      });
  });
}

/**
 * Resetea el <select> a su opción por defecto con value "000".
 */
function resetDefaultOption(element) {
  dbg('resetDefaultOption: init', { id: element?.id });
  if (!element) {
    dbg('resetDefaultOption: element NOT found → return');
    return;
  }
  if (element.tagName.toLowerCase() !== 'select') {
    dbg('resetDefaultOption: not a select → return');
    return;
  }

  const originalLabel =
    element.getAttribute('data-label') || element.options[0]?.textContent || 'Select...';

  element.innerHTML = `<option value="000">${originalLabel}</option>`;
  element.value = '000';
  dbg('resetDefaultOption: select reset to 000 with placeholder', originalLabel);
}

/**
 * Muestra u oculta el campo según si es requerido o no.
 * Delegará al resetDefaultOption para limpiar selects cuando se oculte.
 */
function toggleVisibility(element, isRequired) {
  dbg('toggleVisibility: init', { id: element?.id, isRequired });
  if (!element) {
    dbg('toggleVisibility: element NOT found → return');
    return;
  }

  const formRow = element.closest('.mktoFormRow');

  if (isRequired) {
    dbg('toggleVisibility: show');
    if (formRow) {
      formRow.style.display = 'block';
    }
  } else {
    dbg('toggleVisibility: hide');
    if (formRow) {
      formRow.style.display = 'none';
    }

    if (element.tagName && element.tagName.toLowerCase() === 'select') {
      dbg('toggleVisibility: select cleanup branch → delegating to resetDefaultOption');
      resetDefaultOption(element);
    } else {
      dbg('toggleVisibility: non-select cleanup branch');
      try {
        element.value = '';
      } catch (e) {
        dbg('toggleVisibility: cannot reset value on element', e);
      }
    }
  }
}

/**
 * Populates a picklist from a standardized array of objects.
 */
function updatePicklist(picklist, items) {
  dbg('updatePicklist: init', { id: picklist?.id, itemsCount: items?.length });
  if (!picklist) {
    dbg('updatePicklist: picklist NOT found → return');
    return;
  } else {
    dbg('updatePicklist: picklist found');
  }

  const originalLabel =
    picklist.getAttribute('data-label') || picklist.options[0]?.textContent || 'Select...';

  const previousValue = picklist.value;
  dbg('updatePicklist: previousValue', previousValue);

  picklist.innerHTML = `<option value="" disabled selected>${originalLabel}</option>`;

  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    picklist.appendChild(option);
  });

  if (previousValue && [...picklist.options].some((opt) => opt.value === previousValue)) {
    dbg('updatePicklist: restore previousValue');
    picklist.value = previousValue;
  } else {
    dbg('updatePicklist: cannot restore previousValue');
  }
}

/**
 * Asigna valores a campos ocultos basados en la selección de un radio button.
 */
function conditionalHiddenFields(form, interestedIn, pathwayId) {
  dbg('conditionalHiddenFields: init', { interestedIn, pathwayId });
  const radios = document.querySelectorAll('input[name="mktoRadioButtonsProgram"]');

  radios.forEach((radio) => {
    radio.addEventListener('change', function (event) {
      const selectedValue = event.target.value;
      dbg('conditionalHiddenFields: radio change', selectedValue);

      if (selectedValue == 'I want information about one specific program') {
        dbg('conditionalHiddenFields: branch → specific program');
        form.setValues({ ie_pathwayid: '', ie_interestedin: '' });
      } else {
        dbg('conditionalHiddenFields: branch → default set');
        form.setValues({ ie_pathwayid: pathwayId, ie_interestedin: interestedIn });
      }
    });
  });
}

/**
 * Guarda los valores del formulario en el localStorage del navegador.
 */
function saveValuesIntoLocalStorage(values) {
  dbg('saveValuesIntoLocalStorage: init', { keys: Object.keys(values || {}) });
  values.cta = true;
  localStorage.setItem('formValues', JSON.stringify(values));
  dbg('saveValuesIntoLocalStorage: stored');
}

/**
 * Espera a que el elemento exista/sea visible.
 */
function waitForElement(selector, { root = document, mustBeVisible = false } = {}) {
  dbg('waitForElement: init', { selector, mustBeVisible });
  return new Promise((resolve) => {
    const immediate = root.querySelector(selector);
    if (immediate && (!mustBeVisible || immediate.offsetParent !== null)) {
      dbg('waitForElement: immediate match → resolve');
      return resolve(immediate);
    } else {
      dbg('waitForElement: no immediate match → observe');
    }
    const obs = new MutationObserver(() => {
      const el = root.querySelector(selector);
      if (!el) {
        dbg('waitForElement: observed tick → still not found');
        return;
      }
      if (mustBeVisible && el.offsetParent === null) {
        dbg('waitForElement: found but not visible yet');
        return;
      }
      obs.disconnect();
      dbg('waitForElement: found → resolve');
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
 */
async function asyncGetProgramsByIds(form, programIds = []) {
  dbg('asyncGetProgramsByIds: init', { programIds });
  try {
    const root = form.getFormElem()[0] || document;
    dbg('asyncGetProgramsByIds: waiting for #ie_programmarketoid');
    await waitForElement('#ie_programmarketoid', { root, mustBeVisible: false });
    dbg('asyncGetProgramsByIds: element ready → call getProgramsById');
    getProgramsById(programIds);
  } catch (e) {
    console.error('asyncGetProgramsByIds ->', e);
    dbg('asyncGetProgramsByIds: error');
  }
}

/**
 * Espera a que el formulario esté listo y luego filtra valores por allowedValues.
 */
async function asyncFilterValues(form, field, allowedValues = []) {
  dbg('asyncFilterValues: init', { field, allowedValues });
  try {
    const interestedIn = document.getElementById('ie_interestedin');

    if (interestedIn) {
      dbg('asyncFilterValues: #ie_interestedin found → add listener');
      interestedIn.addEventListener('change', function () {
        dbg('asyncFilterValues: interestedIn change → filterValues');
        filterValues(field, allowedValues);
      });
    } else {
      dbg('asyncFilterValues: #ie_interestedin NOT found');
    }
  } catch (e) {
    console.error('asyncFilterValues ->', e);
    dbg('asyncFilterValues: error');
  }
}

function filterValues(field, allowedValues = []) {
  dbg('filterValues: init', { field, allowedValues });
  const picklist = document.getElementById(field);
  if (!picklist) {
    dbg('filterValues: picklist NOT found → return');
    return;
  } else {
    dbg('filterValues: picklist found');
  }

  for (const option of picklist.options) {
    const shouldBeVisible =
      allowedValues.length === 0 || allowedValues.includes(option.value) || option.value === '';

    if (shouldBeVisible) {
      dbg('filterValues: option visible', option.value);
    } else {
      dbg('filterValues: option hidden', option.value);
    }
    option.style.display = shouldBeVisible ? '' : 'none';
  }
  dbg('filterValues: reset value');
  picklist.value = '';
}

/**
 * Preselecciona una opción de un <select> en base al value proporcionado.
 */
function selectProgram(programId) {
  dbg('selectProgram: init', { programId });
  const programPicklist = document.getElementById('ie_programmarketoid');

  if (!programPicklist) {
    dbg('selectProgram: programPicklist NOT found → return');
    return;
  } else {
    dbg('selectProgram: programPicklist found');
  }

  const optionExists = Array.from(programPicklist.options).some((option) => {
    const cond = option.value === programId;
    dbg('selectProgram: check option', option.value, cond);
    return cond;
  });

  if (optionExists) {
    dbg('selectProgram: option exists → set value');
    programPicklist.value = programId;
  } else {
    dbg('selectProgram: option does NOT exist → no-op');
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

const PARENT_VALUE = 'cf8feddc-1107-eb11-a813-000d3a2cbc56';
const PROFESSOR_VALUE = '34122eb2-1107-eb11-a813-000d3a2cbc56';
const STUDENT_VALUE_CLOUD = 'Student';

const INTERESTED_IN_MASTER = 'Master programs';
const INTERESTED_IN_BACHELOR = 'Undergraduate degrees';
const INTERESTED_IN_EXECUTIVE = 'Executive Education';

const STAGE2_PATHWAYS = new Set([
  BUSINESS_PATHWAY,
  DESIGN_PATHWAY,
  FINANCE_PATHWAY,
  LAW_PATHWAY,
  LEADERSHIP_PATHWAY,
  MARKETING_PATHWAY,
  SCIENCE_PATHWAY,
]);

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

// Mantiene la compatibilidad con thankYouPage personalizado o con lógica de stage
function redirectToThankYouPageLogic(config, values, thankYouPage) {
  dbg('redirectToThankYouPageLogic: init', { configType: config?.type, thankYouPage });
  const { params } = config;

  if (thankYouPage) {
    dbg('redirectToThankYouPageLogic: thankYouPage provided → direct redirect');
    redirectToThankYouPage(params, thankYouPage);
  } else {
    dbg('redirectToThankYouPageLogic: thankYouPage NOT provided → handle logic by stage');
    handleThankYouPageLogic(config, values);
  }
}

// Redirige siempre usando el dominio externo definido en AEM_DOMAIN
const redirectToThankYouPage = (params, thankYouPagePath) => {
  dbg('redirectToThankYouPage: init', { thankYouPagePath, params });
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!value || value === '000') {
      dbg('redirectToThankYouPage: skip param', key, value);
      return;
    } else {
      dbg('redirectToThankYouPage: add param', key, value);
    }
    searchParams.append(key, value);
  });

  const queryString = searchParams.toString();
  const redirectUrl = `${AEM_DOMAIN}${thankYouPagePath}${queryString ? '?' + queryString : ''}`;

  console.log('redirect →', redirectUrl);
  dbg('redirectToThankYouPage: final URL', redirectUrl);

  try {
    dbg('redirectToThankYouPage: OneTrust sync attempt');
    const consent = localStorage.getItem('OptanonConsent');
    const alertBoxClosed = localStorage.getItem('OptanonAlertBoxClosed');

    if (consent) {
      dbg('redirectToThankYouPage: set OptanonConsent cookie');
      document.cookie = `OptanonConsent=${consent}; path=/; domain=.ie.edu; SameSite=None; Secure`;
    } else {
      dbg('redirectToThankYouPage: no OptanonConsent in LS');
    }
    if (alertBoxClosed) {
      dbg('redirectToThankYouPage: set OptanonAlertBoxClosed cookie');
      document.cookie = `OptanonAlertBoxClosed=${alertBoxClosed}; path=/; domain=.ie.edu; SameSite=None; Secure`;
    } else {
      dbg('redirectToThankYouPage: no OptanonAlertBoxClosed in LS');
    }
  } catch (e) {
    console.warn('Error sincronizando OneTrust:', e);
    dbg('redirectToThankYouPage: OneTrust sync error');
  }

  window.location.href = redirectUrl;
};

// Resuelve el path del TYP y luego delega la redirección al método que usa el dominio externo
function handleThankYouPageLogic(config, values) {
  dbg('handleThankYouPageLogic: init', { config });
  let { params } = config;

  if (!params) {
    dbg('handleThankYouPageLogic: no params → buildParamsStage');
    params = buildParamsStage(config, values);
  } else {
    dbg('handleThankYouPageLogic: params provided');
  }

  const path = chooseTYPStage(config, values);
  dbg('handleThankYouPageLogic: chosen path', path);

  const finalPath = adjustAuthorPath(path);
  dbg('handleThankYouPageLogic: finalPath after adjustAuthor', finalPath);

  redirectToThankYouPage(params, finalPath);
}

// Mantiene la lógica actual de path, pero nunca modifica el dominio.
function adjustAuthorPath(path) {
  const isAuthor = /\bauthor\b/i.test(location.hostname);
  if (isAuthor) {
    dbg('adjustAuthorPath: author env → prefix path');
    return '/content/ieprogram/us/en' + path;
  } else {
    dbg('adjustAuthorPath: publish env → keep path');
  }
  return path;
}

/**
 * Build Params
 */
function buildParamsStage(config, values) {
  dbg('buildParamsStage: init', { type: config?.type });
  const { type } = config;
  let params = {};
  if (type == '1') {
    dbg('buildParamsStage: branch type 1');
    params = {
      country: values.ie_countryid,
      province: values.ie_provinceregionid,
      gender: values.ie_genderidentity,
      interestedIn: values.ie_interestedin,
      stakeholderRole: values.mktoStakeholder,
      typeofDualMastersdegrees: 'pendiente',
    };
  } else if (type == '2') {
    dbg('buildParamsStage: branch type 2');
    params = {
      country: values.ie_countryid,
      province: values.ie_provinceregionid,
      gender: values.ie_genderidentity,
      interestedIn: values.ie_interestedin,
      pathwayId: values.ie_pathwayid,
      stakeholderRole: values.mktoStakeholder,
    };
  } else if (type == '3') {
    dbg('buildParamsStage: branch type 3');
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
  } else {
    dbg('buildParamsStage: unknown type → empty params');
  }
  dbg('buildParamsStage: result', params);
  return params;
}

/**
 * Selects the TYP based on the configured flow stage.
 */
function chooseTYPStage(config, values) {
  dbg('chooseTYPStage: init', { type: config?.type, subtype: config?.subtype });
  const { type } = config;
  let thankYouPage = '';
  if (type == '1') {
    dbg('chooseTYPStage: branch type 1');
    thankYouPage = chooseTYPStage1(values);
  } else if (type == '2' || type == '2-3') {
    dbg('chooseTYPStage: branch type 2 / 2-3');
    thankYouPage = chooseTYPStage2(values);
  } else if (type == '3') {
    dbg('chooseTYPStage: branch type 3');
    thankYouPage = chooseTYPStage3(config, values);
  } else {
    dbg('chooseTYPStage: unknown type → default others');
    thankYouPage = ROUTES.others_default;
  }
  dbg('chooseTYPStage: result', thankYouPage);
  return thankYouPage;
}

/**
 * Stage 1 rules
 */
function chooseTYPStage1(values) {
  dbg('chooseTYPStage1: init', values);
  const interestedIn = norm(values.ie_interestedin);
  const stakeholder = norm(values.mktoStakeholder);

  if (INTERESTED_IN_MASTER == interestedIn) {
    dbg('chooseTYPStage1: Master → stage1_interestedIn');
    return abs(ROUTES.stage1_interestedIn);
  } else {
    dbg('chooseTYPStage1: not Master');
  }

  if (INTERESTED_IN_BACHELOR == interestedIn) {
    dbg('chooseTYPStage1: Bachelor branch');
    if (stakeholder === PARENT_VALUE) {
      dbg('chooseTYPStage1: stakeholder Parent');
      return abs(ROUTES.others_bachelor_parent);
    } else if (stakeholder === PROFESSOR_VALUE) {
      dbg('chooseTYPStage1: stakeholder Professor');
      return abs(ROUTES.others_bachelor_counselor);
    } else if (stakeholder === STUDENT_VALUE_CLOUD) {
      dbg('chooseTYPStage1: stakeholder Student');
      return abs(ROUTES.stage1_interestedIn);
    } else {
      dbg('chooseTYPStage1: stakeholder unexpected → default');
    }
  } else {
    dbg('chooseTYPStage1: not Bachelor');
  }

  if (/^summer\s*program$/i.test(interestedIn) || /^doctorate$/i.test(interestedIn)) {
    dbg('chooseTYPStage1: Summer/Doctorate → stage1_interestedIn');
    return abs(ROUTES.stage1_interestedIn);
  } else {
    dbg('chooseTYPStage1: not Summer/Doctorate');
  }

  dbg('chooseTYPStage1: default others');
  return abs(ROUTES.others_default);
}

/**
 * Stage 2 rules
 */
function chooseTYPStage2(values) {
  dbg('chooseTYPStage2: init', values);
  const interestedIn = norm(values.ie_interestedin);
  const stakeholder = norm(values.mktoStakeholder);
  const pathwayLabel = norm(values.ie_pathwayid);

  if (INTERESTED_IN_MASTER == interestedIn && STAGE2_PATHWAYS.has(pathwayLabel)) {
    dbg('chooseTYPStage2: Master + valid pathway → stage2_master_pathway');
    return abs(ROUTES.stage2_master_pathway);
  } else {
    dbg('chooseTYPStage2: not Master/valid pathway');
  }

  if (INTERESTED_IN_BACHELOR == interestedIn && STAGE2_PATHWAYS.has(pathwayLabel)) {
    dbg('chooseTYPStage2: Bachelor + valid pathway branch');
    if (stakeholder === PARENT_VALUE) {
      dbg('chooseTYPStage2: Parent → others_bachelor_parent');
      return abs(ROUTES.others_bachelor_parent);
    } else if (stakeholder === PROFESSOR_VALUE) {
      dbg('chooseTYPStage2: Professor → others_bachelor_counselor');
      return abs(ROUTES.others_bachelor_counselor);
    } else if (stakeholder === STUDENT_VALUE_CLOUD) {
      dbg('chooseTYPStage2: Student → stage2_bachelor_pathway');
      return abs(ROUTES.stage2_bachelor_pathway);
    } else {
      dbg('chooseTYPStage2: unexpected stakeholder → default');
      return abs(ROUTES.others_default);
    }
  } else {
    dbg('chooseTYPStage2: not Bachelor/valid pathway');
  }

  if (INTERESTED_IN_EXECUTIVE == interestedIn) {
    dbg('chooseTYPStage2: Executive branch');
    if (STAGE2_EXECUTIVE_PATHWAYS.has(pathwayLabel)) {
      dbg('chooseTYPStage2: Exec valid pathway → stage2_executive_pathway');
      return abs(ROUTES.stage2_executive_pathway);
    } else {
      dbg('chooseTYPStage2: Exec invalid pathway → others_executive_default');
      return abs(ROUTES.others_executive_default);
    }
  } else {
    dbg('chooseTYPStage2: not Executive');
  }

  dbg('chooseTYPStage2: default others');
  return abs(ROUTES.others_default);
}

/**
 * Stage 3 rules
 */
function chooseTYPStage3(config, values) {
  dbg('chooseTYPStage3: init', { subtype: config?.subtype, values });
  const { subtype } = config;
  const stakeholder = norm(values.mktoStakeholder);

  if (subtype == 'Master') {
    dbg('chooseTYPStage3: subtype Master → stage3_master_program');
    return abs(ROUTES.stage3_master_program);
  } else {
    dbg('chooseTYPStage3: subtype not Master');
  }

  if (subtype == 'University Summer Program') {
    dbg('chooseTYPStage3: subtype University Summer → stage3_summer_program');
    return abs(ROUTES.stage3_summer_program);
  } else {
    dbg('chooseTYPStage3: subtype not University Summer');
  }

  if (stakeholder === PARENT_VALUE) {
    dbg('chooseTYPStage3: stakeholder Parent → others_bachelor_parent');
    return abs(ROUTES.others_bachelor_parent);
  } else if (stakeholder === PROFESSOR_VALUE) {
    dbg('chooseTYPStage3: stakeholder Professor → others_bachelor_counselor');
    return abs(ROUTES.others_bachelor_counselor);
  } else if (stakeholder === STUDENT_VALUE_CLOUD) {
    dbg('chooseTYPStage3: stakeholder Student branch');
    if (subtype == 'Bachelor') {
      dbg('chooseTYPStage3: Student + Bachelor → stage2_bachelor_pathway');
      return abs(ROUTES.stage2_bachelor_pathway);
    } else if (subtype == 'Pre-University Summer Program') {
      dbg('chooseTYPStage3: Student + Pre-University Summer → stage3_summer_program');
      return abs(ROUTES.stage3_summer_program);
    } else {
      dbg('chooseTYPStage3: Student + other subtype → others_bachelor_counselor');
      return abs(ROUTES.others_bachelor_counselor);
    }
  } else {
    dbg('chooseTYPStage3: stakeholder unexpected → default others');
  }

  return abs(ROUTES.others_default);
}
