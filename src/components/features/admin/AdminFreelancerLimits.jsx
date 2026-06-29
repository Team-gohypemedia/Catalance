import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Settings2, ShieldCheck, ShieldAlert } from "lucide-react";
import { useAuth } from "@/shared/context/AuthContext";
import AdminLayout from "./AdminLayout";

export default function AdminFreelancerLimits() {
  const { authFetch } = useAuth();
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [limitInput, setLimitInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      const res = await authFetch("/admin/freelancer-limits");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFreelancers(data.data);
    } catch (error) {
      toast.error("Failed to fetch freelancer limits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setLimitInput(user.customLimit !== null ? user.customLimit.toString() : "");
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    
    const parsedLimit = limitInput.trim() === "" ? null : parseInt(limitInput, 10);
    if (parsedLimit !== null && isNaN(parsedLimit)) {
      toast.error("Please enter a valid number or leave empty to use system default.");
      return;
    }

    try {
      setIsSaving(true);
      const res = await authFetch(`/admin/freelancer-limits/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customProjectLimit: parsedLimit }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Freelancer limit updated successfully");
      setSelectedUser(null);
      fetchLimits(); // Refresh the data
    } catch (error) {
      toast.error("Failed to update limit");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Freelancer Project Limits</h1>
            <p className="text-muted-foreground mt-1">
              Manage custom active project limits for individual freelancers to override the global default.
            </p>
          </div>
        </div>

        <div className="border rounded-md bg-card">
          {loading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader2 className="animate-spin text-primary size-8" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Freelancer</TableHead>
                  <TableHead className="text-center">Active Projects</TableHead>
                  <TableHead className="text-center">Effective Limit</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {freelancers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No active freelancers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  freelancers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {user.activeProjects}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{user.effectiveLimit}</span>
                          {user.customLimit !== null ? (
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1">Custom</span>
                          ) : (
                            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full mt-1">System Default ({user.systemLimit})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.isEligible ? (
                          <div className="inline-flex items-center text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium">
                            <ShieldCheck className="size-3.5 mr-1" />
                            Available
                          </div>
                        ) : (
                          <div className="inline-flex items-center text-destructive bg-destructive/10 px-2.5 py-1 rounded-full text-xs font-medium">
                            <ShieldAlert className="size-3.5 mr-1" />
                            {user.openToWork === false ? 'Not Open to Work' : 'Limit Reached'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditClick(user)}
                        >
                          <Settings2 className="size-4 mr-2" />
                          Edit Limit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Freelancer Limit</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Set a custom limit for <strong>{selectedUser?.name}</strong>. If left blank, the system default of {selectedUser?.systemLimit} will be used.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Active Project Limit</label>
              <Input 
                type="number" 
                placeholder={`Default (${selectedUser?.systemLimit})`}
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="size-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
