const MODELED_PROFILE_DETAILS_KEYS = new Set([
  "profileRole",
  "role",
  "professionalBio",
  "termsAccepted",
  "deliveryPolicyAccepted",
  "communicationPolicyAccepted",
  "acceptInProgressProjects",
  "globalIndustryOther",
  "skills",
  "skillLevels",
  "education",
  "services",
  "serviceDetails",
  "portfolioProjects",
  "globalIndustryFocus",
  "availability",
  "reliability",
]);

const MODELED_IDENTITY_KEYS = new Set([
  "city",
  "country",
  "username",
  "githubUrl",
  "languages",
  "coverImage",
  "linkedinUrl",
  "portfolioUrl",
  "profilePhoto",
  "otherLanguage",
  "professionalTitle",
]);

const MODELED_AVAILABILITY_KEYS = new Set([
  "hoursPerWeek",
  "startTimeline",
  "workingSchedule",
]);

const MODELED_RELIABILITY_KEYS = new Set([
  "delayHandling",
  "missedDeadlines",
]);

const isPlainObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const asObject = (value) => (isPlainObject(value) ? value : {});

const asArray = (value) => (Array.isArray(value) ? value : []);

const toOptionalString = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const toStringArray = (value) =>
  asArray(value)
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean);

const hasMeaningfulValue = (value) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasMeaningfulValue(entry));
  }

  if (isPlainObject(value)) {
    return Object.values(value).some((entry) => hasMeaningfulValue(entry));
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return true;
  }

  return value !== null && value !== undefined;
};

const cloneJsonValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneJsonValue(entry));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneJsonValue(entry)])
    );
  }

  return value;
};

const mergeWithFallback = (primaryValue, fallbackValue) => {
  if (Array.isArray(primaryValue)) {
    return primaryValue.length
      ? cloneJsonValue(primaryValue)
      : Array.isArray(fallbackValue)
        ? cloneJsonValue(fallbackValue)
        : [];
  }

  if (isPlainObject(primaryValue)) {
    const merged = { ...cloneJsonValue(primaryValue) };
    if (!isPlainObject(fallbackValue)) {
      return merged;
    }

    Object.entries(fallbackValue).forEach(([key, value]) => {
      merged[key] = mergeWithFallback(merged[key], value);
    });
    return merged;
  }

  return hasMeaningfulValue(primaryValue)
    ? primaryValue
    : cloneJsonValue(fallbackValue);
};

const compactJsonValue = (value) => {
  if (Array.isArray(value)) {
    const next = value
      .map((entry) => compactJsonValue(entry))
      .filter((entry) => hasMeaningfulValue(entry));
    return next;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, entry]) => [key, compactJsonValue(entry)])
        .filter(([, entry]) => hasMeaningfulValue(entry))
    );
  }

  return value;
};

const compactTopLevelObject = (value) =>
  Object.fromEntries(
    Object.entries(asObject(value)).filter(([, entry]) => hasMeaningfulValue(entry))
  );

const normalizeServiceKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const uniqueValues = (values = []) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
    )
  );

const stripModeledNestedObject = (value, modeledKeys) => {
  const next = { ...cloneJsonValue(asObject(value)) };
  modeledKeys.forEach((key) => {
    delete next[key];
  });
  return compactJsonValue(next);
};

const buildPortfolioProjectsPayload = ({
  profileDetails = {},
  fallbackPortfolioProjects = [],
}) => {
  const profileProjects = asArray(profileDetails.portfolioProjects);
  if (profileProjects.length > 0) {
    return profileProjects;
  }

  return asArray(fallbackPortfolioProjects);
};

