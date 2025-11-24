import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Building2, UserPlus, Plus, Mail, Shield, Calendar, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Alert, AlertDescription } from '../../ui/alert';
import { managementAPI } from "@/utils/API.ts";

export interface Operator {
    operator_id: number;
    operator_name: string;
    license_number: string;
    users?: User[];
}

interface User {
    user_id: number;
    email: string;
    full_name: string;
    is_active: boolean;
    created_at: string;
    operator_id?: number;
    operator?: Operator;
    roles?: string[];
}

export function OperatorUserManagement() {
    const [operators, setOperators] = useState<Operator[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showOperatorDialog, setShowOperatorDialog] = useState(false);
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Operator form state
    const [operatorForm, setOperatorForm] = useState({
        operator_name: '',
        license_number: ''
    });

    // User form state
    const [userForm, setUserForm] = useState({
        email: '',
        full_name: '',
        password: '',
        operator_id: '',
        role: 'operator'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [operatorsData, usersData] = await Promise.all([
                managementAPI.getOperators(),
                managementAPI.getUsers()
            ]);
            setOperators((operatorsData || []).filter(op => op && op.operator_id));
            setUsers((usersData || []).filter(u => u && u.user_id));
        } catch (err: any) {
            console.error('Failed to load data:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOperator = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await managementAPI.createOperator(operatorForm);
            setSuccess('Operator created successfully!');
            setOperatorForm({ operator_name: '', license_number: '' });
            setShowOperatorDialog(false);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to create operator');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const userData = {
                ...userForm,
                operator_id: userForm.operator_id ? parseInt(userForm.operator_id) : null
            };
            await managementAPI.createUser(userData);
            setSuccess('User created successfully!');
            setUserForm({
                email: '',
                full_name: '',
                password: '',
                operator_id: '',
                role: 'operator'
            });
            setShowUserDialog(false);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to create user');
        }
    };

    const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
        try {
            await managementAPI.toggleUserStatus(userId, !currentStatus);
            setSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update user status');
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading user management...</p>
            </div>
        );
    }

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Users</p>
                                <p className="text-3xl font-semibold mt-1">{users.length}</p>
                            </div>
                            <div className="size-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <UserPlus className="size-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Users</p>
                                <p className="text-3xl font-semibold mt-1">
                                    {users.filter(u => u.is_active).length}
                                </p>
                            </div>
                            <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="size-6 text-blue-600" />
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
                                Operators
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
                                <th className="text-left py-3 px-4">ID</th>
                                <th className="text-left py-3 px-4">Operator Name</th>
                                <th className="text-left py-3 px-4">License Number</th>
                                <th className="text-left py-3 px-4">Users</th>
                                <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {operators.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">
                                        No operators found. Add your first operator to get started.
                                    </td>
                                </tr>
                            ) : (
                                operators.map((operator) => (
                                    <tr key={operator.operator_id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium">#{operator.operator_id}</td>
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
                        <span className="text-sm text-gray-600">
                          {users.filter(u => u.operator_id === operator.operator_id).length} users
                        </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm">
                                                    <Edit className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm">
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

            {/* Users Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="size-5" />
                                Users
                            </CardTitle>
                            <CardDescription>Manage user accounts and permissions</CardDescription>
                        </div>
                        <Button onClick={() => setShowUserDialog(true)}>
                            <Plus className="size-4 mr-2" />
                            Add User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4">ID</th>
                                <th className="text-left py-3 px-4">User</th>
                                <th className="text-left py-3 px-4">Operator</th>
                                <th className="text-left py-3 px-4">Role</th>
                                <th className="text-left py-3 px-4">Status</th>
                                <th className="text-left py-3 px-4">Created</th>
                                <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">
                                        No users found. Add your first user to get started.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const userOperator = operators.find(op => op.operator_id === user.operator_id);
                                    return (
                                        <tr key={user.user_id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4 font-medium">#{user.user_id}</td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="size-4 text-gray-400" />
                                                        <span className="font-medium">{user.full_name || 'N/A'}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 ml-6">{user.email}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {userOperator ? (
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="size-4 text-indigo-600" />
                                                        <span className="text-sm">{userOperator.operator_name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">No operator</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                                    <Shield className="size-3" />
                                                    {user.roles?.[0]?.name || 'operator'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                {user.is_active ? (
                                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                        <CheckCircle className="size-3 mr-1" />
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                                        <XCircle className="size-3 mr-1" />
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <Calendar className="size-3" />
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleUserStatus(user.user_id, user.is_active)}
                                                    >
                                                        {user.is_active ? (
                                                            <XCircle className="size-4 text-orange-600" />
                                                        ) : (
                                                            <CheckCircle className="size-4 text-green-600" />
                                                        )}
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="size-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Add Operator Dialog */}
            <Dialog open={showOperatorDialog} onOpenChange={setShowOperatorDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="size-5 text-indigo-600" />
                            Add New Operator
                        </DialogTitle>
                        <DialogDescription>
                            Create a new gaming operator with license information
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateOperator} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="operator_name">Operator Name</Label>
                            <Input
                                id="operator_name"
                                placeholder="e.g., Acme Gaming Ltd."
                                value={operatorForm.operator_name}
                                onChange={(e) => setOperatorForm({ ...operatorForm, operator_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="license_number">License Number</Label>
                            <Input
                                id="license_number"
                                placeholder="e.g., LIC-2025-001"
                                value={operatorForm.license_number}
                                onChange={(e) => setOperatorForm({ ...operatorForm, license_number: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setShowOperatorDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                <Plus className="size-4 mr-2" />
                                Create Operator
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add User Dialog */}
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="size-5 text-green-600" />
                            Add New User
                        </DialogTitle>
                        <DialogDescription>
                            Create a new user account and assign to an operator
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    placeholder="John Doe"
                                    value={userForm.full_name}
                                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={userForm.password}
                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="operator_select">Assign to Operator</Label>
                                <Select
                                    value={userForm.operator_id}
                                    onValueChange={(value) =>
                                        setUserForm({
                                            ...userForm,
                                            operator_id: value === "none" ? null : value
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select operator..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No operator (Admin)</SelectItem>
                                        {operators.map((op) => (
                                            <SelectItem key={op.operator_id} value={String(op.operator_id)}>
                                                {op.operator_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={userForm.role}
                                    onValueChange={(value) => setUserForm({ ...userForm, role: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrator</SelectItem>
                                        <SelectItem value="operator">Operator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setShowUserDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                <Plus className="size-4 mr-2" />
                                Create User
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}