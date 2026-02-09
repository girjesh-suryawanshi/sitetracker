import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// ... (interfaces remain same)

const Credits = () => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [editPaymentMethod, setEditPaymentMethod] = useState("cash");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [creditsRes, bankAccountsRes, sitesRes] = await Promise.all([
        api.get('/credits'),
        api.get('/api/bank-accounts'),
        api.get('/api/sites')
      ]);

      setCredits(creditsRes.data);
      setBankAccounts(bankAccountsRes.data);
      setSites(sitesRes.data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to fetch data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const paymentMethodValue = formData.get("payment_method") as "cash" | "bank_transfer";
    const bankAccountIdValue = formData.get("bank_account_id") as string;
    const descriptionValue = formData.get("description") as string;
    const siteIdValue = formData.get("site_id") as string;

    // Find the site name for the category field
    const selectedSite = sites.find(s => s.id === siteIdValue);

    const newCredit = {
      date: formData.get("date") as string,
      amount: parseFloat(formData.get("amount") as string),
      payment_method: paymentMethodValue,
      bank_account_id: bankAccountIdValue || null,
      description: descriptionValue || null,
      category: selectedSite?.site_name || "",
      site_id: siteIdValue || null,
    };

    try {
      await api.post('/credits', newCredit);

      toast({
        title: "Success",
        description: "Credit added successfully",
      });

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to add credit",
      });
    }
  };

  const handleEdit = async (credit: Credit) => {
    setEditingCredit(credit);
    setEditPaymentMethod(credit.payment_method);
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCredit) return;

    const formData = new FormData(e.currentTarget);
    const paymentMethodValue = formData.get("payment_method") as "cash" | "bank_transfer";
    const bankAccountIdValue = formData.get("bank_account_id") as string;
    const descriptionValue = formData.get("description") as string;
    const siteIdValue = formData.get("site_id") as string;

    const selectedSite = sites.find(s => s.id === siteIdValue);

    const updatedCredit = {
      date: formData.get("date") as string,
      amount: parseFloat(formData.get("amount") as string),
      payment_method: paymentMethodValue,
      bank_account_id: paymentMethodValue === "bank_transfer" ? bankAccountIdValue : null,
      description: descriptionValue || null,
      category: selectedSite?.site_name || "",
      site_id: siteIdValue || null,
    };

    try {
      await api.put(`/credits/${editingCredit.id}`, updatedCredit);

      toast({
        title: "Success",
        description: "Credit updated successfully",
      });

      setEditDialogOpen(false);
      setEditingCredit(null);
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to update credit",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/credits/${id}`);

      toast({
        title: "Success",
        description: "Credit deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to delete credit",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Credits</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage income and credit entries</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Credit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add New Credit</DialogTitle>
                <DialogDescription>
                  Enter credit/income details below
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="site_id">Site</Label>
                  <Select name="site_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.site_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select
                    name="payment_method"
                    onValueChange={setPaymentMethod}
                    defaultValue="cash"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {paymentMethod === "bank_transfer" && (
                  <div className="grid gap-2">
                    <Label htmlFor="bank_account_id">Bank Account</Label>
                    <Select name="bank_account_id">
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank account" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Additional details"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Credit</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
          {editingCredit && (
            <form onSubmit={handleUpdate}>
              <DialogHeader>
                <DialogTitle>Edit Credit</DialogTitle>
                <DialogDescription>
                  Update credit/income details below
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_site_id">Site</Label>
                  <Select name="site_id" defaultValue={editingCredit.category} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.site_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_date">Date</Label>
                  <Input
                    id="edit_date"
                    name="date"
                    type="date"
                    defaultValue={editingCredit.date}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_amount">Amount</Label>
                  <Input
                    id="edit_amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    defaultValue={editingCredit.amount}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_payment_method">Payment Method</Label>
                  <Select
                    name="payment_method"
                    onValueChange={setEditPaymentMethod}
                    defaultValue={editingCredit.payment_method}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editPaymentMethod === "bank_transfer" && (
                  <div className="grid gap-2">
                    <Label htmlFor="edit_bank_account_id">Bank Account</Label>
                    <Select name="bank_account_id" defaultValue={editingCredit.bank_account_id || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank account" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="edit_description">Description</Label>
                  <Textarea
                    id="edit_description"
                    name="description"
                    placeholder="Additional details"
                    defaultValue={editingCredit.description || ""}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Credit</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Recent Credits</CardTitle>
          <CardDescription>List of all credit entries</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto -mx-6 sm:mx-0">
          {credits.length === 0 ? (
            <p className="text-center text-xs sm:text-sm text-muted-foreground py-8 px-6">
              No credits found. Add your first credit entry.
            </p>
          ) : (
            <div className="min-w-[700px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm">Category</TableHead>
                    <TableHead className="text-xs sm:text-sm">Description</TableHead>
                    <TableHead className="text-xs sm:text-sm">Payment Method</TableHead>
                    <TableHead className="text-xs sm:text-sm">Bank Account</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Amount</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits.map((credit) => (
                    <TableRow key={credit.id}>
                      <TableCell className="text-xs sm:text-sm whitespace-nowrap">{new Date(credit.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{credit.category}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{credit.description || "-"}</TableCell>
                      <TableCell className="capitalize text-xs sm:text-sm">
                        {credit.payment_method.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {credit.bankAccount?.account_name || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600 text-xs sm:text-sm whitespace-nowrap">
                        ₹{credit.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(credit)}
                          >
                            <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(credit.id)}
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Credits;
