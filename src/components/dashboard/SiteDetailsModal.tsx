import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Receipt, CreditCard } from "lucide-react";

interface SiteDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteName: string;
}

interface Expense {
  id: string;
  date: string;
  amount: number;
  description: string | null;
  payment_status: string;
  payment_method: string;
  vendor: { name: string } | null;
  category: { category_name: string } | null;
}

interface Credit {
  id: string;
  date: string;
  amount: number;
  description: string | null;
  category: string;
  payment_method: string;
}

export const SiteDetailsModal = ({ open, onOpenChange, siteName }: SiteDetailsModalProps) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && siteName) {
      fetchSiteDetails();
    }
  }, [open, siteName]);

  const fetchSiteDetails = async () => {
    setLoading(true);
    try {
      // Get site ID first
      const { data: sites } = await api.get("/api/sites");
      const site = sites.find((s: any) => s.site_name === siteName);

      if (!site) {
        setExpenses([]);
        setCredits([]);
        return;
      }

      // Fetch expenses for this site
      const { data: expensesData } = await api.get("/api/expenses", {
        params: { site_id: site.id }
      });

      // Fetch credits for this site
      // Note: Backend doesn't support filtering by site_id yet, so we filter client-side
      const { data: creditsData } = await api.get("/api/credits");
      const siteCredits = creditsData.filter((c: any) => c.site_id === site.id);

      setExpenses(expensesData || []);
      setCredits(siteCredits || []);
    } catch (error) {
      console.error("Error fetching site details:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCredits = credits.reduce((sum, c) => sum + Number(c.amount), 0);
  const netBalance = totalCredits - totalExpenses;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            {siteName} - Details
          </DialogTitle>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 py-3">
          <div className="bg-success/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Credits</p>
            <p className="text-lg font-bold text-success">₹{totalCredits.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-destructive/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-bold text-destructive">₹{totalExpenses.toLocaleString('en-IN')}</p>
          </div>
          <div className={`${netBalance >= 0 ? 'bg-primary/10' : 'bg-destructive/10'} rounded-lg p-3 text-center`}>
            <p className="text-xs text-muted-foreground">Net Balance</p>
            <p className={`text-lg font-bold ${netBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
              ₹{netBalance.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="expenses" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expenses" className="gap-2">
                <Receipt className="h-4 w-4" />
                Expenses ({expenses.length})
              </TabsTrigger>
              <TabsTrigger value="credits" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Credits ({credits.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="flex-1 overflow-auto mt-4">
              {expenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Vendor</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs">Method</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="text-xs">
                            {new Date(expense.date).toLocaleDateString('en-IN')}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {expense.vendor?.name || '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {expense.category?.category_name || '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-xs">
                              {expense.payment_method === 'bank_transfer' ? 'Bank' : 'Cash'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge
                              variant={
                                expense.payment_status === 'paid' ? 'default' :
                                  expense.payment_status === 'partial' ? 'secondary' : 'destructive'
                              }
                              className="text-xs"
                            >
                              {expense.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium text-destructive">
                            ₹{Number(expense.amount).toLocaleString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Receipt className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No expenses for this site</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="credits" className="flex-1 overflow-auto mt-4">
              {credits.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs">Method</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-xs text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {credits.map((credit) => (
                        <TableRow key={credit.id}>
                          <TableCell className="text-xs">
                            {new Date(credit.date).toLocaleDateString('en-IN')}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {credit.category}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-xs">
                              {credit.payment_method === 'bank_transfer' ? 'Bank' : 'Cash'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {credit.description || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium text-success">
                            ₹{Number(credit.amount).toLocaleString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <CreditCard className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No credits for this site</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
