import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { prisma } from "../src/lib/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CATALOG_KEY = "services_complete_nested";
const SOURCE_FILE = resolve(__dirname, "../src/data/servicesComplete.json");
const SOURCE_FILE_LABEL = "src/data/servicesComplete.json";

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .trim();

const uniqueKey = (candidate, fallbackPrefix, index, used) => {
  const base =
    typeof candidate === "string" && candidate.trim()
      ? candidate.trim()
      : `${fallbackPrefix}_${index + 1}`;

  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let suffix = 2;
  while (used.has(`${base}_${suffix}`)) {
    suffix += 1;
  }

  const withSuffix = `${base}_${suffix}`;
  used.add(withSuffix);
  return withSuffix;
};

const parseServicesCatalog = () => {
  const raw = readFileSync(SOURCE_FILE, "utf-8");
  return JSON.parse(raw.replace(/^[\u0000-\u001F\uFEFF]+/, "").trimStart());
};

const buildNestedCatalog = (catalog) => {
  const services = Array.isArray(catalog?.services) ? catalog.services : [];
  const serviceIds = [];
  const servicesById = {};
  const usedServiceIds = new Set();

  for (let serviceIndex = 0; serviceIndex < services.length; serviceIndex += 1) {
    const service = services[serviceIndex] || {};
    const serviceId = uniqueKey(service.id, "service", serviceIndex, usedServiceIds);
    const questions = Array.isArray(service.questions) ? service.questions : [];
    const questionIds = [];
    const questionsById = {};
    const usedQuestionIds = new Set();

    for (let questionIndex = 0; questionIndex < questions.length; questionIndex += 1) {
      const question = questions[questionIndex] || {};
      const questionId = uniqueKey(
        question.id,
        "question",
        questionIndex,
        usedQuestionIds
      );
      const options = Array.isArray(question.options) ? question.options : [];
      const optionIds = [];
      const optionsById = {};
      const usedOptionIds = new Set();

      for (let optionIndex = 0; optionIndex < options.length; optionIndex += 1) {
        const option = options[optionIndex] || {};
        const optionKeySource = option.value || option.id || slugify(option.label || "");
        const optionId = uniqueKey(optionKeySource, "option", optionIndex, usedOptionIds);
        optionIds.push(optionId);
        optionsById[optionId] = {
          ...option,
          id: optionId
        };
      }

      questionIds.push(questionId);
      questionsById[questionId] = {
        ...question,
        id: questionId,
        options: {
          allIds: optionIds,
          byId: optionsById
        }
      };
    }

    serviceIds.push(serviceId);
    servicesById[serviceId] = {
      ...service,
      id: serviceId,
      questions: {
        allIds: questionIds,
        byId: questionsById
      }
    };
  }

  return {
    meta: {
      schemaVersion: catalog?.schema_version || null,
      currency: catalog?.currency || null
    },
    globalRules: catalog?.global_rules || {},
    services: {
      allIds: serviceIds,
      byId: servicesById
    }
  };
};

const main = async () => {
  const sourceCatalog = parseServicesCatalog();
  const nestedCatalog = buildNestedCatalog(sourceCatalog);

  await prisma.serviceCatalog.upsert({
    where: { key: CATALOG_KEY },
    update: {
      schemaVersion: nestedCatalog.meta.schemaVersion,
      currency: nestedCatalog.meta.currency,
      payload: nestedCatalog,
      sourceFile: SOURCE_FILE_LABEL
    },
    create: {
      key: CATALOG_KEY,
      schemaVersion: nestedCatalog.meta.schemaVersion,
      currency: nestedCatalog.meta.currency,
      payload: nestedCatalog,
      sourceFile: SOURCE_FILE_LABEL
    }
  });

  const serviceCount = nestedCatalog.services.allIds.length;
  const questionCount = nestedCatalog.services.allIds.reduce((count, serviceId) => {
    const service = nestedCatalog.services.byId[serviceId];
    return count + (service?.questions?.allIds?.length || 0);
  }, 0);

  console.log(
    `[seed_service_catalog] Upserted "${CATALOG_KEY}" with ${serviceCount} services and ${questionCount} questions.`
  );
};

main()
  .catch((error) => {
    console.error("[seed_service_catalog] Failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
