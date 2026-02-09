import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Trash2, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// ... (interfaces remain same)

const FundTransfers = () => {
  const { toast } = useToast();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transfers, setTransfers] = useState<FundTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  const [formData, setFormData] = useState({
    from_account_id: "",
    to_account_id: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    fetchData();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    // In local auth, role is in the token. We can decode it or fetch from profile endpoint if needed.
    // For now, let's assume 'admin' to bypass frontend check or fetch from current user endpoint.
    // TODO: implement proper role check via API or token decode.
    setUserRole("admin"); // Temporary default for local dev
  };

  const fetchData = async () => {
    try {
      const [accountsRes, transfersRes] = await Promise.all([
        api.get('/api/bank-accounts'),
        api.get('/fund-transfers')
      ]);

      setBankAccounts(accountsRes.data);
      setTransfers(transfersRes.data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.from_account_id === formData.to_account_id) {
      toast({
        variant: "destructive",
        title: "Invalid Transfer",
        description: "Source and destination accounts must be different",
      });
      return;
    }

    try {
      await api.post('/fund-transfers', {
        from_account_id: formData.from_account_id,
        to_account_id: formData.to_account_id,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description || null,
      });

      toast({
        title: "Success",
        description: "Fund transfer recorded successfully",
      });

      setFormData({
        from_account_id: "",
        to_account_id: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
      setShowForm(false);
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to add transfer",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/fund-transfers/${deleteId}`);

      toast({
        title: "Success",
        description: "Fund transfer deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to delete transfer",
      });
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Fund Transfers</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Transfer funds between bank accounts</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Transfer
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer Funds
            </CardTitle>
            <CardDescription>Move money from one account to another</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from_account_id">From Account *</Label>
                  <Select
                    value={formData.from_account_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, from_account_id: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name} (₹{account.balance.toLocaleString('en-IN')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to_account_id">To Account *</Label>
                  <Select
                    value={formData.to_account_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, to_account_id: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name} (₹{account.balance.toLocaleString('en-IN')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Transfer Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional notes about this transfer"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Record Transfer</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>All fund transfers between accounts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {transfers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs sm:text-sm">DATE</TableHead>
                    <TableHead className="text-xs sm:text-sm">FROM</TableHead>
                    <TableHead className="text-xs sm:text-sm">TO</TableHead>
                    <TableHead className="text-xs sm:text-sm text-right">AMOUNT</TableHead>
                    <TableHead className="text-xs sm:text-sm">DESCRIPTION</TableHead>
                    {userRole === "admin" && <TableHead className="text-xs sm:text-sm text-center">ACTIONS</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((transfer) => (
                    <TableRow key={transfer.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs sm:text-sm">
                        {new Date(transfer.date).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm font-medium">
                        <Badge variant="outline" className="font-mono">
                          {transfer.fromAccount?.account_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm font-medium">
                        <Badge variant="outline" className="font-mono">
                          {transfer.toAccount?.account_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-right font-semibold text-primary">
                        ₹{Number(transfer.amount).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground">
                        {transfer.description || "-"}
                      </TableCell>
                      {userRole === "admin" && (
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(transfer.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground p-8">
              <ArrowRightLeft className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">No transfers yet</p>
              <p className="text-xs mt-1">Create your first fund transfer to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transfer Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the transfer record and revert the account balances. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FundTransfers;