export const buildFreelancerProfileDetailsResidual = (profileDetails = {}) => {
  const residual = { ...cloneJsonValue(asObject(profileDetails)) };

  MODELED_PROFILE_DETAILS_KEYS.forEach((key) => {
    delete residual[key];
  });

  if (isPlainObject(residual.identity)) {
    const residualIdentity = stripModeledNestedObject(
      residual.identity,
      MODELED_IDENTITY_KEYS
    );
    if (hasMeaningfulValue(residualIdentity)) {
      residual.identity = residualIdentity;
    } else {
      delete residual.identity;
    }
  }

  if (isPlainObject(residual.availability)) {
    const residualAvailability = stripModeledNestedObject(
      residual.availability,
      MODELED_AVAILABILITY_KEYS
    );
    if (hasMeaningfulValue(residualAvailability)) {
      residual.availability = residualAvailability;
    } else {
      delete residual.availability;
    }
  }

  if (isPlainObject(residual.reliability)) {
    const residualReliability = stripModeledNestedObject(
      residual.reliability,
      MODELED_RELIABILITY_KEYS
    );
    if (hasMeaningfulValue(residualReliability)) {
      residual.reliability = residualReliability;
    } else {
      delete residual.reliability;
    }
  }

  return compactJsonValue(residual);
};

export const buildFreelancerProfileDetailsRecord = ({
  profileDetails = {},
  fallbackServices = [],
  fallbackPortfolioProjects = [],
}) => {
  const normalizedProfileDetails = asObject(profileDetails);
  const identity = asObject(normalizedProfileDetails.identity);
  const availability = asObject(normalizedProfileDetails.availability);
  const reliability = asObject(normalizedProfileDetails.reliability);

  return {
    profileDetails: buildFreelancerProfileDetailsResidual(normalizedProfileDetails),
    profileRole: toOptionalString(
      normalizedProfileDetails.profileRole ?? normalizedProfileDetails.role
    ),
    professionalBio: toOptionalString(normalizedProfileDetails.professionalBio),
    termsAccepted: Boolean(normalizedProfileDetails.termsAccepted),
    deliveryPolicyAccepted: Boolean(
      normalizedProfileDetails.deliveryPolicyAccepted
    ),
    communicationPolicyAccepted: Boolean(
      normalizedProfileDetails.communicationPolicyAccepted
    ),
    acceptInProgressProjects: toOptionalString(
      normalizedProfileDetails.acceptInProgressProjects
    ),
    globalIndustryOther: toOptionalString(
      normalizedProfileDetails.globalIndustryOther
    ),
    city: toOptionalString(identity.city),
    country: toOptionalString(identity.country),
    username: toOptionalString(identity.username),
    githubUrl: toOptionalString(identity.githubUrl),
    languages: toStringArray(identity.languages),
    coverImage: toOptionalString(identity.coverImage),
    linkedinUrl: toOptionalString(identity.linkedinUrl),
    portfolioUrl: toOptionalString(identity.portfolioUrl),
    profilePhoto: toOptionalString(identity.profilePhoto),
    otherLanguage: toOptionalString(identity.otherLanguage),
    professionalTitle: toOptionalString(identity.professionalTitle),
    skills: toStringArray(normalizedProfileDetails.skills),
    skillLevels: asObject(normalizedProfileDetails.skillLevels),
    education: asArray(normalizedProfileDetails.education),
    services: toStringArray(normalizedProfileDetails.services).length
      ? toStringArray(normalizedProfileDetails.services)
      : toStringArray(fallbackServices),
    serviceDetails: asObject(normalizedProfileDetails.serviceDetails),
    portfolioProjects: buildPortfolioProjectsPayload({
      profileDetails: normalizedProfileDetails,
      fallbackPortfolioProjects,
    }),
    globalIndustryFocus: toStringArray(
      normalizedProfileDetails.globalIndustryFocus
    ),
    availabilityHoursPerWeek: toOptionalString(availability.hoursPerWeek),
    availabilityStartTimeline: toOptionalString(availability.startTimeline),
    availabilityWorkingSchedule: toOptionalString(availability.workingSchedule),
    reliabilityDelayHandling: toOptionalString(reliability.delayHandling),
    reliabilityMissedDeadlines: toOptionalString(
      reliability.missedDeadlines
    ),
  };
};

