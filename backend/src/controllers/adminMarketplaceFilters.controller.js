import { prisma } from "../lib/prisma.js";

// Fetch all services with their nested sub-categories and tools
export const getAdminMarketplaceFilters = async (req, res) => {
  try {
    const services = await prisma.marketplaceFilterService.findMany({
      include: {
        subCategories: {
          include: {
            tools: true,
          },
        },
      },
    });
    res.json(services);
  } catch (error) {
    console.error("Error fetching admin marketplace filters:", error);
    res.status(500).json({ error: "Failed to fetch filters" });
  }
};

// --- SERVICES ---
export const createAdminService = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const service = await prisma.marketplaceFilterService.create({
      data: { name },
    });
    res.status(201).json(service);
  } catch (error) {
    console.error("Error creating admin service:", error);
    res.status(500).json({ error: "Failed to create service" });
  }
};

export const updateAdminService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const service = await prisma.marketplaceFilterService.update({
      where: { id: parseInt(id) },
      data: { name },
    });
    res.json(service);
  } catch (error) {
    console.error("Error updating admin service:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
};

export const deleteAdminService = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.marketplaceFilterService.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting admin service:", error);
    res.status(500).json({ error: "Failed to delete service" });
  }
};

// --- SUB-CATEGORIES ---
export const createAdminSubCategory = async (req, res) => {
  try {
    const { serviceId, name } = req.body;
    if (!serviceId || !name) return res.status(400).json({ error: "Service ID and Name are required" });

    const subCategory = await prisma.marketplaceFilterSubCategory.create({
      data: { serviceId: parseInt(serviceId), name },
    });
    res.status(201).json(subCategory);
  } catch (error) {
    console.error("Error creating admin sub-category:", error);
    res.status(500).json({ error: "Failed to create sub-category" });
  }
};

export const updateAdminSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const subCategory = await prisma.marketplaceFilterSubCategory.update({
      where: { id: parseInt(id) },
      data: { name },
    });
    res.json(subCategory);
  } catch (error) {
    console.error("Error updating admin sub-category:", error);
    res.status(500).json({ error: "Failed to update sub-category" });
  }
};

export const deleteAdminSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.marketplaceFilterSubCategory.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting admin sub-category:", error);
    res.status(500).json({ error: "Failed to delete sub-category" });
  }
};

// --- TOOLS (SKILLS) ---
export const createAdminTool = async (req, res) => {
  try {
    const { subCategoryId, name } = req.body;
    if (!subCategoryId || !name) return res.status(400).json({ error: "SubCategory ID and Name are required" });

    const tool = await prisma.marketplaceFilterTool.create({
      data: { subCategoryId: parseInt(subCategoryId), name },
    });
    res.status(201).json(tool);
  } catch (error) {
    console.error("Error creating admin tool:", error);
    res.status(500).json({ error: "Failed to create tool" });
  }
};

export const updateAdminTool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const tool = await prisma.marketplaceFilterTool.update({
      where: { id: parseInt(id) },
      data: { name },
    });
    res.json(tool);
  } catch (error) {
    console.error("Error updating admin tool:", error);
    res.status(500).json({ error: "Failed to update tool" });
  }
};

export const deleteAdminTool = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.marketplaceFilterTool.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting admin tool:", error);
    res.status(500).json({ error: "Failed to delete tool" });
  }
};
