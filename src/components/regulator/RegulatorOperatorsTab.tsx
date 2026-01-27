import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { managementAPI } from '@/utils/API';

export interface Operator {
    operator_id: number;
    operator_name: string;
    license_number: string;
    contact_email: string;
    contact_phone: string;
    status: 'active' | 'inactive' | 'suspended';
    created_at: string;
    users_count: number;
}

export function RegulatorOperatorsTab() {
    const [operators, setOperators] = useState<Operator[]>([]);
    const [showOperatorDialog, setShowOperatorDialog] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(null);

    // Operator form state
    const [operatorForm, setOperatorForm] = useState({
        operator_name: '',
        license_number: ''
    });

    useEffect(() => {
        // Load actual operators from the API
        const loadOperators = async () => {
            try {
                const operatorsData = await managementAPI.getOperators();
                setOperators(operatorsData);
            } catch (error) {
                console.error('Failed to load operators:', error);
                setError('Failed to load operators');
            }
        };

        loadOperators();
    }, []);

    const openEditOperatorDialog = (operator: Operator) => {
        setEditingOperator(operator);
        setOperatorForm({
            operator_name: operator.operator_name,
            license_number: operator.license_number
        });
        setShowOperatorDialog(true);
    };

    const closeOperatorDialog = () => {
        setShowOperatorDialog(false);
        setEditingOperator(null);
        setOperatorForm({
            operator_name: '',
            license_number: ''
        });
    };

    const handleCreateOperator = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            // Use the actual API to create operator
            const newOperator = await managementAPI.createOperator({
                operator_name: operatorForm.operator_name,
                license_number: operatorForm.license_number
            });

            // Add the new operator to the local state
            setOperators([...operators, newOperator]);
            setSuccess('Operator created successfully!');
            setOperatorForm({ operator_name: '', license_number: '' });
            setShowOperatorDialog(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to create operator');
        }
    };

    const handleUpdateOperator = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOperator) return;

        setError('');
        setSuccess('');

        try {
            // Use the actual API to update operator
            const updatedOperator = await managementAPI.updateOperator(editingOperator.operator_id, {
                operator_name: operatorForm.operator_name,
                license_number: operatorForm.license_number
            });

            // Update the local state with the updated operator
            const updatedOperators = operators.map(op =>
                op.operator_id === editingOperator.operator_id ? updatedOperator : op
            );
            
            setOperators(updatedOperators);
            setSuccess('Operator updated successfully!');
            setEditingOperator(null);
            setShowOperatorDialog(false);
            setOperatorForm({ operator_name: '', license_number: '' });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update operator');
        }
    };

    const handleDeleteOperator = async (operatorId: number) => {
        const operator = operators.find(op => op.operator_id === operatorId);
        if (operator) {
            setOperatorToDelete(operator);
            setDeleteDialogOpen(true);
        }
    };

    const confirmDeleteOperator = async () => {
        if (!operatorToDelete) return;

        try {
            // Use the actual API to delete operator
            await managementAPI.deleteOperator(operatorToDelete.operator_id);
            
            setOperators(operators.filter(op => op.operator_id !== operatorToDelete.operator_id));
            setSuccess('Operator deleted successfully!');
            setDeleteDialogOpen(false);
            setOperatorToDelete(null);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to delete operator');
        }
    };

    const cancelDeleteOperator = () => {
        setDeleteDialogOpen(false);
        setOperatorToDelete(null);
    };

    return (
        <div className="space-y-6">
            {/* Success/Error Messages */}
            {success && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="size-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <XCircle className="size-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Operators</p>
                                <p className="text-3xl font-semibold mt-1">{operators.length}</p>
                            </div>
                            <div className="size-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Building2 className="size-6 text-indigo-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Operators Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="size-5" />
                                Licensed Operators
                            </CardTitle>
                            <CardDescription>Manage gaming operators and their licenses</CardDescription>
                        </div>
                        <Button onClick={() => setShowOperatorDialog(true)}>
                            <Plus className="size-4 mr-2" />
                            Add Operator
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4">Operator Name</th>
                                    <th className="text-left py-3 px-4">License Number</th>
                                    <th className="text-left py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {operators.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center py-8 text-gray-500">
                                            No operators found. Add your first operator to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    operators.map((operator) => (
                                        <tr key={operator.operator_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="size-4 text-gray-400" />
                                                    <span className="font-medium">{operator.operator_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="outline">{operator.license_number}</Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        onClick={() => openEditOperatorDialog(operator)}
                                                    >
                                                        <Edit className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        onClick={() => handleDeleteOperator(operator.operator_id)}
                                                    >
                                                        <Trash2 className="size-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Operator Dialog */}
            <Dialog open={showOperatorDialog} onOpenChange={setShowOperatorDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingOperator ? 'Edit Operator' : 'Add New Operator'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingOperator 
                                ? 'Update the operator information below.'
                                : 'Fill in the details to register a new gaming operator.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={editingOperator ? handleUpdateOperator : handleCreateOperator}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="operator_name">Operator Name *</Label>
                                <Input
                                    id="operator_name"
                                    value={operatorForm.operator_name}
                                    onChange={(e) => setOperatorForm(prev => ({ ...prev, operator_name: e.target.value }))}
                                    placeholder="e.g., Malawi Gaming Ltd"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="license_number">License Number *</Label>
                                <Input
                                    id="license_number"
                                    value={operatorForm.license_number}
                                    onChange={(e) => setOperatorForm(prev => ({ ...prev, license_number: e.target.value }))}
                                    placeholder="e.g., LIC-2023-001"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeOperatorDialog}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingOperator ? 'Update' : 'Create'} Operator
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{operatorToDelete?.operator_name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={cancelDeleteOperator}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteOperator}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