export const buildFreelancerProfileDetailsObject = (record = null) => {
  const normalizedRecord = asObject(record);
  const legacyProfileDetails = asObject(normalizedRecord.profileDetails);
  const legacyIdentity = asObject(legacyProfileDetails.identity);
  const legacyAvailability = asObject(legacyProfileDetails.availability);
  const legacyReliability = asObject(legacyProfileDetails.reliability);

  const nextProfileDetails = cloneJsonValue(legacyProfileDetails);

  nextProfileDetails.role = mergeWithFallback(
    toOptionalString(normalizedRecord.profileRole),
    legacyProfileDetails.role
  );
  nextProfileDetails.professionalBio = mergeWithFallback(
    toOptionalString(normalizedRecord.professionalBio),
    legacyProfileDetails.professionalBio
  );
  if (normalizedRecord.termsAccepted === true || legacyProfileDetails.termsAccepted === true) {
    nextProfileDetails.termsAccepted = true;
  }
  if (
    normalizedRecord.deliveryPolicyAccepted === true ||
    legacyProfileDetails.deliveryPolicyAccepted === true
  ) {
    nextProfileDetails.deliveryPolicyAccepted = true;
  }
  if (
    normalizedRecord.communicationPolicyAccepted === true ||
    legacyProfileDetails.communicationPolicyAccepted === true
  ) {
    nextProfileDetails.communicationPolicyAccepted = true;
  }
  nextProfileDetails.acceptInProgressProjects = mergeWithFallback(
    toOptionalString(normalizedRecord.acceptInProgressProjects),
    legacyProfileDetails.acceptInProgressProjects
  );
  nextProfileDetails.globalIndustryOther = mergeWithFallback(
    toOptionalString(normalizedRecord.globalIndustryOther),
    legacyProfileDetails.globalIndustryOther
  );
  nextProfileDetails.skills = mergeWithFallback(
    toStringArray(normalizedRecord.skills),
    legacyProfileDetails.skills
  );
  nextProfileDetails.skillLevels = mergeWithFallback(
    asObject(normalizedRecord.skillLevels),
    legacyProfileDetails.skillLevels
  );
  nextProfileDetails.education = mergeWithFallback(
    asArray(normalizedRecord.education),
    legacyProfileDetails.education
  );
  nextProfileDetails.services = mergeWithFallback(
    toStringArray(normalizedRecord.services),
    legacyProfileDetails.services
  );
  nextProfileDetails.serviceDetails = mergeWithFallback(
    asObject(normalizedRecord.serviceDetails),
    legacyProfileDetails.serviceDetails
  );
  nextProfileDetails.portfolioProjects = mergeWithFallback(
    asArray(normalizedRecord.portfolioProjects),
    legacyProfileDetails.portfolioProjects
  );
  nextProfileDetails.globalIndustryFocus = mergeWithFallback(
    toStringArray(normalizedRecord.globalIndustryFocus),
    legacyProfileDetails.globalIndustryFocus
  );

  nextProfileDetails.identity = mergeWithFallback(
    compactJsonValue({
      city: mergeWithFallback(
        toOptionalString(normalizedRecord.city),
        legacyIdentity.city
      ),
      country: mergeWithFallback(
        toOptionalString(normalizedRecord.country),
        legacyIdentity.country
      ),
      username: mergeWithFallback(
        toOptionalString(normalizedRecord.username),
        legacyIdentity.username
      ),
      githubUrl: mergeWithFallback(
        toOptionalString(normalizedRecord.githubUrl),
        legacyIdentity.githubUrl
      ),
      languages: mergeWithFallback(
        toStringArray(normalizedRecord.languages),
        legacyIdentity.languages
      ),
      coverImage: mergeWithFallback(
        toOptionalString(normalizedRecord.coverImage),
        legacyIdentity.coverImage
      ),
      linkedinUrl: mergeWithFallback(
        toOptionalString(normalizedRecord.linkedinUrl),
        legacyIdentity.linkedinUrl
      ),
      portfolioUrl: mergeWithFallback(
        toOptionalString(normalizedRecord.portfolioUrl),
        legacyIdentity.portfolioUrl
      ),
      profilePhoto: mergeWithFallback(
        toOptionalString(normalizedRecord.profilePhoto),
        legacyIdentity.profilePhoto
      ),
      otherLanguage: mergeWithFallback(
        toOptionalString(normalizedRecord.otherLanguage),
        legacyIdentity.otherLanguage
      ),
      professionalTitle: mergeWithFallback(
        toOptionalString(normalizedRecord.professionalTitle),
        legacyIdentity.professionalTitle
      ),
    }),
    legacyIdentity
  );

  nextProfileDetails.availability = mergeWithFallback(
    compactJsonValue({
      hoursPerWeek: mergeWithFallback(
        toOptionalString(normalizedRecord.availabilityHoursPerWeek),
        legacyAvailability.hoursPerWeek
      ),
      startTimeline: mergeWithFallback(
        toOptionalString(normalizedRecord.availabilityStartTimeline),
        legacyAvailability.startTimeline
      ),
      workingSchedule: mergeWithFallback(
        toOptionalString(normalizedRecord.availabilityWorkingSchedule),
        legacyAvailability.workingSchedule
      ),
    }),
    legacyAvailability
  );

  nextProfileDetails.reliability = mergeWithFallback(
    compactJsonValue({
      delayHandling: mergeWithFallback(
        toOptionalString(normalizedRecord.reliabilityDelayHandling),
        legacyReliability.delayHandling
      ),
      missedDeadlines: mergeWithFallback(
        toOptionalString(normalizedRecord.reliabilityMissedDeadlines),
        legacyReliability.missedDeadlines
      ),
    }),
    legacyReliability
  );

  return compactTopLevelObject(nextProfileDetails);
};

