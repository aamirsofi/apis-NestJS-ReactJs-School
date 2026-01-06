import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { reportsService } from '../services/reports.service';
import { useSchool } from '../contexts/SchoolContext';
import { FiFileText, FiTrendingUp, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

export default function FinancialReports() {
  const { selectedSchoolId } = useSchool();
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: trialBalance = [], isLoading: loadingTrialBalance } = useQuery({
    queryKey: ['trialBalance', asOfDate],
    queryFn: () => reportsService.getTrialBalance(asOfDate),
    enabled: !!selectedSchoolId,
  });

  const { data: profitLoss, isLoading: loadingPL } = useQuery({
    queryKey: ['profitLoss', fromDate, toDate],
    queryFn: () => reportsService.getProfitAndLoss(fromDate, toDate),
    enabled: !!selectedSchoolId,
  });

  const { data: balanceSheet, isLoading: loadingBS } = useQuery({
    queryKey: ['balanceSheet', asOfDate],
    queryFn: () => reportsService.getBalanceSheet(asOfDate),
    enabled: !!selectedSchoolId,
  });

  const { data: feeCollection, isLoading: loadingCollection } = useQuery({
    queryKey: ['feeCollection', fromDate, toDate],
    queryFn: () => reportsService.getFeeCollectionSummary(fromDate, toDate),
    enabled: !!selectedSchoolId,
  });

  const { data: outstandingDues = [], isLoading: loadingDues } = useQuery({
    queryKey: ['outstandingDues'],
    queryFn: () => reportsService.getOutstandingDues(),
    enabled: !!selectedSchoolId,
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-gray-600 mt-1">View accounting and financial reports</p>
        </div>

        <Tabs defaultValue="trial-balance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            <TabsTrigger value="fee-collection">Fee Collection</TabsTrigger>
            <TabsTrigger value="outstanding-dues">Outstanding Dues</TabsTrigger>
          </TabsList>

          <TabsContent value="trial-balance">
            <Card>
              <CardHeader>
                <CardTitle>Trial Balance</CardTitle>
                <div className="flex gap-4 mt-4">
                  <div>
                    <Label>As Of Date</Label>
                    <Input
                      type="date"
                      value={asOfDate}
                      onChange={(e) => setAsOfDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingTrialBalance ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Account Code</th>
                          <th className="text-left p-2">Account Name</th>
                          <th className="text-right p-2">Opening Balance</th>
                          <th className="text-right p-2">Debit</th>
                          <th className="text-right p-2">Credit</th>
                          <th className="text-right p-2">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trialBalance.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{item.accountCode}</td>
                            <td className="p-2">{item.accountName}</td>
                            <td className="text-right p-2">₹{item.openingBalance.toLocaleString()}</td>
                            <td className="text-right p-2">₹{item.debit.toLocaleString()}</td>
                            <td className="text-right p-2">₹{item.credit.toLocaleString()}</td>
                            <td className="text-right p-2 font-medium">
                              ₹{item.balance.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profit-loss">
            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss Statement</CardTitle>
                <div className="flex gap-4 mt-4">
                  <div>
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>To Date</Label>
                    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPL ? (
                  <div className="text-center py-8">Loading...</div>
                ) : profitLoss ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">Income</h3>
                      <div className="space-y-2">
                        {profitLoss.income.items.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{item.accountName}</span>
                            <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total Income</span>
                          <span>₹{profitLoss.income.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Expenses</h3>
                      <div className="space-y-2">
                        {profitLoss.expenses.items.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{item.accountName}</span>
                            <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total Expenses</span>
                          <span>₹{profitLoss.expenses.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t-2 pt-4">
                      <div className="flex justify-between text-xl font-bold">
                        <span>Net Profit</span>
                        <span className={profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{profitLoss.netProfit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">No data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance-sheet">
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
                <div className="flex gap-4 mt-4">
                  <div>
                    <Label>As Of Date</Label>
                    <Input
                      type="date"
                      value={asOfDate}
                      onChange={(e) => setAsOfDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingBS ? (
                  <div className="text-center py-8">Loading...</div>
                ) : balanceSheet ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">Assets</h3>
                      <div className="space-y-2">
                        {balanceSheet.assets.items.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{item.accountName}</span>
                            <span className="font-medium">₹{item.balance.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total Assets</span>
                          <span>₹{balanceSheet.assets.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Liabilities</h3>
                      <div className="space-y-2">
                        {balanceSheet.liabilities.items.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{item.accountName}</span>
                            <span className="font-medium">₹{item.balance.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total Liabilities</span>
                          <span>₹{balanceSheet.liabilities.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Equity</h3>
                      <div className="space-y-2">
                        {balanceSheet.equity.items.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{item.accountName}</span>
                            <span className="font-medium">₹{item.balance.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total Equity</span>
                          <span>₹{balanceSheet.equity.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">No data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fee-collection">
            <Card>
              <CardHeader>
                <CardTitle>Fee Collection Summary</CardTitle>
                <div className="flex gap-4 mt-4">
                  <div>
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>To Date</Label>
                    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCollection ? (
                  <div className="text-center py-8">Loading...</div>
                ) : feeCollection ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Collection</p>
                        <p className="text-2xl font-bold">₹{feeCollection.totalAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Transactions</p>
                        <p className="text-2xl font-bold">{feeCollection.totalCount}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">By Payment Method</h3>
                      <div className="space-y-2">
                        {Object.entries(feeCollection.byMethod).map(([method, data]: [string, any]) => (
                          <div key={method} className="flex justify-between">
                            <span className="capitalize">{method.replace('_', ' ')}</span>
                            <div className="text-right">
                              <p className="font-medium">₹{data.amount.toLocaleString()}</p>
                              <p className="text-sm text-gray-600">{data.count} transactions</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">No data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outstanding-dues">
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Dues</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDues ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Invoice #</th>
                          <th className="text-left p-2">Student</th>
                          <th className="text-left p-2">Academic Year</th>
                          <th className="text-right p-2">Total</th>
                          <th className="text-right p-2">Paid</th>
                          <th className="text-right p-2">Balance</th>
                          <th className="text-left p-2">Due Date</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outstandingDues.map((due, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{due.invoiceNumber}</td>
                            <td className="p-2">
                              {due.studentName} ({due.studentId})
                            </td>
                            <td className="p-2">{due.academicYear}</td>
                            <td className="text-right p-2">₹{due.totalAmount.toLocaleString()}</td>
                            <td className="text-right p-2">₹{due.paidAmount.toLocaleString()}</td>
                            <td className="text-right p-2 font-medium text-red-600">
                              ₹{due.balanceAmount.toLocaleString()}
                            </td>
                            <td className="p-2">{format(new Date(due.dueDate), 'MMM dd, yyyy')}</td>
                            <td className="p-2">
                              <span className="capitalize">{due.status.replace('_', ' ')}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {outstandingDues.length === 0 && (
                      <div className="text-center py-8 text-gray-500">No outstanding dues</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

