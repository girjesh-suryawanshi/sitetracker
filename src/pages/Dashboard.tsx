import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee, TrendingUp, Building2, AlertTriangle } from "lucide-react";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DashboardStats {
  todayTotal: number;
  monthTotal: number;
  unpaidTotal: number;
  sitesCount: number;
}

interface SiteSummary {
  site_name: string;
  received: number;
  expense: number;
  balance: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todayTotal: 0,
    monthTotal: 0,
    unpaidTotal: 0,
    sitesCount: 0,
  });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [siteSummary, setSiteSummary] = useState<SiteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];

      // Fetch today's expenses
      const { data: todayExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("date", today);

      // Fetch month's expenses
      const { data: monthExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .gte("date", firstDayOfMonth);

      // Fetch unpaid expenses
      const { data: unpaidExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("payment_status", "unpaid");

      // Fetch sites count
      const { data: sites } = await supabase.from("sites").select("id");

      // Fetch category-wise data
      const { data: expensesByCategory } = await supabase
        .from("expenses")
        .select("amount, categories(category_name)")
        .gte("date", firstDayOfMonth);

      // Fetch site-wise summary
      const { data: allSites } = await supabase
        .from("sites")
        .select("id, site_name");

      const { data: allExpenses } = await supabase
        .from("expenses")
        .select("site_id, amount");

      const { data: allCredits } = await supabase
        .from("credits")
        .select("site_id, amount");

      // Process data
      const todayTotal = todayExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const monthTotal = monthExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const unpaidTotal = unpaidExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

      // Process category data
      const categoryMap = new Map();
      expensesByCategory?.forEach((exp: any) => {
        const category = exp.categories?.category_name || "Other";
        categoryMap.set(category, (categoryMap.get(category) || 0) + Number(exp.amount));
      });
      const categoryChartData = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));

      // Process site-wise summary
      const siteSummaryData: SiteSummary[] = [];
      allSites?.forEach((site) => {
        const siteExpenses = allExpenses
          ?.filter((exp) => exp.site_id === site.id)
          .reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
        
        const siteCredits = allCredits
          ?.filter((credit) => credit.site_id === site.id)
          .reduce((sum, credit) => sum + Number(credit.amount), 0) || 0;

        siteSummaryData.push({
          site_name: site.site_name,
          received: siteCredits,
          expense: siteExpenses,
          balance: siteCredits - siteExpenses,
        });
      });

      setStats({
        todayTotal,
        monthTotal,
        unpaidTotal,
        sitesCount: sites?.length || 0,
      });
      setCategoryData(categoryChartData);
      setSiteSummary(siteSummaryData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Overview of your construction expenses</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Today's Expenses</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">₹{stats.todayTotal.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">₹{stats.monthTotal.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Sites</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.sitesCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Unpaid Bills</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-warning">₹{stats.unpaidTotal.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Site-wise Summary</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {siteSummary.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">SITE</TableHead>
                      <TableHead className="text-xs sm:text-sm text-right">Received</TableHead>
                      <TableHead className="text-xs sm:text-sm text-right">EXPENSE</TableHead>
                      <TableHead className="text-xs sm:text-sm text-right">BALANCE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siteSummary.map((site, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs sm:text-sm font-medium">{site.site_name}</TableCell>
                        <TableCell className="text-xs sm:text-sm text-right">
                          ₹{site.received.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-right">
                          ₹{site.expense.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className={`text-xs sm:text-sm text-right font-medium ${site.balance < 0 ? 'text-destructive' : 'text-foreground'}`}>
                          ₹{site.balance.toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell className="text-xs sm:text-sm">TOTAL</TableCell>
                      <TableCell className="text-xs sm:text-sm text-right">
                        ₹{siteSummary.reduce((sum, site) => sum + site.received, 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-right">
                        ₹{siteSummary.reduce((sum, site) => sum + site.expense, 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className={`text-xs sm:text-sm text-right ${siteSummary.reduce((sum, site) => sum + site.balance, 0) < 0 ? 'text-destructive' : 'text-foreground'}`}>
                        ₹{siteSummary.reduce((sum, site) => sum + site.balance, 0).toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;