export const mergeFreelancerProfileDetailsWithMarketplace = (
  profileDetails = {},
  marketplaceRows = []
) => {
  const nextProfileDetails = cloneJsonValue(asObject(profileDetails));
  const nextServices = new Set(
    toStringArray(nextProfileDetails.services)
  );
  const nextServiceDetails = asObject(nextProfileDetails.serviceDetails);

  (Array.isArray(marketplaceRows) ? marketplaceRows : []).forEach((row) => {
    const serviceKey = normalizeServiceKey(row?.serviceKey || row?.service);
    if (!serviceKey) return;

    nextServices.add(serviceKey);

    const marketplaceDetail = asObject(row?.serviceDetails);
    const currentDetail = asObject(nextServiceDetails[serviceKey]);
    const tools = uniqueValues([
      ...toStringArray(marketplaceDetail.tools),
      ...toStringArray(marketplaceDetail.techStack),
      ...toStringArray(marketplaceDetail.technologies),
      ...toStringArray(marketplaceDetail.stack),
    ]);
    const projects = asArray(
      Array.isArray(marketplaceDetail.portfolio)
        ? marketplaceDetail.portfolio
        : marketplaceDetail.projects
    );

    const marketplaceFallback = compactTopLevelObject({
      coverImage: toOptionalString(
        marketplaceDetail.coverImage ||
          marketplaceDetail.image ||
          marketplaceDetail.thumbnail
      ),
      serviceDescription: toOptionalString(
        marketplaceDetail.serviceDescription ||
          marketplaceDetail.description ||
          marketplaceDetail.bio
      ),
      averageProjectPrice: toOptionalString(
        marketplaceDetail.averageProjectPrice ||
          marketplaceDetail.averagePrice ||
          marketplaceDetail.averageProjectPriceRange ||
          marketplaceDetail.priceRange
      ),
      averagePrice: toOptionalString(
        marketplaceDetail.averagePrice ||
          marketplaceDetail.averageProjectPrice ||
          marketplaceDetail.averageProjectPriceRange ||
          marketplaceDetail.priceRange
      ),
      deliveryTime: toOptionalString(
        marketplaceDetail.deliveryTime || marketplaceDetail.deliveryDays
      ),
      skillsAndTechnologies: tools,
      projects,
      platformLinks: asObject(marketplaceDetail.platformLinks),
    });

    nextServiceDetails[serviceKey] = mergeWithFallback(
      currentDetail,
      marketplaceFallback
    );
  });

  if (nextServices.size) {
    nextProfileDetails.services = Array.from(nextServices);
  }

  if (Object.keys(nextServiceDetails).length) {
    nextProfileDetails.serviceDetails = nextServiceDetails;
  }

  return compactTopLevelObject(nextProfileDetails);
};
