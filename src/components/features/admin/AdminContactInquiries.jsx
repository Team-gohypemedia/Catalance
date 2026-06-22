import React, { useCallback, useEffect, useState } from "react";
import Mail from "lucide-react/dist/esm/icons/mail";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { toast } from "sonner";

import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { useAuth } from "@/shared/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminContactInquiries = () => {
  const { authFetch } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch("/admin/contact-inquiries?limit=100");
      const payload = await response.json().catch(() => null);
      setInquiries(Array.isArray(payload?.data?.inquiries) ? payload.data.inquiries : []);
    } catch (error) {
      console.error("Failed to load contact inquiries:", error);
      toast.error("Failed to load contact inquiries");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="Contact Inquiries" />

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contact Inquiries</h1>
            <p className="mt-2 text-muted-foreground">
              Messages submitted from the public contact page.
            </p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  All Inquiries
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {loading ? "Loading inquiries..." : `${inquiries.length} inquiries found`}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="text-right">Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                          <div className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading contact inquiries...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : inquiries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                          No contact inquiries found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      inquiries.map((inquiry) => (
                        <TableRow key={inquiry.id}>
                          <TableCell className="font-medium">{inquiry.name}</TableCell>
                          <TableCell>{inquiry.email}</TableCell>
                          <TableCell>{inquiry.phone || "No phone provided"}</TableCell>
                          <TableCell>{inquiry.subject}</TableCell>
                          <TableCell className="max-w-[420px] whitespace-normal break-words text-muted-foreground">
                            {inquiry.message}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {formatDateTime(inquiry.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContactInquiries;
