
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, AlertTriangle, Camera, FileText, Star } from 'lucide-react';

const QualityControl = () => {
  const [selectedOrder, setSelectedOrder] = useState('');
  const [qualityChecks, setQualityChecks] = useState({
    stainRemoval: false,
    fabricCare: false,
    colorIntegrity: false,
    pressing: false,
    packaging: false,
    overallCleanliness: false
  });
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  const pendingOrders = [
    { id: 'ORD-001', customer: 'John Smith', items: 'Shirts (3), Pants (2)' },
    { id: 'ORD-002', customer: 'Sarah Johnson', items: 'Dress (1), Blazer (1)' },
    { id: 'ORD-003', customer: 'Mike Davis', items: 'Suit (1), Ties (2)' }
  ];

  const recentInspections = [
    {
      id: 'ORD-098',
      customer: 'Alice Wilson',
      inspector: 'Jane Doe',
      score: 98,
      status: 'passed',
      issues: [],
      timestamp: '2024-01-15 14:30'
    },
    {
      id: 'ORD-097',
      customer: 'Bob Miller',
      inspector: 'John Smith',
      score: 85,
      status: 'passed',
      issues: ['Minor wrinkle on collar'],
      timestamp: '2024-01-15 13:15'
    },
    {
      id: 'ORD-096',
      customer: 'Carol Brown',
      inspector: 'Jane Doe',
      score: 70,
      status: 'failed',
      issues: ['Stain not fully removed', 'Fabric pilling'],
      timestamp: '2024-01-15 11:45'
    }
  ];

  const handleQualityCheck = (check: string, value: boolean) => {
    setQualityChecks(prev => ({
      ...prev,
      [check]: value
    }));
  };

  const calculateScore = () => {
    const checkedItems = Object.values(qualityChecks).filter(Boolean).length;
    const totalItems = Object.keys(qualityChecks).length;
    return Math.round((checkedItems / totalItems) * 100);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'passed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'review': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quality Control</h1>
        <p className="text-gray-600">Inspect and ensure quality standards for all orders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Inspection Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Quality Inspection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="order-select">Select Order</Label>
              <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an order to inspect" />
                </SelectTrigger>
                <SelectContent>
                  {pendingOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.id} - {order.customer} ({order.items})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOrder && (
              <>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Quality Checklist</h3>
                  <div className="space-y-3">
                    {Object.entries(qualityChecks).map(([key, checked]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={checked}
                          onCheckedChange={(value) => handleQualityCheck(key, value as boolean)}
                        />
                        <Label htmlFor={key} className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Overall Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 cursor-pointer ${
                          star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                        onClick={() => setRating(star)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Inspection Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any quality issues, recommendations, or notes..."
                    rows={4}
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Quality Score:</span>
                    <span className={`text-2xl font-bold ${getScoreColor(calculateScore())}`}>
                      {calculateScore()}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Based on checklist completion ({Object.values(qualityChecks).filter(Boolean).length}/{Object.keys(qualityChecks).length} items)
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Pass Inspection
                  </Button>
                  <Button variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
                    <XCircle className="h-4 w-4 mr-2" />
                    Fail Inspection
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Add Photos
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Inspections */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInspections.map((inspection) => (
                <div key={inspection.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{inspection.id}</h4>
                      <p className="text-sm text-gray-600">{inspection.customer}</p>
                    </div>
                    <Badge className={getStatusColor(inspection.status)}>
                      {inspection.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Score:</span>
                      <span className={`font-bold ${getScoreColor(inspection.score)}`}>
                        {inspection.score}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      by {inspection.inspector}
                    </div>
                  </div>

                  {inspection.issues.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                        <AlertTriangle className="h-4 w-4" />
                        Issues Found:
                      </div>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {inspection.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 border-t pt-2">
                    {inspection.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Statistics (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">96.2%</div>
              <div className="text-sm text-gray-600">Average Quality Score</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">847</div>
              <div className="text-sm text-gray-600">Total Inspections</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">23</div>
              <div className="text-sm text-gray-600">Failed Inspections</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">12</div>
              <div className="text-sm text-gray-600">Items Under Review</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityControl;
