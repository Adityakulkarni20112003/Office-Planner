import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { StatBox } from "@/components/StatBox";
import { ChartWidget } from "@/components/ChartWidget";
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, Plus, Filter, Search, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewTransactionForm } from "@/components/forms/NewTransactionForm";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Transaction {
  id: number;
  type: string;
  category: string;
  description: string;
  amount: string;
  date: string;
  status: string;
  createdAt: string;
}

export default function Finance() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/finances");
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const data = await response.json();
      setTransactions(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transactions. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewTransaction = () => {
    fetchTransactions();
  };

  const receivedIncome = transactions
    .filter(f => f.type === 'income' && f.status === 'received')
    .reduce((sum, f) => sum + parseFloat(f.amount), 0);

  const pendingIncome = transactions
    .filter(f => f.type === 'income' && (f.status === 'pending' || f.status === 'overdue'))
    .reduce((sum, f) => sum + parseFloat(f.amount), 0);

  const totalExpectedIncome = receivedIncome + pendingIncome;

  const totalExpenses = transactions
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + parseFloat(f.amount), 0);

  const overdueAmount = transactions
    .filter(f => f.type === 'income' && f.status === 'overdue')
    .reduce((sum, f) => sum + parseFloat(f.amount), 0);

  const revenueData = [
    { category: 'Received', amount: receivedIncome || 0, color: '#10B981' },
    { category: 'Pending', amount: (pendingIncome - overdueAmount) || 0, color: '#F59E0B' },
    { category: 'Overdue', amount: overdueAmount || 0, color: '#EF4444' },
  ];

  // Generate monthly data based on real transactions
  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = months.map(month => {
      return {
        month,
        expected: 0,
        received: 0,
        pending: 0
      };
    });
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        const date = new Date(transaction.date);
        if (date.getFullYear() === currentYear) {
          const monthIndex = date.getMonth();
          const amount = parseFloat(transaction.amount);
          
          monthlyData[monthIndex].expected += amount;
          
          if (transaction.status === 'received') {
            monthlyData[monthIndex].received += amount;
          } else {
            monthlyData[monthIndex].pending += amount;
          }
        }
      }
    });
    
    return monthlyData;
  };

  const monthlyData = transactions.length > 0 ? generateMonthlyData() : [
    { month: 'Jan', expected: 0, received: 0, pending: 0 },
    { month: 'Feb', expected: 0, received: 0, pending: 0 },
    { month: 'Mar', expected: 0, received: 0, pending: 0 },
    { month: 'Apr', expected: 0, received: 0, pending: 0 },
    { month: 'May', expected: 0, received: 0, pending: 0 },
    { month: 'Jun', expected: 0, received: 0, pending: 0 },
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'received': return 'bg-emerald-500/20 text-emerald-300';
      case 'pending': return 'bg-orange-500/20 text-orange-300';
      case 'overdue': return 'bg-red-500/20 text-red-300';
      case 'paid': return 'bg-blue-500/20 text-blue-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <Layout 
      title="Financial Management" 
      subtitle="Track expected vs received revenue and monitor cash flow"
    >
      <div className="space-y-6">
        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatBox
            title="Expected Revenue"
            value={`$${totalExpectedIncome.toLocaleString()}`}
            change={totalExpectedIncome > 0 ? "+12.5%" : "0%"}
            changeType="positive"
            changeLabel="this month"
            icon={TrendingUp}
            iconColor="text-blue-400"
            iconBgColor="bg-blue-500/20"
          />
          <StatBox
            title="Received Revenue"
            value={`$${receivedIncome.toLocaleString()}`}
            change={totalExpectedIncome > 0 ? `${((receivedIncome / totalExpectedIncome) * 100).toFixed(1)}%` : "0%"}
            changeType="positive"
            changeLabel="of expected"
            icon={DollarSign}
            iconColor="text-emerald-400"
            iconBgColor="bg-emerald-500/20"
          />
          <StatBox
            title="Pending Amount"
            value={`$${(pendingIncome - overdueAmount).toLocaleString()}`}
            change={totalExpectedIncome > 0 ? `${(((pendingIncome - overdueAmount) / totalExpectedIncome) * 100).toFixed(1)}%` : "0%"}
            changeType="neutral"
            changeLabel="of expected"
            icon={Clock}
            iconColor="text-orange-400"
            iconBgColor="bg-orange-500/20"
          />
          <StatBox
            title="Overdue Amount"
            value={`$${overdueAmount.toLocaleString()}`}
            change={totalExpectedIncome > 0 ? `${((overdueAmount / totalExpectedIncome) * 100).toFixed(1)}%` : "0%"}
            changeType="negative"
            changeLabel="needs action"
            icon={AlertCircle}
            iconColor="text-red-400"
            iconBgColor="bg-red-500/20"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWidget title="Expected vs Received Revenue">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="expected" fill="#6B7280" radius={4} name="Expected" />
                <Bar dataKey="received" fill="#10B981" radius={4} name="Received" />
                <Bar dataKey="pending" fill="#F59E0B" radius={4} name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </ChartWidget>

          <ChartWidget title="Revenue Status Breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="amount"
                  label={({ category, amount }) => `${category}: $${amount.toLocaleString()}`}
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </ChartWidget>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-xl font-semibold text-foreground">Recent Transactions</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-2.5" />
                <Input 
                  placeholder="Search transactions..." 
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <NewTransactionForm onSuccess={handleNewTransaction} />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-muted-foreground">Loading transactions...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="rounded-lg p-6 border border-red-500/30 bg-red-500/10 text-center">
              <p className="text-red-300">{error}</p>
              <Button 
                variant="outline" 
                className="mt-4 border-red-500/30 text-red-300 hover:bg-red-500/20"
                onClick={fetchTransactions}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && transactions.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No transactions yet</h3>
              <p className="text-muted-foreground mb-6">Add your first transaction to get started</p>
            </div>
          )}

          {/* Transactions Table */}
          {!loading && !error && transactions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Type</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4 text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-foreground">{transaction.description}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status || 'pending'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          {transaction.type === 'income' ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-400 mr-1" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-400 mr-1" />
                          )}
                          <span className={`font-medium ${
                            transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {transaction.type}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`font-bold ${
                          transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}