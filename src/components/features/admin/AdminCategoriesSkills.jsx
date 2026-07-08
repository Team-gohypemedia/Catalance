import React, { useState, useEffect } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Trash, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function AdminCategoriesSkills() {
  const { authFetch } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSkillOpen, setIsSkillOpen] = useState(false);

  // Form states
  const [editingItem, setEditingItem] = useState(null);
  const [parentId, setParentId] = useState(null); // Used for adding children
  const [formName, setFormName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await authFetch("/admin/marketplace-filters");
      const data = await res.json();
      setServices(data);
    } catch (error) {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveService = async () => {
    try {
      if (editingItem) {
        await authFetch(`/admin/marketplace-filters/services/${editingItem.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: formName }),
        });
        toast.success("Service updated");
      } else {
        await authFetch("/admin/marketplace-filters/services", {
          method: "POST",
          body: JSON.stringify({ name: formName }),
        });
        toast.success("Service added");
      }
      setIsServiceOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error saving service");
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await authFetch(`/admin/marketplace-filters/services/${id}`, { method: "DELETE" });
      toast.success("Service deleted");
      fetchData();
    } catch (error) {
      toast.error("Error deleting service");
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (editingItem) {
        await authFetch(`/admin/marketplace-filters/sub-categories/${editingItem.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: formName }),
        });
        toast.success("Category updated");
      } else {
        await authFetch("/admin/marketplace-filters/sub-categories", {
          method: "POST",
          body: JSON.stringify({ serviceId: parentId, name: formName }),
        });
        toast.success("Category added");
      }
      setIsCategoryOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error saving category");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await authFetch(`/admin/marketplace-filters/sub-categories/${id}`, { method: "DELETE" });
      toast.success("Category deleted");
      fetchData();
    } catch (error) {
      toast.error("Error deleting category");
    }
  };

  const handleSaveSkill = async () => {
    try {
      if (editingItem) {
        await authFetch(`/admin/marketplace-filters/tools/${editingItem.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: formName }),
        });
        toast.success("Skill updated");
      } else {
        await authFetch("/admin/marketplace-filters/tools", {
          method: "POST",
          body: JSON.stringify({ subCategoryId: parentId, name: formName }),
        });
        toast.success("Skill added");
      }
      setIsSkillOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error saving skill");
    }
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) return;
    try {
      await authFetch(`/admin/marketplace-filters/tools/${id}`, { method: "DELETE" });
      toast.success("Skill deleted");
      fetchData();
    } catch (error) {
      toast.error("Error deleting skill");
    }
  };

  const openServiceDialog = (service = null) => {
    setEditingItem(service);
    setFormName(service ? service.name : "");
    setIsServiceOpen(true);
  };

  const openCategoryDialog = (serviceId, category = null) => {
    setParentId(serviceId);
    setEditingItem(category);
    setFormName(category ? category.name : "");
    setIsCategoryOpen(true);
  };

  const openSkillDialog = (categoryId, skill = null) => {
    setParentId(categoryId);
    setEditingItem(skill);
    setFormName(skill ? skill.name : "");
    setIsSkillOpen(true);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories & Skills</h1>
          <p className="text-muted-foreground mt-2">Manage the services, categories, and skills for freelancer onboarding.</p>
        </div>
        <Button onClick={() => openServiceDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="space-y-4">
        {services && services.length > 0 ? services.map((service) => (
          <Card key={service.id} className="overflow-hidden border-primary/20">
            <CardHeader className="bg-primary/5 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg">{service.name}</CardTitle>
              <div className="flex space-x-2">
                <Button size="sm" variant="ghost" onClick={() => openCategoryDialog(service.id)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Category
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openServiceDialog(service)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteService(service.id)}>
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="multiple" className="w-full">
                {service.subCategories?.map((category) => (
                  <AccordionItem value={category.id.toString()} key={category.id} className="border-b last:border-0 px-4">
                    <div className="flex items-center justify-between py-2">
                      <AccordionTrigger className="hover:no-underline font-medium text-left flex-1 py-2">
                        {category.name}
                      </AccordionTrigger>
                      <div className="flex items-center space-x-1 pl-4 opacity-70 hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openSkillDialog(category.id)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openCategoryDialog(service.id, category)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeleteCategory(category.id)}>
                          <Trash className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <AccordionContent className="pb-4 pl-4 pt-0">
                      <div className="flex flex-wrap gap-2 mt-2">
                        {category.tools?.length > 0 ? (
                          category.tools.map((skill) => (
                            <div key={skill.id} className="bg-secondary text-secondary-foreground text-sm px-3 py-1 rounded-full flex items-center group border border-border">
                              {skill.name}
                              <button onClick={() => openSkillDialog(category.id, skill)} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit2 className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                              </button>
                              <button onClick={() => handleDeleteSkill(skill.id)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash className="w-3 h-3 text-red-400 hover:text-red-500" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground italic">No skills added yet.</span>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
                {(!service.subCategories || service.subCategories.length === 0) && (
                  <div className="p-4 text-sm text-muted-foreground italic">No categories added yet.</div>
                )}
              </Accordion>
            </CardContent>
          </Card>
        )) : (
          <div className="text-center p-8 text-muted-foreground">No services found. Click 'Add Service' to get started.</div>
        )}
      </div>

      {/* Service Dialog */}
      <Dialog open={isServiceOpen} onOpenChange={setIsServiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Service" : "Add Service"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Service Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveService}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Category Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skill Dialog */}
      <Dialog open={isSkillOpen} onOpenChange={setIsSkillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Skill" : "Add Skill"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Skill Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSkillOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSkill}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
